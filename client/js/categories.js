// Category Functions - Using window.API_BASE_URL from app.js

/**
 * Fetches all categories from the API
 * @returns {Promise<Array>} Array of category objects
 */
async function fetchCategories() {
  try {
    const response = await fetch(`${window.API_BASE_URL}/api/categories`, {
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
    console.error('Fetch categories error:', error);
    showToast('Failed to load categories', 'error');
    return [];
  }
}

/**
 * Adds a new category
 */
async function addCategory() {
  const nameInput = document.getElementById('new-category');
  const name = nameInput.value.trim();
  
  if (!name) {
    showToast('Category name cannot be empty', 'warning');
    return;
  }

  try {
    const response = await fetch(`${window.API_BASE_URL}/api/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ name })
    });

    if (response.ok) {
      nameInput.value = '';
      showToast('Category added successfully', 'success');
      await loadCategories();
      await loadBooks(); // Refresh books to show new category
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add category');
    }
  } catch (error) {
    console.error('Add category error:', error);
    showToast(error.message || 'Failed to add category', 'error');
  }
}

/**
 * Deletes a category
 * @param {Event} e - Click event
 * @param {number} categoryId - ID of category to delete
 */
async function deleteCategory(e, categoryId) {
  e.preventDefault();
  e.stopPropagation();
  
  if (!confirm('Are you sure you want to delete this category?\nAll associated books will be uncategorized.')) {
    return;
  }

  try {
    const response = await fetch(`${window.API_BASE_URL}/api/categories/${categoryId}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      showToast('Category deleted successfully', 'success');
      await loadCategories();
      await loadBooks(); // Refresh books list
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete category');
    }
  } catch (error) {
    console.error('Delete category error:', error);
    showToast(error.message || 'Failed to delete category', 'error');
  }
}

/**
 * Loads and displays all categories
 */
async function loadCategories() {
  try {
    const categoriesList = document.getElementById('categories-list');
    if (!categoriesList) {
      console.error('Categories list element not found');
      return;
    }

    categoriesList.innerHTML = '<li class="loading">Loading categories...</li>';
    
    const categories = await fetchCategories();
    
    if (categories.length === 0) {
      categoriesList.innerHTML = '<li>No categories yet</li>';
      return;
    }

    categoriesList.innerHTML = categories.map(category => `
      <li class="category-item" data-id="${category.id}">
        <a href="#" onclick="loadBooksByCategory(${category.id})" class="category-link">
          ${category.name} 
          <span class="book-count">(${category.book_count || 0})</span>
        </a>
        <button class="btn-danger" onclick="deleteCategory(event, ${category.id})">
          <i class="fas fa-trash"></i>
        </button>
      </li>
    `).join('');
  } catch (error) {
    console.error('Load categories error:', error);
    const categoriesList = document.getElementById('categories-list');
    if (categoriesList) {
      categoriesList.innerHTML = '<li class="error">Failed to load categories</li>';
    }
  }
}

/**
 * Helper function to show toast notifications
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error, warning)
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }, 100);
}

// Make functions available globally
window.fetchCategories = fetchCategories;
window.addCategory = addCategory;
window.deleteCategory = deleteCategory;
window.loadCategories = loadCategories;

// Initialize categories when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('categories-list')) {
    loadCategories();
  }
});
