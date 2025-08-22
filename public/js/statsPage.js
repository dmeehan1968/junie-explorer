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
            unit: 'minute'
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

function updateMemoryChart(currentData) {
  if (!memoryChart) {
    initializeMemoryChart();
  }
  
  // Add new data point using actual current values
  memoryChart.data.labels.push(new Date(currentData.timestamp));
  memoryChart.data.datasets[0].data.push(formatBytes(currentData.memory.used));
  memoryChart.data.datasets[1].data.push(formatBytes(currentData.memory.heapUsed));
  memoryChart.data.datasets[2].data.push(formatBytes(currentData.memory.external));
  
  // Keep only recent data points based on current period
  const maxPoints = getMaxPointsForPeriod(currentPeriod);
  if (memoryChart.data.labels.length > maxPoints) {
    memoryChart.data.labels.shift();
    memoryChart.data.datasets.forEach(dataset => dataset.data.shift());
  }
  
  memoryChart.update('none'); // No animation for real-time updates
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
            unit: 'minute'
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

function updateWorkerChart(currentData) {
  if (!workerChart) {
    initializeWorkerChart();
  }
  
  // Add new data point using actual current values
  workerChart.data.labels.push(new Date(currentData.timestamp));
  workerChart.data.datasets[0].data.push(currentData.workerPool.busyCount);
  workerChart.data.datasets[1].data.push(currentData.workerPool.idleCount);
  workerChart.data.datasets[2].data.push(currentData.workerPool.queuedCount);
  
  // Keep only recent data points based on current period
  const maxPoints = getMaxPointsForPeriod(currentPeriod);
  if (workerChart.data.labels.length > maxPoints) {
    workerChart.data.labels.shift();
    workerChart.data.datasets.forEach(dataset => dataset.data.shift());
  }
  
  workerChart.update('none'); // No animation for real-time updates
}

async function fetchStats() {
  const period = document.getElementById('timePeriod').value;
  
  // If period changed, reinitialize charts
  if (period !== currentPeriod) {
    currentPeriod = period;
    lastDataTime = 0; // Reset to force full chart recreation
    initializeMemoryChart();
    initializeWorkerChart();
  }
  
  try {
    // Update current stats display
    const currentData = await updateCurrentStats();
    
    if (currentData) {
      // For progressive updates, only add new data if we have existing charts
      // and this is not the first load
      if (lastDataTime > 0 && memoryChart && workerChart) {
        updateMemoryChart(currentData);
        updateWorkerChart(currentData);
      } else {
        // First load or period change - initialize with current data
        initializeMemoryChart();
        initializeWorkerChart();
        updateMemoryChart(currentData);
        updateWorkerChart(currentData);
      }
      
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
});