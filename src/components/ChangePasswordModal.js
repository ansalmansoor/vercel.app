export class ChangePasswordModal {
  constructor(handlers) {
    this.modal = document.getElementById('change-pwd-modal');
    this.form = document.getElementById('change-pwd-form');
    this.currentPasswordInput = document.getElementById('current-password');
    this.newPasswordInput = document.getElementById('new-pwd');
    this.confirmPasswordInput = document.getElementById('confirm-pwd');

    this.handlers = handlers; // { onChangePassword }

    this.initEventListeners();
  }

  initEventListeners() {
    this.modal.querySelectorAll('.modal-close-trigger').forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        this.close();
      });
    });

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const currentPwd = this.currentPasswordInput.value;
      const newPwd = this.newPasswordInput.value;
      const confirmPwd = this.confirmPasswordInput.value;

      if (newPwd !== confirmPwd) {
        alert("New passwords do not match.");
        return;
      }

      this.handlers.onChangePassword(currentPwd, newPwd);
    });
  }

  open() {
    this.form.reset();
    this.modal.style.display = 'flex';
    this.currentPasswordInput.focus();
  }

  close() {
    this.modal.style.display = 'none';
  }
}
