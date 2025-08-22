import fs from 'fs'
import fsExtra from 'fs-extra'

export type FileIOOperationType = 'read' | 'write' | 'directory' | 'check'

export interface FileSystemModule {
  readFile: any
  readFileSync: any
  writeFile: any
  writeFileSync: any
  readdir: any
  readdirSync: any
  stat: any
  statSync: any
  lstat?: any
  lstatSync?: any
  existsSync: any
  access: any
  globSync?: any
}

export abstract class BaseFileIOMonitor {
  protected originalMethods: Map<string, Function> = new Map()
  protected isInitialized: boolean = false

  protected abstract recordOperation(
    operationType: FileIOOperationType,
    startTime: number,
    endTime: number,
    size?: number,
    error?: boolean
  ): void

  protected initializeMonitoring(modules: { name: string, module: FileSystemModule }[]): void {
    if (this.isInitialized) return
    this.isInitialized = true

    for (const { name, module } of modules) {
      this.storeOriginalMethods(name, module)
      this.wrapModuleMethods(name, module)
    }
  }

  private storeOriginalMethods(moduleName: string, module: FileSystemModule): void {
    const methods = [
      'readFile', 'readFileSync', 'writeFile', 'writeFileSync',
      'readdir', 'readdirSync', 'stat', 'statSync', 
      'lstat', 'lstatSync', 'existsSync', 'access', 'globSync'
    ]

    for (const methodName of methods) {
      const method = (module as any)[methodName]
      if (method) {
        this.originalMethods.set(`${moduleName}.${methodName}`, method)
      }
    }
  }

  private wrapModuleMethods(moduleName: string, module: FileSystemModule): void {
    // Wrap async read operations
    this.wrapAsyncMethod(module, 'readFile', 'read', (args, result) => result?.length || 0)
    this.wrapAsyncMethod(module, 'writeFile', 'write', (args) => this.getWriteSize(args[1]))
    this.wrapAsyncMethod(module, 'readdir', 'directory')
    this.wrapAsyncMethod(module, 'stat', 'directory')
    this.wrapAsyncMethod(module, 'access', 'check')

    if ((module as any).lstat) {
      this.wrapAsyncMethod(module, 'lstat', 'directory')
    }

    // Wrap sync operations
    this.wrapSyncMethod(module, 'readFileSync', 'read', (args, result) => 
      typeof result === 'string' ? Buffer.byteLength(result) : result?.length || 0)
    this.wrapSyncMethod(module, 'writeFileSync', 'write', (args) => this.getWriteSize(args[1]))
    this.wrapSyncMethod(module, 'readdirSync', 'directory')
    this.wrapSyncMethod(module, 'existsSync', 'check')

    // Handle methods that might be read-only
    this.wrapMethodSafely(module, 'statSync', 'directory', true)
    if ((module as any).lstatSync) {
      this.wrapMethodSafely(module, 'lstatSync', 'directory', true)
    }
    if ((module as any).globSync) {
      this.wrapMethodSafely(module, 'globSync', 'directory', true)
    }
  }

  private wrapAsyncMethod(
    module: FileSystemModule,
    methodName: string,
    operationType: FileIOOperationType,
    getSizeFromResult?: (args: any[], result: any) => number
  ): void {
    const originalMethod = (module as any)[methodName]
    if (!originalMethod) return

    ;(module as any)[methodName] = (...args: any[]) => {
      const startTime = Date.now()
      
      const callback = args[args.length - 1]
      if (typeof callback === 'function') {
        args[args.length - 1] = (error: any, result: any) => {
          const endTime = Date.now()
          const size = !error && getSizeFromResult ? getSizeFromResult(args, result) : undefined
          
          this.recordOperation(operationType, startTime, endTime, size, !!error)
          callback(error, result)
        }
      }
      
      return originalMethod(...args)
    }
  }

  private wrapSyncMethod(
    module: FileSystemModule,
    methodName: string,
    operationType: FileIOOperationType,
    getSizeFromArgs?: (args: any[], result?: any) => number
  ): void {
    const originalMethod = (module as any)[methodName]
    if (!originalMethod) return

    ;(module as any)[methodName] = (...args: any[]) => {
      const startTime = Date.now()
      
      try {
        const result = originalMethod(...args)
        const endTime = Date.now()
        const size = getSizeFromArgs ? getSizeFromArgs(args, result) : undefined
        
        this.recordOperation(operationType, startTime, endTime, size, false)
        return result
      } catch (error) {
        const endTime = Date.now()
        this.recordOperation(operationType, startTime, endTime, undefined, true)
        throw error
      }
    }
  }

  private wrapMethodSafely(
    module: FileSystemModule,
    methodName: string,
    operationType: FileIOOperationType,
    isSync: boolean
  ): void {
    const originalMethod = (module as any)[methodName]
    if (!originalMethod) return

    try {
      if (isSync) {
        this.wrapSyncMethod(module, methodName, operationType)
      } else {
        this.wrapAsyncMethod(module, methodName, operationType)
      }
    } catch (error) {
      // If wrapping fails (read-only property), use type casting
      ;(module as any)[methodName] = isSync 
        ? this.createSyncWrapper(originalMethod, operationType)
        : this.createAsyncWrapper(originalMethod, operationType)
    }
  }

  private createSyncWrapper(originalMethod: Function, operationType: FileIOOperationType) {
    return (...args: any[]) => {
      const startTime = Date.now()
      
      try {
        const result = originalMethod(...args)
        const endTime = Date.now()
        this.recordOperation(operationType, startTime, endTime, undefined, false)
        return result
      } catch (error) {
        const endTime = Date.now()
        this.recordOperation(operationType, startTime, endTime, undefined, true)
        throw error
      }
    }
  }

  private createAsyncWrapper(originalMethod: Function, operationType: FileIOOperationType) {
    return (...args: any[]) => {
      const startTime = Date.now()
      
      const callback = args[args.length - 1]
      if (typeof callback === 'function') {
        args[args.length - 1] = (error: any, result: any) => {
          const endTime = Date.now()
          this.recordOperation(operationType, startTime, endTime, undefined, !!error)
          callback(error, result)
        }
      }
      
      return originalMethod(...args)
    }
  }

  private getWriteSize(data: any): number {
    if (typeof data === 'string') return Buffer.byteLength(data)
    if (Buffer.isBuffer(data)) return data.length
    return 0
  }

  public stop(): void {
    if (!this.isInitialized) return
    
    // Restore original methods
    for (const [methodKey, originalMethod] of this.originalMethods) {
      const [moduleName, methodName] = methodKey.split('.')
      
      if (moduleName === 'fs') {
        ;(fs as any)[methodName] = originalMethod
      } else if (moduleName === 'fsExtra') {
        ;(fsExtra as any)[methodName] = originalMethod
      }
    }
    
    this.originalMethods.clear()
    this.isInitialized = false
  }
}