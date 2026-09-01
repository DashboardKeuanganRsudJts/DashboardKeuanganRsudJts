import { collection, doc, writeBatch, onSnapshot, getDocs, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { idbGet, idbSet, idbSetLocalOnly } from '../utils/indexedDbStorage';

// Keeps track of active listeners so we don't duplicate them
const listeners: Record<string, () => void> = {};

// Direct App Data document keys to synchronize across Firestore and LocalStorage
const APP_DATA_DOCS = [
  { docId: 'perusahaan_asuransi_2026', storageKey: 'rsud_perusahaan_asuransi_2026', eventName: 'rsud_perusahaan_data_updated' },
  { docId: 'listrik_kantin_2026', storageKey: 'rsud_listrik_kantin_2026', eventName: 'rsud_listrik_data_updated' },
  { docId: 'pendapatan_blud_data', storageKey: 'rsud_pendapatan_blud_data', eventName: 'rsud_pendapatan_data_updated' },
  { docId: 'pengeluaran_blud_data', storageKey: 'rsud_pengeluaran_blud_data', eventName: 'rsud_pengeluaran_data_updated' },
  { docId: 'semua_rekapan_2026', storageKey: 'rsud_semua_rekapan_2026', eventName: 'rsud_semua_rekapan_updated' }
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

      const data = snapshot.docs.map(doc => doc.data());
      
      data.sort((a: any, b: any) => (a.no || 0) - (b.no || 0));

      let idbKey = '';
      if (colName === 'invoices2025') idbKey = 'rsud_invoice_hutang_2025';
      else if (colName === 'invoices2026') idbKey = 'rsud_invoice_hutang_2026';
      else if (colName === 'legacy_hutang2025') idbKey = 'rsud_hutang_blud_apbd_v2025_complete';
      else if (colName === 'legacy_hutang2026') idbKey = 'rsud_rekap_pengadaan_hutang_2026_master_v3';
      
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
        localStorage.setItem(localKey, JSON.stringify(data));
      } catch (e) {}
      
      window.dispatchEvent(new CustomEvent(`${localKey}_updated`, { detail: data }));
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
          localStorage.setItem(storageKey, JSON.stringify(docData.payload));
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

  try {
    const docRef = doc(db, 'appData', docId);
    const sanitized = sanitizeForFirestore(payload);
    await setDoc(docRef, {
      payload: sanitized,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser.email || auth.currentUser.uid
    }, { merge: true });
  } catch (err) {
    console.error(`Error syncing appData/${docId} to Firestore:`, err);
  }
}

/**
 * Uploads all local storage / cached data to Firestore when user clicks "Sinkronkan Semua Data ke Firestore".
 */
export async function pushAllLocalDataToFirestore() {
  if (!auth.currentUser) {
    throw new Error('Harap login terlebih dahulu untuk melakukan sinkronisasi data ke Cloud.');
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

  const colName = key === 'rsud_invoice_hutang_2025' ? 'invoices2025' : 
                  key === 'rsud_invoice_hutang_2026' ? 'invoices2026' : 
                  key === 'rsud_hutang_blud_apbd_v2025_complete' ? 'legacy_hutang2025' : 
                  key === 'rsud_rekap_pengadaan_hutang_2026_master_v3' ? 'legacy_hutang2026' : null;
  
  if (!colName) return;

  // Get current from IDB to diff
  const oldData: any[] = (await idbGet(key)) || [];
  
  const oldMap = new Map(oldData.map(item => [item.id, item]));
  const added: any[] = [];
  const modified: any[] = [];
  
  for (const item of newData) {
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
  } catch (err) {
    console.error(`Error syncing ${colName} batch to Firestore:`, err);
  }
}

export async function syncHighlightsToFirestore(year: '2025' | '2026', data: Record<number, boolean>) {
  if (!auth.currentUser) return; // Only sync if logged in
  
  try {
    const docRef = doc(db, 'appState', `highlights${year}`);
    const cleanData = sanitizeForFirestore(data);
    await setDoc(docRef, cleanData, { merge: true });
  } catch (err) {
    console.error(`Error syncing highlights${year} to Firestore:`, err);
  }
}
