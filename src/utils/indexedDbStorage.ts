/**
 * Robust IndexedDB & Storage manager for large datasets in RSUD Dashboard.
 * Bypasses localStorage 5MB quota limits.
 */

const DB_NAME = 'rsud_dashboard_db';
const DB_VERSION = 2; // Incremented to guarantee onupgradeneeded creates STORE_NAME
const STORE_NAME = 'keyvalue_store';

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Fallback upgrade if the store is missing
        db.close();
        const nextVer = db.version + 1;
        const upgradeReq = window.indexedDB.open(DB_NAME, nextVer);
        upgradeReq.onupgradeneeded = () => {
          if (!upgradeReq.result.objectStoreNames.contains(STORE_NAME)) {
            upgradeReq.result.createObjectStore(STORE_NAME);
          }
        };
        upgradeReq.onsuccess = () => resolve(upgradeReq.result);
        upgradeReq.onerror = () => reject(upgradeReq.error);
        return;
      }
      resolve(db);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function idbSetLocalOnly<T>(key: string, value: T): Promise<void> {
  // Synchronous cache
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (e) {
    // Quota reached is fine
  }

  // Persist to IDB
  try {
    const db = await openDB();
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      return;
    }
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`[IDB] idbSetLocalOnly failed for key "${key}":`, err);
  }
}

export async function idbGet<T>(key: string): Promise<T | null> {
  let result: T | null = null;
  try {
    const db = await openDB();
    if (db.objectStoreNames.contains(STORE_NAME)) {
      result = await new Promise<T | null>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result !== undefined ? request.result : null);
        request.onerror = () => reject(request.error);
      });
    }
  } catch (err) {
    console.warn(`[IDB] get failed for key "${key}", falling back to localStorage:`, err);
  }

  // Fallback to localStorage if IDB failed or returned null (e.g., legacy data or IDB blocked)
  if (result === null) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = localStorage.getItem(key);
        if (item) {
          result = JSON.parse(item) as T;
        }
      }
    } catch (e) {
      console.warn('localStorage fallback failed:', e);
    }
  }

  return result;
}

export async function idbSet<T>(key: string, value: T): Promise<void> {
  // Sync to Firestore if this is one of our managed array keys
  if (key === 'rsud_invoice_hutang_2025' || 
      key === 'rsud_invoice_hutang_2026' || 
      key === 'rsud_hutang_blud_apbd_v2025_complete' || 
      key === 'rsud_rekap_pengadaan_hutang_2026_master_v3') {
    try {
      const { syncArrayToFirestore } = await import('../services/firestoreSync');
      // We must sync BEFORE we overwrite the local IDB, so we can diff against the old data
      await syncArrayToFirestore(key, value as any);
    } catch (err) {
      console.error('[Sync] Error syncing to firestore:', err);
    }
  }

  // 1. Always attempt saving to localStorage first as fast synchronous cache
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (e) {
    // Quota reached for localStorage is acceptable since IndexedDB handles large records
  }

  // 2. Persist to IndexedDB
  try {
    const db = await openDB();
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      return;
    }
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`[IDB] set failed for key "${key}":`, err);
  }
}

export async function idbDelete(key: string): Promise<void> {
  try {
    const db = await openDB();
    if (db.objectStoreNames.contains(STORE_NAME)) {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  } catch (err) {
    console.warn(`[IDB] delete failed for key "${key}", falling back to localStorage:`, err);
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(key);
    }
  } catch (e) {
    console.warn('localStorage fallback failed:', e);
  }
}

/**
 * Free up localStorage space by removing old/large cached datasets that exceeded quota.
 */
export function cleanupLargeLocalStorageKeys(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const keysToRemove = [
      'rsud_invoice_hutang_2025_dataset_v1',
      'rsud_invoice_hutang_2025_dataset_v2',
      'rsud_invoice_hutang_2025_dataset_v3',
      'rsud_invoice_hutang_2025_dataset_v4'
    ];
    keysToRemove.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch (_) {}
    });
  } catch (e) {
    console.warn('Cleanup localStorage error:', e);
  }
}
