/**
 * Service Manager - Central Service Orchestration
 * Manages initialization, lifecycle, and interaction between services
 */

import { AuthService } from '@/lib/auth'
import { ExportService } from '@/lib/export'
import { HealthMonitor } from '@/lib/health-monitor'
import CronService from './cron-service'
import NotificationService from './notification'
import StartupService from './startup'

type ServiceStatus = 'initialized' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error'

interface ServiceInstance {
  name: string
  instance: any
  status: ServiceStatus
  error?: string
  startedAt?: Date
}

class ServiceManager {
  private services: Map<string, ServiceInstance> = new Map()
  private initialized = false

  /**
   * Initialize all services in the correct order
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      throw new Error('ServiceManager already initialized')
    }

    console.log('🚀 ServiceManager: Initializing services...')

    try {
      // Initialize core services first
      await this.registerService('auth', new AuthService())
      await this.registerService('health', new HealthMonitor())
      await this.registerService('notification', new NotificationService())
      
      // Initialize background services
      await this.registerService('cron', new CronService())
      await this.registerService('export', new ExportService())
      
      // Initialize startup service last (orchestrates everything)
      await this.registerService('startup', new StartupService())

      this.initialized = true
      console.log('✅ ServiceManager: All services initialized successfully')
    } catch (error) {
      console.error('❌ ServiceManager: Failed to initialize services:', error)
      throw error
    }
  }

  /**
   * Register and start a service
   */
  private async registerService(name: string, instance: any): Promise<void> {
    console.log(`📦 ServiceManager: Registering ${name} service...`)
    
    const serviceInstance: ServiceInstance = {
      name,
      instance,
      status: 'initialized'
    }

    this.services.set(name, serviceInstance)

    try {
      serviceInstance.status = 'starting'
      
      // Check if service has an initialize method
      if (typeof instance.initialize === 'function') {
        await instance.initialize()
      }
      
      serviceInstance.status = 'running'
      serviceInstance.startedAt = new Date()
      
      console.log(`✅ ServiceManager: ${name} service started successfully`)
    } catch (error) {
      serviceInstance.status = 'error'
      serviceInstance.error = error instanceof Error ? error.message : 'Unknown error'
      
      console.error(`❌ ServiceManager: Failed to start ${name} service:`, error)
      throw error
    }
  }

  /**
   * Get a service instance by name
   */
  getService<T = any>(name: string): T | null {
    const service = this.services.get(name)
    return service?.instance || null
  }

  /**
   * Get service status
   */
  getServiceStatus(name: string): ServiceStatus | null {
    const service = this.services.get(name)
    return service?.status || null
  }

  /**
   * Get all services status
   */
  getAllServicesStatus(): Array<{
    name: string
    status: ServiceStatus
    error?: string
    startedAt?: Date
    uptime?: number
  }> {
    return Array.from(this.services.values()).map(service => ({
      name: service.name,
      status: service.status,
      error: service.error,
      startedAt: service.startedAt,
      uptime: service.startedAt ? Date.now() - service.startedAt.getTime() : undefined
    }))
  }

  /**
   * Stop a specific service
   */
  async stopService(name: string): Promise<void> {
    const service = this.services.get(name)
    if (!service) {
      throw new Error(`Service ${name} not found`)
    }

    console.log(`🛑 ServiceManager: Stopping ${name} service...`)
    
    try {
      service.status = 'stopping'
      
      // Check if service has a shutdown method
      if (typeof service.instance.shutdown === 'function') {
        await service.instance.shutdown()
      }
      
      service.status = 'stopped'
      console.log(`✅ ServiceManager: ${name} service stopped successfully`)
    } catch (error) {
      service.status = 'error'
      service.error = error instanceof Error ? error.message : 'Unknown error'
      
      console.error(`❌ ServiceManager: Failed to stop ${name} service:`, error)
      throw error
    }
  }

  /**
   * Stop all services in reverse order
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return
    }

    console.log('🛑 ServiceManager: Shutting down all services...')
    
    const serviceNames = Array.from(this.services.keys()).reverse()
    
    for (const name of serviceNames) {
      try {
        await this.stopService(name)
      } catch (error) {
        console.error(`Failed to stop ${name} service during shutdown:`, error)
      }
    }

    this.services.clear()
    this.initialized = false
    
    console.log('✅ ServiceManager: All services shut down')
  }

  /**
   * Restart a specific service
   */
  async restartService(name: string): Promise<void> {
    const service = this.services.get(name)
    if (!service) {
      throw new Error(`Service ${name} not found`)
    }

    console.log(`🔄 ServiceManager: Restarting ${name} service...`)
    
    await this.stopService(name)
    await this.registerService(name, service.instance)
    
    console.log(`✅ ServiceManager: ${name} service restarted successfully`)
  }

  /**
   * Check if all services are healthy
   */
  isHealthy(): boolean {
    return Array.from(this.services.values()).every(
      service => service.status === 'running'
    )
  }

  /**
   * Get health summary
   */
  getHealthSummary(): {
    healthy: boolean
    totalServices: number
    runningServices: number
    errors: string[]
  } {
    const services = Array.from(this.services.values())
    const runningServices = services.filter(s => s.status === 'running').length
    const errors = services
      .filter(s => s.status === 'error')
      .map(s => `${s.name}: ${s.error}`)

    return {
      healthy: this.isHealthy(),
      totalServices: services.length,
      runningServices,
      errors
    }
  }
}

// Create singleton instance
const serviceManager = new ServiceManager()

// Auto-initialize in production
if (process.env.NODE_ENV === 'production') {
  serviceManager.initialize().catch(console.error)
}

export default serviceManager 