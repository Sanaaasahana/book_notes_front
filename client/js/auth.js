// Configuration - API Base URL with environment awareness
window.API_BASE_URL = window.API_BASE_URL || (function() {
  // Auto-detect environment
  const isLocal = window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1';
  return isLocal ? 'http://localhost:5000' : 'https://backend-cpn2.onrender.com';
})();

// Core Application
(function() {
  // State Management with persistence
  const state = {
    currentUser: null,
    get user() {
      return this.currentUser || JSON.parse(localStorage.getItem('user'));
    },
    set user(userData) {
      this.currentUser = userData;
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        localStorage.removeItem('user');
      }
    }
  };

  // DOM Elements cache
  const elements = {
    nav: document.getElementById('nav'),
    mainContent: document.getElementById('main-content')
  };

  // Authentication Functions
  function checkAuth() {
    const token = localStorage.getItem('token');
    try {
      if (token) {
        state.user = JSON.parse(localStorage.getItem('user'));
        showAuthenticatedViews();
        loadDashboard();
        return;
      }
    } catch (error) {
      console.error('Auth state error:', error);
      clearAuthState();
    }
    showUnauthenticatedViews();
    loadLogin();
  }

  function clearAuthState() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    state.user = null;
  }

  // View Management with debouncing
  const viewManager = {
    showAuthenticatedViews() {
      document.querySelectorAll('.auth-only').forEach(el => {
        el?.style.setProperty('display', 'block', 'important');
      });
      document.querySelectorAll('.guest-only').forEach(el => {
        el?.style.setProperty('display', 'none', 'important');
      });
    },
    showUnauthenticatedViews() {
      document.querySelectorAll('.auth-only').forEach(el => {
        el?.style.setProperty('display', 'none', 'important');
      });
      document.querySelectorAll('.guest-only').forEach(el => {
        el?.style.setProperty('display', 'block', 'important');
      });
    }
  };

  // Enhanced API Client
  const apiClient = {
    async request(endpoint, { method = 'GET', body, headers = {} } = {}) {
      const url = `${window.API_BASE_URL}${endpoint}`;
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        credentials: 'include'
      };

      if (body) config.body = JSON.stringify(body);

      try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
          const error = new Error(`HTTP error! status: ${response.status}`);
          error.response = response;
          throw error;
        }

        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return await response.json();
        }
        return await response.text();
      } catch (error) {
        console.error(`API Error at ${endpoint}:`, error);
        throw error;
      }
    }
  };

  // Auth Handlers with better validation
  async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;

    if (!email || !password) {
      showAlert('Please fill in all fields', 'error');
      return;
    }

    try {
      const data = await apiClient.request('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      });

      localStorage.setItem('token', data.token);
      state.user = data.user;
      setupNavigation();
      viewManager.showAuthenticatedViews();
      loadDashboard();
      showAlert('Login successful!', 'success');
    } catch (error) {
      const message = error.response?.status === 401 
        ? 'Invalid credentials' 
        : 'Login failed. Please try again.';
      showAlert(message, 'error');
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username')?.value.trim();
    const email = document.getElementById('register-email')?.value.trim();
    const password = document.getElementById('register-password')?.value;

    if (!username || !email || !password) {
      showAlert('Please fill in all fields', 'error');
      return;
    }

    if (password.length < 6) {
      showAlert('Password must be at least 6 characters', 'error');
      return;
    }

    try {
      const data = await apiClient.request('/api/auth/register', {
        method: 'POST',
        body: { username, email, password }
      });

      localStorage.setItem('token', data.token);
      state.user = data.user;
      setupNavigation();
      viewManager.showAuthenticatedViews();
      loadDashboard();
      showAlert('Registration successful!', 'success');
    } catch (error) {
      const message = error.response?.status === 409 
        ? 'User already exists' 
        : 'Registration failed. Please try again.';
      showAlert(message, 'error');
    }
  }

  async function logout() {
    try {
      await apiClient.request('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthState();
      setupNavigation();
      viewManager.showUnauthenticatedViews();
      loadLogin();
    }
  }

  // UI Helpers
  function showAlert(message, type = 'info') {
    // Implement your alert system (could be toast notifications)
    alert(`${type.toUpperCase()}: ${message}`);
  }

  function setupNavigation() {
    if (!elements.nav) return;
    
    elements.nav.innerHTML = state.user ? `
      <a href="#" onclick="loadDashboard()">Dashboard</a>
      <a href="#" onclick="loadBookForm()">Add Book</a>
      <a href="#" onclick="logout()">Logout</a>
      <span>Welcome, ${state.user.username}</span>
    ` : `
      <a href="#" onclick="loadLogin()">Login</a>
      <a href="#" onclick="loadRegister()">Register</a>
    `;
  }

  // UI Loaders with template caching
  const templates = {
    login: `
      <div class="auth-form">
        <h2>Login</h2>
        <form id="login-form">
          <div class="form-group">
            <label for="login-email">Email</label>
            <input type="email" id="login-email" required>
          </div>
          <div class="form-group">
            <label for="login-password">Password</label>
            <input type="password" id="login-password" required>
          </div>
          <button type="submit">Login</button>
        </form>
        <p>Don't have an account? <a href="#" onclick="loadRegister()">Register</a></p>
      </div>
    `,
    register: `
      <div class="auth-form">
        <h2>Register</h2>
        <form id="register-form">
          <div class="form-group">
            <label for="register-username">Username</label>
            <input type="text" id="register-username" required>
          </div>
          <div class="form-group">
            <label for="register-email">Email</label>
            <input type="email" id="register-email" required>
          </div>
          <div class="form-group">
            <label for="register-password">Password</label>
            <input type="password" id="register-password" required minlength="6">
          </div>
          <button type="submit">Register</button>
        </form>
        <p>Already have an account? <a href="#" onclick="loadLogin()">Login</a></p>
      </div>
    `
  };

  function loadLogin() {
    if (!elements.mainContent) return;
    elements.mainContent.innerHTML = templates.login;
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
  }

  function loadRegister() {
    if (!elements.mainContent) return;
    elements.mainContent.innerHTML = templates.register;
    document.getElementById('register-form')?.addEventListener('submit', handleRegister);
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupNavigation();
  });

  // Public API
  window.authModule = {
    checkAuth,
    logout,
    loadLogin,
    loadRegister,
    get currentUser() { return state.user; }
  };
})();
