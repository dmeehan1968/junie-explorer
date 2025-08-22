let memoryChart = null;
let workerChart = null;
let fileIOCombinedChart = null;
let lastDataTime = 0;
let currentPeriod = '1h';
let lastReceivedTimestamp = 0;
let isFetching = false;

function formatBytes(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

function formatBytesWithUnit(bytes) {
  if (bytes < 1024) {
    return `${bytes.toFixed(2)} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  } else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}

function formatNumber(num) {
  return parseFloat(num).toFixed(2);
}

function formatTimeMs(ms) {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(3);
  return `${minutes.toString().padStart(2, '0')}:${seconds.padStart(6, '0')}`;
}

function updateCurrentStats(latestDataPoint) {
  if (!latestDataPoint) {
    console.warn('No data point provided for current stats update');
    return;
  }
  
  try {
    const memory = latestDataPoint.memory;
    const worker = latestDataPoint.workerPool;
    
    // Update memory metrics
    document.getElementById('memUsed').textContent = formatBytesWithUnit(memory.used);
    document.getElementById('memTotal').textContent = formatBytesWithUnit(memory.total);
    document.getElementById('heapUsed').textContent = formatBytesWithUnit(memory.heapUsed);
    document.getElementById('heapTotal').textContent = formatBytesWithUnit(memory.heapTotal);
    document.getElementById('external').textContent = formatBytesWithUnit(memory.external);
    
    // Fix heap usage calculation - ensure we're comparing the right values
    const heapUsagePercent = memory.heapTotal > 0 ? Math.min((memory.heapUsed / memory.heapTotal) * 100, 100) : 0;
    document.getElementById('heapUsagePercent').textContent = formatNumber(heapUsagePercent) + '%';
    
    // Update worker metrics
    document.getElementById('totalWorkers').textContent = worker.workerCount;
    document.getElementById('busyWorkers').textContent = worker.busyCount;
    document.getElementById('idleWorkers').textContent = worker.idleCount;
    document.getElementById('queuedJobs').textContent = worker.queuedCount;
    document.getElementById('successCount').textContent = worker.successCount;
    document.getElementById('failureCount').textContent = worker.failureCount;
    document.getElementById('avgExecution').textContent = formatNumber(worker.averageExecutionTimeMs);
    document.getElementById('peakWorkers').textContent = worker.peakWorkerCount;
    document.getElementById('totalExecTime').textContent = formatTimeMs(worker.totalExecutionTimeMs);
    document.getElementById('avgQueueWait').textContent = formatNumber(worker.averageQueueWaitTimeMs);
    
    // Update file I/O metrics
    const fileIO = latestDataPoint.fileIO;
    document.getElementById('totalIOOpsPerSec').textContent = formatNumber(fileIO.total.operationsPerSecond);
    document.getElementById('readOpsPerSec').textContent = formatNumber(fileIO.read.operationsPerSecond);
    document.getElementById('writeOpsPerSec').textContent = formatNumber(fileIO.write.operationsPerSecond);
    document.getElementById('totalIOBytes').textContent = formatBytesWithUnit(fileIO.total.bytesTotal);
    document.getElementById('readThroughput').textContent = formatNumber(fileIO.read.throughputMBps);
    document.getElementById('writeThroughput').textContent = formatNumber(fileIO.write.throughputMBps);
    document.getElementById('totalIOErrors').textContent = fileIO.total.errorCount;
    
    // Calculate weighted average duration across all operation types
    const totalOps = fileIO.read.operationCount + fileIO.write.operationCount + fileIO.directory.operationCount + fileIO.check.operationCount;
    const weightedAvgDuration = totalOps > 0 ? 
      (fileIO.read.averageDurationMs * fileIO.read.operationCount + 
       fileIO.write.averageDurationMs * fileIO.write.operationCount +
       fileIO.directory.averageDurationMs * fileIO.directory.operationCount +
       fileIO.check.averageDurationMs * fileIO.check.operationCount) / totalOps : 0;
    document.getElementById('avgIODuration').textContent = formatNumber(weightedAvgDuration);
    
  } catch (error) {
    console.error('Error updating current stats:', error);
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
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 6
        },
        {
          label: 'Heap Used (MB)',
          data: [],
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 6
        },
        {
          label: 'External (MB)',
          data: [],
          borderColor: 'rgb(255, 205, 86)',
          backgroundColor: 'rgba(255, 205, 86, 0.2)',
          tension: 0.1,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 6
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
            unit: 'minute', // Default, will be updated based on actual data
            displayFormats: {
              second: 'HH:mm:ss',
              minute: 'HH:mm',
              hour: 'HH:mm',
              day: 'MMM dd'
            }
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
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 6
        },
        {
          label: 'Idle Workers',
          data: [],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 6
        },
        {
          label: 'Queued Jobs',
          data: [],
          borderColor: 'rgb(255, 205, 86)',
          backgroundColor: 'rgba(255, 205, 86, 0.2)',
          tension: 0.1,
          fill: false,
          yAxisID: 'y1',
          pointRadius: 0,
          pointHoverRadius: 6
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
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Worker Count'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Queued Jobs'
          },
          grid: {
            drawOnChartArea: false
          }
        },
        x: {
          type: 'time',
          time: {
            unit: 'minute', // Default, will be updated based on actual data
            displayFormats: {
              second: 'HH:mm:ss',
              minute: 'HH:mm',
              hour: 'HH:mm',
              day: 'MMM dd'
            }
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

function initializeFileIOCombinedChart() {
  const ctx = document.getElementById('fileIOCombinedChart').getContext('2d');
  
  if (fileIOCombinedChart) {
    fileIOCombinedChart.destroy();
  }
  
  fileIOCombinedChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Read Ops/sec',
          data: [],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 6,
          yAxisID: 'y'
        },
        {
          label: 'Write Ops/sec',
          data: [],
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 6,
          yAxisID: 'y'
        },
        {
          label: 'Directory Ops/sec',
          data: [],
          borderColor: 'rgb(255, 205, 86)',
          backgroundColor: 'rgba(255, 205, 86, 0.2)',
          tension: 0.1,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 6,
          yAxisID: 'y'
        },
        {
          label: 'Check Ops/sec',
          data: [],
          borderColor: 'rgb(153, 102, 255)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          tension: 0.1,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 6,
          yAxisID: 'y'
        },
        {
          label: 'Read Throughput (MB/s)',
          data: [],
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.1,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 6,
          yAxisID: 'y1'
        },
        {
          label: 'Write Throughput (MB/s)',
          data: [],
          borderColor: 'rgb(255, 159, 64)',
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          tension: 0.1,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 6,
          yAxisID: 'y1'
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
          type: 'linear',
          display: true,
          position: 'left',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Operations per Second'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Throughput (MB/s)'
          },
          grid: {
            drawOnChartArea: false
          }
        },
        x: {
          type: 'time',
          time: {
            unit: 'minute',
            displayFormats: {
              second: 'HH:mm:ss',
              minute: 'HH:mm',
              hour: 'HH:mm',
              day: 'MMM dd'
            }
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
          text: 'File I/O Throughput & Operations'
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
    
    return await response.json();
  } catch (error) {
    console.error('Error loading historical data:', error);
    return [];
  }
}

async function loadIncrementalData(period, fromTimestamp) {
  try {
    const response = await fetch(`/api/stats/data?period=${period}&from=${fromTimestamp}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error loading incremental data:', error);
    return [];
  }
}

async function initializeChartsWithFullData(period) {
  try {
    // Load all historical data for the period
    const historicalData = await loadHistoricalData(period);
    
    if (historicalData.length === 0) {
      return;
    }
    
    // Calculate actual data span
    const timestamps = historicalData.map(d => d.timestamp);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const dataSpanMs = maxTime - minTime;
    
    // Determine optimal time unit based on actual data span
    const optimalTimeUnit = getOptimalTimeUnit(dataSpanMs);
    
    // Clear existing chart data
    if (memoryChart) {
      memoryChart.data.labels = [];
      memoryChart.data.datasets.forEach(dataset => dataset.data = []);
      memoryChart.options.scales.x.time.unit = optimalTimeUnit;
    }
    if (workerChart) {
      workerChart.data.labels = [];
      workerChart.data.datasets.forEach(dataset => dataset.data = []);
      workerChart.options.scales.x.time.unit = optimalTimeUnit;
    }
    if (fileIOCombinedChart) {
      fileIOCombinedChart.data.labels = [];
      fileIOCombinedChart.data.datasets.forEach(dataset => dataset.data = []);
      fileIOCombinedChart.options.scales.x.time.unit = optimalTimeUnit;
    }
    
    // Populate with historical data
    historicalData.forEach(dataPoint => {
      addDataPointToCharts(dataPoint);
    });
    
    // Update charts
    if (memoryChart) memoryChart.update('none');
    if (workerChart) workerChart.update('none');
    if (fileIOCombinedChart) fileIOCombinedChart.update('none');
    
    // Update tracking variables
    if (historicalData.length > 0) {
      lastReceivedTimestamp = Math.max(...timestamps);
      
      // Find and use the most recent data point for current stats
      const latestDataPoint = historicalData.find(d => d.timestamp === lastReceivedTimestamp);
      if (latestDataPoint) {
        updateCurrentStats(latestDataPoint);
      }
    }
    
    console.log(`Initialized charts with ${historicalData.length} data points, latest: ${new Date(lastReceivedTimestamp)}`);
    
  } catch (error) {
    console.error('Error initializing charts:', error);
  }
}

function addDataPointToCharts(dataPoint) {
  const timestamp = new Date(dataPoint.timestamp);
  
  if (memoryChart) {
    memoryChart.data.labels.push(timestamp);
    memoryChart.data.datasets[0].data.push(formatBytes(dataPoint.memory.used));
    memoryChart.data.datasets[1].data.push(formatBytes(dataPoint.memory.heapUsed));
    memoryChart.data.datasets[2].data.push(formatBytes(dataPoint.memory.external));
  }
  
  if (workerChart) {
    workerChart.data.labels.push(timestamp);
    workerChart.data.datasets[0].data.push(dataPoint.workerPool.busyCount);
    workerChart.data.datasets[1].data.push(dataPoint.workerPool.idleCount);
    workerChart.data.datasets[2].data.push(dataPoint.workerPool.queuedCount);
  }
  
  if (fileIOCombinedChart) {
    fileIOCombinedChart.data.labels.push(timestamp);
    fileIOCombinedChart.data.datasets[0].data.push(dataPoint.fileIO.read.operationsPerSecond);
    fileIOCombinedChart.data.datasets[1].data.push(dataPoint.fileIO.write.operationsPerSecond);
    fileIOCombinedChart.data.datasets[2].data.push(dataPoint.fileIO.directory.operationsPerSecond);
    fileIOCombinedChart.data.datasets[3].data.push(dataPoint.fileIO.check.operationsPerSecond);
    fileIOCombinedChart.data.datasets[4].data.push(dataPoint.fileIO.read.throughputMBps);
    fileIOCombinedChart.data.datasets[5].data.push(dataPoint.fileIO.write.throughputMBps);
  }
}

function removeOldDataPoints(period) {
  const now = Date.now();
  const periodMs = getPeriodMs(period);
  const cutoffTime = now - periodMs;
  
  // Remove old data points from memory chart
  if (memoryChart) {
    while (memoryChart.data.labels.length > 0 && 
           memoryChart.data.labels[0].getTime() < cutoffTime) {
      memoryChart.data.labels.shift();
      memoryChart.data.datasets.forEach(dataset => dataset.data.shift());
    }
  }
  
  // Remove old data points from worker chart
  if (workerChart) {
    while (workerChart.data.labels.length > 0 && 
           workerChart.data.labels[0].getTime() < cutoffTime) {
      workerChart.data.labels.shift();
      workerChart.data.datasets.forEach(dataset => dataset.data.shift());
    }
  }
  
  // Remove old data points from file I/O combined chart
  if (fileIOCombinedChart) {
    while (fileIOCombinedChart.data.labels.length > 0 && 
           fileIOCombinedChart.data.labels[0].getTime() < cutoffTime) {
      fileIOCombinedChart.data.labels.shift();
      fileIOCombinedChart.data.datasets.forEach(dataset => dataset.data.shift());
    }
  }
}

async function updateChartsWithIncrementalData() {
  if (isFetching) {
    return; // Prevent parallel requests
  }
  
  isFetching = true;
  
  try {
    const period = document.getElementById('timePeriod').value;
    
    // Get incremental data from last received timestamp
    const newData = await loadIncrementalData(period, lastReceivedTimestamp);
    
    if (newData.length > 0) {
      // Add new data points
      newData.forEach(dataPoint => {
        addDataPointToCharts(dataPoint);
      });
      
      // Update last received timestamp
      const newTimestamps = newData.map(d => d.timestamp);
      const newLatestTimestamp = Math.max(lastReceivedTimestamp, ...newTimestamps);
      
      // If we have a new latest timestamp, update current stats
      if (newLatestTimestamp > lastReceivedTimestamp) {
        const latestDataPoint = newData.find(d => d.timestamp === newLatestTimestamp);
        if (latestDataPoint) {
          updateCurrentStats(latestDataPoint);
        }
      }
      
      lastReceivedTimestamp = newLatestTimestamp;
      
      // Remove old data points outside the period
      removeOldDataPoints(period);
      
      // Update charts
      if (memoryChart) memoryChart.update('none');
      if (workerChart) workerChart.update('none');
      if (fileIOCombinedChart) fileIOCombinedChart.update('none');
      
      // console.log(`Added ${newData.length} new data points, latest: ${new Date(lastReceivedTimestamp)}`);
    }
    
  } catch (error) {
    console.error('Error updating charts incrementally:', error);
  } finally {
    isFetching = false;
  }
}

async function fetchStats() {
  const period = document.getElementById('timePeriod').value;
  
  // If period changed, reinitialize with full data
  if (period !== currentPeriod) {
    currentPeriod = period;
    lastReceivedTimestamp = 0; // Reset to force full reload
    
    if (!memoryChart || !workerChart || !fileIOCombinedChart) {
      initializeMemoryChart();
      initializeWorkerChart();
      initializeFileIOCombinedChart();
    }
    
    await initializeChartsWithFullData(period);
    lastDataTime = Date.now();
  } else {
    // Incremental update for same period
    if (lastDataTime === 0) {
      // First load
      if (!memoryChart || !workerChart || !fileIOCombinedChart) {
        initializeMemoryChart();
        initializeWorkerChart();
        initializeFileIOCombinedChart();
      }
      await initializeChartsWithFullData(period);
      lastDataTime = Date.now();
    } else {
      // Regular incremental update
      await updateChartsWithIncrementalData();
    }
  }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  // Load initial stats
  fetchStats().catch(console.error);
  
  // Set up event listeners
  document.getElementById('refreshStats').addEventListener('click', () => {
    fetchStats().catch(console.error);
  });
  document.getElementById('timePeriod').addEventListener('change', () => {
    fetchStats().catch(console.error);
  });
  
  // Auto-refresh every 1 second
  setInterval(() => {
    fetchStats().catch(console.error);
  }, 1000);
  
  // Refresh when page becomes visible again (handles tab switching)
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      console.log('Tab became visible, refreshing stats...');
      fetchStats().catch(console.error);
    }
  });
});