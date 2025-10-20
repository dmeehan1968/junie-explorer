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
    dayPeriod: (n, options) => {
      const periods = options?.width === 'wide' ? ['AM', 'PM'] : ['AM', 'PM'];
      return periods[n] || '';
    },
    ordinalNumber: (n) => n
  },
  formatRelative: () => '',
  match: {},
  options: { weekStartsOn: 0 }
};

// Initialize the cost over time graph when the page loads
window.onload = function() {
  (async function() {
    try {
      const chartElement = document.getElementById('costOverTimeChart');
      // Only initialize the chart if the element exists (i.e., there are issues)
      if (!chartElement) {
        console.log('No chart element found - chart will not be initialized');
        return;
      }

      const body = document.querySelector('body')
      const projectId = body?.dataset.projectId
      if (!projectId) {
        console.warn('No projectId found on body dataset; cannot load chart data')
        return
      }

      const resp = await fetch(`/api/projects/${encodeURIComponent(projectId)}/issue-cost`)
      if (!resp.ok) {
        console.warn('Failed to load chart data:', resp.status)
        return
      }
      const chartData = await resp.json()

      const ctx = chartElement.getContext('2d');
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
            borderWidth: 2
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
                  hour: 'HH:mm',
                  day: 'MMM d',
                  week: 'MMM d',
                  month: 'MMM yyyy',
                  year: 'yyyy'
                },
                tooltipFormat: 'MMM d, yyyy HH:mm'
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
              title: {
                display: true,
                text: 'Cost ($)'
              },
              beginAtZero: true
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Issue Cost Over Time',
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
      new Chart(ctx, config);
      const container = chartElement.closest('[data-testid="cost-over-time-graph"]')
      if (container) container.setAttribute('data-ready', 'true')
    } catch (error) {
      console.error('Error creating chart:', error);
    }
  })();
};
