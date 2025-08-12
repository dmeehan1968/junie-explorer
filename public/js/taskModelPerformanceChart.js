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

// Model Performance Chart using Chart.js
class ModelPerformanceChart {
  constructor(canvasId, apiUrl) {
    this.canvas = document.getElementById(canvasId);
    this.apiUrl = apiUrl;
    this.data = null;
    this.providers = [];
    this.visibleProviders = new Set();
    this.metricMode = 'both'; // 'both' | 'latency' | 'tps'
    this.selectedProvider = 'both'; // 'both' or provider name
    this.chart = null;

    // Flag from DOM: whether tokens/sec metrics should be shown
    const section = document.querySelector('[data-testid="model-performance-section"]');
    this.hasMetrics = section?.getAttribute('data-has-metrics') === 'true';
    if (!this.hasMetrics) {
      this.metricMode = 'latency';
    }
    
    // Chart colors
    this.colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
    ];
    
    this.loadData();
  }
  
  async loadData() {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.data = await response.json();
      this.providers = this.data.providers || [];
      
      // Initialize all providers as visible
      this.visibleProviders = new Set(this.providers);
      
      this.createProviderFilters();
      this.setupMetricToggle();
      this.createChart();
    } catch (error) {
      console.error('Error loading Model Performance data:', error);
      this.showError('Failed to load Model Performance data');
    }
  }
  
  setupMetricToggle() {
    const toggleContainer = document.getElementById('model-performance-metric-toggle');
    if (!toggleContainer) return;

    const buttons = Array.from(toggleContainer.querySelectorAll('button[data-metric]'));

    // If tokens/sec metrics are not available, ensure only latency is active
    if (!this.hasMetrics) {
      this.metricMode = 'latency';
    }

    buttons.forEach(btn => {
      // If hasMetrics is false, ignore clicks on anything other than latency (shouldn't exist server-side)
      if (!this.hasMetrics && btn.getAttribute('data-metric') !== 'latency') return;
      btn.addEventListener('click', () => {
        // update pressed states
        buttons.forEach(b => {
          const isActive = b === btn;
          b.classList.toggle('btn-primary', isActive);
          b.setAttribute('aria-pressed', String(isActive));
        });
        this.metricMode = btn.getAttribute('data-metric');
        this.updateChart();
      });
    });
  }

  createProviderFilters() {
    const container = document.getElementById('model-performance-provider-filters');
    if (!container) return;
    
    container.innerHTML = '';
    
    const buttons = [];
    
    const setSelection = (value) => {
      this.selectedProvider = value;
      if (value === 'both') {
        this.visibleProviders = new Set(this.providers);
      } else {
        this.visibleProviders = new Set([value]);
      }
      buttons.forEach(b => {
        const active = b.getAttribute('data-value') === value;
        b.classList.toggle('btn-primary', active);
        b.setAttribute('aria-pressed', String(active));
      });
      this.updateChart();
    };
    
    const makeButton = (label, value) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-sm join-item';
      btn.setAttribute('data-value', value);
      btn.setAttribute('aria-pressed', 'false');
      btn.textContent = label;
      btn.addEventListener('click', () => setSelection(value));
      return btn;
    };
    
    const bothBtn = makeButton('Both', 'both');
    container.appendChild(bothBtn);
    buttons.push(bothBtn);
    
    this.providers.forEach((provider) => {
      const btn = makeButton(provider, provider);
      container.appendChild(btn);
      buttons.push(btn);
    });
    
    // Initialize selection
    setSelection(this.selectedProvider || 'both');
  }
  
  createChart() {
    if (!this.data || !this.data.performanceData) {
      this.showError('No performance data available');
      return;
    }

    const ctx = this.canvas.getContext('2d');
    
    // Prepare datasets for each provider - conditional tokens/sec datasets
    const datasets = [];
    this.providers.forEach((provider, index) => {
      const color = this.colors[index % this.colors.length];
      const providerData = this.data.performanceData
        .filter(item => item.provider === provider)
        .map(item => ({
          x: new Date(item.timestamp),
          latencySeconds: (item.latency ?? 0) / 1000,
          tokensPerSecond: item.tokensPerSecond ?? 0,
          provider: item.provider,
          model: item.model,
        }));

      datasets.push({
        label: provider + ' • Latency',
        data: providerData.map(p => ({ x: p.x, y: p.latencySeconds, provider: p.provider, model: p.model })),
        borderColor: color,
        backgroundColor: color + '20',
        fill: false,
        tension: 0.1,
        borderWidth: 2,
        yAxisID: 'yLatency',
        hidden: !this.visibleProviders.has(provider),
        _provider: provider,
        _metric: 'latency'
      });

      if (this.hasMetrics) {
        datasets.push({
          label: provider + ' • tokens/sec',
          data: providerData.map(p => ({ x: p.x, y: p.tokensPerSecond, provider: p.provider, model: p.model })),
          borderColor: color,
          borderDash: [6, 4],
          backgroundColor: color + '20',
          fill: false,
          tension: 0.1,
          borderWidth: 2,
          yAxisID: 'yTokens',
          hidden: !this.visibleProviders.has(provider),
          _provider: provider,
          _metric: 'tps'
        });
      }
    });

    // Build scales object conditionally
    const scales = {
      x: {
        type: 'time',
        time: {
          displayFormats: {
            hour: 'HH:mm',
            minute: 'HH:mm:ss',
            second: 'HH:mm:ss'
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
      yLatency: {
        title: {
          display: true,
          text: 'Latency (secs)'
        },
        beginAtZero: true
      }
    };

    if (this.hasMetrics) {
      scales.yTokens = {
        title: {
          display: true,
          text: 'Tokens/sec'
        },
        beginAtZero: true,
        position: 'right',
        grid: {
          drawOnChartArea: false
        }
      };
    }

    const config = {
      type: 'line',
      data: {
        datasets: datasets
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
        scales: scales,
        plugins: {
          title: {
            display: true,
            text: this.hasMetrics ? 'Latency and Tokens/sec Over Time' : 'Latency Over Time',
            font: {
              size: 16
            }
          },
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            callbacks: {
              title: function(context) {
                return new Date(context[0].parsed.x).toLocaleString();
              },
              label: (context) => {
                const dataPoint = context.raw;
                const value = context.parsed.y;
                const lines = [
                  `${context.dataset._provider}`,
                  `Model: ${dataPoint.model}`,
                ];
                if (!this.hasMetrics || context.dataset._metric === 'latency') {
                  lines.push(`Latency: ${value.toFixed(2)}s`);
                } else {
                  lines.push(`Tokens/sec: ${value.toFixed(2)}`);
                }
                return lines;
              }
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  updateChart() {
    if (!this.chart) return;

    // Update dataset visibility based on provider and metric mode
    this.chart.data.datasets.forEach((dataset) => {
      const providerVisible = this.visibleProviders.has(dataset._provider);
      const metricVisible = (this.metricMode === 'both') || (dataset._metric === this.metricMode);
      dataset.hidden = !(providerVisible && metricVisible);
    });

    this.chart.update();
  }
  
  showError(message) {
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2);
  }
}

// Initialize chart when section is expanded
document.addEventListener('DOMContentLoaded', function() {
  const modelPerformanceSection = document.querySelector('[data-testid="model-performance-section"]');
  if (!modelPerformanceSection) return;
  
  const header = modelPerformanceSection.querySelector('.collapsible-header');
  let chartInitialized = false;
  
  header.addEventListener('click', function() {
    const content = modelPerformanceSection.querySelector('.collapsible-content');
    const isExpanded = !content.classList.contains('hidden');
    
    if (isExpanded && !chartInitialized) {
      // Initialize chart when first expanded
      setTimeout(() => {
        const pathParts = window.location.pathname.split('/');
        const projectName = pathParts[2];
        const issueId = pathParts[4];
        const taskId = pathParts[6];
        
        const apiUrl = `/api/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}/task/${encodeURIComponent(taskId)}/trajectories/model-performance`;
        
        new ModelPerformanceChart('model-performance-chart', apiUrl);
        chartInitialized = true;
      }, 100);
    }
  });
});