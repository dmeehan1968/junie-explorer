// LLM Request Latency Chart
class LlmLatencyChart {
  constructor(canvasId, apiUrl) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.apiUrl = apiUrl;
    this.data = null;
    this.providers = [];
    this.visibleProviders = new Set();
    
    // Chart dimensions and styling
    this.margin = { top: 20, right: 30, bottom: 60, left: 200 };
    this.colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
    ];
    
    this.setupCanvas();
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
      this.render();
    } catch (error) {
      console.error('Error loading LLM latency data:', error);
      this.showError('Failed to load LLM latency data');
    }
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
        this.render();
      });
      
      const colorBox = document.createElement('div');
      colorBox.className = 'w-4 h-4 rounded';
      colorBox.style.backgroundColor = color;
      
      const text = document.createElement('span');
      text.textContent = provider;
      text.className = 'text-sm';
      
      label.appendChild(checkbox);
      label.appendChild(colorBox);
      label.appendChild(text);
      filtersContainer.appendChild(label);
    });
  }
  
  setupCanvas() {
    // Get the container width
    let containerWidth = 0;
    
    const llmLatencySection = this.canvas.closest('.collapsible-section');
    const collapsibleContent = this.canvas.closest('.collapsible-content');
    
    if (collapsibleContent && collapsibleContent.offsetWidth > 0) {
      containerWidth = collapsibleContent.offsetWidth - 40; // Account for padding
    } else if (llmLatencySection && llmLatencySection.offsetWidth > 0) {
      containerWidth = llmLatencySection.offsetWidth - 40;
    } else if (this.canvas.offsetWidth > 0) {
      containerWidth = this.canvas.offsetWidth;
    } else {
      containerWidth = 800; // Fallback
    }
    
    this.canvas.width = containerWidth;
    this.canvas.height = 400; // Fixed height for latency chart
    
    // Set up high DPI rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const actualWidth = rect.width || containerWidth;
    this.canvas.width = actualWidth * dpr;
    this.canvas.height = 400 * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = actualWidth + 'px';
    this.canvas.style.height = '400px';
    
    this.chartWidth = actualWidth - this.margin.left - this.margin.right;
    this.chartHeight = 400 - this.margin.top - this.margin.bottom;
  }
  
  render() {
    if (!this.data || !this.data.latencyData) {
      this.showError('No latency data available');
      return;
    }
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Filter data by visible providers
    const filteredData = this.data.latencyData.filter(item => 
      this.visibleProviders.has(item.provider)
    );
    
    if (filteredData.length === 0) {
      this.showError('No data to display with current filters');
      return;
    }
    
    // Calculate scales
    const timestamps = filteredData.map(d => new Date(d.timestamp).getTime());
    const latencies = filteredData.map(d => d.latency);
    
    const timeRange = {
      min: Math.min(...timestamps),
      max: Math.max(...timestamps)
    };
    
    const latencyRange = {
      min: 0, // Start from 0 for latency
      max: Math.max(...latencies)
    };
    
    // Add some padding to the max latency
    latencyRange.max *= 1.1;
    
    // Draw axes
    this.drawAxes(timeRange, latencyRange);
    
    // Draw data points grouped by provider
    this.drawDataPoints(filteredData, timeRange, latencyRange);
    
    // Draw legend
    this.drawLegend();
  }
  
  drawAxes(timeRange, latencyRange) {
    this.ctx.strokeStyle = '#374151';
    this.ctx.lineWidth = 1;
    this.ctx.font = '12px sans-serif';
    this.ctx.fillStyle = '#374151';
    
    // Y-axis (latency)
    this.ctx.beginPath();
    this.ctx.moveTo(this.margin.left, this.margin.top);
    this.ctx.lineTo(this.margin.left, this.margin.top + this.chartHeight);
    this.ctx.stroke();
    
    // X-axis (time)
    this.ctx.beginPath();
    this.ctx.moveTo(this.margin.left, this.margin.top + this.chartHeight);
    this.ctx.lineTo(this.margin.left + this.chartWidth, this.margin.top + this.chartHeight);
    this.ctx.stroke();
    
    // Y-axis labels (latency in ms)
    const latencyTicks = 5;
    for (let i = 0; i <= latencyTicks; i++) {
      const latency = (latencyRange.max / latencyTicks) * i;
      const y = this.margin.top + this.chartHeight - (i / latencyTicks) * this.chartHeight;
      
      this.ctx.fillText(
        `${Math.round(latency)}ms`,
        this.margin.left - 10,
        y + 4
      );
      
      // Grid lines
      if (i > 0) {
        this.ctx.strokeStyle = '#e5e7eb';
        this.ctx.beginPath();
        this.ctx.moveTo(this.margin.left, y);
        this.ctx.lineTo(this.margin.left + this.chartWidth, y);
        this.ctx.stroke();
        this.ctx.strokeStyle = '#374151';
      }
    }
    
    // X-axis labels (time)
    const timeTicks = 5;
    for (let i = 0; i <= timeTicks; i++) {
      const time = timeRange.min + ((timeRange.max - timeRange.min) / timeTicks) * i;
      const x = this.margin.left + (i / timeTicks) * this.chartWidth;
      
      const date = new Date(time);
      const timeStr = date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
      
      this.ctx.save();
      this.ctx.translate(x, this.margin.top + this.chartHeight + 15);
      this.ctx.rotate(-Math.PI / 4);
      this.ctx.fillText(timeStr, 0, 0);
      this.ctx.restore();
    }
    
    // Axis labels
    this.ctx.font = '14px sans-serif';
    this.ctx.fillText('Latency (ms)', 10, this.margin.top + this.chartHeight / 2);
    this.ctx.fillText('Time', this.margin.left + this.chartWidth / 2, this.margin.top + this.chartHeight + 50);
  }
  
  drawDataPoints(data, timeRange, latencyRange) {
    // Group data by provider
    const providerData = {};
    data.forEach(item => {
      if (!providerData[item.provider]) {
        providerData[item.provider] = [];
      }
      providerData[item.provider].push(item);
    });
    
    // Draw each provider's data
    Object.entries(providerData).forEach(([provider, items], providerIndex) => {
      if (!this.visibleProviders.has(provider)) return;
      
      const color = this.colors[this.providers.indexOf(provider) % this.colors.length];
      this.ctx.fillStyle = color;
      this.ctx.strokeStyle = color;
      
      // Sort items by timestamp for line drawing
      items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      // Draw line connecting points
      if (items.length > 1) {
        this.ctx.beginPath();
        items.forEach((item, index) => {
          const x = this.margin.left + 
            ((new Date(item.timestamp).getTime() - timeRange.min) / (timeRange.max - timeRange.min)) * this.chartWidth;
          const y = this.margin.top + this.chartHeight - 
            (item.latency / latencyRange.max) * this.chartHeight;
          
          if (index === 0) {
            this.ctx.moveTo(x, y);
          } else {
            this.ctx.lineTo(x, y);
          }
        });
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }
      
      // Draw points
      items.forEach(item => {
        const x = this.margin.left + 
          ((new Date(item.timestamp).getTime() - timeRange.min) / (timeRange.max - timeRange.min)) * this.chartWidth;
        const y = this.margin.top + this.chartHeight - 
          (item.latency / latencyRange.max) * this.chartHeight;
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
        this.ctx.fill();
      });
    });
  }
  
  drawLegend() {
    // Legend is handled by the checkboxes, so this is optional
    // Could add additional legend information here if needed
  }
  
  showError(message) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.font = '16px sans-serif';
    this.ctx.fillStyle = '#ef4444';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      message,
      this.canvas.width / 2,
      this.canvas.height / 2
    );
    this.ctx.textAlign = 'left';
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
    
    if (!isExpanded && !chartInitialized) {
      // Initialize chart when first expanded
      setTimeout(() => {
        const pathParts = window.location.pathname.split('/');
        const projectName = pathParts[2];
        const issueId = pathParts[4];
        const taskId = pathParts[6];
        
        const apiUrl = `/api/project/${encodeURIComponent(projectName)}/issue/${encodeURIComponent(issueId)}/task/${encodeURIComponent(taskId)}/trajectories/llm-latency`;
        
        new LlmLatencyChart('llm-latency-chart', apiUrl);
        chartInitialized = true;
      }, 100); // Small delay to ensure DOM is ready
    }
  });
});