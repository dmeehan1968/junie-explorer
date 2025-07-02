// Task Event Timeline Chart
class TaskEventChart {
  constructor(canvasId, events) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.events = events;
    this.eventTypes = [...new Set(events.map(e => e.event.type))].sort();
    this.eventPairs = this.calculateEventPairs();
    this.timeRange = this.calculateTimeRange();
    
    // Chart dimensions and styling
    this.margin = { top: 20, right: 20, bottom: 60, left: 200 };
    this.rowHeight = 20;
    this.minBarWidth = 8; // Minimum width for bars to be visible
    this.circleRadius = 4;
    
    this.setupCanvas();
    this.render();
  }
  
  calculateEventPairs() {
    const pairs = [];
    
    // Sort events by timestamp to ensure proper ordering
    const sortedEvents = [...this.events].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Calculate duration for each event based on difference from previous event
    sortedEvents.forEach((event, index) => {
      const type = event.event.type;
      let duration = 0;
      let startTime = event.timestamp;
      let endTime = event.timestamp;
      
      if (index > 0) {
        // Calculate duration as difference from previous event
        const previousEvent = sortedEvents[index - 1];
        duration = event.timestamp.getTime() - previousEvent.timestamp.getTime();
        startTime = previousEvent.timestamp;
        endTime = event.timestamp;
      }
      
      // Treat all events as pairs, even those with zero duration
      pairs.push({
        type: type,
        startTime: startTime,
        endTime: endTime,
        duration: duration
      });
    });
    
    return { pairs };
  }
  
  calculateTimeRange() {
    if (this.events.length === 0) {
      return { start: new Date(), end: new Date() };
    }
    
    const timestamps = this.events.map(e => e.timestamp.getTime());
    const start = new Date(Math.min(...timestamps));
    const end = new Date(Math.max(...timestamps));
    
    // Add some padding
    const padding = (end.getTime() - start.getTime()) * 0.05;
    return {
      start: new Date(start.getTime() - padding),
      end: new Date(end.getTime() + padding)
    };
  }
  
  setupCanvas() {
    const chartHeight = this.eventTypes.length * this.rowHeight + this.margin.top + this.margin.bottom;
    this.canvas.height = chartHeight;
    this.canvas.width = this.canvas.offsetWidth;
    
    // Set up high DPI rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = chartHeight * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = chartHeight + 'px';
    
    this.chartWidth = rect.width - this.margin.left - this.margin.right;
    this.chartHeight = this.eventTypes.length * this.rowHeight;
  }
  
  timeToX(timestamp) {
    const totalTime = this.timeRange.end.getTime() - this.timeRange.start.getTime();
    const elapsed = timestamp.getTime() - this.timeRange.start.getTime();
    return this.margin.left + (elapsed / totalTime) * this.chartWidth;
  }
  
  typeToY(eventType) {
    const index = this.eventTypes.indexOf(eventType);
    return this.margin.top + index * this.rowHeight + this.rowHeight / 2;
  }
  
  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid lines
    this.drawGrid();
    
    // Draw event type labels
    this.drawEventTypeLabels();
    
    // Draw time axis
    this.drawTimeAxis();
    
    // Draw all events (unified approach)
    this.drawEvents();
  }
  
  drawGrid() {
    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 1;
    
    // Horizontal grid lines
    this.eventTypes.forEach((type, index) => {
      const y = this.margin.top + index * this.rowHeight;
      this.ctx.beginPath();
      this.ctx.moveTo(this.margin.left, y);
      this.ctx.lineTo(this.margin.left + this.chartWidth, y);
      this.ctx.stroke();
    });
    
    // Vertical grid lines (time markers)
    const timeSpan = this.timeRange.end.getTime() - this.timeRange.start.getTime();
    const numTicks = 5;
    for (let i = 0; i <= numTicks; i++) {
      const time = this.timeRange.start.getTime() + (timeSpan * i / numTicks);
      const x = this.timeToX(new Date(time));
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.margin.top);
      this.ctx.lineTo(x, this.margin.top + this.chartHeight);
      this.ctx.stroke();
    }
  }
  
  drawEventTypeLabels() {
    this.ctx.fillStyle = '#333333';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';
    
    this.eventTypes.forEach((type, index) => {
      const y = this.typeToY(type);
      this.ctx.fillText(type, this.margin.left - 10, y);
    });
  }
  
  drawTimeAxis() {
    this.ctx.fillStyle = '#333333';
    this.ctx.font = '11px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    
    const timeSpan = this.timeRange.end.getTime() - this.timeRange.start.getTime();
    const numTicks = 8;
    
    for (let i = 0; i <= numTicks; i++) {
      const time = new Date(this.timeRange.start.getTime() + (timeSpan * i / numTicks));
      const x = this.timeToX(time);
      
      // Format time based on the span
      let timeLabel;
      if (timeSpan < 60000) { // Less than 1 minute
        timeLabel = time.toLocaleTimeString('en-US', { 
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit', 
          fractionalSecondDigits: 3
        });
      } else if (timeSpan < 3600000) { // Less than 1 hour
        timeLabel = time.toLocaleTimeString('en-US', { 
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit' 
        });
      } else {
        timeLabel = time.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      
      this.ctx.fillText(timeLabel, x, this.margin.top + this.chartHeight + 10);
    }
  }
  
  drawEvents() {
    // Set color and style for both circles and bars
    this.ctx.strokeStyle = '#67c100';
    this.ctx.fillStyle = '#2196F3';
    this.ctx.lineWidth = 1;
    
    this.eventPairs.pairs.forEach(pair => {
      const startX = this.timeToX(pair.startTime);
      const endX = this.timeToX(pair.endTime);
      const y = this.typeToY(pair.type);
      const barWidth = endX - startX;
      
      // Choose rendering style based on duration
      if (barWidth < this.minBarWidth) {
        // Small duration - render as circle only
        this.ctx.beginPath();
        this.ctx.arc(startX + barWidth / 2, y, this.circleRadius, 0, 2 * Math.PI);
        this.ctx.fill();
      } else {
        // Longer duration - render as unfilled rounded bar with circle at the end
        this.drawRoundedRect(startX, y - this.circleRadius, barWidth, this.circleRadius * 2, this.circleRadius);

        // Draw circle at the end of the bar
        this.ctx.beginPath();
        this.ctx.arc(endX - this.circleRadius, y, this.circleRadius - 1, 0, 2 * Math.PI);
        this.ctx.fill();
      }
    });
  }
  
  drawRoundedRect(x, y, width, height, radius) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
    this.ctx.stroke();
  }
}

// Initialize chart when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  const chartCanvas = document.getElementById('event-timeline-chart');
  if (chartCanvas && window.taskEvents) {
    new TaskEventChart('event-timeline-chart', window.taskEvents);
  }
});