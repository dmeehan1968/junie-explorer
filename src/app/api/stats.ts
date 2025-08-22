import { Router } from 'express'
import { AppRequest, AppResponse } from '../types.js'
import { TimePeriod } from '../../stats/StatsTypes.js'

const router = Router()

router.get('/api/stats/current', (req: AppRequest, res: AppResponse) => {
  try {
    if (!req.jetBrains) {
      return res.status(500).json({ error: 'JetBrains instance not available' })
    }
    
    // Get current memory usage
    const memUsage = process.memoryUsage()
    
    // Get current worker pool metrics (aggregated from all pools)
    const statsCollector = req.jetBrains.statsCollector
    const workerStats = statsCollector.aggregateWorkerPoolStats()
    
    const currentStats = {
      timestamp: Date.now(),
      memory: {
        used: memUsage.rss,
        free: 0, // Node.js doesn't provide free memory directly
        total: memUsage.rss + memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        heapUsagePercent: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      workerPool: workerStats
    }
    
    res.json(currentStats)
  } catch (error) {
    console.error('Error fetching current stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/api/stats/data', (req: AppRequest, res: AppResponse) => {
  try {
    if (!req.jetBrains) {
      return res.status(500).json({ error: 'JetBrains instance not available' })
    }
    
    const maxPoints = parseInt(req.query.maxPoints as string) || 60
    const dataPoints = req.jetBrains.statsCollector.getRecentDataPoints(maxPoints)
    
    res.json(dataPoints)
  } catch (error) {
    console.error('Error fetching data points:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/api/stats', (req: AppRequest, res: AppResponse) => {
  try {
    const period = (req.query.period as TimePeriod) || '1h'
    const intervalMs = req.query.intervalMs ? parseInt(req.query.intervalMs as string) : undefined
    
    const validPeriods: TimePeriod[] = ['1m', '5m', '15m', '1h', '6h', '12h']
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ 
        error: 'Invalid period. Must be one of: 1m, 5m, 15m, 1h, 6h, 12h' 
      })
    }
    
    if (intervalMs !== undefined && (intervalMs < 1000 || intervalMs > 600000)) {
      return res.status(400).json({ 
        error: 'Invalid intervalMs. Must be between 1000 and 600000' 
      })
    }

    if (!req.jetBrains) {
      return res.status(500).json({ error: 'JetBrains instance not available' })
    }
    
    const stats = req.jetBrains.statsCollector.getStats({ period, intervalMs })
    
    res.json(stats)
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router