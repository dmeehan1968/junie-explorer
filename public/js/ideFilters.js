// Initialize IDE filters from session storage or default to all selected
function initializeFilters() {
  const ideFilters = {};
  const storedFilters = sessionStorage.getItem('ideFilters');

  // Get all IDE elements
  const ideElements = document.querySelectorAll('.ide-filter');

  if (storedFilters) {
    // Use stored filters
    const parsedFilters = JSON.parse(storedFilters);
    ideElements.forEach(element => {
      const ide = element.getAttribute('data-ide');
      if (ide && parsedFilters[ide] !== undefined) {
        ideFilters[ide] = parsedFilters[ide];
        if (!parsedFilters[ide]) {
          element.classList.add('ide-filter-disabled');
        }
      } else {
        ideFilters[ide] = true; // Default to selected
      }
    });
  } else {
    // Default: all IDEs selected
    ideElements.forEach(element => {
      const ide = element.getAttribute('data-ide');
      if (ide) {
        ideFilters[ide] = true;
      }
    });
  }

  // Apply filters
  applyFilters(ideFilters);

  return ideFilters;
}

// Toggle IDE filter
function toggleIdeFilter(element) {
  const ide = element.getAttribute('data-ide');
  const ideFilters = window.ideFilters || {};

  // Toggle the filter state
  ideFilters[ide] = !ideFilters[ide];

  // Update the visual state
  if (ideFilters[ide]) {
    element.classList.remove('ide-filter-disabled');
  } else {
    element.classList.add('ide-filter-disabled');
  }

  // Save to session storage
  sessionStorage.setItem('ideFilters', JSON.stringify(ideFilters));

  // Apply filters to the project list
  applyFilters(ideFilters);

  // Update global state
  window.ideFilters = ideFilters;
}

// Apply filters to the project list
function applyFilters(ideFilters) {
  const projectItems = document.querySelectorAll('.project-item');

  projectItems.forEach(item => {
    const projectIdes = JSON.parse(item.getAttribute('data-ides') || '[]');
    const shouldShow = projectIdes.some(ide => ideFilters[ide]);

    if (shouldShow) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

// Reload page function
function reloadPage() {
  const button = document.getElementById('reload-button');
  if (button) {
    button.disabled = true;
    button.classList.add('loading');
    setTimeout(() => {
      window.location.href = '/refresh';
    }, 100);
  }
}

// Initialize filters when the page loads
window.onload = function() {
  window.ideFilters = initializeFilters();
};