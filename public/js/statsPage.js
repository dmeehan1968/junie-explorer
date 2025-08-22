let memoryChart = null;
let workerChart = null;

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

function createMemoryChart(stats) {
  const ctx = document.getElementById('memoryChart').getContext('2d');
  
  if (memoryChart) {
    memoryChart.destroy();
  }
  
  memoryChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [new Date(stats.period.startTime), new Date(stats.period.endTime)],
      datasets: [
        {
          label: 'Memory Used (MB)',
          data: [formatBytes(stats.memory.used.min), formatBytes(stats.memory.used.max)],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        },
        {
          label: 'Heap Used (MB)',
          data: [formatBytes(stats.memory.heapUsed.min), formatBytes(stats.memory.heapUsed.max)],
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1
        },
        {
          label: 'External (MB)',
          data: [formatBytes(stats.memory.external.min), formatBytes(stats.memory.external.max)],
          borderColor: 'rgb(255, 205, 86)',
          backgroundColor: 'rgba(255, 205, 86, 0.2)',
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
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

function createWorkerChart(stats) {
  const ctx = document.getElementById('workerChart').getContext('2d');
  
  if (workerChart) {
    workerChart.destroy();
  }
  
  workerChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [new Date(stats.period.startTime), new Date(stats.period.endTime)],
      datasets: [
        {
          label: 'Busy Workers',
          data: [stats.workerPool.busyCount.min, stats.workerPool.busyCount.max],
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1
        },
        {
          label: 'Idle Workers',
          data: [stats.workerPool.idleCount.min, stats.workerPool.idleCount.max],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        },
        {
          label: 'Queued Jobs',
          data: [stats.workerPool.queuedCount.min, stats.workerPool.queuedCount.max],
          borderColor: 'rgb(255, 205, 86)',
          backgroundColor: 'rgba(255, 205, 86, 0.2)',
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
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

async function fetchStats() {
  const period = document.getElementById('timePeriod').value;
  
  try {
    const response = await fetch(`/api/stats?period=${period}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const stats = await response.json();
    
    updateCurrentStats(stats);
    createMemoryChart(stats);
    createWorkerChart(stats);
    
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