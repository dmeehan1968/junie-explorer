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

// LLM Request Latency Chart using Chart.js
class LlmLatencyChart {
  constructor(canvasId, apiUrl) {
    this.canvas = document.getElementById(canvasId);
    this.apiUrl = apiUrl;
    this.data = null;
    this.providers = [];
    this.visibleProviders = new Set();
    this.metricMode = 'both'; // 'both' | 'latency' | 'tps'
    this.chart = null;
    
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
      console.error('Error loading LLM latency data:', error);
      this.showError('Failed to load LLM latency data');
    }
  }
  
  setupMetricToggle() {
    const toggleContainer = document.getElementById('llm-latency-metric-toggle');
    if (!toggleContainer) return;

    const buttons = Array.from(toggleContainer.querySelectorAll('button[data-metric]'));
    buttons.forEach(btn => {
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
    const filtersContainer = document.getElementById('llm-latency-provider-filters');
    if (!filtersContainer) return;
    
    filtersContainer.innerHTML = '';
    
    this.providers.forEach((provider, index) => {
      const color = this.colors[index % this.colors.length];
      
      const label = document.createElement('label');
      label.className = 'flex items-center gap-2 cursor-pointer';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      checkbox.className = 'checkbox checkbox-sm';
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.visibleProviders.add(provider);
        } else {
          this.visibleProviders.delete(provider);
        }
        this.updateChart();
      });
      
      const colorBox = document.createElement('div');
      colorBox.className = 'w-4 h-4 rounded';
      colorBox.style.backgroundColor = color;
      
      const text = document.createElement('span');
      text.textContent = provider
        .replace(/</.g, '&lt;')
        .replace(/>/.g, '&gt;')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
      text.className = 'text-sm';
      
      label.appendChild(checkbox);
      label.appendChild(colorBox);
      label.appendChild(text);
      filtersContainer.appendChild(label);
    });
  }
  
  createChart() {
    if (!this.data || !this.data.latencyData) {
      this.showError('No latency data available');
      return;
    }

    const ctx = this.canvas.getContext('2d');
    
    // Prepare datasets for each provider - two datasets per provider (latency and tokens/s)
    const datasets = [];
    this.providers.forEach((provider, index) => {
      const color = this.colors[index % this.colors.length];
      const providerData = this.data.latencyData
        .filter(item => item.provider === provider)
        .map(item => ({
          x: new Date(item.timestamp),
          latencySeconds: (item.latency ?? 0) / 1000,
          tokensPerSecond: item.tokensPerSecond ?? 0,
          provider: item.provider,
          model: item.model,
        }));

      datasets.push({
        label: provider + ' • latency',
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

      datasets.push({
        label: provider + ' • tokens/s',
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
    });

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
        scales: {
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
              text: 'Latency (s)'
            },
            beginAtZero: true
          },
          yTokens: {
            title: {
              display: true,
              text: 'Tokens / s'
            },
            beginAtZero: true,
            position: 'right',
            grid: {
              drawOnChartArea: false
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Model Latency and Tokens/s Over Time',
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
              label: function(context) {
                const dataPoint = context.raw;
                const isLatency = context.dataset._metric === 'latency';
                const value = context.parsed.y;
                const lines = [
                  `${context.dataset._provider}`,
                  `Model: ${dataPoint.model}`,
                ];
                if (isLatency) {
                  lines.push(`Latency: ${value.toFixed(2)}s`);
                } else {
                  lines.push(`Tokens/s: ${value.toFixed(2)}`);
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
  const llmLatencySection = document.querySelector('[data-testid="llm-latency-section"]');
  if (!llmLatencySection) return;
  
  const header = llmLatencySection.querySelector('.collapsible-header');
  let chartInitialized = false;
  
  header.addEventListener('click', function() {
    const content = llmLatencySection.querySelector('.collapsible-content');
    const isExpanded = !content.classList.contains('hidden');
    
    if (isExpanded && !chartInitialized) {
      // Initialize chart when first expanded
      setTimeout(() => {
        const pathParts = window.location.pathname.split('/');
        const projectName = pathParts[2];
        const issueId = pathParts[4];
        const taskId = pathParts[6];
        
        const apiUrl = `/api/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}/task/${encodeURIComponent(taskId)}/trajectories/llm-latency`;
        
        new LlmLatencyChart('llm-latency-chart', apiUrl);
        chartInitialized = true;
      }, 100);
    }
  });
});