// Login component for SafeTClaim

export class Login {
  constructor(handlers) {
    this.loginContainer = document.getElementById('login-container');
    this.loginForm = document.getElementById('login-form');
    this.usernameInput = document.getElementById('login-username');
    this.passwordInput = document.getElementById('login-password');
    this.errorMsg = document.getElementById('login-error-msg');
    
    this.handlers = handlers; // { onLogin }

    this.initEventListeners();
  }

  initEventListeners() {
    this.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = this.usernameInput.value.trim();
      const password = this.passwordInput.value;
      
      this.errorMsg.style.display = 'none';
      
      if (username && password) {
        this.handlers.onLogin(username, password);
      }
    });
  }

  showError(message = 'Invalid username or password.') {
    this.errorMsg.textContent = message;
    this.errorMsg.style.display = 'block';
    this.passwordInput.value = '';
    this.passwordInput.focus();
  }

  show() {
    this.clear();
    this.loginContainer.style.display = 'flex';
  }

  hide() {
    this.loginContainer.style.display = 'none';
  }

  clear() {
    this.usernameInput.value = '';
    this.passwordInput.value = '';
    this.errorMsg.style.display = 'none';
  }
}
