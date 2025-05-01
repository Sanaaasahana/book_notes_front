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
      const userData = localStorage.getItem('user');
      return this.currentUser || (userData ? JSON.parse(userData) : null);
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
      if (token && state.user) {
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

  // View Management
  function showAuthenticatedViews() {
    document.querySelectorAll('.auth-only').forEach(el => {
      if (el) el.style.display = 'block';
    });
    document.querySelectorAll('.guest-only').forEach(el => {
      if (el) el.style.display = 'none';
    });
  }

  function showUnauthenticatedViews() {
    document.querySelectorAll('.auth-only').forEach(el => {
      if (el) el.style.display = 'none';
    });
    document.querySelectorAll('.guest-only').forEach(el => {
      if (el) el.style.display = 'block';
    });
  }

  // Enhanced API Client with CORS handling
  const apiClient = {
    async request(endpoint, { method = 'GET', body, headers = {} } = {}) {
      const url = `${window.API_BASE_URL}${endpoint}`;
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        credentials: 'include',
        mode: 'cors'
      };

      if (body) config.body = JSON.stringify(body);

      try {
        const response = await fetch(url, config);
        
        // Handle CORS preflight errors
        if (response.status === 0) {
          throw new Error('CORS policy blocked the request');
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
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
      showAuthenticatedViews();
      loadDashboard();
      showAlert('Login successful!', 'success');
    } catch (error) {
      showAlert(error.message.includes('CORS') 
        ? 'Connection error. Please try again later.' 
        : 'Invalid credentials', 
      'error');
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
      showAuthenticatedViews();
      loadDashboard();
      showAlert('Registration successful!', 'success');
    } catch (error) {
      showAlert(
        error.message.includes('CORS') ? 'Connection error' :
        error.message.includes('409') ? 'User already exists' :
        'Registration failed. Please try again.',
        'error'
      );
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
      showUnauthenticatedViews();
      loadLogin();
    }
  }

  // UI Helpers
  function showAlert(message, type = 'info') {
    // Replace with your actual alert/notification system
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
  }

  function setupNavigation() {
    if (!elements.nav) return;
    
    elements.nav.innerHTML = state.user ? `
      <a href="#" onclick="authModule.loadDashboard()">Dashboard</a>
      <a href="#" onclick="authModule.loadBookForm()">Add Book</a>
      <a href="#" onclick="authModule.logout()">Logout</a>
      <span>Welcome, ${state.user.username}</span>
    ` : `
      <a href="#" onclick="authModule.loadLogin()">Login</a>
      <a href="#" onclick="authModule.loadRegister()">Register</a>
    `;
  }

  // UI Loaders
  function loadLogin() {
    if (!elements.mainContent) return;
    elements.mainContent.innerHTML = `
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
        <p>Don't have an account? <a href="#" onclick="authModule.loadRegister()">Register</a></p>
      </div>
    `;
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
  }

  function loadRegister() {
    if (!elements.mainContent) return;
    elements.mainContent.innerHTML = `
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
        <p>Already have an account? <a href="#" onclick="authModule.loadLogin()">Login</a></p>
      </div>
    `;
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
    loadDashboard: function() {
      // Implement your dashboard loading logic
      if (elements.mainContent) elements.mainContent.innerHTML = '<h2>Dashboard</h2>';
    },
    loadBookForm: function() {
      // Implement your book form loading logic
      if (elements.mainContent) elements.mainContent.innerHTML = '<h2>Add Book</h2>';
    },
    get currentUser() { return state.user; }
  };
})();
