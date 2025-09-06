/* eslint-disable no-console */

/**
 * Notification Service - Simplified Version
 * Core notification functionality for the attendance system
 */

import { getBot } from '@/lib/telegram-bot'
import { prisma } from '@/lib/prisma'
import { MessageFormatter } from '@/utils/telegram-formatters'

export class NotificationService {
  private bot = getBot()

  async sendNotification(telegramId: string, message: string, keyboard?: unknown): Promise<{ success: boolean; error?: string }> {
    try {
      await this.bot.getBot().telegram.sendMessage(telegramId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard as any
      })
      
      return { success: true }
    } catch (error) {
      console.error('Failed to send notification:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async sendDailySummary(): Promise<void> {
    try {
      const admins = await prisma.admin.findMany({ where: { isActive: true } })
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [totalEmployees, checkedIn, lateCheckins] = await Promise.all([
        prisma.employee.count({ where: { isActive: true } }),
        prisma.attendanceRecord.count({ where: { date: today, checkInTime: { not: null } } }),
        prisma.attendanceRecord.count({ where: { date: today, isLate: true } })
      ])

      const summaryData = {
        date: today,
        totalEmployees,
        checkedIn,
        checkedOut: 0,
        lateCheckins,
        earlyCheckouts: 0,
        attendanceRate: totalEmployees > 0 ? (checkedIn / totalEmployees) * 100 : 0
      }

      const message = MessageFormatter.formatDailySummary(summaryData)

      for (const admin of admins) {
        await this.bot.getBot().telegram.sendMessage(admin.telegramId, message, {
          parse_mode: 'Markdown'
        })
      }

      console.log(`Daily summary sent to ${admins.length} admins`)
    } catch (error) {
      console.error('Failed to send daily summary:', error)
    }
  }

  async sendLateAlert(employee: { firstName: string; lastName?: string; username?: string; telegramId: string }, checkInTime: Date, minutesLate: number): Promise<void> {
    try {
      const admins = await prisma.admin.findMany({ where: { isActive: true } })
      const employeeInfo = {
        firstName: employee.firstName,
        lastName: employee.lastName,
        username: employee.username,
        telegramId: employee.telegramId
      }

      const message = MessageFormatter.formatLateAlert(employeeInfo, checkInTime, minutesLate)

      for (const admin of admins) {
        await this.bot.getBot().telegram.sendMessage(admin.telegramId, message, {
          parse_mode: 'Markdown'
        })
      }
    } catch (error) {
      console.error('Failed to send late alert:', error)
    }
  }
}

let notificationService: NotificationService | null = null

export const getNotificationService = (): NotificationService => {
  if (!notificationService) {
    notificationService = new NotificationService()
  }
  return notificationService
} 