let memoryChart = null;
let workerChart = null;
let lastDataTime = 0;
let currentPeriod = '1h';

function formatBytes(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

function formatNumber(num) {
  return parseFloat(num).toFixed(2);
}

async function updateCurrentStats() {
  try {
    const response = await fetch('/api/stats/current');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const current = await response.json();
    const memory = current.memory;
    const worker = current.workerPool;
    
    // Update memory metrics
    document.getElementById('memUsed').textContent = formatBytes(memory.used);
    document.getElementById('memTotal').textContent = formatBytes(memory.total);
    document.getElementById('heapUsed').textContent = formatBytes(memory.heapUsed);
    document.getElementById('heapTotal').textContent = formatBytes(memory.heapTotal);
    document.getElementById('external').textContent = formatBytes(memory.external);
    document.getElementById('heapUsagePercent').textContent = formatNumber(memory.heapUsagePercent) + '%';
    
    // Update worker metrics
    document.getElementById('totalWorkers').textContent = worker.workerCount;
    document.getElementById('busyWorkers').textContent = worker.busyCount;
    document.getElementById('idleWorkers').textContent = worker.idleCount;
    document.getElementById('queuedJobs').textContent = worker.queuedCount;
    document.getElementById('successCount').textContent = worker.successCount;
    document.getElementById('failureCount').textContent = worker.failureCount;
    document.getElementById('avgExecution').textContent = formatNumber(worker.averageExecutionTimeMs);
    document.getElementById('peakWorkers').textContent = worker.peakWorkerCount;
    document.getElementById('totalExecTime').textContent = formatNumber(worker.totalExecutionTimeMs);
    document.getElementById('avgQueueWait').textContent = formatNumber(worker.averageQueueWaitTimeMs);
    
    return current;
  } catch (error) {
    console.error('Error updating current stats:', error);
    return null;
  }
}

function getOptimalTimeUnit(dataSpanMs) {
  if (dataSpanMs < 2 * 60 * 1000) {        // Less than 2 minutes
    return 'second';
  } else if (dataSpanMs < 2 * 60 * 60 * 1000) {  // Less than 2 hours
    return 'minute';
  } else if (dataSpanMs < 2 * 24 * 60 * 60 * 1000) { // Less than 2 days
    return 'hour';
  } else {
    return 'day';
  }
}

function initializeMemoryChart() {
  const ctx = document.getElementById('memoryChart').getContext('2d');
  
  if (memoryChart) {
    memoryChart.destroy();
  }
  
  memoryChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Memory Used (MB)',
          data: [],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          fill: false
        },
        {
          label: 'Heap Used (MB)',
          data: [],
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1,
          fill: false
        },
        {
          label: 'External (MB)',
          data: [],
          borderColor: 'rgb(255, 205, 86)',
          backgroundColor: 'rgba(255, 205, 86, 0.2)',
          tension: 0.1,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Memory (MB)'
          }
        },
        x: {
          type: 'time',
          time: {
            unit: 'minute' // Default, will be updated based on actual data
          },
          title: {
            display: true,
            text: 'Time'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Memory Usage Over Time'
        },
        legend: {
          display: true
        }
      }
    }
  });
}

// Removed updateMemoryChart - now using refreshChartsWithLatestData

function getPeriodMs(period) {
  switch (period) {
    case '1m': return 60 * 1000;          // 1 minute
    case '5m': return 5 * 60 * 1000;      // 5 minutes
    case '15m': return 15 * 60 * 1000;    // 15 minutes
    case '1h': return 60 * 60 * 1000;     // 1 hour
    case '6h': return 6 * 60 * 60 * 1000; // 6 hours
    case '12h': return 12 * 60 * 60 * 1000; // 12 hours
    default: return 60 * 60 * 1000;       // Default to 1 hour
  }
}

function getMaxPointsForPeriod(period) {
  switch (period) {
    case '1m': return 60;    // 1 second interval = 60 points
    case '5m': return 60;    // 5 second interval = 60 points
    case '15m': return 60;   // 15 second interval = 60 points
    case '1h': return 60;    // 1 minute interval = 60 points
    case '6h': return 72;    // 5 minute interval = 72 points
    case '12h': return 72;   // 10 minute interval = 72 points
    default: return 60;
  }
}

function initializeWorkerChart() {
  const ctx = document.getElementById('workerChart').getContext('2d');
  
  if (workerChart) {
    workerChart.destroy();
  }
  
  workerChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Busy Workers',
          data: [],
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1,
          fill: false
        },
        {
          label: 'Idle Workers',
          data: [],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          fill: false
        },
        {
          label: 'Queued Jobs',
          data: [],
          borderColor: 'rgb(255, 205, 86)',
          backgroundColor: 'rgba(255, 205, 86, 0.2)',
          tension: 0.1,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Count'
          }
        },
        x: {
          type: 'time',
          time: {
            unit: 'minute' // Default, will be updated based on actual data
          },
          title: {
            display: true,
            text: 'Time'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Worker Pool Activity'
        },
        legend: {
          display: true
        }
      }
    }
  });
}

// Removed updateWorkerChart - now using refreshChartsWithLatestData

async function loadHistoricalData(period) {
  try {
    const response = await fetch(`/api/stats/data?period=${period}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const dataPoints = await response.json();
    return dataPoints;
  } catch (error) {
    console.error('Error loading historical data:', error);
    return [];
  }
}

// Removed initializeChartsWithData - now using refreshChartsWithLatestData

async function refreshChartsWithLatestData() {
  try {
    const period = document.getElementById('timePeriod').value;
    
    // Get the latest data points for the current period
    const latestData = await loadHistoricalData(period);
    
    if (latestData.length === 0) {
      return;
    }
    
    // Calculate actual data span
    const timestamps = latestData.map(d => d.timestamp);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const dataSpanMs = maxTime - minTime;
    
    // Determine optimal time unit based on actual data span
    const optimalTimeUnit = getOptimalTimeUnit(dataSpanMs);
    
    // Clear existing chart data
    if (memoryChart) {
      memoryChart.data.labels = [];
      memoryChart.data.datasets.forEach(dataset => dataset.data = []);
      
      // Update time unit based on actual data span
      memoryChart.options.scales.x.time.unit = optimalTimeUnit;
    }
    if (workerChart) {
      workerChart.data.labels = [];
      workerChart.data.datasets.forEach(dataset => dataset.data = []);
      
      // Update time unit based on actual data span
      workerChart.options.scales.x.time.unit = optimalTimeUnit;
    }
    
    // Populate with latest data
    latestData.forEach(dataPoint => {
      if (memoryChart) {
        memoryChart.data.labels.push(new Date(dataPoint.timestamp));
        memoryChart.data.datasets[0].data.push(formatBytes(dataPoint.memory.used));
        memoryChart.data.datasets[1].data.push(formatBytes(dataPoint.memory.heapUsed));
        memoryChart.data.datasets[2].data.push(formatBytes(dataPoint.memory.external));
      }
      
      if (workerChart) {
        workerChart.data.labels.push(new Date(dataPoint.timestamp));
        workerChart.data.datasets[0].data.push(dataPoint.workerPool.busyCount);
        workerChart.data.datasets[1].data.push(dataPoint.workerPool.idleCount);
        workerChart.data.datasets[2].data.push(dataPoint.workerPool.queuedCount);
      }
    });
    
    // Update charts with new scale configuration
    if (memoryChart) memoryChart.update('none');
    if (workerChart) workerChart.update('none');
    
    // Log the time span for debugging
    console.log(`Data span: ${formatNumber(dataSpanMs / 1000 / 60)} minutes, using ${optimalTimeUnit} time unit`);
    
  } catch (error) {
    console.error('Error refreshing charts:', error);
  }
}

async function fetchStats() {
  const period = document.getElementById('timePeriod').value;
  
  // If period changed, reload charts with historical data
  if (period !== currentPeriod) {
    currentPeriod = period;
    if (!memoryChart || !workerChart) {
      initializeMemoryChart();
      initializeWorkerChart();
    }
    await refreshChartsWithLatestData();
    lastDataTime = Date.now(); // Mark as initialized
  }
  
  try {
    // Update current stats display
    await updateCurrentStats();
    
    // Refresh charts with latest data to fill any gaps
    if (lastDataTime > 0 && memoryChart && workerChart) {
      await refreshChartsWithLatestData();
    } else {
      // First load - initialize charts and load data
      if (!memoryChart || !workerChart) {
        initializeMemoryChart();
        initializeWorkerChart();
      }
      await refreshChartsWithLatestData();
      lastDataTime = Date.now();
    }
    
  } catch (error) {
    console.error('Error fetching stats:', error);
    
    // Show error in the UI
    const currentStats = document.getElementById('currentStats');
    currentStats.innerHTML = `
      <div class="alert alert-error">
        <span>Error loading statistics: ${error.message}</span>
      </div>
    `;
  }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  // Load initial stats
  fetchStats();
  
  // Set up event listeners
  document.getElementById('refreshStats').addEventListener('click', fetchStats);
  document.getElementById('timePeriod').addEventListener('change', fetchStats);
  
  // Auto-refresh every 1 second
  setInterval(fetchStats, 1000);
  
  // Refresh when page becomes visible again (handles tab switching)
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      console.log('Tab became visible, refreshing stats...');
      fetchStats();
    }
  });
});