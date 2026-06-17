// IndexedDB Database Wrapper for SafeTClaim - Amazon SAFE-T Claim Manager

const DB_NAME = 'SafeTClaimDB';
const DB_VERSION = 1;
const USERS_STORE = 'users';
const CLAIMS_STORE = 'claims';

let dbInstance = null;

// Initialize Database
export function initDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('SafeTClaim DB failed to open:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store for users: keyed by username
      if (!db.objectStoreNames.contains(USERS_STORE)) {
        db.createObjectStore(USERS_STORE, { keyPath: 'username' });
      }
      
      // Store for claim records: keyed by id
      if (!db.objectStoreNames.contains(CLAIMS_STORE)) {
        db.createObjectStore(CLAIMS_STORE, { keyPath: 'id' });
      }
    };
  });
}

// Helper to get transaction and object store
function getStore(storeName, mode = 'readonly') {
  return new Promise((resolve, reject) => {
    initDB()
      .then((db) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        resolve({ store, transaction });
      })
      .catch(reject);
  });
}

// --- Users Store Operations ---

export function getUsers() {
  return new Promise((resolve, reject) => {
    getStore(USERS_STORE)
      .then(({ store }) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      })
      .catch(reject);
  });
}

export function saveUser(user) {
  return new Promise((resolve, reject) => {
    getStore(USERS_STORE, 'readwrite')
      .then(({ store }) => {
        const request = store.put(user);
        request.onsuccess = () => resolve(user);
        request.onerror = () => reject(request.error);
      })
      .catch(reject);
  });
}

export function deleteUser(username) {
  return new Promise((resolve, reject) => {
    getStore(USERS_STORE, 'readwrite')
      .then(({ store }) => {
        const request = store.delete(username);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      })
      .catch(reject);
  });
}

// --- Claims Store Operations ---

export function getClaims() {
  return new Promise((resolve, reject) => {
    getStore(CLAIMS_STORE)
      .then(({ store }) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      })
      .catch(reject);
  });
}

export function saveClaim(claim) {
  return new Promise((resolve, reject) => {
    if (!claim.id) {
      claim.id = 'claim_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    if (!claim.dateAdded) {
      claim.dateAdded = new Date().toISOString();
    }
    if (!claim.status) {
      claim.status = 'Pending';
    }
    if (!claim.history) {
      claim.history = [{
        date: new Date().toISOString(),
        user: claim.addedBy || 'system',
        status: 'Pending',
        comment: 'Claim record created by warehouse staff.'
      }];
    }
    
    getStore(CLAIMS_STORE, 'readwrite')
      .then(({ store }) => {
        const request = store.put(claim);
        request.onsuccess = () => resolve(claim);
        request.onerror = () => reject(request.error);
      })
      .catch(reject);
  });
}

export function deleteClaim(id) {
  return new Promise((resolve, reject) => {
    getStore(CLAIMS_STORE, 'readwrite')
      .then(({ store }) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      })
      .catch(reject);
  });
}

// --- Import & Export Operations ---

export function exportBackup() {
  return new Promise((resolve, reject) => {
    Promise.all([getUsers(), getClaims()])
      .then(([users, claims]) => {
        const backupData = {
          version: 1,
          exportedAt: new Date().toISOString(),
          users,
          claims
        };
        resolve(JSON.stringify(backupData, null, 2));
      })
      .catch(reject);
  });
}

export function importBackup(jsonString) {
  return new Promise((resolve, reject) => {
    try {
      const backupData = JSON.parse(jsonString);
      
      // Basic validation
      if (!backupData.users || !backupData.claims) {
        throw new Error('Invalid backup file structure.');
      }

      initDB()
        .then((db) => {
          const transaction = db.transaction([USERS_STORE, CLAIMS_STORE], 'readwrite');
          const userStore = transaction.objectStore(USERS_STORE);
          const claimStore = transaction.objectStore(CLAIMS_STORE);

          // Clear existing stores
          userStore.clear();
          claimStore.clear();

          // Load users
          backupData.users.forEach((u) => {
            userStore.put(u);
          });

          // Load claims
          backupData.claims.forEach((c) => {
            claimStore.put(c);
          });

          transaction.oncomplete = () => {
            resolve({
              usersCount: backupData.users.length,
              claimsCount: backupData.claims.length
            });
          };

          transaction.onerror = (event) => {
            reject(event.target.error);
          };
        })
        .catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}

// --- Storage Space Calculator ---
export function calculateStorageStats() {
  return new Promise((resolve) => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((estimate) => {
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;
        resolve({
          usageBytes: usage,
          quotaBytes: quota,
          percentage: quota > 0 ? Math.round((usage / quota) * 100) : 0,
          readableUsage: formatBytes(usage),
          readableQuota: formatBytes(quota)
        });
      }).catch(() => {
        resolve(getFallbackStats());
      });
    } else {
      resolve(getFallbackStats());
    }
  });
}

function getFallbackStats() {
  return {
    usageBytes: 0,
    quotaBytes: 0,
    percentage: 0,
    readableUsage: 'Unknown size',
    readableQuota: 'Unlimited'
  };
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
