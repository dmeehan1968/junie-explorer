// Task Action Timeline Chart
class TaskActionChart {

  constructor(canvasId, events) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.events = events;
    this.actionPairs = this.calculateActionPairs();
    this.actionNames = [...new Set(this.actionPairs.pairs.map(p => (p.actionName + ' ' + (p.inputParamValue || '')).trim()))];
    this.timeRange = this.calculateTimeRange();
    
    // Chart dimensions and styling
    this.margin = { top: 20, right: 30, bottom: 60, left: 500 };
    this.rowHeight = 20;
    this.minBarWidth = 8; // Minimum width for bars to be visible
    this.circleRadius = 3;
    this.barHeight = 8;
    this.numTicks = 8;
    this.maxLabelLength = 80;
    
    this.setupCanvas();
    this.render();
  }
  
  calculateActionPairs() {
    const pairs = [];
    const startedEvents = new Map(); // Map actionName to started event
    
    // Sort events by timestamp to ensure proper ordering
    const sortedEvents = [...this.events].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    sortedEvents.forEach(event => {
      const eventType = event.eventType;
      
      if (eventType === 'AgentActionExecutionStarted') {
        const actionName = event.actionName;
        const inputParamValue = event.inputParamValue;
        if (actionName) {
          startedEvents.set(actionName, { ...event, inputParamValue });
        }
      } else if (eventType === 'AgentActionExecutionFinished') {
        // For finished events, we need to find the corresponding started event
        // Since AgentActionExecutionFinished might not have actionName, 
        // we'll match with the most recent unmatched started event
        let matchedActionName = null;
        let matchedStartEvent = null;
        
        // Find the most recent started event that hasn't been matched yet
        for (const [actionName, startEvent] of startedEvents.entries()) {
          if (startEvent.timestamp.getTime() <= event.timestamp.getTime()) {
            if (!matchedStartEvent || startEvent.timestamp.getTime() > matchedStartEvent.timestamp.getTime()) {
              matchedActionName = actionName;
              matchedStartEvent = startEvent;
            }
          }
        }
        
        if (matchedStartEvent && matchedActionName) {
          const duration = event.timestamp.getTime() - matchedStartEvent.timestamp.getTime();
          pairs.push({
            actionName: matchedActionName,
            inputParamValue: matchedStartEvent.inputParamValue,
            startTime: matchedStartEvent.timestamp,
            endTime: event.timestamp,
            duration: duration
          });
          
          // Remove the matched started event so it won't be matched again
          startedEvents.delete(matchedActionName);
        }
      }
    });
    
    // Handle any unmatched started events (show as zero-duration events)
    for (const [actionName, startEvent] of startedEvents.entries()) {
      pairs.push({
        actionName: actionName,
        inputParamValue: startEvent.inputParamValue,
        startTime: startEvent.timestamp,
        endTime: startEvent.timestamp,
        duration: 0
      });
    }
    
    return { pairs };
  }
  
  calculateTimeRange() {
    if (this.actionPairs.pairs.length === 0) {
      return { start: new Date(), end: new Date() };
    }
    
    const allTimes = [];
    this.actionPairs.pairs.forEach(pair => {
      allTimes.push(pair.startTime.getTime());
      allTimes.push(pair.endTime.getTime());
    });
    
    const start = new Date(Math.min(...allTimes));
    const end = new Date(Math.max(...allTimes));
    
    // Add some padding
    const padding = (end.getTime() - start.getTime()) * 0.05;
    return {
      start: new Date(start.getTime() - padding),
      end: new Date(end.getTime() + padding)
    };
  }
  
  setupCanvas() {
    const chartHeight = this.actionNames.length * this.rowHeight + this.margin.top + this.margin.bottom;
    this.canvas.height = chartHeight;
    
    // Get the container width - prioritize parent container width over canvas width
    let containerWidth = 0;
    
    // Try to get width from parent containers in order of preference
    const actionTimelineContainer = this.canvas.closest('.action-timeline-container');
    const collapsibleContent = this.canvas.closest('.collapsible-content');
    const collapsibleSection = this.canvas.closest('.collapsible-section');
    
    if (actionTimelineContainer && actionTimelineContainer.offsetWidth > 0) {
      containerWidth = actionTimelineContainer.offsetWidth;
    } else if (collapsibleContent && collapsibleContent.offsetWidth > 0) {
      containerWidth = collapsibleContent.offsetWidth - 40; // Account for padding (20px on each side)
    } else if (collapsibleSection && collapsibleSection.offsetWidth > 0) {
      containerWidth = collapsibleSection.offsetWidth - 40; // Account for padding
    } else if (this.canvas.offsetWidth > 0) {
      containerWidth = this.canvas.offsetWidth;
    } else {
      // Final fallback - use a reasonable default
      containerWidth = 800;
    }
    
    this.canvas.width = containerWidth;
    
    // Set up high DPI rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const actualWidth = rect.width || containerWidth;
    this.canvas.width = actualWidth * dpr;
    this.canvas.height = chartHeight * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = actualWidth + 'px';
    this.canvas.style.height = chartHeight + 'px';
    
    this.chartWidth = actualWidth - this.margin.left - this.margin.right;
    this.chartHeight = this.actionNames.length * this.rowHeight;
  }
  
  // Method to resize and redraw the chart
  resize() {
    this.setupCanvas();
    this.render();
  }
  
  timeToX(timestamp) {
    const totalTime = this.timeRange.end.getTime() - this.timeRange.start.getTime();
    const elapsed = timestamp.getTime() - this.timeRange.start.getTime();
    return this.margin.left + (elapsed / totalTime) * this.chartWidth;
  }
  
  actionNameToY(actionName) {
    const index = this.actionNames.indexOf(actionName);
    return this.margin.top + index * this.rowHeight + this.rowHeight / 2;
  }
  
  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid lines
    this.drawGrid();
    
    // Draw action name labels
    this.drawActionNameLabels();
    
    // Draw time axis
    this.drawTimeAxis();
    
    // Draw all action events
    this.drawActions();
  }
  
  drawGrid() {
    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 1;
    
    // Horizontal grid lines
    this.actionNames.forEach((actionName, index) => {
      const y = this.margin.top + index * this.rowHeight;
      this.ctx.beginPath();
      this.ctx.moveTo(this.margin.left, y);
      this.ctx.lineTo(this.margin.left + this.chartWidth, y);
      this.ctx.stroke();
    });
    
    // Vertical grid lines (time markers)
    const timeSpan = this.timeRange.end.getTime() - this.timeRange.start.getTime();
    for (let i = 0; i <= this.numTicks; i++) {
      const time = this.timeRange.start.getTime() + (timeSpan * i / this.numTicks);
      const x = this.timeToX(new Date(time));
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.margin.top);
      this.ctx.lineTo(x, this.margin.top + this.chartHeight);
      this.ctx.stroke();
    }
  }
  
  drawActionNameLabels() {
    this.ctx.fillStyle = '#333333';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';
    
    this.actionNames.forEach((actionName, index) => {
      const y = this.actionNameToY(actionName);
      const name = actionName.length <= this.maxLabelLength ? actionName : actionName.substring(0, (this.maxLabelLength/2)-2) + '...' + actionName.substring(actionName.length - (this.maxLabelLength/2)-2);
      this.ctx.fillText(name, this.margin.left - 10, y);
    });
  }
  
  drawTimeAxis() {
    this.ctx.fillStyle = '#333333';
    this.ctx.font = '11px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    
    const timeSpan = this.timeRange.end.getTime() - this.timeRange.start.getTime();

    for (let i = 0; i <= this.numTicks; i++) {
      const time = new Date(this.timeRange.start.getTime() + (timeSpan * i / this.numTicks));
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
  
  drawActions() {
    // Set color and style for both circles and bars
    this.ctx.strokeStyle = '#67c100';
    this.ctx.fillStyle = '#2196F3';
    this.ctx.lineWidth = 1;
    
    this.actionPairs.pairs.forEach(pair => {
      const startX = this.timeToX(pair.startTime);
      const endX = this.timeToX(pair.endTime);
      const labelName = (pair.actionName + ' ' + (pair.inputParamValue || '')).trim();
      const y = this.actionNameToY(labelName);
      const barWidth = endX - startX;

      // Choose rendering style based on duration
      if (barWidth < this.minBarWidth) {
        // Small duration - render as circle only
        this.ctx.beginPath();
        this.ctx.arc(startX + barWidth / 2, y, this.circleRadius, 0, 2 * Math.PI);
        this.ctx.fill();
      } else {
        // Longer duration - render as unfilled rounded bar with circle at the end
        this.drawRoundedRect(startX, y - this.barHeight / 2, barWidth, this.barHeight, this.circleRadius * 1.5);

        // Draw circle at the end of the bar
        this.ctx.beginPath();
        this.ctx.arc(endX - this.circleRadius - 1, y, this.circleRadius, 0, 2 * Math.PI);
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
    this.ctx.stroke();
  }
}

// Initialize chart when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  const chartCanvas = document.getElementById('action-timeline-chart');
  if (chartCanvas && window.taskActionEvents) {
    window.taskActionChart = new TaskActionChart('action-timeline-chart', window.taskActionEvents);
  }
});