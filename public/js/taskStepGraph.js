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

// Initialize the step metrics graph when the page loads
window.onload = function() {
  // Add a small delay to ensure all scripts are loaded
  setTimeout(function() {
    try {
      const chartElement = document.getElementById('stepMetricsChart');
      // Only initialize the chart if the element exists (i.e., there are steps)
      if (!chartElement) {
        console.log('No chart element found - chart will not be initialized');
        return;
      }

      // Check if chartData exists (it won't if there are no steps)
      if (!window.chartData) {
        console.log('No chart data available - chart will not be initialized');
        return;
      }

      const ctx = chartElement.getContext('2d');
      // Use a global variable to avoid JSON parsing issues
      const chartData = window.chartData;
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
              text: 'Step Metrics Over Time',
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
      new Chart(ctx, config);
    } catch (error) {
      console.error('Error creating chart:', error);
    }
  }, 100); // 100ms delay
};