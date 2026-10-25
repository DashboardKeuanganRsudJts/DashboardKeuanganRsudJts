import { collection, doc, writeBatch, onSnapshot, getDocs, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { idbGet, idbSet, idbSetLocalOnly } from '../utils/indexedDbStorage';
import { 
  checkIsQuotaExceeded, 
  markQuotaExceeded, 
  isQuotaExceededError, 
  handleFirestoreError, 
  OperationType 
} from '../utils/firestoreErrorHandler';

import { deduplicateInvoiceRecords, getInvoiceDeduplicationKey, getDeterministicInvoiceId } from '../utils/invoiceDeduplicator';

// Keeps track of active listeners so we don't duplicate them
const listeners: Record<string, () => void> = {};

// Direct App Data document keys to synchronize across Firestore and LocalStorage
const APP_DATA_DOCS = [
  { docId: 'perusahaan_asuransi_2026', storageKey: 'rsud_perusahaan_asuransi_2026', eventName: 'rsud_perusahaan_data_updated' },
  { docId: 'listrik_kantin_2026', storageKey: 'rsud_listrik_kantin_2026', eventName: 'rsud_listrik_data_updated' },
  { docId: 'pendapatan_blud_data', storageKey: 'rsud_pendapatan_blud_data', eventName: 'rsud_pendapatan_data_updated' },
  { docId: 'pengeluaran_blud_data', storageKey: 'rsud_pengeluaran_blud_data', eventName: 'rsud_pengeluaran_data_updated' },
  { docId: 'semua_rekapan_2026', storageKey: 'rsud_semua_rekapan_2026', eventName: 'rsud_semua_rekapan_updated' },
  { docId: 'piutang_data_cache', storageKey: 'rsud_piutang_data_cache', eventName: 'rsud_piutang_data_updated' },
  { docId: 'ppn_coretax_data_2026', storageKey: 'rsud_ppn_coretax_data_2026', eventName: 'rsud_ppn_coretax_updated' },
  { docId: 'ppn_hutang_data_2026', storageKey: 'rsud_ppn_hutang_data_2026', eventName: 'rsud_ppn_hutang_updated' },
  { docId: 'sheets_sync_config', storageKey: 'rsud_sheets_config', eventName: 'rsud_sheets_config_updated' }
];

export function initFirestoreSync() {
  if (typeof window === 'undefined') return;

  const arrayCollections = ['invoices2025', 'invoices2026', 'legacy_hutang2025', 'legacy_hutang2026'];
  
  arrayCollections.forEach(colName => {
    if (listeners[colName]) return; 

    listeners[colName] = onSnapshot(collection(db, colName), async (snapshot) => {
      if (snapshot.metadata.hasPendingWrites) {
        return; 
      }

      const isInvoiceCol = colName === 'invoices2025' || colName === 'invoices2026';
      const year = colName === 'invoices2025' ? 2025 : 2026;

      let idbKey = '';
      if (colName === 'invoices2025') idbKey = 'rsud_invoice_hutang_2025';
      else if (colName === 'invoices2026') idbKey = 'rsud_invoice_hutang_2026';
      else if (colName === 'legacy_hutang2025') idbKey = 'rsud_hutang_blud_apbd_v2025_complete';
      else if (colName === 'legacy_hutang2026') idbKey = 'rsud_rekap_pengadaan_hutang_2026_master_v3';

      // 1. Prevent resurrection if user explicitly reset/cleared this dataset
      const isCleared = typeof window !== 'undefined' && localStorage.getItem(`${idbKey}_cleared`) === 'true';
      if (isCleared) {
        if (!snapshot.empty && auth.currentUser && !checkIsQuotaExceeded()) {
          // Asynchronously ensure cloud collection is cleared to match user's explicit reset
          clearFirestoreCollection(colName).catch(() => {});
        }
        return;
      }

      let data: any[];

      if (isInvoiceCol) {
        // Collect duplicate doc refs in Firestore strictly by row number 'no' or doc ID
        const seenRowNumbers = new Set<number>();
        const staleDocRefs: any[] = [];
        const uniqueDocs: any[] = [];

        // Check if snapshot contains real user imported data vs dummy seed data
        const hasRealImportedDocs = snapshot.docs.some(docSnap => {
          const d = docSnap.data();
          return Boolean(
            d._presentFields || 
            d._isImported || 
            docSnap.id.startsWith('inv-excel-') || 
            (d.rekanan && typeof d.rekanan === 'string' && d.rekanan.toUpperCase().includes('PMI KARAWANG'))
          );
        });

        // Sort snapshot docs:
        // CRITICAL: When real user imported docs exist, NEVER prioritize seed mockup docs!
        const sortedDocs = [...snapshot.docs].sort((a, b) => {
          const aData = a.data();
          const bData = b.data();
          const aIsReal = Boolean(aData._presentFields || aData._isImported || a.id.startsWith('inv-excel-'));
          const bIsReal = Boolean(bData._presentFields || bData._isImported || b.id.startsWith('inv-excel-'));
          
          if (aIsReal && !bIsReal) return -1;
          if (!aIsReal && bIsReal) return 1;

          // If both have same reality tier, sort by no ascending
          const aNo = Number(aData.no) || 0;
          const bNo = Number(bData.no) || 0;
          return aNo - bNo;
        });

        for (const docSnap of sortedDocs) {
          const docData = docSnap.data();
          const isMockSeed = hasRealImportedDocs && !docData._presentFields && !docData._isImported && !docSnap.id.startsWith('inv-excel-');
          
          if (isMockSeed) {
            // This is an orphaned dummy seed document that was leftover in Firestore
            staleDocRefs.push(docSnap.ref);
            continue;
          }

          const rowNo = Number(docData.no) || 0;
          if (rowNo > 0) {
            if (seenRowNumbers.has(rowNo)) {
              staleDocRefs.push(docSnap.ref);
            } else {
              seenRowNumbers.add(rowNo);
              uniqueDocs.push(docData);
            }
          } else {
            uniqueDocs.push(docData);
          }
        }

        // Keep all unique row numbers sequentially
        data = deduplicateInvoiceRecords(uniqueDocs, year);

        // Background cleanup of stale/duplicate documents from Firestore if user is authenticated
        if (staleDocRefs.length > 0 && auth.currentUser && !checkIsQuotaExceeded()) {
          (async () => {
            try {
              let batch = writeBatch(db);
              let count = 0;
              for (const ref of staleDocRefs) {
                batch.delete(ref);
                count++;
                if (count >= 400) {
                  await batch.commit();
                  batch = writeBatch(db);
                  count = 0;
                }
              }
              if (count > 0) {
                await batch.commit();
              }
              console.log(`[Firestore] Pruned ${staleDocRefs.length} duplicate/stale docs from ${colName}`);
            } catch (err: any) {
              console.warn(`[Firestore] Background prune skipped for ${colName}:`, err?.message || err);
            }
          })();
        }
      } else {
        data = snapshot.docs.map(doc => doc.data());
        data.sort((a: any, b: any) => (a.no || 0) - (b.no || 0));
      }


      
      const existingData = await idbGet<any[]>(idbKey);
      if (existingData && JSON.stringify(existingData) === JSON.stringify(data)) {
        return; // Skip duplicate echo update
      }

      await idbSetLocalOnly(idbKey, data);
      window.dispatchEvent(new CustomEvent(`${idbKey}_updated`, { detail: data }));
      
      if (idbKey === 'rsud_hutang_blud_apbd_v2025_complete') {
        window.dispatchEvent(new CustomEvent('rsud_hutang_data_updated', { detail: data }));
      }
    }, (error) => {
      console.error(`Error syncing ${colName} from Firestore:`, error);
    });
  });

  // Setup listeners for highlights
  ['2025', '2026'].forEach(year => {
    const docPath = `appState/highlights${year}`;
    if (listeners[docPath]) return;

    listeners[docPath] = onSnapshot(doc(db, 'appState', `highlights${year}`), (snapshot) => {
      if (snapshot.metadata.hasPendingWrites) return;
      const data = snapshot.data() || {};
      
      const localKey = `rsud_rekap_${year}_highlights`;
      try {
        const currentLocal = localStorage.getItem(localKey);
        const newString = JSON.stringify(data);
        if (currentLocal === newString) return; // Skip duplicate echo update

        localStorage.setItem(localKey, newString);
        window.dispatchEvent(new CustomEvent(`${localKey}_updated`, { detail: data }));
      } catch (e) {}
    });
  });

  // Setup listeners for Pendapatan, Pengeluaran, Perusahaan Asuransi, Listrik Kantin, Semua Rekapan
  APP_DATA_DOCS.forEach(({ docId, storageKey, eventName }) => {
    const docPath = `appData/${docId}`;
    if (listeners[docPath]) return;

    listeners[docPath] = onSnapshot(doc(db, 'appData', docId), (snapshot) => {
      if (snapshot.metadata.hasPendingWrites) return;
      if (!snapshot.exists()) return;

      const docData = snapshot.data();
      if (docData && docData.payload) {
        try {
          const currentLocal = localStorage.getItem(storageKey);
          const newString = JSON.stringify(docData.payload);
          if (currentLocal === newString) {
            return; // Skip duplicate echo update
          }

          localStorage.setItem(storageKey, newString);
          window.dispatchEvent(new CustomEvent(eventName, { detail: docData.payload }));
          window.dispatchEvent(new CustomEvent('rsud_data_updated'));
        } catch (e) {
          console.warn(`Failed to store real-time data for ${storageKey}:`, e);
        }
      }
    }, (error) => {
      console.error(`Error syncing appData/${docId} from Firestore:`, error);
    });
  });
}

export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

/**
 * Saves entire module state (Pendapatan, Pengeluaran, Perusahaan & Asuransi, Listrik & Kantin)
 * directly to Firestore appData/{docId} document for real-time cloud persistence.
 */
export async function syncDocumentToFirestore(docId: string, payload: any) {
  if (!auth.currentUser) return; // Only sync if logged in
  if (checkIsQuotaExceeded()) {
    return; // Circuit breaker: skip writing to Firestore while daily write quota is exceeded
  }

  try {
    const docRef = doc(db, 'appData', docId);
    const sanitized = sanitizeForFirestore(payload);
    await setDoc(docRef, {
      payload: sanitized,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser.email || auth.currentUser.uid
    }, { merge: true });
  } catch (err: any) {
    if (isQuotaExceededError(err)) {
      markQuotaExceeded(err?.message);
    }
    console.warn(`[Firestore] Sync skipped for appData/${docId}:`, err?.message || err);
  }
}

/**
 * Uploads all local storage / cached data to Firestore when user clicks "Sinkronkan Semua Data ke Firestore".
 */
export async function pushAllLocalDataToFirestore() {
  if (!auth.currentUser) {
    throw new Error('Harap login terlebih dahulu untuk melakukan sinkronisasi data ke Cloud.');
  }

  if (checkIsQuotaExceeded()) {
    throw new Error('Batas kuota penulisan harian Cloud Firestore (Free Tier) telah tercapai untuk hari ini. Data Anda tetap tersimpan aman di browser (IndexedDB) dan kuota akan otomatis di-reset besok.');
  }

  // 1. AppData docs
  for (const { docId, storageKey } of APP_DATA_DOCS) {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        await syncDocumentToFirestore(docId, parsed);
      }
    } catch (e) {
      console.warn(`Error uploading ${storageKey} to Firestore:`, e);
    }
  }

  // 2. Invoices & Legacy Hutang
  const idbKeys = [
    'rsud_invoice_hutang_2025',
    'rsud_invoice_hutang_2026',
    'rsud_hutang_blud_apbd_v2025_complete',
    'rsud_rekap_pengadaan_hutang_2026_master_v3'
  ];

  for (const key of idbKeys) {
    if (checkIsQuotaExceeded()) break;
    try {
      const data = await idbGet<any[]>(key);
      if (data && Array.isArray(data) && data.length > 0) {
        await syncArrayToFirestore(key, data);
      }
    } catch (e) {
      console.warn(`Error syncing array ${key} to Firestore:`, e);
    }
  }

  // 3. Highlights
  for (const year of ['2025', '2026'] as const) {
    if (checkIsQuotaExceeded()) break;
    try {
      const raw = localStorage.getItem(`rsud_rekap_${year}_highlights`);
      if (raw) {
        const parsed = JSON.parse(raw);
        await syncHighlightsToFirestore(year, parsed);
      }
    } catch (e) {}
  }
}

export async function syncArrayToFirestore(key: string, newData: any[]) {
  if (!auth.currentUser) return; // Only sync if logged in
  if (checkIsQuotaExceeded()) {
    // When free daily write units quota is reached, do not dispatch batches to Firestore
    return;
  }

  const colName = key === 'rsud_invoice_hutang_2025' ? 'invoices2025' : 
                  key === 'rsud_invoice_hutang_2026' ? 'invoices2026' : 
                  key === 'rsud_hutang_blud_apbd_v2025_complete' ? 'legacy_hutang2025' : 
                  key === 'rsud_rekap_pengadaan_hutang_2026_master_v3' ? 'legacy_hutang2026' : null;
  
  if (!colName) return;

  const isInvoiceCol = colName === 'invoices2025' || colName === 'invoices2026';
  const year = colName === 'invoices2025' ? 2025 : 2026;
  const cleanData = isInvoiceCol ? deduplicateInvoiceRecords(newData, year) : newData;

  // Get current from IDB to diff
  const oldData: any[] = (await idbGet(key)) || [];
  
  const oldMap = new Map(oldData.map(item => [item.id, item]));
  const added: any[] = [];
  const modified: any[] = [];
  
  for (const item of cleanData) {
    if (!item || !item.id) continue;
    const oldItem = oldMap.get(item.id);
    if (!oldItem) {
      added.push(item);
    } else if (JSON.stringify(oldItem) !== JSON.stringify(item)) {
      modified.push(item);
    }
    oldMap.delete(item.id);
  }
  
  const deleted = Array.from(oldMap.values());

  if (added.length === 0 && modified.length === 0 && deleted.length === 0) {
    return; // No changes to sync
  }

  // Execute batch writes
  const batches = [];
  let currentBatch = writeBatch(db);
  let opCount = 0;
  
  const commitBatch = () => {
     batches.push(currentBatch.commit());
     currentBatch = writeBatch(db);
     opCount = 0;
  };

  const addOp = () => {
    opCount++;
    if (opCount >= 450) commitBatch();
  };

  for (const item of added) {
     const cleanItem = sanitizeForFirestore(item);
     currentBatch.set(doc(db, colName, item.id), cleanItem);
     addOp();
  }
  for (const item of modified) {
     const cleanItem = sanitizeForFirestore(item);
     currentBatch.set(doc(db, colName, item.id), cleanItem, { merge: true });
     addOp();
  }
  for (const item of deleted) {
     currentBatch.delete(doc(db, colName, item.id));
     addOp();
  }
  
  if (opCount > 0) commitBatch();
  
  try {
    await Promise.all(batches);
  } catch (err: any) {
    if (isQuotaExceededError(err)) {
      markQuotaExceeded(err?.message);
    }
    console.warn(`[Firestore] Sync to ${colName} paused:`, err?.message || err);
  }
}

export async function syncHighlightsToFirestore(year: '2025' | '2026', data: Record<number, boolean>) {
  if (!auth.currentUser) return; // Only sync if logged in
  if (checkIsQuotaExceeded()) return;
  
  try {
    const docRef = doc(db, 'appState', `highlights${year}`);
    const cleanData = sanitizeForFirestore(data);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (err: any) {
    if (isQuotaExceededError(err)) {
      markQuotaExceeded(err?.message);
    }
    console.warn(`[Firestore] Sync highlights${year} skipped:`, err?.message || err);
  }
}

/**
 * Deletes all documents in a specific Firestore collection (e.g. 'invoices2025' or 'invoices2026')
 */
export async function clearFirestoreCollection(colName: string): Promise<{ success: boolean; count: number; error?: string }> {
  if (!auth.currentUser) {
    return { success: true, count: 0 };
  }

  if (checkIsQuotaExceeded()) {
    console.warn(`[Firestore] clearFirestoreCollection skipped for ${colName} due to quota limit.`);
    return { success: false, count: 0, error: 'Batas kuota penulisan Firestore tercapai.' };
  }

  try {
    const colRef = collection(db, colName);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      return { success: true, count: 0 };
    }

    let currentBatch = writeBatch(db);
    let opCount = 0;
    let totalDeleted = 0;

    for (const docSnap of snapshot.docs) {
      currentBatch.delete(docSnap.ref);
      opCount++;
      totalDeleted++;
      if (opCount >= 400) {
        await currentBatch.commit();
        currentBatch = writeBatch(db);
        opCount = 0;
      }
    }

    if (opCount > 0) {
      await currentBatch.commit();
    }

    return { success: true, count: totalDeleted };
  } catch (err: any) {
    console.error(`[Firestore] Error clearing collection ${colName}:`, err);
    if (isQuotaExceededError(err)) {
      markQuotaExceeded(err?.message);
    }
    return { success: false, count: 0, error: err?.message || String(err) };
  }
}

