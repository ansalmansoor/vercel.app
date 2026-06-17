// =====================================================
// SafeTClaim - Database Layer (PHP/MySQL Backend)
// All data is stored in MySQL via PHP API endpoints.
// This replaces the previous browser IndexedDB version.
// =====================================================

// Base URL of the PHP API
// Change this if your server uses a different path
const API_BASE = './api';

// Helper: generic API fetch call
async function apiFetch(endpoint, options = {}) {
  const response = await fetch(API_BASE + endpoint, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `API error (${response.status})`);
  }
  return data;
}

// --- No-op initDB: Not needed with MySQL backend ---
export function initDB() {
  return Promise.resolve(); // Nothing to initialise
}

// --- Users API ---

export function getUsers() {
  return apiFetch('/users.php');
}

export function saveUser(user) {
  return apiFetch('/users.php', {
    method: 'POST',
    body: JSON.stringify({
      username: user.username,
      password: user.password,
      role: user.role,
    }),
  });
}

export function deleteUser(username) {
  return apiFetch(`/users.php?username=${encodeURIComponent(username)}`, {
    method: 'DELETE',
  });
}

// --- Claims API ---

export function getClaims() {
  return apiFetch('/claims.php');
}

export function saveClaim(claim) {
  // Assign ID and defaults if missing (same logic as old IndexedDB version)
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

  return apiFetch('/claims.php', {
    method: 'POST',
    body: JSON.stringify(claim),
  });
}

export function deleteClaim(id) {
  return apiFetch(`/claims.php?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// --- Storage Stats (stub - not applicable for MySQL) ---
export function calculateStorageStats() {
  return Promise.resolve({
    usageBytes: 0,
    quotaBytes: 0,
    percentage: 0,
    readableUsage: 'MySQL Server',
    readableQuota: 'Unlimited'
  });
}
