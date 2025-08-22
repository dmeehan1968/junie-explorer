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

function updateCurrentStats(stats) {
  // Get latest timestamp data for current stats
  const latest = stats.memory;
  const latestWorker = stats.workerPool;
  
  document.getElementById('memUsed').textContent = formatBytes(latest.used.avg);
  document.getElementById('heapUsed').textContent = formatBytes(latest.heapUsed.avg);
  document.getElementById('activeWorkers').textContent = Math.round(latestWorker.busyCount.avg);
  document.getElementById('queuedJobs').textContent = Math.round(latestWorker.queuedCount.avg);
  document.getElementById('successCount').textContent = Math.round(latestWorker.successCount.avg);
  document.getElementById('failureCount').textContent = Math.round(latestWorker.failureCount.avg);
  document.getElementById('avgExecution').textContent = formatNumber(latestWorker.averageExecutionTimeMs.avg);
  document.getElementById('peakWorkers').textContent = Math.round(latestWorker.peakWorkerCount.max);
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

function updateMemoryChart(stats) {
  if (!memoryChart) {
    initializeMemoryChart();
  }
  
  const now = Date.now();
  
  // Add new data point
  memoryChart.data.labels.push(new Date(now));
  memoryChart.data.datasets[0].data.push(formatBytes(stats.memory.used.avg));
  memoryChart.data.datasets[1].data.push(formatBytes(stats.memory.heapUsed.avg));
  memoryChart.data.datasets[2].data.push(formatBytes(stats.memory.external.avg));
  
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

function updateWorkerChart(stats) {
  if (!workerChart) {
    initializeWorkerChart();
  }
  
  const now = Date.now();
  
  // Add new data point
  workerChart.data.labels.push(new Date(now));
  workerChart.data.datasets[0].data.push(Math.round(stats.workerPool.busyCount.avg));
  workerChart.data.datasets[1].data.push(Math.round(stats.workerPool.idleCount.avg));
  workerChart.data.datasets[2].data.push(Math.round(stats.workerPool.queuedCount.avg));
  
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
    const response = await fetch(`/api/stats?period=${period}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const stats = await response.json();
    
    updateCurrentStats(stats);
    
    // For progressive updates, only add new data if we have existing charts
    // and this is not the first load
    if (lastDataTime > 0 && memoryChart && workerChart) {
      updateMemoryChart(stats);
      updateWorkerChart(stats);
    } else {
      // First load or period change - initialize with current data
      initializeMemoryChart();
      initializeWorkerChart();
      updateMemoryChart(stats);
      updateWorkerChart(stats);
    }
    
    lastDataTime = Date.now();
    
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