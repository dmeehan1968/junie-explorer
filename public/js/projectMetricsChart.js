// Global variables for project selection
let selectedProjects = {};
let projectsChart = null;
let displayOption = 'cost'; // Default display option (cost, tokens, tps)
let groupOption = 'auto'; // Grouping option for x-axis (auto, hour, day, week, month)
let viewOption = 'project'; // View option (project, model)
let agentTypeOption = 'Agent'; // Agent type option for TPS display

// Helper to get cookie
function getCookie(name) {
  const cookie = document.cookie || '';
  const match = cookie.split(';').map(p => p.trim()).find(p => p.startsWith(name + '='));
  if (match) {
    return decodeURIComponent(match.split('=')[1] || '').trim();
  }
  return null;
}

// Helper to set cookie
function setCookie(name, value) {
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=31536000; Path=/; SameSite=Lax`;
  } catch (e) {
    // ignore cookie errors
  }
}

// Initialize project selection from local storage
function initializeProjectSelection() {
  let storedSelection = getCookie('junie-explorer-selectedProjects');
  if (!storedSelection) {
    storedSelection = localStorage.getItem('junie-explorer-selectedProjects');
  }
  const storedDisplayOption = localStorage.getItem('junie-explorer-displayOption');
  const graphContainer = document.getElementById('project-metrics-chart');

  // Initialize display option from local storage or default to 'cost'
  if (storedDisplayOption) {
    // Coerce legacy 'both' value to 'cost'
    const allowed = ['cost', 'tokens', 'tps'];
    displayOption = storedDisplayOption === 'both' ? 'cost' : (allowed.includes(storedDisplayOption) ? storedDisplayOption : 'cost');
    // Persist coerced value if it changed
    if (displayOption !== storedDisplayOption) {
      localStorage.setItem('junie-explorer-displayOption', displayOption);
    }
    const radio = document.querySelector(`input[name="display-option"][value="${displayOption}"]`);
    if (radio) radio.checked = true;
  }

  // Initialize agent type option from local storage or default to 'Agent'
  const storedAgentTypeOption = localStorage.getItem('junie-explorer-agentTypeOption');
  if (storedAgentTypeOption) {
    agentTypeOption = storedAgentTypeOption;
    const agentTypeSelect = document.getElementById('agent-type-select');
    if (agentTypeSelect) agentTypeSelect.value = agentTypeOption;
  }

  // Show/hide agent type dropdown based on display option
  const agentTypeContainer = document.getElementById('agent-type-container');
  if (agentTypeContainer) {
    if (displayOption === 'tps') {
      agentTypeContainer.classList.remove('hidden');
    } else {
      agentTypeContainer.classList.add('hidden');
    }
  }

  // Initialize group option from local storage or default to 'auto'
  const storedGroupOption = localStorage.getItem('junie-explorer-groupOption');
  if (storedGroupOption) {
    const allowed = ['auto', 'hour', 'day', 'week', 'month'];
    groupOption = allowed.includes(storedGroupOption) ? storedGroupOption : 'auto';
    const groupRadio = document.querySelector(`input[name="group-option"][value="${groupOption}"]`);
    if (groupRadio) groupRadio.checked = true;
  }

  // Initialize view option from local storage or default to 'project'
  const storedViewOption = localStorage.getItem('junie-explorer-viewOption');
  if (storedViewOption) {
    // Map legacy 'jbai' to 'model'
    if (storedViewOption === 'jbai') {
      viewOption = 'model';
      localStorage.setItem('junie-explorer-viewOption', 'model');
    } else {
      const allowed = ['project', 'model'];
      viewOption = allowed.includes(storedViewOption) ? storedViewOption : 'project';
    }
    const viewRadio = document.querySelector(`input[name="view-option"][value="${viewOption}"]`);
    if (viewRadio) viewRadio.checked = true;
  }

  // Set initial state of graph container if present
  if (graphContainer) {
    graphContainer.classList.add('hidden');
  }

  if (storedSelection) {
    selectedProjects = JSON.parse(storedSelection);

    // Update checkboxes based on stored selection
    document.querySelectorAll('.project-checkbox').forEach(checkbox => {
      const projectName = checkbox.getAttribute('data-project-name');
      if (selectedProjects[projectName]) {
        checkbox.checked = true;
      }
    });

    // Update "Select All" checkbox
    updateSelectAllCheckbox();

    // Check if any projects are selected
    const anySelected = Object.values(selectedProjects).some(selected => selected);

    // Load and display the graph if projects are selected
    if (anySelected) {
      loadProjectMetricsChart();
    }
  } else {
    // Initialize with empty selection
    selectedProjects = {};
    document.querySelectorAll('.project-checkbox').forEach(checkbox => {
      const projectName = checkbox.getAttribute('data-project-name');
      selectedProjects[projectName] = false;
    });
  }
}

// Handle project selection
function handleProjectSelection(checkbox) {
  const projectName = checkbox.getAttribute('data-project-name');
  selectedProjects[projectName] = checkbox.checked;

  // Save to cookie
  const activeProjects = Object.fromEntries(Object.entries(selectedProjects).filter(([_, selected]) => selected));
  setCookie('junie-explorer-selectedProjects', JSON.stringify(activeProjects));

  // Update "Select All" checkbox
  updateSelectAllCheckbox();

  // Load and display the graph if projects are selected
  loadProjectMetricsChart();
}

// Toggle select/deselect all projects
function toggleSelectAllProjects() {
  const selectAllCheckbox = document.getElementById('select-all-projects');
  if (!selectAllCheckbox) return;
  const isChecked = selectAllCheckbox.checked;

  // Update all project checkboxes
  document.querySelectorAll('.project-checkbox').forEach(checkbox => {
    checkbox.checked = isChecked;
    const projectName = checkbox.getAttribute('data-project-name');
    selectedProjects[projectName] = isChecked;
  });

  // Save to cookie
  const activeProjects = Object.fromEntries(Object.entries(selectedProjects).filter(([_, selected]) => selected));
  setCookie('junie-explorer-selectedProjects', JSON.stringify(activeProjects));

  // Load and display the graph if projects are selected
  loadProjectMetricsChart();
}

// Update the "Select All" checkbox based on individual selections
function updateSelectAllCheckbox() {
  const selectAllCheckbox = document.getElementById('select-all-projects');
  if (!selectAllCheckbox) return;
  const checkboxes = document.querySelectorAll('.project-checkbox');
  const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;

  if (checkedCount === 0) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
  } else if (checkedCount === checkboxes.length) {
    selectAllCheckbox.checked = true;
    selectAllCheckbox.indeterminate = false;
  } else {
    selectAllCheckbox.indeterminate = true;
  }
}

// Handle display option change (Cost, Tokens, TPS)
function handleDisplayOptionChange(radio) {
  const allowed = ['cost', 'tokens', 'tps'];
  displayOption = allowed.includes(radio.value) ? radio.value : 'cost'; // default to 'cost' for any unexpected value

  // Save to local storage
  localStorage.setItem('junie-explorer-displayOption', displayOption);

  // Show/hide agent type dropdown based on display option
  const agentTypeContainer = document.getElementById('agent-type-container');
  if (agentTypeContainer) {
    if (displayOption === 'tps') {
      agentTypeContainer.classList.remove('hidden');
    } else {
      agentTypeContainer.classList.add('hidden');
    }
  }

  // Reload the graph with the new display option
  loadProjectMetricsChart();
}

// Handle agent type change
function handleAgentTypeChange(select) {
  agentTypeOption = select.value;
  localStorage.setItem('junie-explorer-agentTypeOption', agentTypeOption);
  loadProjectMetricsChart();
}

// Handle group option change (Auto, Hour, Day, Week, Month)
function handleGroupOptionChange(radio) {
  const allowed = ['auto', 'hour', 'day', 'week', 'month'];
  groupOption = allowed.includes(radio.value) ? radio.value : 'auto';
  localStorage.setItem('junie-explorer-groupOption', groupOption);
  loadProjectMetricsChart();
}

// Handle view option change (Project, Model, AgentType)
function handleViewOptionChange(radio) {
  const allowed = ['project', 'model', 'agentType'];
  viewOption = allowed.includes(radio.value) ? radio.value : 'project';
  localStorage.setItem('junie-explorer-viewOption', viewOption);
  loadProjectMetricsChart();
}

// Load and display the graph for selected projects
async function loadProjectMetricsChart() {
  const graphContainer = document.getElementById('project-metrics-chart');
  if (!graphContainer) return;
  const selectedProjectNames = Object.keys(selectedProjects).filter(name => selectedProjects[name]);

  // Hide graph if no projects are selected
  if (selectedProjectNames.length === 0) {
    // Add hidden class and remove visible class for animation, then fully hide the container
    graphContainer.classList.add('hidden');
    graphContainer.classList.remove('visible');
    graphContainer.style.display = 'none';

    // Wait for animation to complete before destroying chart
    setTimeout(() => {
      if (projectsChart) {
        projectsChart.destroy();
        projectsChart = null;
      }
    }, 500); // Match the transition duration in CSS

    return;
  }

  // Show graph container immediately so loader can be seen
  if (graphContainer.classList.contains('hidden')) {
    graphContainer.classList.remove('hidden');
    graphContainer.classList.add('visible');
    graphContainer.style.display = 'block';
  }

  const loader = document.getElementById('chart-loader');
  let loadingTimeout;
  if (loader) {
    loadingTimeout = setTimeout(() => {
      loader.classList.remove('hidden');
    }, 200);
  }

  try {
    // Fetch graph data for selected projects
    const breakdownParam = viewOption === 'model' ? '&breakdown=model' : (viewOption === 'agentType' ? '&breakdown=agentType' : '');
    const displayParam = '&display=' + encodeURIComponent(displayOption);
    const agentTypeParam = displayOption === 'tps' ? '&agentType=' + encodeURIComponent(agentTypeOption) : '';
    const response = await fetch('/api/projects/graph?names=' + selectedProjectNames.join(',') + '&group=' + encodeURIComponent(groupOption) + breakdownParam + displayParam + agentTypeParam);
    const graphData = await response.json();

    // Create or update the chart
    createProjectsChart(graphData);
  } catch (error) {
    console.error('Error loading graph data:', error);
  } finally {
    if (loadingTimeout) clearTimeout(loadingTimeout);
    if (loader) loader.classList.add('hidden');
  }
}

// Create or update the projects chart
function createProjectsChart(graphData) {
  const ctx = document.getElementById('projectsMetricsChart').getContext('2d');

  // Destroy existing chart if it exists
  if (projectsChart) {
    projectsChart.destroy();
  }

  // Define a minimal locale object to satisfy the adapter requirements
  window._locale = {
    code: 'en-US',
    formatLong: {
      date: (options) => {
        return options.width === 'short' ? 'MM/dd/yyyy' : 'MMMM d, yyyy';
      }
    },
    localize: {
      month: (n) => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][n],
      day: (n) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][n],
      ordinalNumber: (n) => n
    },
    formatRelative: () => '',
    match: {},
    options: { weekStartsOn: 0 }
  };

  // Filter datasets based on the selected display option
  let filteredDatasets = [];
  if (graphData.datasets) {
    if (displayOption === 'tps') {
      // TPS datasets are already on the y axis
      filteredDatasets = graphData.datasets.filter(dataset => dataset.yAxisID === 'y');
    } else if (displayOption === 'tokens') {
      // Move token datasets to the primary axis (y)
      filteredDatasets = graphData.datasets
        .filter(dataset => dataset.yAxisID === 'y1')
        .map(ds => Object.assign({}, ds, { yAxisID: 'y' }));
    } else { // default to 'cost'
      filteredDatasets = graphData.datasets.filter(dataset => dataset.yAxisID === 'y');
    }
  }

  // Choose tooltip/date formats based on time unit
  const unit = graphData.timeUnit || 'day';

  // Convert datasets to bars (stacked for cost/tokens) or lines (for TPS)
  if (displayOption === 'tps') {
    filteredDatasets = filteredDatasets.map(ds => Object.assign({}, ds, {
      type: 'line'
    }));
  } else {
    filteredDatasets = filteredDatasets.map(ds => Object.assign({}, ds, {
      type: 'bar',
      stack: 'main'
    }));
  }
  const tooltipFormat = unit === 'hour' ? 'MMM d, yyyy HH:00' : (unit === 'month' ? 'MMM yyyy' : (unit === 'year' ? 'yyyy' : 'MMM d, yyyy'));

  // Create chart configuration
  const config = {
    type: 'bar',
    data: {
      datasets: filteredDatasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      spanGaps: true, // Prevent connecting lines between points with gaps
      elements: {
        point: {
          radius: 4,
          hitRadius: 10,
          hoverRadius: 6
        },
        line: {
          tension: 0.1
        }
      },
      scales: {
        x: {
          type: 'time',
          stacked: displayOption !== 'tps',
          offset: true,
          time: {
            unit: graphData.timeUnit || 'day',
            stepSize: graphData.stepSize || 1,
            displayFormats: {
              hour: 'MMM d HH:00',
              day: 'MMM d',
              week: 'MMM d',
              month: 'MMM yyyy',
              year: 'yyyy'
            },
            tooltipFormat: tooltipFormat
          },
          title: {
            display: true,
            text: unit === 'hour' ? 'Date/Time' : 'Date'
          },
          adapters: {
            date: {
              locale: window._locale
            }
          }
        },
        y: {
          position: 'left',
          stacked: displayOption !== 'tps',
          title: {
            display: true,
            text: displayOption === 'tps' ? 'TPS (tokens/sec)' : (displayOption === 'tokens' ? 'Tokens' : 'Cost ($)')
          },
          beginAtZero: true,
          display: true,
          ticks: {
            callback: function(value) {
              const n = Number(value);
              if (displayOption === 'tps') {
                return n.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
              }
              if (displayOption === 'tokens') {
                return n.toLocaleString();
              }
              return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
          }
        },
        y1: {
          position: 'right',
          stacked: true,
          title: {
            display: false,
            text: ''
          },
          beginAtZero: true,
          grid: {
            drawOnChartArea: false
          },
          display: false
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Project Metrics Over Time',
          font: {
            size: 16
          }
        },
        legend: {
          display: viewOption === 'model' || viewOption === 'agentType' || (graphData.projectNames && graphData.projectNames.length > 1),
          position: 'bottom',
          labels: {
            usePointStyle: true,
            filter: function(legendItem, data) {
              // Only show legend items for datasets currently in the chart
              return true;
            }
          }
        }
      }
    }
  };

  // Create the chart
  projectsChart = new Chart(ctx, config);
}

// Initialize when the page loads
window.addEventListener('load', function() {
  initializeProjectSelection();

  // Apply IDE filters after project selection is initialized
  if (typeof initializeFilters === 'function') {
    window.ideFilters = initializeFilters();
  }

  // Apply current sort (field + direction) from localStorage
  applySort();
});

// Apply current sort field
function applySort() {
  const field = localStorage.getItem('junie-explorer-sortField') || 'name';
  if (field === 'updated') {
    applyUpdatedSort();
  } else {
    applyNameSort();
  }
}

// Sorting by project name with persistence
function applyNameSort() {
  const tableBody = document.getElementById('project-list');
  if (!tableBody) return;
  const sortOrder = localStorage.getItem('junie-explorer-nameSort') || 'asc';
  const rows = Array.from(tableBody.querySelectorAll('tr.project-row'));
  rows.sort((a, b) => {
    const nameA = (a.querySelector('.project-name')?.textContent || '').toLowerCase();
    const nameB = (b.querySelector('.project-name')?.textContent || '').toLowerCase();
    if (nameA < nameB) return sortOrder === 'asc' ? -1 : 1;
    if (nameA > nameB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  rows.forEach(r => tableBody.appendChild(r));
  // Update sort button indicators
  const nameBtn = document.getElementById('sort-name-btn');
  if (nameBtn) {
    const ascSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="3" y="5" width="6" height="4" rx="1" fill="currentColor"/><rect x="3" y="10" width="10" height="4" rx="1" fill="currentColor"/><rect x="3" y="15" width="14" height="4" rx="1" fill="currentColor"/><rect x="20" y="10" width="2" height="8" rx="1" fill="currentColor"/><polygon points="21,5 23,10 19,10" fill="currentColor"/></svg>';
    const descSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="3" y="5" width="14" height="4" rx="1" fill="currentColor"/><rect x="3" y="10" width="10" height="4" rx="1" fill="currentColor"/><rect x="3" y="15" width="6" height="4" rx="1" fill="currentColor"/><rect x="20" y="6" width="2" height="8" rx="1" fill="currentColor"/><polygon points="19,14 23,14 21,19" fill="currentColor"/></svg>';
    nameBtn.innerHTML = sortOrder === 'asc' ? ascSvg : descSvg;
    nameBtn.title = sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending';
    nameBtn.setAttribute('aria-label', nameBtn.title);
  }
  const updatedBtn = document.getElementById('sort-updated-btn');
  if (updatedBtn) {
    // Dim the other sort button to indicate inactive field
    updatedBtn.classList.add('opacity-50');
  }
  const field = 'name';
  localStorage.setItem('junie-explorer-sortField', field);
}

// Sorting by last updated with persistence
function applyUpdatedSort() {
  const tableBody = document.getElementById('project-list');
  if (!tableBody) return;
  const sortOrder = localStorage.getItem('junie-explorer-updatedSort') || 'desc';
  const rows = Array.from(tableBody.querySelectorAll('tr.project-row'));
  rows.sort((a, b) => {
    const aTs = Number((a.querySelector('[data-updated-ts]')?.getAttribute('data-updated-ts')) || '0');
    const bTs = Number((b.querySelector('[data-updated-ts]')?.getAttribute('data-updated-ts')) || '0');
    if (aTs < bTs) return sortOrder === 'asc' ? -1 : 1;
    if (aTs > bTs) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  rows.forEach(r => tableBody.appendChild(r));
  // Update sort button indicators
  const updatedBtn = document.getElementById('sort-updated-btn');
  if (updatedBtn) {
    // Use the same icon style as the Name sort
    const ascSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="3" y="5" width="6" height="4" rx="1" fill="currentColor"/><rect x="3" y="10" width="10" height="4" rx="1" fill="currentColor"/><rect x="3" y="15" width="14" height="4" rx="1" fill="currentColor"/><rect x="20" y="10" width="2" height="8" rx="1" fill="currentColor"/><polygon points="21,5 23,10 19,10" fill="currentColor"/></svg>';
    const descSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="3" y="5" width="14" height="4" rx="1" fill="currentColor"/><rect x="3" y="10" width="10" height="4" rx="1" fill="currentColor"/><rect x="3" y="15" width="6" height="4" rx="1" fill="currentColor"/><rect x="20" y="6" width="2" height="8" rx="1" fill="currentColor"/><polygon points="19,14 23,14 21,19" fill="currentColor"/></svg>';
    updatedBtn.innerHTML = sortOrder === 'asc' ? ascSvg : descSvg;
    updatedBtn.title = sortOrder === 'asc' ? 'Oldest first' : 'Newest first';
    updatedBtn.setAttribute('aria-label', updatedBtn.title);
    updatedBtn.classList.remove('opacity-50');
  }
  const nameBtn = document.getElementById('sort-name-btn');
  if (nameBtn) {
    nameBtn.classList.add('opacity-50');
  }
  const field = 'updated';
  localStorage.setItem('junie-explorer-sortField', field);
}

function toggleNameSort() {
  const currentField = localStorage.getItem('junie-explorer-sortField') || 'name';
  if (currentField !== 'name') {
    localStorage.setItem('junie-explorer-sortField', 'name');
  } else {
    const current = localStorage.getItem('junie-explorer-nameSort') || 'asc';
    const next = current === 'asc' ? 'desc' : 'asc';
    localStorage.setItem('junie-explorer-nameSort', next);
  }
  applySort();
}

function toggleUpdatedSort() {
  const currentField = localStorage.getItem('junie-explorer-sortField') || 'name';
  if (currentField !== 'updated') {
    localStorage.setItem('junie-explorer-sortField', 'updated');
  } else {
    const current = localStorage.getItem('junie-explorer-updatedSort') || 'desc';
    const next = current === 'asc' ? 'desc' : 'asc';
    localStorage.setItem('junie-explorer-updatedSort', next);
  }
  applySort();
}
