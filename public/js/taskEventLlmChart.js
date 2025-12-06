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

// Global variables for chart management
let llmChart = null;
let originalChartData = null;
let llmEventsData = null;
let selectedProvidersSet = new Set();
let selectedProvider = 'all';
let selectedMetricType = 'cost'; // 'cost' or 'tokens'

// UI element references
function getLoadingElement() {
  return document.getElementById('llmMetricsLoading');
}

function getErrorElement() {
  return document.getElementById('llmMetricsError');
}

function getErrorMessageElement() {
  return document.getElementById('llmMetricsErrorMessage');
}

function getChartElement() {
  return document.getElementById('llmMetricsChart');
}

// Show loading state
function showLoading() {
  const loading = getLoadingElement();
  const error = getErrorElement();
  const chart = getChartElement();
  
  if (loading) loading.classList.remove('hidden');
  if (error) error.classList.add('hidden');
  if (chart) chart.classList.add('hidden');
}

// Show error state
function showError(message) {
  const loading = getLoadingElement();
  const error = getErrorElement();
  const errorMessage = getErrorMessageElement();
  const chart = getChartElement();
  
  if (loading) loading.classList.add('hidden');
  if (error) error.classList.remove('hidden');
  if (errorMessage) errorMessage.textContent = message || 'Failed to load chart data';
  if (chart) chart.classList.add('hidden');
}

// Show chart (hide loading and error)
function showChart() {
  const loading = getLoadingElement();
  const error = getErrorElement();
  const chart = getChartElement();
  
  if (loading) loading.classList.add('hidden');
  if (error) error.classList.add('hidden');
  if (chart) chart.classList.remove('hidden');
}

// Function to update dataset visibility based on selected metric type
function updateDatasetVisibility() {
  if (!llmChart || !originalChartData) return;

  llmChart.data.datasets.forEach((dataset, index) => {
    const originalDataset = originalChartData.datasets[index];
    const group = originalDataset?.group;
    // Cumulative series are identified by having borderDash property (dashed lines)
    const isCumulativeSeries = Array.isArray(originalDataset?.borderDash) && originalDataset.borderDash.length > 0;
    
    if (group === 'cost') {
      // If cumulative series, keep it hidden; otherwise show/hide based on selected metric type
      dataset.hidden = isCumulativeSeries || selectedMetricType !== 'cost';
    } else if (group === 'tokens') {
      // If cumulative series, keep it hidden; otherwise show/hide based on selected metric type
      dataset.hidden = isCumulativeSeries || selectedMetricType !== 'tokens';
    } else if (group === 'legacy') {
      dataset.hidden = true; // Always hide legacy datasets
    }
  });

  // Update Y-axis visibility and labels
  if (llmChart.options.scales.y) {
    llmChart.options.scales.y.display = selectedMetricType === 'cost';
    llmChart.options.scales.y.title.text = 'Cost ($)';
  }
  if (llmChart.options.scales.y1) {
    llmChart.options.scales.y1.display = selectedMetricType === 'tokens';
    llmChart.options.scales.y1.title.text = 'Tokens';
    llmChart.options.scales.y1.position = 'left'; // Move to left when tokens is selected
  }

  llmChart.update();
}

// Function to filter chart data based on selected providers
function filterChartData(selectedProviders) {
  if (!llmEventsData) return originalChartData;
  
  // Convert ISO string back to Date object
  const llmEvents = llmEventsData.map(event => ({
    ...event,
    timestamp: new Date(event.timestamp)
  }));

  if (!originalChartData) return originalChartData;
  
  // Filter events based on selected providers
  const filteredEvents = llmEvents.filter(event => {
    const provider = event.event.answer?.llm?.provider;
    return selectedProviders.includes(provider);
  });
  
  if (filteredEvents.length === 0) {
    return {
      ...originalChartData,
      labels: [],
      datasets: originalChartData.datasets.map(dataset => ({
        ...dataset,
        data: []
      }))
    };
  }
  
  // Return filtered data - the datasets structure matches originalChartData
  // We need to filter each dataset's data based on the filtered events' timestamps
  const filteredTimestamps = new Set(filteredEvents.map(e => e.timestamp.toISOString()));
  
  return {
    ...originalChartData,
    labels: filteredEvents.map(event => event.timestamp.toISOString()),
    datasets: originalChartData.datasets.map(dataset => ({
      ...dataset,
      data: dataset.data.filter(point => filteredTimestamps.has(point.x))
    }))
  };
}

// Function to update chart with filtered data
function updateChart() {
  if (!llmChart) return;

  let selectedProviders = [];
  if (selectedProvider === 'all') {
    selectedProviders = (originalChartData && Array.isArray(originalChartData.providers)) ? originalChartData.providers : [];
  } else if (selectedProvider) {
    selectedProviders = [selectedProvider];
  }

  selectedProvidersSet = new Set(selectedProviders);
  llmChart.data = filterChartData(selectedProviders);
  
  // Reapply visibility based on metric type after filtering
  updateDatasetVisibility();
}

// Function to set metric type and update UI
function setMetricType(type) {
  selectedMetricType = type;
  
  // Update button states
  const toggleContainer = document.getElementById('metric-type-toggle');
  if (toggleContainer) {
    const buttons = toggleContainer.querySelectorAll('button');
    buttons.forEach(btn => {
      const value = btn.getAttribute('data-value');
      const active = value === type;
      btn.classList.toggle('btn-primary', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }
  
  updateDatasetVisibility();
}

// Function to create the chart with fetched data
function createChart(chartData) {
  const chartElement = getChartElement();
  if (!chartElement) {
    console.log('No LLM chart element found - chart will not be initialized');
    return;
  }

  const ctx = chartElement.getContext('2d');
  originalChartData = chartData;
  const timeUnit = chartData.timeUnit;
  const stepSize = chartData.stepSize;

  // Create chart configuration
  const config = {
    type: 'line',
    data: {
      labels: chartData.labels,
      datasets: chartData.datasets.map(dataset => ({
        label: dataset.label,
        data: dataset.data,
        borderColor: dataset.borderColor,
        backgroundColor: dataset.backgroundColor,
        fill: false,
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHitRadius: 10,
        borderWidth: 2,
        yAxisID: dataset.yAxisID,
        hidden: dataset.hidden
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
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
            unit: timeUnit,
            stepSize: stepSize,
            displayFormats: {
              second: 'HH:mm:ss',
              minute: 'HH:mm',
              hour: 'HH:mm',
              day: 'MMM d',
              week: 'MMM d',
              month: 'MMM yyyy',
              year: 'yyyy'
            },
            tooltipFormat: 'MMM d, yyyy HH:mm:ss'
          },
          title: {
            display: true,
            text: 'Time'
          },
          adapters: {
            date: {
              locale: window._locale
            }
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Cost ($)'
          },
          beginAtZero: true
        },
        y1: {
          type: 'linear',
          display: false,
          position: 'left',
          title: {
            display: true,
            text: 'Tokens'
          },
          beginAtZero: true,
          grid: {
            drawOnChartArea: false
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Event Metrics',
          font: {
            size: 16
          }
        },
        legend: {
          display: true,
          position: 'top',
          labels: {
            filter: function(legendItem, chartData) {
              // Only show legend items for the currently selected metric type
              const dataset = chartData.datasets[legendItem.datasetIndex];
              const group = originalChartData.datasets[legendItem.datasetIndex]?.group;
              if (group === 'legacy') return false;
              if (selectedMetricType === 'cost' && group === 'tokens') return false;
              if (selectedMetricType === 'tokens' && group === 'cost') return false;
              return true;
            }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      }
    }
  };

  // Create the chart
  llmChart = new Chart(ctx, config);

  // Initialize metric type toggle
  const metricToggleContainer = document.getElementById('metric-type-toggle');
  if (metricToggleContainer) {
    const buttons = metricToggleContainer.querySelectorAll('button');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const value = btn.getAttribute('data-value');
        if (value) {
          setMetricType(value);
        }
      });
    });
  }

  // Build provider filter button group (exclusive: All or one provider)
  const providerFiltersContainer = document.getElementById('llm-provider-filters');
  if (providerFiltersContainer && originalChartData && Array.isArray(originalChartData.providers)) {
    providerFiltersContainer.innerHTML = '';
    const providers = originalChartData.providers;

    // Initialize selection to first 'Assistant*' provider, or 'all' if none found
    const agentProvider = providers.find(p => p.startsWith('Assistant'));
    selectedProvider = agentProvider || 'all';
    selectedProvidersSet = agentProvider ? new Set([agentProvider]) : new Set(providers);

    const buttons = [];

    const makeBtn = (label, value) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-sm join-item';
      btn.setAttribute('data-value', value);
      btn.setAttribute('aria-pressed', 'false');
      btn.textContent = label;
      return btn;
    };

    const refreshButtons = () => {
      buttons.forEach(btn => {
        const value = btn.getAttribute('data-value');
        const active = value === selectedProvider;
        btn.classList.toggle('btn-primary', active);
        btn.setAttribute('aria-pressed', String(active));
      });
    };

    const setSelection = (value) => {
      selectedProvider = value;
      if (value === 'all') {
        selectedProvidersSet = new Set(providers);
      } else {
        selectedProvidersSet = new Set([value]);
      }
      refreshButtons();
      updateChart();
    };

    const allBtn = makeBtn('All', 'all');
    allBtn.addEventListener('click', () => setSelection('all'));
    providerFiltersContainer.appendChild(allBtn);
    buttons.push(allBtn);

    providers.forEach(provider => {
      const pBtn = makeBtn(provider, provider);
      pBtn.addEventListener('click', () => setSelection(provider));
      providerFiltersContainer.appendChild(pBtn);
      buttons.push(pBtn);
    });

    // Initialize UI state and chart
    refreshButtons();
    updateChart();
  }

  // Show the chart
  showChart();
}

// Fetch chart data from API
async function fetchChartData(apiUrl) {
  showLoading();
  
  try {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.llmChartData) {
      throw new Error('Invalid response: missing chart data');
    }
    
    // Store the events data globally for filtering
    llmEventsData = data.llmEvents || [];
    
    // Create the chart with the fetched data
    createChart(data.llmChartData);
    
  } catch (error) {
    console.error('Error fetching chart data:', error);
    showError(error.message || 'Failed to load chart data');
  }
}

// Initialize the LLM metrics graph when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Add a small delay to ensure all scripts are loaded
  setTimeout(function() {
    try {
      const chartElement = getChartElement();
      // Only initialize the chart if the element exists (i.e., there are LLM events)
      if (!chartElement) {
        console.log('No LLM chart element found - chart will not be initialized');
        return;
      }

      // Get the config from the embedded JSON
      const configEl = document.getElementById('chartDataConfig');
      const config = configEl ? JSON.parse(configEl.textContent) : null;
      
      if (!config) {
        console.log('No chart config available - chart will not be initialized');
        return;
      }
      
      // Check if there are metrics to display
      if (!config.hasMetrics) {
        console.log('No metrics available - chart will not be initialized');
        return;
      }
      
      // Fetch chart data from the API
      if (config.apiUrl) {
        fetchChartData(config.apiUrl);
      } else {
        console.log('No API URL configured - chart will not be initialized');
        showError('Chart configuration error');
      }
      
    } catch (error) {
      console.error('Error initializing LLM chart:', error);
      showError('Failed to initialize chart');
    }
  }, 100); // 100ms delay
});
