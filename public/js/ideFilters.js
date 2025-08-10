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
          element.classList.add('opacity-50', 'grayscale');
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
    element.classList.remove('opacity-50', 'grayscale');
  } else {
    element.classList.add('opacity-50', 'grayscale');
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
  const projectList = document.getElementById('project-list');
  const tableRows = projectList ? projectList.querySelectorAll('tr.project-row') : [];
  const listItems = document.querySelectorAll('.project-item');
  const items = (tableRows && tableRows.length > 0) ? tableRows : listItems;
  let visibleCount = 0;

  items.forEach(item => {
    const projectIdes = JSON.parse(item.getAttribute('data-ides') || '[]');
    const nameEl = item.querySelector('.project-name');
    const projectName = (nameEl ? nameEl.textContent : '').toLowerCase();

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
  const projectListEl = document.getElementById('project-list');
  let noMatchMessage = document.getElementById('no-match-message');

  if (visibleCount === 0) {
    if (!noMatchMessage && projectListEl) {
      if (projectListEl.tagName.toLowerCase() === 'tbody') {
        noMatchMessage = document.createElement('tr');
        noMatchMessage.id = 'no-match-message';
        const td = document.createElement('td');
        td.colSpan = 4;
        td.setAttribute('data-testid', 'no-matching-projects');
        td.textContent = 'No matching projects';
        td.style.padding = '10px 15px';
        noMatchMessage.appendChild(td);
      } else {
        noMatchMessage = document.createElement('li');
        noMatchMessage.id = 'no-match-message';
        noMatchMessage.setAttribute('data-testid', 'no-matching-projects');
        noMatchMessage.textContent = 'No matching projects';
        noMatchMessage.style.padding = '10px 15px';
      }
      projectListEl.appendChild(noMatchMessage);
    }
    if (noMatchMessage) noMatchMessage.style.display = '';
  } else if (noMatchMessage) {
    noMatchMessage.style.display = 'none';
  }
}

// Toggle visibility of the search clear button
function toggleSearchClearBtn() {
  const input = document.getElementById('project-search-input');
  const btn = document.getElementById('project-search-clear');
  if (!input || !btn) return;
  const hasText = (input.value || '').trim().length > 0;
  if (hasText) {
    btn.classList.remove('hidden');
  } else {
    btn.classList.add('hidden');
  }
}

// Clear the project search input and reapply filters
function clearProjectSearch() {
  const input = document.getElementById('project-search-input');
  if (!input) return;
  input.value = '';
  filterByProjectName('');
  toggleSearchClearBtn();
  input.focus();
}

// Initialize clear button state on load
window.addEventListener('load', function() {
  toggleSearchClearBtn();
});


