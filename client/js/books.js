// Configuration
const API_BASE_URL = 'https://backend-cpn2.onrender.com';

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

// View Management
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

async function fetchBooksByCategory(categoryId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/books/category/${categoryId}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    return response.ok ? await response.json() : [];
  } catch (error) {
    console.error('Fetch books by category error:', error);
    return [];
  }
}

async function loadBooks() {
  const books = await fetchBooks();
  updateBooksGrid(books);
}

function updateBooksGrid(books) {
  const booksGrid = document.getElementById('books-grid');
  
  if (books.length === 0) {
    booksGrid.innerHTML = '<p>No books yet. Add your first book!</p>';
  } else {
    booksGrid.innerHTML = books.map(book => `
      <div class="book-card">
        <h3>${book.title}</h3>
        <p>by ${book.author}</p>
        ${book.category_name ? `<p>Category: ${book.category_name}</p>` : ''}
        <span class="book-status status-${book.status.replace(' ', '-')}">${book.status}</span>
        ${book.rating ? `<p>Rating: ${'★'.repeat(book.rating)}${'☆'.repeat(5 - book.rating)}</p>` : ''}
        <div class="book-actions">
          <button onclick="loadBookForm(${JSON.stringify(book).replace(/"/g, '&quot;')})">Edit</button>
          <button onclick="loadBookNotes(${book.id})">Notes</button>
          <button class="btn-danger" onclick="deleteBook(${book.id})">Delete</button>
        </div>
      </div>
    `).join('');
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

async function handleUpdateBook(e) {
  e.preventDefault();
  const bookId = document.getElementById('book-id').value;
  const bookData = {
    title: document.getElementById('book-title').value,
    author: document.getElementById('book-author').value,
    categoryId: document.getElementById('book-category').value,
    status: document.getElementById('book-status').value,
    rating: document.getElementById('book-rating').value
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/books/${bookId}`, {
      method: 'PUT',
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
      alert(error.message || 'Failed to update book');
    }
  } catch (error) {
    console.error('Update book error:', error);
    alert('Failed to update book');
  }
}

async function deleteBook(bookId) {
  if (!confirm('Are you sure you want to delete this book?')) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/books/${bookId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (response.ok) {
      loadDashboard();
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to delete book');
    }
  } catch (error) {
    console.error('Delete book error:', error);
    alert('Failed to delete book');
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

async function handleUpdateNote(e) {
  e.preventDefault();
  const noteId = document.getElementById('note-id').value;
  const noteData = {
    content: document.getElementById('note-content').value
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/notes/${noteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(noteData)
    });

    if (response.ok) {
      const bookId = document.getElementById('note-book-id').value;
      loadBookNotes(bookId);
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to update note');
    }
  } catch (error) {
    console.error('Update note error:', error);
    alert('Failed to update note');
  }
}

async function deleteNote(noteId) {
  if (!confirm('Are you sure you want to delete this note?')) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/notes/${noteId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (response.ok) {
      const bookId = document.getElementById('note-book-id').value;
      loadBookNotes(bookId);
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to delete note');
    }
  } catch (error) {
    console.error('Delete note error:', error);
    alert('Failed to delete note');
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

async function addCategory() {
  const name = document.getElementById('new-category').value.trim();
  if (!name) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ name })
    });

    if (response.ok) {
      document.getElementById('new-category').value = '';
      loadCategories();
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to add category');
    }
  } catch (error) {
    console.error('Add category error:', error);
    alert('Failed to add category');
  }
}

async function deleteCategory(e, categoryId) {
  e.preventDefault();
  e.stopPropagation();
  if (!confirm('Are you sure you want to delete this category?')) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/categories/${categoryId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    if (response.ok) {
      loadCategories();
      loadBooks();
    } else {
      const error = await response.json();
      alert(error.message || 'Failed to delete category');
    }
  } catch (error) {
    console.error('Delete category error:', error);
    alert('Failed to delete category');
  }
}

// UI Loaders
function loadLogin() {
  document.getElementById('main-content').innerHTML = `
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
  document.getElementById('login-form').addEventListener('submit', handleLogin);
}

function loadRegister() {
  document.getElementById('main-content').innerHTML = `
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
  document.getElementById('register-form').addEventListener('submit', handleRegister);
}

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
        <div class="form-row">
          <div class="form-group">
            <label for="book-title">Title</label>
            <input type="text" id="book-title" value="${book?.title || ''}" required>
          </div>
          <div class="form-group">
            <label for="book-author">Author</label>
            <input type="text" id="book-author" value="${book?.author || ''}" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="book-category">Category</label>
            <select id="book-category" required>
              <option value="">Select a category</option>
            </select>
          </div>
          <div class="form-group">
            <label for="book-status">Status</label>
            <select id="book-status" required>
              <option value="to-read" ${book?.status === 'to-read' ? 'selected' : ''}>To Read</option>
              <option value="reading" ${book?.status === 'reading' ? 'selected' : ''}>Reading</option>
              <option value="read" ${book?.status === 'read' ? 'selected' : ''}>Read</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="book-rating">Rating (1-5)</label>
          <input type="number" id="book-rating" min="1" max="5" value="${book?.rating || ''}">
        </div>
        <button type="submit">${isEdit ? 'Update' : 'Add'}</button>
        ${isEdit ? `<button type="button" class="btn-danger" onclick="deleteBook(${book.id})">Delete</button>` : ''}
      </form>
    </div>
  `;

  fetchCategories().then(categories => {
    const select = document.getElementById('book-category');
    select.innerHTML = '<option value="">Select a category</option>';
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      if (book?.category_id === category.id) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  });

  document.getElementById('book-form')
    .addEventListener('submit', isEdit ? handleUpdateBook : handleAddBook);
}

function loadBookNotes(bookId) {
  document.getElementById('main-content').innerHTML = `
    <div class="notes-container">
      <div class="notes-header">
        <h2>Book Notes</h2>
        <button onclick="loadNoteForm(${bookId})">Add Note</button>
      </div>
      <div id="notes-list"></div>
    </div>
  `;
  fetchNotes(bookId).then(notes => {
    const notesList = document.getElementById('notes-list');
    notesList.innerHTML = notes.length ? notes.map(note => `
      <div class="note-card">
        <div class="note-content">${note.content}</div>
        <div class="note-meta">
          <span>${new Date(note.created_at).toLocaleString()}</span>
          <div class="note-actions">
            <button onclick="loadEditNoteForm(${note.id}, ${bookId})">Edit</button>
            <button class="btn-danger" onclick="deleteNote(${note.id})">Delete</button>
          </div>
        </div>
      </div>
    `).join('') : '<p>No notes yet. Add your first note!</p>';
  });
}

function loadNoteForm(bookId, note = null) {
  const isEdit = !!note;
  document.getElementById('main-content').innerHTML = `
    <div class="book-form">
      <h2>${isEdit ? 'Edit Note' : 'Add Note'}</h2>
      <form id="note-form">
        <input type="hidden" id="note-id" value="${note?.id || ''}">
        <input type="hidden" id="note-book-id" value="${bookId}">
        <div class="form-group">
          <label for="note-content">Note Content</label>
          <textarea id="note-content" rows="6" required>${note?.content || ''}</textarea>
        </div>
        <button type="submit">${isEdit ? 'Update' : 'Add'}</button>
        ${isEdit ? `<button type="button" class="btn-danger" onclick="deleteNote(${note.id})">Delete</button>` : ''}
      </form>
    </div>
  `;
  document.getElementById('note-form')
    .addEventListener('submit', isEdit ? handleUpdateNote : handleAddNote);
}

function loadEditNoteForm(noteId, bookId) {
  fetch(`${API_BASE_URL}/api/notes/${noteId}`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  })
    .then(response => response.json())
    .then(note => loadNoteForm(bookId, note))
    .catch(error => {
      console.error('Error fetching note:', error);
      alert('Failed to fetch note');
    });
}

function loadCategories() {
  fetchCategories().then(categories => {
    const categoriesList = document.getElementById('categories-list');
    categoriesList.innerHTML = categories.length ? categories.map(category => `
      <li>
        <a href="#" onclick="loadBooksByCategory(${category.id})">${category.name}</a>
        <button class="btn-danger" onclick="deleteCategory(event, ${category.id})">Delete</button>
      </li>
    `).join('') : '<li>No categories yet</li>';
  });
}