

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupNavigation();
});

// State
let currentUser = null;

// Auth Functions
function checkAuth() {
  const token = localStorage.getItem('token');
  if (token) {
    currentUser = JSON.parse(localStorage.getItem('user'));
    showAuthenticatedViews();
    loadDashboard();
  } else {
    showUnauthenticatedViews();
    loadLogin();
  }
}

function setupNavigation() {
  const nav = document.getElementById('nav');
  nav.innerHTML = `
    ${currentUser ? `
      <a href="#" onclick="loadDashboard()">Dashboard</a>
      <a href="#" onclick="loadBookForm()">Add Book</a>
      <a href="#" onclick="logout()">Logout</a>
      <span>Welcome, ${currentUser.username}</span>
    ` : `
      <a href="#" onclick="loadLogin()">Login</a>
      <a href="#" onclick="loadRegister()">Register</a>
    `}
  `;
}

// View Helpers
function showAuthenticatedViews() {
  document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'block');
  document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'none');
}

function showUnauthenticatedViews() {
  document.querySelectorAll('.auth-only').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'block');
}

// Auth Handlers
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
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
    alert('Login failed');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
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
    alert('Registration failed');
  }
}

function logout() {
  fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  }).finally(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    setupNavigation();
    showUnauthenticatedViews();
    loadLogin();
  });
}

// Book Functions
async function fetchBooks() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/books`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    return response.ok ? await response.json() : [];
  } catch (error) {
    console.error('Fetch books error:', error);
    return [];
  }
}

async function handleAddBook(e) {
  e.preventDefault();
  const bookData = {
    title: document.getElementById('book-title').value,
    author: document.getElementById('book-author').value,
    categoryId: document.getElementById('book-category').value,
    status: document.getElementById('book-status').value,
    rating: document.getElementById('book-rating').value
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(bookData)
    });

    if (response.ok) {
      loadDashboard();
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to add book');
    }
  } catch (error) {
    console.error('Add book error:', error);
    alert('Failed to add book');
  }
}

// Note Functions
async function fetchNotes(bookId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notes/book/${bookId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    return response.ok ? await response.json() : [];
  } catch (error) {
    console.error('Fetch notes error:', error);
    return [];
  }
}

async function handleAddNote(e) {
  e.preventDefault();
  const noteData = {
    bookId: document.getElementById('note-book-id').value,
    content: document.getElementById('note-content').value
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(noteData)
    });

    if (response.ok) {
      loadBookNotes(noteData.bookId);
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to add note');
    }
  } catch (error) {
    console.error('Add note error:', error);
    alert('Failed to add note');
  }
}

// Category Functions
async function fetchCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    return response.ok ? await response.json() : [];
  } catch (error) {
    console.error('Fetch categories error:', error);
    return [];
  }
}

// UI Loaders
function loadDashboard() {
  document.getElementById('main-content').innerHTML = `
    <div class="dashboard">
      <div class="categories-sidebar">
        <h2>Categories</h2>
        <ul id="categories-list"></ul>
        <div class="category-form">
          <input type="text" id="new-category" placeholder="New category">
          <button onclick="addCategory()">Add</button>
        </div>
      </div>
      <div class="books-container">
        <div class="books-header">
          <h2>All Books</h2>
          <button onclick="loadBookForm()">Add Book</button>
        </div>
        <div class="books-grid" id="books-grid"></div>
      </div>
    </div>
  `;
  loadCategories();
  loadBooks();
}

function loadBookForm(book = null) {
  const isEdit = !!book;
  document.getElementById('main-content').innerHTML = `
    <div class="book-form">
      <h2>${isEdit ? 'Edit Book' : 'Add Book'}</h2>
      <form id="book-form">
        <input type="hidden" id="book-id" value="${book?.id || ''}">
        <!-- Form fields here -->
        <button type="submit">${isEdit ? 'Update' : 'Add'}</button>
      </form>
    </div>
  `;
  document.getElementById('book-form')
    .addEventListener('submit', isEdit ? handleUpdateBook : handleAddBook);
}

// Initialize
checkAuth();
