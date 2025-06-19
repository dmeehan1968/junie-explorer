// Global variables for filters
let currentSearchTerm = '';

// Initialize IDE filters from local storage or default to all selected
function initializeFilters() {
  const ideFilters = {};
  const storedFilters = localStorage.getItem('junie-explorer-ideFilters');

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
  applyFilters(ideFilters, currentSearchTerm);

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

  // Save to local storage
  localStorage.setItem('junie-explorer-ideFilters', JSON.stringify(ideFilters));

  // Apply filters to the project list
  applyFilters(ideFilters, currentSearchTerm);

  // Update global state
  window.ideFilters = ideFilters;
}

// Filter by project name
function filterByProjectName(searchTerm) {
  currentSearchTerm = searchTerm.trim().toLowerCase();
  applyFilters(window.ideFilters || {}, currentSearchTerm);
}

// Apply filters to the project list
function applyFilters(ideFilters, searchTerm = '') {
  const projectItems = document.querySelectorAll('.project-item');
  let visibleCount = 0;

  projectItems.forEach(item => {
    const projectIdes = JSON.parse(item.getAttribute('data-ides') || '[]');
    const projectName = item.querySelector('.project-name').textContent.toLowerCase();

    // Check if project matches both IDE filter and search term
    const matchesIdeFilter = projectIdes.some(ide => ideFilters[ide]);
    const matchesSearchTerm = searchTerm === '' || projectName.includes(searchTerm);
    const shouldShow = matchesIdeFilter && matchesSearchTerm;

    if (shouldShow) {
      item.style.display = '';
      visibleCount++;
    } else {
      item.style.display = 'none';
    }
  });

  // Show or hide the "no matching projects" message
  const projectList = document.querySelector('.project-list');
  let noMatchMessage = document.getElementById('no-match-message');

  if (visibleCount === 0) {
    if (!noMatchMessage) {
      noMatchMessage = document.createElement('li');
      noMatchMessage.id = 'no-match-message';
      noMatchMessage.setAttribute('data-testid', 'no-matching-projects');
      noMatchMessage.textContent = 'No matching projects';
      noMatchMessage.style.padding = '10px 15px';
      projectList.appendChild(noMatchMessage);
    }
    noMatchMessage.style.display = '';
  } else if (noMatchMessage) {
    noMatchMessage.style.display = 'none';
  }
}


// Initialize filters when the page loads
window.onload = function() {
  window.ideFilters = initializeFilters();
};
