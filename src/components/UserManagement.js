// UserManagement component for SafeTClaim (Super User Only)
import { escapeHTML } from '../utils/sanitize.js';

export class UserManagement {
  constructor(handlers) {
    this.modal = document.getElementById('user-management-modal');
    this.form = document.getElementById('add-user-form');
    this.usernameInput = document.getElementById('new-username');
    this.passwordInput = document.getElementById('new-password');
    this.roleSelect = document.getElementById('new-role');
    this.tableBody = document.getElementById('user-mgr-tbody');

    this.handlers = handlers; // { onAddUser, onDeleteUser }

    this.initEventListeners();
  }

  initEventListeners() {
    // Close modal triggers
    this.modal.querySelectorAll('.modal-close-trigger').forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        this.close();
      });
    });

    // Form Submission (Add User)
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const username = this.usernameInput.value.trim().toLowerCase();
      const password = this.passwordInput.value;
      const role = this.roleSelect.value;

      if (username && password && role) {
        this.handlers.onAddUser({ username, password, role });
        this.form.reset();
        this.usernameInput.focus();
      }
    });
  }

  open(users, currentLoggedInUser) {
    this.renderUsers(users, currentLoggedInUser);
    this.modal.style.display = 'flex';
    this.usernameInput.focus();
  }

  renderUsers(users, currentLoggedInUser) {
    this.tableBody.innerHTML = '';

    users.forEach(user => {
      const row = document.createElement('tr');
      const isSelf = user.username === currentLoggedInUser;
      
      // Role text
      const roleText = user.role === 'super' ? 'Super User (Manager)' : 'Warehouse Staff';
      const escapedUsername = escapeHTML(user.username);

      row.innerHTML = `
        <td><strong>${escapedUsername}</strong></td>
        <td>${roleText}</td>
        <td>
          ${isSelf ? `
            <span class="info-val-small" style="font-style: italic; color: var(--color-text-dark);">Current Session</span>
          ` : `
            <button type="button" class="btn btn-secondary text-btn remove-user-btn" style="color: #f87171; border-color: rgba(239, 68, 68, 0.1);" data-username="${escapedUsername}">
              <i data-lucide="user-minus" style="width: 14px; height: 14px;"></i> Delete
            </button>
          `}
        </td>
      `;

      if (!isSelf) {
        row.querySelector('.remove-user-btn').addEventListener('click', () => {
          if (confirm(`Are you sure you want to delete user "${user.username}"?`)) {
            this.handlers.onDeleteUser(user.username);
          }
        });
      }

      this.tableBody.appendChild(row);
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  close() {
    this.modal.style.display = 'none';
  }
}
