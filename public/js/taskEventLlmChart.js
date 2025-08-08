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
let selectedProvidersSet = new Set();
let selectedProvider = 'all';

// Function to filter chart data based on selected providers
function filterChartData(selectedProviders) {
  if (!originalChartData || !window.llmEvents) return originalChartData;
  
  // Filter events based on selected providers
  const filteredEvents = window.llmEvents.filter(event => {
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
  
  // Recreate datasets with filtered data
  const costData = filteredEvents.map(event => ({
    x: event.timestamp.toISOString(),
    y: event.event.answer.cost,
  }));
  
  const tokenData = filteredEvents.map(event => {
    const answer = event.event.answer;
    return {
      x: event.timestamp.toISOString(),
      y: answer.inputTokens + answer.outputTokens + answer.cacheCreateInputTokens,
    };
  });
  
  return {
    ...originalChartData,
    labels: filteredEvents.map(event => event.timestamp.toISOString()),
    datasets: [
      {
        ...originalChartData.datasets[0],
        data: costData
      },
      {
        ...originalChartData.datasets[1],
        data: tokenData
      }
    ]
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
  llmChart.update();
}

// Initialize the LLM metrics graph when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Add a small delay to ensure all scripts are loaded
  setTimeout(function() {
    try {
      const chartElement = document.getElementById('llmMetricsChart');
      // Only initialize the chart if the element exists (i.e., there are LLM events)
      if (!chartElement) {
        console.log('No LLM chart element found - chart will not be initialized');
        return;
      }

      // Check if llmChartData exists (it won't if there are no LLM events)
      if (!window.llmChartData) {
        console.log('No LLM chart data available - chart will not be initialized');
        return;
      }

      const ctx = chartElement.getContext('2d');
      // Use a global variable to avoid JSON parsing issues
      const chartData = window.llmChartData;
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
            yAxisID: dataset.yAxisID
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
              display: true,
              position: 'right',
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
              position: 'top'
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
      
      // Build provider filter button group (exclusive: All or one provider)
      const providerFiltersContainer = document.getElementById('llm-provider-filters');
      if (providerFiltersContainer && originalChartData && Array.isArray(originalChartData.providers)) {
        providerFiltersContainer.innerHTML = '';
        const providers = originalChartData.providers;

        // Initialize selection to 'all'
        selectedProvider = 'all';
        selectedProvidersSet = new Set(providers);

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
      
    } catch (error) {
      console.error('Error creating LLM chart:', error);
    }
  }, 100); // 100ms delay
});