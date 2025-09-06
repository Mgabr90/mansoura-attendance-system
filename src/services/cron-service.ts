/**
 * Cron Service - Scheduled Task Management
 * Handles all automated tasks and notifications
 */

import cron from 'node-cron'
import { getNotificationService } from './notification-service'
import { prisma } from '@/lib/prisma'

export interface CronJobConfig {
  name: string
  schedule: string
  enabled: boolean
  lastRun?: Date
  nextRun?: Date
  runCount?: number
}

export class CronService {
  private notificationService = getNotificationService()
  private jobs: Map<string, any> = new Map()
  private isRunning = false

  /**
   * Initialize and start all cron jobs
   */
  async initialize(): Promise<void> {
    if (this.isRunning) {
      console.log('Cron service is already running')
      return
    }

    try {
      // Daily Summary - 8:00 AM
      this.scheduleJob(
        'daily_summary',
        '0 8 * * 1-5', // Monday to Friday at 8:00 AM
        () => this.runDailySummary()
      )

      // Morning Absence Check - 10:00 AM
      this.scheduleJob(
        'absence_check',
        '0 10 * * 1-5', // Monday to Friday at 10:00 AM
        () => this.runAbsenceCheck()
      )

      // Late Check-in Reminders - 9:30 AM
      this.scheduleJob(
        'late_reminders',
        '30 9 * * 1-5', // Monday to Friday at 9:30 AM
        () => this.runLateReminders()
      )

      // Check-out Reminders - 5:30 PM
      this.scheduleJob(
        'checkout_reminders',
        '30 17 * * 1-5', // Monday to Friday at 5:30 PM
        () => this.runCheckoutReminders()
      )

      // Weekly Summary - Friday 6:00 PM
      this.scheduleJob(
        'weekly_summary',
        '0 18 * * 5', // Friday at 6:00 PM
        () => this.runWeeklySummary()
      )

      // Monthly Summary - Last day of month 6:00 PM
      this.scheduleJob(
        'monthly_summary',
        '0 18 28-31 * *', // Last days of month at 6:00 PM
        () => this.runMonthlySummary()
      )

      // End of day report - 6:00 PM
      this.scheduleJob(
        'end_of_day_report',
        '0 18 * * 1-5', // Monday to Friday at 6:00 PM
        () => this.runEndOfDayReport()
      )

      // Cleanup old records - Sunday 2:00 AM
      this.scheduleJob(
        'cleanup_old_records',
        '0 2 * * 0', // Sunday at 2:00 AM
        () => this.runCleanupOldRecords()
      )

      // Health check - Every hour
      this.scheduleJob(
        'health_check',
        '0 * * * *', // Every hour
        () => this.runHealthCheck()
      )

      this.isRunning = true
      await this.logCronActivity('cron_service_started', 'All cron jobs initialized and started')
      console.log('🕐 Cron service started with all scheduled jobs')

    } catch (error) {
      console.error('Failed to initialize cron service:', error)
      await this.logCronActivity('cron_service_error', `Failed to start: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Stop all cron jobs
   */
  async stop(): Promise<void> {
    try {
      this.jobs.forEach((task, name) => {
        task.stop()
        console.log(`Stopped cron job: ${name}`)
      })

      this.jobs.clear()
      this.isRunning = false
      
      await this.logCronActivity('cron_service_stopped', 'All cron jobs stopped')
      console.log('🛑 Cron service stopped')

    } catch (error) {
      console.error('Error stopping cron service:', error)
    }
  }

  /**
   * Get status of all jobs
   */
  getJobsStatus(): CronJobConfig[] {
    const status: CronJobConfig[] = []
    
    for (const [name, task] of this.jobs) {
      status.push({
        name,
        schedule: '', // node-cron doesn't expose schedule
        enabled: task.running || false,
        lastRun: undefined, // Would need to track separately
        nextRun: undefined  // Would need to calculate
      })
    }

    return status
  }

  /**
   * Manual trigger for specific job
   */
  async triggerJob(jobName: string): Promise<boolean> {
    try {
      switch (jobName) {
        case 'daily_summary':
          await this.runDailySummary()
          break
        case 'absence_check':
          await this.runAbsenceCheck()
          break
        case 'late_reminders':
          await this.runLateReminders()
          break
        case 'checkout_reminders':
          await this.runCheckoutReminders()
          break
        case 'weekly_summary':
          await this.runWeeklySummary()
          break
        case 'monthly_summary':
          await this.runMonthlySummary()
          break
        case 'end_of_day_report':
          await this.runEndOfDayReport()
          break
        case 'health_check':
          await this.runHealthCheck()
          break
        default:
          throw new Error(`Unknown job: ${jobName}`)
      }

      await this.logCronActivity('manual_trigger', `Job ${jobName} triggered manually`)
      return true

    } catch (error) {
      console.error(`Failed to trigger job ${jobName}:`, error)
      await this.logCronActivity('manual_trigger_error', `Failed to trigger ${jobName}: ${error instanceof Error ? error.message : String(error)}`)
      return false
    }
  }

  // ============ PRIVATE JOB METHODS ============

  private scheduleJob(name: string, schedule: string, task: () => Promise<void>): void {
    const cronTask = cron.schedule(schedule, async () => {
      console.log(`Running cron job: ${name}`)
      const startTime = Date.now()
      
      try {
        await task()
        const duration = Date.now() - startTime
        await this.logCronActivity('job_completed', `${name} completed in ${duration}ms`)
        
      } catch (error) {
        const duration = Date.now() - startTime
        console.error(`Cron job ${name} failed:`, error)
        await this.logCronActivity('job_failed', `${name} failed after ${duration}ms: ${error instanceof Error ? error.message : String(error)}`)
      }
    }, {
      timezone: 'Africa/Cairo'
    } as any)

    this.jobs.set(name, cronTask)
    console.log(`Scheduled cron job: ${name} (${schedule})`)
  }

  private async runDailySummary(): Promise<void> {
    console.log('Running daily summary...')
    await this.notificationService.sendDailySummary()
  }

  // Alias for easier testing
  async dailySummary(): Promise<void> {
    return this.runDailySummary()
  }

  private async runAbsenceCheck(): Promise<void> {
    console.log('Running absence check...')
    await this.notificationService.sendAbsenceAlerts()
  }

  private async runLateReminders(): Promise<void> {
    console.log('Running late check-in reminders...')
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find employees who haven't checked in yet
    const checkedInToday = await prisma.attendanceRecord.findMany({
      where: {
        date: today,
        checkInTime: { not: null }
      },
      select: { employeeId: true }
    })

    const checkedInEmployeeIds = checkedInToday.map(r => r.employeeId)
    
    const lateEmployees = await prisma.employee.findMany({
      where: {
        isActive: true,
        id: { notIn: checkedInEmployeeIds }
      }
    })

    // Send reminders to late employees
    for (const employee of lateEmployees) {
      await this.notificationService.sendEmployeeReminder(employee, 'late_warning')
    }

    console.log(`Sent late reminders to ${lateEmployees.length} employees`)
  }

  private async runCheckoutReminders(): Promise<void> {
    console.log('Running check-out reminders...')
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find employees who checked in but haven't checked out
    const needCheckout = await prisma.attendanceRecord.findMany({
      where: {
        date: today,
        checkInTime: { not: null },
        checkOutTime: null
      },
      include: { employee: true }
    })

    // Send reminders to employees who need to check out
    for (const record of needCheckout) {
      await this.notificationService.sendEmployeeReminder(record.employee, 'checkout_reminder')
    }

    console.log(`Sent checkout reminders to ${needCheckout.length} employees`)
  }

  private async runWeeklySummary(): Promise<void> {
    console.log('Running weekly summary...')
    await this.notificationService.sendWeeklySummary()
  }

  private async runMonthlySummary(): Promise<void> {
    console.log('Running monthly summary...')
    
    // Check if it's actually the last day of the month
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Only run on last day of month
    if (today.getMonth() === tomorrow.getMonth()) {
      console.log('Not the last day of month, skipping monthly summary')
      return
    }

    await this.notificationService.sendMonthlySummary()
  }

  private async runEndOfDayReport(): Promise<void> {
    console.log('Running end of day report...')
    await this.notificationService.sendDetailedDailyReport()
  }

  private async runCleanupOldRecords(): Promise<void> {
    console.log('Running cleanup of old records...')
    
    try {
      // Clean up conversation states older than 1 day
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)

      const deletedConversations = await prisma.conversationState.deleteMany({
        where: {
          expiresAt: { lt: oneDayAgo }
        }
      })

      // Clean up notification logs older than 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const deletedNotifications = await prisma.notificationLog.deleteMany({
        where: {
          sentAt: { lt: thirtyDaysAgo }
        }
      })

      // Clean up server activity logs older than 90 days
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

      const deletedActivities = await prisma.serverActivity.deleteMany({
        where: {
          timestamp: { lt: ninetyDaysAgo }
        }
      })

      console.log(`Cleanup completed: ${deletedConversations.count} conversations, ${deletedNotifications.count} notifications, ${deletedActivities.count} activities`)

      await this.logCronActivity(
        'cleanup_completed', 
        `Removed ${deletedConversations.count + deletedNotifications.count + deletedActivities.count} old records`
      )

    } catch (error) {
      console.error('Cleanup failed:', error)
      await this.logCronActivity('cleanup_failed', error instanceof Error ? error.message : String(error))
    }
  }

  private async runHealthCheck(): Promise<void> {
    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`

      // Check memory usage
      const memoryUsage = process.memoryUsage()
      const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024

      // Alert if memory usage is high (over 500MB)
      if (memoryUsageMB > 500) {
        await this.notificationService.sendHealthAlert(
          'warning',
          `High memory usage: ${memoryUsageMB.toFixed(2)}MB`,
          { memoryUsage }
        )
      }

      // Check for failed attendance records
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const incompleteRecords = await prisma.attendanceRecord.count({
        where: {
          date: today,
          checkInTime: { not: null },
          checkOutTime: null,
          createdAt: { lt: new Date(Date.now() - 2 * 60 * 60 * 1000) } // 2 hours ago
        }
      })

      if (incompleteRecords > 5) {
        await this.notificationService.sendHealthAlert(
          'warning',
          `${incompleteRecords} employees still haven't checked out`,
          { incompleteRecords }
        )
      }

    } catch (error) {
      console.error('Health check failed:', error)
      await this.notificationService.sendHealthAlert(
        'error',
        'Health check failed',
        { error: error instanceof Error ? error.message : String(error) }
      )
    }
  }

  private async logCronActivity(type: string, message: string): Promise<void> {
    try {
      await prisma.serverActivity.create({
        data: {
          type: `cron_${type}`,
          message,
          metadata: JSON.stringify({ service: 'cron' })
        }
      })
    } catch (error) {
      console.error('Failed to log cron activity:', error)
    }
  }
}

// Singleton instance
let cronServiceInstance: CronService | null = null

export const getCronService = (): CronService => {
  if (!cronServiceInstance) {
    cronServiceInstance = new CronService()
  }
  return cronServiceInstance
}

export default CronService 