// Main Application Coordinator for SafeTClaim - Amazon SAFE-T Claim Manager

// Test automation helper (bypasses blocking native popups in automated browser agent runs)
if (window.location.search.includes('test=true')) {
  window.confirm = () => true;
  window.alert = (msg) => console.log('Mock Alert:', msg);
}

import * as db from './utils/db.js';
import { getSupabaseUsers, saveSupabaseUser, deleteSupabaseUser } from './utils/supabase.js';
import { Login } from './components/Login.js';
import { renderClaimCard } from './components/ClaimCard.js';
import { ClaimFormModal } from './components/ClaimFormModal.js';
import { ClaimDetailModal } from './components/ClaimDetailModal.js';
import { UserManagement } from './components/UserManagement.js';
import { ChangePasswordModal } from './components/ChangePasswordModal.js';
import { hashPassword, isHash } from './utils/sanitize.js';

// Global App State
const state = {
  users: [],
  claims: [],
  currentUser: null, // { username, role }
  activeStatusFilter: 'all', // 'all', 'Pending', 'Case Created', 'Approved', 'Rejected'
  activeIssueFilter: 'all',  // 'all', 'Not our item', 'Missing part', 'Used item', 'Other'
  searchQuery: '',
  storageStats: null
};

// Component Instances
let loginComponent = null;
let claimFormModalComponent = null;
let claimDetailModalComponent = null;
let userManagementComponent = null;
let changePasswordModalComponent = null;

// DOM Elements
const appContainer = document.getElementById('app-container');
const loginContainer = document.getElementById('login-container');
const navUserName = document.getElementById('nav-user-name');
const navUserRole = document.getElementById('nav-user-role');

// Sidebar DOM
const sidebarContainer = document.getElementById('sidebar-container');
const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
const statusFilters = document.getElementById('status-filters');
const issueFilters = document.getElementById('issue-filters');
const managerActionsSection = document.getElementById('manager-actions-section');
const userMgrBtn = document.getElementById('nav-user-mgr-btn');
const changePwdBtn = document.getElementById('change-pwd-btn');
const logoutBtn = document.getElementById('logout-btn');

// Top Bar & Workspace DOM
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const addClaimBtn = document.getElementById('add-claim-btn');
const emptyStateBtn = document.getElementById('empty-state-btn');
const claimsGrid = document.getElementById('claims-grid');
const emptyState = document.getElementById('empty-state');
const filterHeader = document.getElementById('filter-header');
const activeFiltersContainer = document.getElementById('active-filters-container');
const clearAllFiltersBtn = document.getElementById('clear-all-filters-btn');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  try {
    // 1. Initialize local IndexedDB (for claims)
    await db.initDB();

    // 2. Load Users from Supabase + Claims from IndexedDB
    await loadData();

    // 3. Seed sample claims if local DB is empty (users are seeded in Supabase)
    if (state.claims.length === 0) {
      await seedMockClaims();
      await loadData();
    }

    // 4. Calculate local storage size metrics
    await updateStorageStats();

    // 5. Setup Component Instances
    initComponents();

    // 6. Bind General Page Event Listeners
    bindEvents();

    // 7. Session Restore Check
    restoreSession();
  } catch (error) {
    console.error('Failed to initialize SafeTClaim app:', error);
    alert('Failed to load app. Please check your internet connection (Supabase required).');
  }
}

// Data loaders
async function loadData() {
  // Users → Supabase (persistent across all devices/browsers)
  state.users = await getSupabaseUsers();
  // Claims → IndexedDB (local browser storage)
  state.claims = await db.getClaims();
}

async function updateStorageStats() {
  state.storageStats = await db.calculateStorageStats();
}

// Seeding Default Credentials
async function seedMockUsers() {
  const defaultUsers = [
    { username: 'admin', password: await hashPassword('admin123'), role: 'super' },
    { username: 'staff', password: await hashPassword('staff123'), role: 'staff' }
  ];
  for (const u of defaultUsers) {
    await db.saveUser(u);
  }
}

// Seeding Mock Claims
async function seedMockClaims() {
  const mockClaims = [
    {
      id: 'claim_seed_1',
      shipmentId: 'FBA18G5K9A',
      trackingNumber: '1Z999AA10123456784',
      returnType: 'Amazon',
      issueType: 'Not our item',
      images: [
        'https://images.unsplash.com/photo-1597872200919-21652f361a8c?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?auto=format&fit=crop&w=600&q=80'
      ],
      message: 'Customer purchased a brand new Samsung SSD but returned a dusty old mechanical hard drive instead. The serial numbers do not match the retail packaging.',
      status: 'Pending',
      dateAdded: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      addedBy: 'staff',
      addedByRole: 'staff',
      history: [
        {
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          user: 'staff',
          status: 'Pending',
          comment: 'Claim record created by warehouse team. WhatsApp photos attached.'
        }
      ]
    },
    {
      id: 'claim_seed_2',
      shipmentId: 'FBA18H6L0B',
      trackingNumber: '1Z999AA10123456785',
      returnType: 'FBA Return',
      issueType: 'Missing part',
      images: [
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=600&q=80'
      ],
      message: 'Retail package for Beats Headphones arrived completely empty. Seal was torn off and headphones were missing inside. Box was resealed with clear packing tape.',
      status: 'Case Created',
      dateAdded: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      addedBy: 'staff',
      addedByRole: 'staff',
      history: [
        {
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          user: 'staff',
          status: 'Pending',
          comment: 'Empty headphones box uploaded. Weight reported is incorrect.'
        },
        {
          date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hrs ago
          user: 'admin',
          status: 'Case Created',
          comment: 'SAFE-T Case successfully created. Amazon Claim Case ID: 1403912093. Waiting for response.'
        }
      ]
    },
    {
      id: 'claim_seed_3',
      shipmentId: 'FBA18I7M1C',
      trackingNumber: '1Z999AA10123456786',
      returnType: 'Amazon',
      issueType: 'Used item',
      images: [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'
      ],
      message: 'Customer returned running shoes covered in mud and heavy sole wear. Obviously worn for weeks outside before initiating return. Product is damaged and unsellable.',
      status: 'Approved',
      dateAdded: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
      addedBy: 'staff',
      addedByRole: 'staff',
      history: [
        {
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          user: 'staff',
          status: 'Pending',
          comment: 'Damaged muddy shoes logged.'
        },
        {
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          user: 'admin',
          status: 'Case Created',
          comment: 'SAFE-T Case filed: ID 14037592. Submitted photos of sole wear.'
        },
        {
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          user: 'admin',
          status: 'Approved',
          comment: 'Amazon approved refund reimbursement: $129.99 credited to seller account balance.'
        }
      ]
    }
  ];

  for (const c of mockClaims) {
    await db.saveClaim(c);
  }
}

// Session Check
function restoreSession() {
  const session = sessionStorage.getItem('safet_user_session');
  if (session) {
    try {
      const user = JSON.parse(session);
      loginUser(user.username, user.role);
    } catch (e) {
      sessionStorage.removeItem('safet_user_session');
      showLoginScreen();
    }
  } else {
    showLoginScreen();
  }
}

function showLoginScreen() {
  state.currentUser = null;
  appContainer.style.display = 'none';
  loginComponent.show();
}

function loginUser(username, role) {
  state.currentUser = { username, role };
  
  // Save to session
  sessionStorage.setItem('safet_user_session', JSON.stringify(state.currentUser));

  // Configure UI headers
  navUserName.textContent = username;
  navUserRole.textContent = role === 'super' ? 'Super User (Manager)' : 'Warehouse Staff';

  // Toggle super-user visual options
  if (role === 'super') {
    managerActionsSection.style.display = 'block';
  } else {
    managerActionsSection.style.display = 'none';
  }

  // Swap Views
  loginComponent.hide();
  appContainer.style.display = 'flex';
  
  // Render Workspace
  render();
}

// Component setups
function initComponents() {
  // 1. Login Component
  loginComponent = new Login({
    onLogin: async (username, password) => {
      const match = state.users.find(u => u.username === username.toLowerCase());
      if (match) {
        let isCorrect = false;
        if (isHash(match.password)) {
          const hashedInput = await hashPassword(password);
          isCorrect = (match.password === hashedInput);
        } else {
          // Plaintext fallback (migration / fallback compatibility)
          isCorrect = (match.password === password);
        }

        if (isCorrect) {
          loginUser(match.username, match.role);
          return;
        }
      }
      loginComponent.showError();
    }
  });

  // 2. Claim Form Modal
  claimFormModalComponent = new ClaimFormModal({
    onSubmit: async (claimData) => {
      try {
        claimData.addedBy = state.currentUser.username;
        claimData.addedByRole = state.currentUser.role;
        await db.saveClaim(claimData);
        await loadData();
        await updateStorageStats();
        render();
      } catch (err) {
        alert('Failed to save claim record: ' + err.message);
      }
    }
  });

  // 3. Claim Detail Modal
  claimDetailModalComponent = new ClaimDetailModal({
    onStatusChange: async (claimId, newStatus, statusNote) => {
      try {
        if (!state.currentUser || state.currentUser.role !== 'super') {
          alert('Access denied. Managers only.');
          return;
        }
        const claim = state.claims.find(c => c.id === claimId);
        if (!claim) return;

        // Clone claim and push timeline event
        const updatedClaim = { ...claim };
        updatedClaim.status = newStatus;
        updatedClaim.history = [...(claim.history || [])];
        updatedClaim.history.push({
          date: new Date().toISOString(),
          user: state.currentUser.username,
          status: newStatus,
          comment: statusNote || `Status changed to ${newStatus}.`
        });

        await db.saveClaim(updatedClaim);
        await loadData();
        
        // Reopen to show updates
        claimDetailModalComponent.open(updatedClaim, state.currentUser.role);
        render();
      } catch (err) {
        alert('Failed to update status: ' + err.message);
      }
    },
    onDelete: async (claimId) => {
      if (!state.currentUser || state.currentUser.role !== 'super') {
        alert('Access denied. Managers only.');
        return;
      }
      if (confirm('Are you sure you want to delete this claim record? This will permanently delete the images from local IndexedDB.')) {
        try {
          await db.deleteClaim(claimId);
          await loadData();
          await updateStorageStats();
          claimDetailModalComponent.close();
          render();
        } catch (err) {
          alert('Delete failed: ' + err.message);
        }
      }
    }
  });

  // 4. User Manager Modal (Super User only)
  userManagementComponent = new UserManagement({
    onAddUser: async (userData) => {
      if (!state.currentUser || state.currentUser.role !== 'super') {
        alert('Access denied. Managers only.');
        return;
      }
      const exists = state.users.some(u => u.username === userData.username);
      if (exists) {
        alert(`Username "${userData.username}" already exists.`);
        return;
      }
      try {
        // Hash password before saving
        userData.password = await hashPassword(userData.password);
        await saveSupabaseUser(userData); // Saved to Supabase (persists everywhere)
        await loadData();
        userManagementComponent.renderUsers(state.users, state.currentUser.username);
      } catch (err) {
        alert('Failed to save user: ' + err.message);
      }
    },
    onDeleteUser: async (username) => {
      if (!state.currentUser || state.currentUser.role !== 'super') {
        alert('Access denied. Managers only.');
        return;
      }
      try {
        await deleteSupabaseUser(username); // Deleted from Supabase
        await loadData();
        userManagementComponent.renderUsers(state.users, state.currentUser.username);
      } catch (err) {
        alert('Failed to delete user: ' + err.message);
      }
    }
  });

  // 5. Change Password Modal
  changePasswordModalComponent = new ChangePasswordModal({
    onChangePassword: async (currentPassword, newPassword) => {
      try {
        const user = state.users.find(u => u.username === state.currentUser.username);
        if (!user) return;

        let isCorrect = false;
        if (isHash(user.password)) {
          const hashedInput = await hashPassword(currentPassword);
          isCorrect = (user.password === hashedInput);
        } else {
          isCorrect = (user.password === currentPassword);
        }

        if (!isCorrect) {
          alert("Current password is incorrect.");
          return;
        }

        // Clone user and save new hashed password to Supabase
        const updatedUser = { ...user, password: await hashPassword(newPassword) };
        await saveSupabaseUser(updatedUser); // Saved to Supabase (persists everywhere)
        // Reload users from Supabase to sync in-memory state
        await loadData();
        
        alert("Password updated successfully!");
        changePasswordModalComponent.close();
      } catch (err) {
        alert('Failed to update password: ' + err.message);
      }
    }
  });
}

// Event bindings
function bindEvents() {
  // Backdrop clicks close
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.style.display = 'none';
      }
    });
  });

  // Mobile sidebar toggles
  sidebarToggleBtn.addEventListener('click', () => {
    sidebarContainer.classList.add('open');
  });

  sidebarCloseBtn.addEventListener('click', () => {
    sidebarContainer.classList.remove('open');
  });

  // Change Password trigger
  if (changePwdBtn) {
    changePwdBtn.addEventListener('click', () => {
      changePasswordModalComponent.open();
    });
  }

  // Logout button
  logoutBtn.addEventListener('click', () => {
    if (confirm('Log out of SafeTClaim?')) {
      sessionStorage.removeItem('safet_user_session');
      showLoginScreen();
    }
  });

  // User Manager modal trigger
  userMgrBtn.addEventListener('click', () => {
    if (state.currentUser.role === 'super') {
      userManagementComponent.open(state.users, state.currentUser.username);
    }
  });

  // Add Record Modal trigger
  addClaimBtn.addEventListener('click', () => {
    claimFormModalComponent.open();
  });

  emptyStateBtn.addEventListener('click', () => {
    claimFormModalComponent.open();
  });

  // Search input change listeners
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase().trim();
    if (state.searchQuery) {
      clearSearchBtn.style.display = 'block';
    } else {
      clearSearchBtn.style.display = 'none';
    }
    renderGridOnly();
  });

  clearSearchBtn.addEventListener('click', () => {
    state.searchQuery = '';
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    renderGridOnly();
  });

  // Status Filter clicks
  statusFilters.querySelectorAll('.nav-filter-item').forEach(item => {
    item.addEventListener('click', () => {
      statusFilters.querySelectorAll('.nav-filter-item').forEach(li => li.classList.remove('active'));
      item.classList.add('active');
      state.activeStatusFilter = item.getAttribute('data-status');
      
      // Close sidebar drawer on mobile after clicking filter
      sidebarContainer.classList.remove('open');
      render();
    });
  });

  // Issue category clicks
  issueFilters.querySelectorAll('.nav-filter-item').forEach(item => {
    item.addEventListener('click', () => {
      issueFilters.querySelectorAll('.nav-filter-item').forEach(li => li.classList.remove('active'));
      item.classList.add('active');
      state.activeIssueFilter = item.getAttribute('data-issue');
      
      // Close sidebar drawer on mobile
      sidebarContainer.classList.remove('open');
      render();
    });
  });

  // Clear filters
  clearAllFiltersBtn.addEventListener('click', () => {
    resetFilters();
  });
}

function resetFilters() {
  state.activeStatusFilter = 'all';
  state.activeIssueFilter = 'all';
  state.searchQuery = '';
  searchInput.value = '';
  clearSearchBtn.style.display = 'none';

  statusFilters.querySelectorAll('.nav-filter-item').forEach(li => {
    li.classList.toggle('active', li.getAttribute('data-status') === 'all');
  });

  issueFilters.querySelectorAll('.nav-filter-item').forEach(li => {
    li.classList.toggle('active', li.getAttribute('data-issue') === 'all');
  });

  render();
}

// Core filtering rules
function getFilteredClaims() {
  return state.claims.filter(claim => {
    // 1. Status Filter
    if (state.activeStatusFilter !== 'all') {
      if (claim.status !== state.activeStatusFilter) return false;
    }

    // 2. Issue Type Filter
    if (state.activeIssueFilter !== 'all') {
      if (claim.issueType !== state.activeIssueFilter) return false;
    }

    // 3. Search query matches
    if (state.searchQuery) {
      const shipMatch = claim.shipmentId.toLowerCase().includes(state.searchQuery);
      const trackingMatch = claim.trackingNumber.toLowerCase().includes(state.searchQuery);
      const messageMatch = (claim.message || '').toLowerCase().includes(state.searchQuery);
      const userMatch = (claim.addedBy || '').toLowerCase().includes(state.searchQuery);
      
      if (!shipMatch && !trackingMatch && !messageMatch && !userMatch) return false;
    }

    return true;
  });
}

// --- Render Operations ---

function render() {
  // Sidebar statuses tallies update
  renderSidebarTally();

  // Grid layout rendering
  renderGridOnly();
}

function renderSidebarTally() {
  // 1. Calculate count tallies
  const counts = {
    all: state.claims.length,
    pending: state.claims.filter(c => c.status === 'Pending').length,
    case: state.claims.filter(c => c.status === 'Case Created').length,
    approved: state.claims.filter(c => c.status === 'Approved').length,
    rejected: state.claims.filter(c => c.status === 'Rejected').length
  };

  document.getElementById('count-all').textContent = counts.all;
  document.getElementById('count-pending').textContent = counts.pending;
  document.getElementById('count-case').textContent = counts.case;
  document.getElementById('count-approved').textContent = counts.approved;
  document.getElementById('count-rejected').textContent = counts.rejected;

  // 2. Render storage bar stats
  const percentageStr = state.storageStats ? `${state.storageStats.percentage}%` : '0%';
  const readableStr = state.storageStats ? `${state.storageStats.readableUsage} of ${state.storageStats.readableQuota}` : 'Calculated locally';
  
  const percentageEl = document.getElementById('storage-percentage');
  const progressEl = document.getElementById('storage-progress');
  const descEl = document.getElementById('storage-desc');

  if (percentageEl) percentageEl.textContent = percentageStr;
  if (progressEl) progressEl.style.width = percentageStr;
  if (descEl) descEl.textContent = readableStr;
}

function renderGridOnly() {
  // Render active filters indicator
  renderFilterHeader();

  const filteredList = getFilteredClaims();
  
  // Sort claims newest first
  const sortedList = [...filteredList].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

  claimsGrid.innerHTML = '';

  if (sortedList.length === 0) {
    claimsGrid.style.display = 'none';
    emptyState.style.display = 'flex';

    if (state.searchQuery || state.activeStatusFilter !== 'all' || state.activeIssueFilter !== 'all') {
      document.getElementById('empty-state-title').textContent = 'No matching claims';
      document.getElementById('empty-state-text').textContent = 'Try adjusting your search query, or clear filters to view all records.';
    } else {
      document.getElementById('empty-state-title').textContent = 'No claim records';
      document.getElementById('empty-state-text').textContent = 'Everything is fully caught up! Tap Add Record to log a new claim issue.';
    }
  } else {
    claimsGrid.style.display = 'grid';
    emptyState.style.display = 'none';

    sortedList.forEach(claim => {
      const card = renderClaimCard(claim, {
        onClick: (id) => {
          const claimObj = state.claims.find(c => c.id === id);
          claimDetailModalComponent.open(claimObj, state.currentUser.role);
        }
      });
      claimsGrid.appendChild(card);
    });
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderFilterHeader() {
  activeFiltersContainer.innerHTML = '';
  
  const hasStatus = state.activeStatusFilter !== 'all';
  const hasIssue = state.activeIssueFilter !== 'all';
  const hasSearch = !!state.searchQuery;

  if (hasStatus || hasIssue || hasSearch) {
    filterHeader.style.display = 'flex';

    if (hasStatus) {
      const pill = document.createElement('div');
      pill.className = 'filter-pill';
      pill.innerHTML = `
        <span>Status: ${state.activeStatusFilter}</span>
        <button id="clear-status-pill">&times;</button>
      `;
      pill.querySelector('button').addEventListener('click', () => {
        state.activeStatusFilter = 'all';
        statusFilters.querySelectorAll('.nav-filter-item').forEach(li => {
          li.classList.toggle('active', li.getAttribute('data-status') === 'all');
        });
        render();
      });
      activeFiltersContainer.appendChild(pill);
    }

    if (hasIssue) {
      const pill = document.createElement('div');
      pill.className = 'filter-pill';
      pill.innerHTML = `
        <span>Category: ${state.activeIssueFilter}</span>
        <button id="clear-issue-pill">&times;</button>
      `;
      pill.querySelector('button').addEventListener('click', () => {
        state.activeIssueFilter = 'all';
        issueFilters.querySelectorAll('.nav-filter-item').forEach(li => {
          li.classList.toggle('active', li.getAttribute('data-issue') === 'all');
        });
        render();
      });
      activeFiltersContainer.appendChild(pill);
    }

    if (hasSearch) {
      const pill = document.createElement('div');
      pill.className = 'filter-pill';
      pill.innerHTML = `
        <span>Search: "${state.searchQuery}"</span>
        <button id="clear-search-pill">&times;</button>
      `;
      pill.querySelector('button').addEventListener('click', () => {
        state.searchQuery = '';
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        render();
      });
      activeFiltersContainer.appendChild(pill);
    }
  } else {
    filterHeader.style.display = 'none';
  }
}
