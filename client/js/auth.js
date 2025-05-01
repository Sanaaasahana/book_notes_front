// Configuration - Remove API_BASE_URL if already defined in app.js
// Use window.API_BASE_URL instead of redeclaring

// Core Application
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupNavigation();
});

// State Management
let currentUser = null;

// Authentication Functions
function checkAuth() {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      currentUser = JSON.parse(localStorage.getItem('user'));
      showAuthenticatedViews();
      loadDashboard();
    } catch (error) {
      console.error('Error parsing user data:', error);
      logout();
    }
  } else {
    showUnauthenticatedViews();
    loadLogin();
  }
}

function setupNavigation() {
  const nav = document.getElementById('nav');
  if (!nav) {
    console.error('Navigation element not found');
    return;
  }

  nav.innerHTML = currentUser ? `
    <a href="#" onclick="loadDashboard()">Dashboard</a>
    <a href="#" onclick="loadBookForm()">Add Book</a>
    <a href="#" onclick="logout()">Logout</a>
    <span>Welcome, ${currentUser.username}</span>
  ` : `
    <a href="#" onclick="loadLogin()">Login</a>
    <a href="#" onclick="loadRegister()">Register</a>
  `;
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

// Auth Handlers
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email')?.value;
  const password = document.getElementById('login-password')?.value;

  if (!email || !password) {
    alert('Please fill in all fields');
    return;
  }

  try {
    const response = await fetch(`${window.API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      currentUser = data.user;
      setupNavigation();
      showAuthenticatedViews();
      loadDashboard();
    } else {
      alert(data.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Login failed. Please try again.');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('register-username')?.value;
  const email = document.getElementById('register-email')?.value;
  const password = document.getElementById('register-password')?.value;

  if (!username || !email || !password) {
    alert('Please fill in all fields');
    return;
  }

  try {
    const response = await fetch(`${window.API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      currentUser = data.user;
      setupNavigation();
      showAuthenticatedViews();
      loadDashboard();
    } else {
      alert(data.error || 'Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error);
    alert('Registration failed. Please try again.');
  }
}

function logout() {
  fetch(`${window.API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  })
  .catch(error => console.error('Logout error:', error))
  .finally(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    setupNavigation();
    showUnauthenticatedViews();
    loadLogin();
  });
}

// UI Loaders
function loadLogin() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  mainContent.innerHTML = `
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
  `;

  const form = document.getElementById('login-form');
  if (form) {
    form.addEventListener('submit', handleLogin);
  }
}

function loadRegister() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  mainContent.innerHTML = `
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
  `;

  const form = document.getElementById('register-form');
  if (form) {
    form.addEventListener('submit', handleRegister);
  }
}

// Make functions available globally
window.checkAuth = checkAuth;
window.setupNavigation = setupNavigation;
window.showAuthenticatedViews = showAuthenticatedViews;
window.showUnauthenticatedViews = showUnauthenticatedViews;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.logout = logout;
window.loadLogin = loadLogin;
window.loadRegister = loadRegister;
