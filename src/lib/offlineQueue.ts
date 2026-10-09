/**
 * AKS-HCD Durable Offline Storage & Queue Engine
 * Uses IndexedDB for reliable offline queueing, local caching, and media storage.
 */

export interface QueuedOperation {
  id: string; // Stable UUID or op-timestamp-random
  recordId: string;
  operationType: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_TRANSITION';
  payload: any;
  userContext: {
    id: string;
    name: string;
    role: string;
    assignedLgaId?: string;
  };
  lgaId: string;
  createdAt: string;
  lastAttemptAt?: string;
  retryCount: number;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  errorDetails?: string;
  conflictInfo?: string;
}

export interface CachedEvidence {
  id: string;
  fileName: string;
  lgaId: string;
  activityId: string;
  blob: Blob;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

const DB_NAME = 'aks_hcd_offline_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export const openOfflineDb = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;

      // 1. Pending operations queue
      if (!db.objectStoreNames.contains('pending_operations')) {
        const opStore = db.createObjectStore('pending_operations', { keyPath: 'id' });
        opStore.createIndex('status', 'status', { unique: false });
        opStore.createIndex('createdAt', 'createdAt', { unique: false });
        opStore.createIndex('recordId', 'recordId', { unique: false });
        opStore.createIndex('lgaId', 'lgaId', { unique: false });
      }

      // 2. Offline cached activities
      if (!db.objectStoreNames.contains('cached_activities')) {
        const actStore = db.createObjectStore('cached_activities', { keyPath: 'id' });
        actStore.createIndex('lgaId', 'lgaId', { unique: false });
        actStore.createIndex('status', 'status', { unique: false });
      }

      // 3. Offline binary evidence assets
      if (!db.objectStoreNames.contains('offline_evidence')) {
        db.createObjectStore('offline_evidence', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
};

// Queue operations
export const enqueueOperation = async (
  op: Omit<QueuedOperation, 'id' | 'createdAt' | 'retryCount' | 'status'>
): Promise<QueuedOperation> => {
  const fullOp: QueuedOperation = {
    ...op,
    id: `op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    status: 'pending',
  };

  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_operations', 'readwrite');
      const store = tx.objectStore('pending_operations');
      const req = store.put(fullOp);
      req.onsuccess = () => resolve(fullOp);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Fallback to local storage for offline operation:', err);
    // Graceful in-memory / localStorage fallback if IndexedDB is blocked
    const fallback = getFallbackQueue();
    fallback.push(fullOp);
    saveFallbackQueue(fallback);
    return fullOp;
  }
};

export const getPendingOperations = async (): Promise<QueuedOperation[]> => {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_operations', 'readonly');
      const store = tx.objectStore('pending_operations');
      const req = store.getAll();
      req.onsuccess = () => {
        const ops = (req.result || []) as QueuedOperation[];
        resolve(ops.filter((o) => o.status === 'pending' || o.status === 'failed'));
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return getFallbackQueue().filter((o) => o.status === 'pending' || o.status === 'failed');
  }
};

export const getAllOperations = async (): Promise<QueuedOperation[]> => {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_operations', 'readonly');
      const store = tx.objectStore('pending_operations');
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []) as QueuedOperation[]);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return getFallbackQueue();
  }
};

export const updateOperation = async (op: QueuedOperation): Promise<void> => {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_operations', 'readwrite');
      const store = tx.objectStore('pending_operations');
      const req = store.put(op);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    const list = getFallbackQueue().map((o) => (o.id === op.id ? op : o));
    saveFallbackQueue(list);
  }
};

export const removeOperation = async (id: string): Promise<void> => {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_operations', 'readwrite');
      const store = tx.objectStore('pending_operations');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    saveFallbackQueue(getFallbackQueue().filter((o) => o.id !== id));
  }
};

// Activity local caching
export const cacheActivitiesLocally = async (activities: any[]): Promise<void> => {
  try {
    const db = await openOfflineDb();
    const tx = db.transaction('cached_activities', 'readwrite');
    const store = tx.objectStore('cached_activities');
    for (const act of activities) {
      store.put(act);
    }
  } catch (err) {
    try {
      localStorage.setItem('aks_hcd_cached_activities', JSON.stringify(activities.slice(0, 50)));
    } catch {}
  }
};

export const getCachedActivities = async (): Promise<any[]> => {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cached_activities', 'readonly');
      const store = tx.objectStore('cached_activities');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      const raw = localStorage.getItem('aks_hcd_cached_activities');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
};

// Binary evidence asset caching
export const storeOfflineEvidence = async (evidence: CachedEvidence): Promise<void> => {
  try {
    const db = await openOfflineDb();
    const tx = db.transaction('offline_evidence', 'readwrite');
    tx.objectStore('offline_evidence').put(evidence);
  } catch (err) {
    console.warn('Unable to cache offline evidence blob:', err);
  }
};

export const getOfflineEvidence = async (id: string): Promise<CachedEvidence | null> => {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('offline_evidence', 'readonly');
      const req = tx.objectStore('offline_evidence').get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
};

// LocalStorage helpers for fallback
const FALLBACK_KEY = 'aks_hcd_pending_ops_fallback';
function getFallbackQueue(): QueuedOperation[] {
  try {
    const raw = localStorage.getItem(FALLBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveFallbackQueue(ops: QueuedOperation[]): void {
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(ops));
  } catch {}
}
