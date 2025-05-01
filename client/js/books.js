// Remove any duplicate API_BASE_URL declaration (it's now in app.js)
// Use window.API_BASE_URL instead of declaring it here

// Book-related functions
async function fetchBooks() {
  try {
    const response = await fetch(`${window.API_BASE_URL}/api/books`, {
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
    const response = await fetch(`${window.API_BASE_URL}/api/books/category/${categoryId}`, {
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
  
  if (!booksGrid) {
    console.error('Books grid element not found');
    return;
  }

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
          <button onclick="loadBookForm(${book.id})">Edit</button>
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
    const response = await fetch(`${window.API_BASE_URL}/api/books`, {
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
    const response = await fetch(`${window.API_BASE_URL}/api/books/${bookId}`, {
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
    const response = await fetch(`${window.API_BASE_URL}/api/books/${bookId}`, {
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

// Make functions available globally
window.fetchBooks = fetchBooks;
window.fetchBooksByCategory = fetchBooksByCategory;
window.loadBooks = loadBooks;
window.updateBooksGrid = updateBooksGrid;
window.handleAddBook = handleAddBook;
window.handleUpdateBook = handleUpdateBook;
window.deleteBook = deleteBook;
