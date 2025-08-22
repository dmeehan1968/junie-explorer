import fsExtra from 'fs-extra'
import { WorkerFileIOOperation, WorkerFileIOStats } from '../stats/StatsTypes.js'
import { BaseFileIOMonitor, FileIOOperationType } from '../stats/BaseFileIOMonitor.js'

export class WorkerFileIOCollector extends BaseFileIOMonitor {
  private operations: WorkerFileIOOperation[] = []
  private workerId: string

  constructor(workerId: string) {
    super()
    this.workerId = workerId
    this.initializeWorkerMonitoring()
  }

  private initializeWorkerMonitoring(): void {
    // Workers primarily use fs-extra, so we only monitor that module
    this.initializeMonitoring([
      { name: 'fsExtra', module: fsExtra }
    ])
  }

  protected recordOperation(
    operationType: FileIOOperationType,
    startTime: number,
    endTime: number,
    size?: number,
    error?: boolean
  ): void {
    const operation: WorkerFileIOOperation = {
      type: operationType,
      duration: endTime - startTime,
      size,
      error: !!error,
      timestamp: startTime
    }
    
    this.operations.push(operation)
  }

  public getStats(): WorkerFileIOStats {
    return {
      operations: [...this.operations],
      workerId: this.workerId
    }
  }

  public clearStats(): void {
    this.operations = []
  }

  // stop() method is inherited from BaseFileIOMonitor
}