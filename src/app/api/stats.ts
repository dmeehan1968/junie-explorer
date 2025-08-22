import { Router } from 'express'
import { AppRequest, AppResponse } from '../types.js'
import { TimePeriod } from '../../stats/StatsTypes.js'
import fs from 'fs-extra'
import path from 'path'

const router = Router()

router.get('/api/stats/data', (req: AppRequest, res: AppResponse) => {
  try {
    if (!req.jetBrains) {
      return res.status(500).json({ error: 'JetBrains instance not available' })
    }
    
    const period = (req.query.period as TimePeriod) || '1h'
    const maxPoints = parseInt(req.query.maxPoints as string) || 0
    const fromTimestamp = parseInt(req.query.from as string) || 0
    
    let dataPoints: any[]
    
    if (fromTimestamp > 0) {
      // Get only new data points since the last timestamp, respecting period boundary
      dataPoints = req.jetBrains.statsCollector.getDataPointsSince(fromTimestamp, period)
      // console.log(`Incremental fetch: ${dataPoints.length} new points since ${new Date(fromTimestamp)}`)
    } else if (period && period !== '1h') {
      // Get data for specific period
      const validPeriods: TimePeriod[] = ['1m', '5m', '15m', '1h', '6h', '12h']
      if (!validPeriods.includes(period)) {
        return res.status(400).json({ 
          error: 'Invalid period. Must be one of: 1m, 5m, 15m, 1h, 6h, 12h' 
        })
      }
      dataPoints = req.jetBrains.statsCollector.getDataPointsForPeriod(period)
    } else if (maxPoints > 0) {
      // Get recent points by count
      dataPoints = req.jetBrains.statsCollector.getRecentDataPoints(maxPoints)
    } else {
      // Default to 1 hour of data
      dataPoints = req.jetBrains.statsCollector.getDataPointsForPeriod('1h')
    }
    
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

// Test endpoint to generate file I/O activity for testing monitoring
router.get('/api/stats/test-io', async (req: AppRequest, res: AppResponse) => {
  try {
    const testFile = path.join(process.cwd(), 'temp-test-file.txt')
    const testData = 'Test data for file I/O monitoring ' + Date.now()
    
    // Generate some file I/O operations
    await fs.writeFile(testFile, testData)
    const content = await fs.readFile(testFile, 'utf-8')
    const exists = fs.existsSync(testFile)
    const stats = await fs.stat(testFile)
    await fs.unlink(testFile)
    
    res.json({ 
      message: 'File I/O test completed',
      operations: 5,
      bytesWritten: Buffer.byteLength(testData),
      bytesRead: content.length,
      fileExists: exists,
      fileSize: stats.size
    })
  } catch (error) {
    console.error('Error in test-io endpoint:', error)
    res.status(500).json({ error: 'Test failed' })
  }
})

export default router