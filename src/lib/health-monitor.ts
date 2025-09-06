/**
 * System Health & Performance Monitor
 * Tracks database, services, and overall system health
 */

import { prisma } from './prisma'

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical'
  uptime: number
  timestamp: Date
  services: ServiceStatus[]
  database: DatabaseHealth
  performance: PerformanceMetrics
  alerts: SystemAlert[]
}

export interface ServiceStatus {
  name: string
  status: 'online' | 'offline' | 'degraded'
  lastCheck: Date
  responseTime?: number
  errorCount: number
}

export interface DatabaseHealth {
  status: 'connected' | 'disconnected' | 'slow'
  connectionCount: number
  avgQueryTime: number
  slowQueries: number
  lastBackup?: Date
}

export interface PerformanceMetrics {
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }
  responseTime: {
    avg: number
    p95: number
    p99: number
  }
  errorRate: number
  requestsPerMinute: number
}

export interface SystemAlert {
  id: string
  type: 'error' | 'warning' | 'info'
  message: string
  timestamp: Date
  resolved: boolean
  service?: string
}

export class HealthMonitor {
  private static alerts: SystemAlert[] = []
  private static startTime = Date.now()

  /**
   * Get comprehensive system health status
   */
  static async getHealthStatus(): Promise<HealthStatus> {
    const [
      databaseHealth,
      serviceStatuses,
      performanceMetrics
    ] = await Promise.all([
      this.checkDatabaseHealth(),
      this.checkServiceStatuses(),
      this.getPerformanceMetrics()
    ])

    const overallStatus = this.determineOverallStatus(databaseHealth, serviceStatuses)

    return {
      status: overallStatus,
      uptime: Date.now() - this.startTime,
      timestamp: new Date(),
      services: serviceStatuses,
      database: databaseHealth,
      performance: performanceMetrics,
      alerts: this.getActiveAlerts()
    }
  }

  /**
   * Check database health and performance
   */
  private static async checkDatabaseHealth(): Promise<DatabaseHealth> {
    const startTime = Date.now()
    let status: 'connected' | 'disconnected' | 'slow' = 'connected'
    let connectionCount = 0
    let slowQueries = 0

    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`
      
      const queryTime = Date.now() - startTime
      
      // Check if query is slow (>1000ms is slow)
      if (queryTime > 1000) {
        status = 'slow'
        this.addAlert('warning', 'Database queries are running slow', 'database')
      }

      // Get database statistics
      try {
        const employeeCount = await prisma.employee.count()
        const attendanceCount = await prisma.attendanceRecord.count()
        
        // Estimate connection count (simplified)
        connectionCount = 1

        // Check for slow queries in the last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        slowQueries = await prisma.serverActivity.count({
          where: {
            type: 'slow_query',
            timestamp: { gte: oneHourAgo }
          }
        })

        return {
          status,
          connectionCount,
          avgQueryTime: queryTime,
          slowQueries,
          lastBackup: await this.getLastBackupTime()
        }

      } catch (statsError) {
        console.error('Database stats error:', statsError)
        return {
          status: 'connected',
          connectionCount: 0,
          avgQueryTime: queryTime,
          slowQueries: 0
        }
      }

    } catch (error) {
      console.error('Database health check failed:', error)
      this.addAlert('error', 'Database connection failed', 'database')
      
      return {
        status: 'disconnected',
        connectionCount: 0,
        avgQueryTime: 0,
        slowQueries: 0
      }
    }
  }

  /**
   * Check status of various services
   */
  private static async checkServiceStatuses(): Promise<ServiceStatus[]> {
    const services: ServiceStatus[] = []

    // Check Telegram Bot Service
    try {
      const botStatus = await this.checkTelegramBot()
      services.push(botStatus)
    } catch (error) {
      services.push({
        name: 'Telegram Bot',
        status: 'offline',
        lastCheck: new Date(),
        errorCount: 1
      })
    }

    // Check Cron Service
    try {
      const cronStatus = await this.checkCronService()
      services.push(cronStatus)
    } catch (error) {
      services.push({
        name: 'Cron Service',
        status: 'offline',
        lastCheck: new Date(),
        errorCount: 1
      })
    }

    // Check Notification Service
    try {
      const notificationStatus = await this.checkNotificationService()
      services.push(notificationStatus)
    } catch (error) {
      services.push({
        name: 'Notification Service',
        status: 'offline',
        lastCheck: new Date(),
        errorCount: 1
      })
    }

    return services
  }

  /**
   * Get performance metrics
   */
  private static async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    // Get memory usage
    const memoryUsage = process.memoryUsage()
    const totalMemory = require('os').totalmem()
    
    // Get response time metrics from server activities
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    const responseTimes = await prisma.serverActivity.findMany({
      where: {
        type: 'api_request',
        timestamp: { gte: oneHourAgo }
      },
      select: { metadata: true }
    })

    const times = responseTimes
      .map(activity => {
        try {
          const metadata = JSON.parse(activity.metadata as string)
          return metadata.responseTime || 0
        } catch {
          return 0
        }
      })
      .filter(time => time > 0)

    const avgResponseTime = times.length > 0 
      ? times.reduce((sum, time) => sum + time, 0) / times.length 
      : 0

    // Calculate percentiles
    const sortedTimes = times.sort((a, b) => a - b)
    const p95Index = Math.floor(sortedTimes.length * 0.95)
    const p99Index = Math.floor(sortedTimes.length * 0.99)

    // Get error count
    const errorCount = await prisma.serverActivity.count({
      where: {
        type: 'error',
        timestamp: { gte: oneHourAgo }
      }
    })

    // Calculate error rate
    const totalRequests = responseTimes.length
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0

    return {
      memoryUsage: {
        used: memoryUsage.heapUsed,
        total: totalMemory,
        percentage: (memoryUsage.heapUsed / totalMemory) * 100
      },
      responseTime: {
        avg: avgResponseTime,
        p95: sortedTimes[p95Index] || 0,
        p99: sortedTimes[p99Index] || 0
      },
      errorRate,
      requestsPerMinute: totalRequests
    }
  }

  /**
   * Check Telegram Bot status
   */
  private static async checkTelegramBot(): Promise<ServiceStatus> {
    const startTime = Date.now()
    
    try {
      // Check if bot has recent activity
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const recentActivity = await prisma.serverActivity.findFirst({
        where: {
          type: { startsWith: 'bot_' },
          timestamp: { gte: fiveMinutesAgo }
        }
      })

      const responseTime = Date.now() - startTime
      
      return {
        name: 'Telegram Bot',
        status: recentActivity ? 'online' : 'degraded',
        lastCheck: new Date(),
        responseTime,
        errorCount: 0
      }

    } catch (error) {
      return {
        name: 'Telegram Bot',
        status: 'offline',
        lastCheck: new Date(),
        errorCount: 1
      }
    }
  }

  /**
   * Check Cron Service status
   */
  private static async checkCronService(): Promise<ServiceStatus> {
    try {
      // Check if cron jobs have run recently
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const recentCronActivity = await prisma.serverActivity.findFirst({
        where: {
          type: 'cron_job',
          timestamp: { gte: oneHourAgo }
        }
      })

      return {
        name: 'Cron Service',
        status: recentCronActivity ? 'online' : 'degraded',
        lastCheck: new Date(),
        errorCount: 0
      }

    } catch (error) {
      return {
        name: 'Cron Service',
        status: 'offline',
        lastCheck: new Date(),
        errorCount: 1
      }
    }
  }

  /**
   * Check Notification Service status
   */
  private static async checkNotificationService(): Promise<ServiceStatus> {
    try {
      // Check recent notifications
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const recentNotifications = await prisma.notificationLog.findFirst({
        where: {
          sentAt: { gte: oneHourAgo }
        }
      })

      return {
        name: 'Notification Service',
        status: recentNotifications ? 'online' : 'degraded',
        lastCheck: new Date(),
        errorCount: 0
      }

    } catch (error) {
      return {
        name: 'Notification Service',
        status: 'offline',
        lastCheck: new Date(),
        errorCount: 1
      }
    }
  }

  /**
   * Determine overall system status
   */
  private static determineOverallStatus(
    db: DatabaseHealth, 
    services: ServiceStatus[]
  ): 'healthy' | 'warning' | 'critical' {
    // Critical if database is down
    if (db.status === 'disconnected') {
      return 'critical'
    }

    // Critical if any core service is offline
    const offlineServices = services.filter(s => s.status === 'offline')
    if (offlineServices.length > 0) {
      return 'critical'
    }

    // Warning if database is slow or services are degraded
    if (db.status === 'slow' || services.some(s => s.status === 'degraded')) {
      return 'warning'
    }

    return 'healthy'
  }

  /**
   * Add system alert
   */
  private static addAlert(
    type: 'error' | 'warning' | 'info', 
    message: string, 
    service?: string
  ) {
    const alert: SystemAlert = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: new Date(),
      resolved: false,
      service
    }

    this.alerts.unshift(alert)
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(0, 50)
    }

    // Log to database
    this.logAlert(alert)
  }

  /**
   * Get active (unresolved) alerts
   */
  private static getActiveAlerts(): SystemAlert[] {
    return this.alerts.filter(alert => !alert.resolved)
  }

  /**
   * Resolve alert
   */
  static resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      return true
    }
    return false
  }

  /**
   * Get last backup time (placeholder)
   */
  private static async getLastBackupTime(): Promise<Date | undefined> {
    try {
      // Check for backup activity in server logs
      const backup = await prisma.serverActivity.findFirst({
        where: { type: 'database_backup' },
        orderBy: { timestamp: 'desc' }
      })
      
      return backup?.timestamp
    } catch {
      return undefined
    }
  }

  /**
   * Log alert to database
   */
  private static async logAlert(alert: SystemAlert) {
    try {
      await prisma.serverActivity.create({
        data: {
          type: `alert_${alert.type}`,
          message: alert.message,
          metadata: JSON.stringify({
            alertId: alert.id,
            service: alert.service,
            timestamp: alert.timestamp
          })
        }
      })
    } catch (error) {
      console.error('Failed to log alert:', error)
    }
  }

  /**
   * Record performance metric
   */
  static async recordMetric(
    type: string, 
    value: number, 
    metadata?: Record<string, any>
  ) {
    try {
      await prisma.serverActivity.create({
        data: {
          type: `metric_${type}`,
          message: `${type}: ${value}`,
          metadata: metadata ? JSON.stringify(metadata) : undefined
        }
      })
    } catch (error) {
      console.error('Failed to record metric:', error)
    }
  }

  /**
   * Check if system needs attention
   */
  static async needsAttention(): Promise<boolean> {
    const health = await this.getHealthStatus()
    return health.status === 'critical' || 
           health.alerts.length > 5 ||
           health.database.status === 'disconnected'
  }
}

export default HealthMonitor 