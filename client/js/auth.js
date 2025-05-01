// Configuration - API Base URL with environment awareness
window.API_BASE_URL = window.API_BASE_URL || (() => {
  const isLocal = window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1';
  return isLocal ? 'http://localhost:5000' : 'https://backend-cpn2.onrender.com';
})();

// Core Application
(function() {
  // Enhanced State Management
  const state = {
    _currentUser: null,
    get user() {
      if (this._currentUser) return this._currentUser;
      try {
        const userData = localStorage.getItem('user');
        return userData && userData !== 'undefined' ? JSON.parse(userData) : null;
      } catch (e) {
        console.error('Error parsing user data:', e);
        localStorage.removeItem('user');
        return null;
      }
    },
    set user(userData) {
      this._currentUser = userData;
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        localStorage.removeItem('user');
      }
    },
    clear() {
      this._currentUser = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  // DOM Elements cache
  const elements = {
    nav: document.getElementById('nav'),
    mainContent: document.getElementById('main-content'),
    alertContainer: document.createElement('div') // For showing alerts
  };
  elements.alertContainer.id = 'alert-container';
  document.body.appendChild(elements.alertContainer);

  // Enhanced API Client
  const apiClient = {
    async request(endpoint, { method = 'GET', body, headers = {} } = {}) {
      const url = `${window.API_BASE_URL}${endpoint}`;
      const token = localStorage.getItem('token');
      
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...headers
        },
        credentials: 'include',
        mode: 'cors'
      };

      if (body) config.body = JSON.stringify(body);

      try {
        const response = await fetch(url, config);
        
        // Handle CORS and network errors
        if (response.status === 0 || response.type === 'opaque') {
          throw new Error('Network error or CORS blocked the request');
        }

        if (response.status === 401) {
          // Token expired or invalid
          state.clear();
          showAlert('Session expired. Please login again.', 'error');
          window.location.href = '/login';
          throw new Error('Unauthorized');
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`API Error at ${endpoint}:`, error);
        throw error;
      }
    }
  };

  // Authentication Functions
  async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
      showUnauthenticatedViews();
      return;
    }

    try {
      // Verify token with backend
      await apiClient.request('/api/auth/verify');
      showAuthenticatedViews();
      loadDashboard();
    } catch (error) {
      console.error('Auth verification failed:', error);
      clearAuthState();
      showUnauthenticatedViews();
      loadLogin();
    }
  }

  function clearAuthState() {
    state.clear();
  }

  // View Management
  function showAuthenticatedViews() {
    document.querySelectorAll('.auth-only').forEach(el => {
      el.style.display = 'block';
    });
    document.querySelectorAll('.guest-only').forEach(el => {
      el.style.display = 'none';
    });
  }

  function showUnauthenticatedViews() {
    document.querySelectorAll('.auth-only').forEach(el => {
      el.style.display = 'none';
    });
    document.querySelectorAll('.guest-only').forEach(el => {
      el.style.display = 'block';
    });
  }

  // Auth Handlers
  async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;

    if (!email || !password) {
      showAlert('Please fill in all fields', 'error');
      return;
    }

    showAlert('Logging in...', 'info');

    try {
      const data = await apiClient.request('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      });

      if (!data.token) {
        throw new Error('Authentication failed - no token received');
      }

      localStorage.setItem('token', data.token);
      state.user = data.user;
      
      showAlert('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (error) {
      console.error('Login failed:', error);
      showAlert(
        error.message.includes('Network') ? 'Connection error. Please try again.' :
        error.message.includes('401') ? 'Invalid email or password' :
        'Login failed. Please try again.',
        'error'
      );
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

    showAlert('Creating account...', 'info');

    try {
      const data = await apiClient.request('/api/auth/register', {
        method: 'POST',
        body: { username, email, password }
      });

      if (!data.token) {
        throw new Error('Registration failed - no token received');
      }

      localStorage.setItem('token', data.token);
      state.user = data.user;
      
      showAlert('Registration successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (error) {
      console.error('Registration failed:', error);
      showAlert(
        error.message.includes('Network') ? 'Connection error' :
        error.message.includes('409') ? 'User already exists' :
        'Registration failed. Please try again.',
        'error'
      );
    }
  }

  async function logout() {
    showAlert('Logging out...', 'info');
    
    try {
      await apiClient.request('/api/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthState();
      showAlert('Logged out successfully', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
  }

  // UI Helpers
  function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    elements.alertContainer.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
  }

  function setupNavigation() {
    if (!elements.nav) return;
    
    elements.nav.innerHTML = state.user ? `
      <a href="/dashboard">Dashboard</a>
      <a href="/books">Books</a>
      <a href="/profile">Profile</a>
      <a href="#" id="logout-btn">Logout</a>
      <span>Welcome, ${state.user.username}</span>
    ` : `
      <a href="/login">Login</a>
      <a href="/register">Register</a>
    `;
    
    document.getElementById('logout-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
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
        <p>Don't have an account? <a href="/register">Register</a></p>
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
        <p>Already have an account? <a href="/login">Login</a></p>
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
      if (elements.mainContent) elements.mainContent.innerHTML = '<h2>Dashboard</h2>';
    },
    loadBookForm: function() {
      if (elements.mainContent) elements.mainContent.innerHTML = '<h2>Book Form</h2>';
    },
    get currentUser() {
      return state.user;
    },
    apiClient
  };
})();
