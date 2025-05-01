// Notes Functions - Using window.API_BASE_URL from app.js

/**
 * Fetches notes for a specific book
 * @param {number} bookId - ID of the book
 * @returns {Promise<Array>} Array of note objects
 */
async function fetchNotes(bookId) {
  try {
    const response = await fetch(`${window.API_BASE_URL}/api/notes/book/${bookId}`, {
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch notes error:', error);
    showToast('Failed to load notes', 'error');
    return [];
  }
}

/**
 * Adds a new note
 * @param {Event} e - Form submit event
 */
async function handleAddNote(e) {
  e.preventDefault();
  
  const bookId = document.getElementById('note-book-id')?.value;
  const content = document.getElementById('note-content')?.value.trim();
  
  if (!content) {
    showToast('Note content cannot be empty', 'warning');
    return;
  }

  try {
    const response = await fetch(`${window.API_BASE_URL}/api/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ 
        bookId,
        content 
      })
    });

    if (response.ok) {
      showToast('Note added successfully', 'success');
      loadBookNotes(bookId);
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add note');
    }
  } catch (error) {
    console.error('Add note error:', error);
    showToast(error.message || 'Failed to add note', 'error');
  }
}

/**
 * Updates an existing note
 * @param {Event} e - Form submit event
 */
async function handleUpdateNote(e) {
  e.preventDefault();
  
  const noteId = document.getElementById('note-id')?.value;
  const bookId = document.getElementById('note-book-id')?.value;
  const content = document.getElementById('note-content')?.value.trim();
  
  if (!content) {
    showToast('Note content cannot be empty', 'warning');
    return;
  }

  try {
    const response = await fetch(`${window.API_BASE_URL}/api/notes/${noteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ content })
    });

    if (response.ok) {
      showToast('Note updated successfully', 'success');
      loadBookNotes(bookId);
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update note');
    }
  } catch (error) {
    console.error('Update note error:', error);
    showToast(error.message || 'Failed to update note', 'error');
  }
}

/**
 * Deletes a note
 * @param {number} noteId - ID of the note to delete
 */
async function deleteNote(noteId) {
  if (!confirm('Are you sure you want to delete this note?\nThis action cannot be undone.')) {
    return;
  }

  try {
    const bookId = document.getElementById('note-book-id')?.value;
    const response = await fetch(`${window.API_BASE_URL}/api/notes/${noteId}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      showToast('Note deleted successfully', 'success');
      loadBookNotes(bookId);
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete note');
    }
  } catch (error) {
    console.error('Delete note error:', error);
    showToast(error.message || 'Failed to delete note', 'error');
  }
}

/**
 * Loads and displays notes for a book
 * @param {number} bookId - ID of the book
 */
async function loadBookNotes(bookId) {
  try {
    const notesContainer = document.getElementById('main-content');
    if (!notesContainer) {
      console.error('Main content element not found');
      return;
    }

    notesContainer.innerHTML = `
      <div class="notes-container">
        <div class="notes-header">
          <h2>Book Notes</h2>
          <button onclick="loadNoteForm(${bookId})" class="btn-primary">
            <i class="fas fa-plus"></i> Add Note
          </button>
        </div>
        <div id="notes-list" class="notes-loading">Loading notes...</div>
      </div>
    `;

    const notes = await fetchNotes(bookId);
    const notesList = document.getElementById('notes-list');
    
    if (notes.length === 0) {
      notesList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-book-open"></i>
          <p>No notes yet</p>
          <button onclick="loadNoteForm(${bookId})" class="btn-primary">
            Add Your First Note
          </button>
        </div>
      `;
      return;
    }

    notesList.className = 'notes-list';
    notesList.innerHTML = notes.map(note => `
      <div class="note-card" data-id="${note.id}">
        <div class="note-content">${formatNoteContent(note.content)}</div>
        <div class="note-meta">
          <span class="note-date">
            <i class="fas fa-clock"></i>
            ${formatDate(note.created_at)}
          </span>
          <div class="note-actions">
            <button onclick="loadEditNoteForm(${note.id}, ${bookId})" class="btn-edit">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button onclick="deleteNote(${note.id})" class="btn-danger">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Load book notes error:', error);
    const notesList = document.getElementById('notes-list');
    if (notesList) {
      notesList.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Failed to load notes</p>
          <button onclick="loadBookNotes(${bookId})" class="btn-retry">
            <i class="fas fa-sync-alt"></i> Try Again
          </button>
        </div>
      `;
    }
  }
}

/**
 * Loads the note form for adding/editing
 * @param {number} bookId - ID of the book
 * @param {Object|null} note - Note object for editing, or null for new note
 */
function loadNoteForm(bookId, note = null) {
  const isEdit = !!note;
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  mainContent.innerHTML = `
    <div class="note-form-container">
      <h2>${isEdit ? 'Edit Note' : 'Add Note'}</h2>
      <form id="note-form" class="note-form">
        <input type="hidden" id="note-id" value="${note?.id || ''}">
        <input type="hidden" id="note-book-id" value="${bookId}">
        
        <div class="form-group">
          <label for="note-content">Note Content</label>
          <textarea 
            id="note-content" 
            rows="8" 
            placeholder="Write your thoughts about this book..." 
            required
          >${note?.content || ''}</textarea>
        </div>
        
        <div class="form-actions">
          <button type="button" onclick="loadBookNotes(${bookId})" class="btn-cancel">
            <i class="fas fa-arrow-left"></i> Cancel
          </button>
          <button type="submit" class="btn-primary">
            ${isEdit ? '<i class="fas fa-save"></i> Update' : '<i class="fas fa-plus"></i> Add'}
          </button>
        </div>
      </form>
    </div>
  `;

  const form = document.getElementById('note-form');
  if (form) {
    form.addEventListener('submit', isEdit ? handleUpdateNote : handleAddNote);
    // Auto-focus the textarea
    const textarea = document.getElementById('note-content');
    if (textarea) textarea.focus();
  }
}

/**
 * Loads the edit form for a specific note
 * @param {number} noteId - ID of the note to edit
 * @param {number} bookId - ID of the associated book
 */
async function loadEditNoteForm(noteId, bookId) {
  try {
    const response = await fetch(`${window.API_BASE_URL}/api/notes/${noteId}`, {
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const note = await response.json();
    loadNoteForm(bookId, note);
  } catch (error) {
    console.error('Error fetching note:', error);
    showToast('Failed to load note for editing', 'error');
  }
}

/**
 * Formats note content with line breaks
 * @param {string} content - Note content
 * @returns {string} Formatted content
 */
function formatNoteContent(content) {
  return content.replace(/\n/g, '<br>');
}

/**
 * Formats date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  };
  return new Date(dateString).toLocaleString(undefined, options);
}

/**
 * Shows a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error, warning, info)
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-message">${message}</div>
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }, 100);
}

// Make functions available globally
window.fetchNotes = fetchNotes;
window.handleAddNote = handleAddNote;
window.handleUpdateNote = handleUpdateNote;
window.deleteNote = deleteNote;
window.loadBookNotes = loadBookNotes;
window.loadNoteForm = loadNoteForm;
window.loadEditNoteForm = loadEditNoteForm;
