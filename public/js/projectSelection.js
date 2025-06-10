// Global variables for project selection
let selectedProjects = {};
let projectsChart = null;
let displayOption = 'both'; // Default display option (both, cost, tokens)

// Initialize project selection from session storage
function initializeProjectSelection() {
  const storedSelection = sessionStorage.getItem('selectedProjects');
  const storedDisplayOption = sessionStorage.getItem('displayOption');
  const graphContainer = document.getElementById('projects-graph-container');

  // Initialize display option from session storage or default to 'both'
  if (storedDisplayOption) {
    displayOption = storedDisplayOption;
    // Update radio buttons based on stored display option
    document.querySelector(`input[name="display-option"][value="${displayOption}"]`).checked = true;
  }

  // Set initial state of graph container
  graphContainer.classList.add('hidden');
  graphContainer.style.display = 'block'; // Keep in DOM for animation

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
      loadProjectsGraph();
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

  // Save to session storage
  sessionStorage.setItem('selectedProjects', JSON.stringify(selectedProjects));

  // Update "Select All" checkbox
  updateSelectAllCheckbox();

  // Load and display the graph if projects are selected
  loadProjectsGraph();
}

// Toggle select/deselect all projects
function toggleSelectAllProjects() {
  const selectAllCheckbox = document.getElementById('select-all-projects');
  const isChecked = selectAllCheckbox.checked;

  // Update all project checkboxes
  document.querySelectorAll('.project-checkbox').forEach(checkbox => {
    checkbox.checked = isChecked;
    const projectName = checkbox.getAttribute('data-project-name');
    selectedProjects[projectName] = isChecked;
  });

  // Save to session storage
  sessionStorage.setItem('selectedProjects', JSON.stringify(selectedProjects));

  // Load and display the graph if projects are selected
  loadProjectsGraph();
}

// Update the "Select All" checkbox based on individual selections
function updateSelectAllCheckbox() {
  const selectAllCheckbox = document.getElementById('select-all-projects');
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

// Handle display option change (Cost, Tokens, Both)
function handleDisplayOptionChange(radio) {
  displayOption = radio.value;

  // Save to session storage
  sessionStorage.setItem('displayOption', displayOption);

  // Reload the graph with the new display option
  if (projectsChart) {
    loadProjectsGraph();
  }
}

// Load and display the graph for selected projects
async function loadProjectsGraph() {
  const graphContainer = document.getElementById('projects-graph-container');
  const selectedProjectNames = Object.keys(selectedProjects).filter(name => selectedProjects[name]);

  // Hide graph if no projects are selected
  if (selectedProjectNames.length === 0) {
    // Add hidden class and remove visible class for animation
    graphContainer.classList.add('hidden');
    graphContainer.classList.remove('visible');

    // Wait for animation to complete before destroying chart
    setTimeout(() => {
      if (projectsChart) {
        projectsChart.destroy();
        projectsChart = null;
      }
    }, 500); // Match the transition duration in CSS

    return;
  }

  // Make sure the container is in the DOM but hidden initially if it was hidden before
  if (graphContainer.classList.contains('hidden')) {
    // Keep it hidden but in the DOM
    graphContainer.style.display = 'block';

    // Trigger reflow to ensure the transition works
    void graphContainer.offsetWidth;
  }

  try {
    // Fetch graph data for selected projects
    const response = await fetch('/api/projects/graph?names=' + selectedProjectNames.join(','));
    const graphData = await response.json();

    // Create or update the chart
    createProjectsChart(graphData);

    // Show graph container with animation
    graphContainer.classList.remove('hidden');
    graphContainer.classList.add('visible');
  } catch (error) {
    console.error('Error loading graph data:', error);
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
    if (displayOption === 'both') {
      filteredDatasets = graphData.datasets;
    } else if (displayOption === 'cost') {
      filteredDatasets = graphData.datasets.filter(dataset => dataset.yAxisID === 'y');
    } else if (displayOption === 'tokens') {
      filteredDatasets = graphData.datasets.filter(dataset => dataset.yAxisID === 'y1');
    }
  }

  // Create chart configuration
  const config = {
    type: 'line',
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
          time: {
            unit: graphData.timeUnit || 'day',
            stepSize: graphData.stepSize || 1,
            displayFormats: {
              hour: 'HH:mm',
              day: 'MMM d',
              week: 'MMM d',
              month: 'MMM yyyy',
              year: 'yyyy'
            },
            tooltipFormat: 'MMM d, yyyy'
          },
          title: {
            display: true,
            text: 'Date'
          },
          adapters: {
            date: {
              locale: window._locale
            }
          }
        },
        y: {
          position: 'left',
          title: {
            display: true,
            text: 'Cost ($)'
          },
          beginAtZero: true,
          display: displayOption === 'both' || displayOption === 'cost'
        },
        y1: {
          position: 'right',
          title: {
            display: true,
            text: 'Tokens'
          },
          beginAtZero: true,
          grid: {
            drawOnChartArea: false
          },
          display: displayOption === 'both' || displayOption === 'tokens'
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
          display: false
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
});
