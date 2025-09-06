/* eslint-disable no-console */

/**
 * Startup Service
 * Initializes all system services and components
 */

import { getCronService } from './cron-service'
import { getNotificationService } from './notification'
import { getBot } from '@/lib/telegram-bot'
import { prisma } from '@/lib/prisma'

export class StartupService {
  private static instance: StartupService | null = null
  private isInitialized = false

  static getInstance(): StartupService {
    if (!StartupService.instance) {
      StartupService.instance = new StartupService()
    }
    return StartupService.instance
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🟢 System already initialized')
      return
    }

    try {
      console.log('🚀 Starting El Mansoura CIH Attendance System...')

      // 1. Check database connection
      await this.checkDatabase()

      // 2. Initialize Telegram bot
      await this.initializeTelegramBot()

      // 3. Initialize cron service
      await this.initializeCronService()

      // 4. Initialize notification service
      this.initializeNotificationService()

      // 5. Log startup
      await this.logStartup()

      this.isInitialized = true
      console.log('✅ System initialization completed successfully!')

    } catch (error) {
      console.error('❌ System initialization failed:', error)
      throw error
    }
  }

  async shutdown(): Promise<void> {
    try {
      console.log('🛑 Shutting down system...')

      // Stop cron service
      const cronService = getCronService()
      await cronService.stop()

      // Stop telegram bot
      const bot = getBot()
      await bot.stop()

      // Disconnect database
      await prisma.$disconnect()

      console.log('✅ System shutdown completed')

    } catch (error) {
      console.error('❌ Error during shutdown:', error)
    }
  }

  private async checkDatabase(): Promise<void> {
    try {
      console.log('📊 Checking database connection...')
      await prisma.$queryRaw`SELECT 1`
      console.log('✅ Database connection established')
    } catch (error) {
      console.error('❌ Database connection failed:', error)
      throw new Error('Database connection failed')
    }
  }

  private async initializeTelegramBot(): Promise<void> {
    try {
      console.log('🤖 Initializing Telegram bot...')
      const bot = getBot()
      await bot.launch()
      console.log('✅ Telegram bot initialized')
    } catch (error) {
      console.error('❌ Telegram bot initialization failed:', error)
      throw new Error('Telegram bot initialization failed')
    }
  }

  private async initializeCronService(): Promise<void> {
    try {
      console.log('⏰ Initializing cron service...')
      const cronService = getCronService()
      await cronService.initialize()
      console.log('✅ Cron service initialized')
    } catch (error) {
      console.error('❌ Cron service initialization failed:', error)
      throw new Error('Cron service initialization failed')
    }
  }

  private initializeNotificationService(): void {
    try {
      console.log('📢 Initializing notification service...')
      const _notificationService = getNotificationService()
      // Notification service is ready to use
      console.log('✅ Notification service initialized')
    } catch (error) {
      console.error('❌ Notification service initialization failed:', error)
      throw new Error('Notification service initialization failed')
    }
  }

  private async logStartup(): Promise<void> {
    try {
      await prisma.serverActivity.create({
        data: {
          type: 'system_startup',
          message: 'El Mansoura CIH Attendance System started successfully',
          metadata: JSON.stringify({
            timestamp: new Date().toISOString(),
            nodeVersion: process.version,
            platform: process.platform
          })
        }
      })
    } catch (error) {
      console.error('Failed to log startup:', error)
    }
  }
}

// Export singleton instance
export const getStartupService = (): StartupService => {
  return StartupService.getInstance()
}

export default StartupService 