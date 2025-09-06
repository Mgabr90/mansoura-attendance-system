/**
 * Notification Service
 * Handles daily summaries, admin alerts, and scheduled notifications
 */

import { getBot } from '@/lib/telegram-bot'
import { prisma } from '@/lib/prisma'
import { MessageFormatter, type DailySummaryData, type EmployeeInfo } from '@/utils/telegram-formatters'
import type { Employee, Admin } from '@prisma/client'

export interface NotificationOptions {
  parseMode?: 'Markdown' | 'HTML'
  silentNotification?: boolean
  replyMarkup?: unknown
}

export interface DailyReportData {
  date: Date
  totalEmployees: number
  checkedIn: number
  checkedOut: number
  lateCheckins: number
  earlyCheckouts: number
  absentees: Employee[]
  lateEmployees: Employee[]
  earlyDepartures: Employee[]
  attendanceRate: number
  averageWorkingHours: number
}

export class NotificationService {
  private bot = getBot()

  /**
   * Send daily summary to all admins
   */
  async sendDailySummary(): Promise<void> {
    try {
      const admins = await this.getActiveAdmins()
      if (admins.length === 0) {
        console.log('No active admins found for daily summary')
        return
      }

      const reportData = await this.generateDailyReport()
      const summary = this.convertToSummaryData(reportData)
      const message = MessageFormatter.formatDailySummary(summary)

      // Send to all admins
      const results = await Promise.allSettled(
        admins.map(admin => this.sendToAdmin(admin, message, { parseMode: 'Markdown' }))
      )

      // Log notification results
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      await this.logNotification(
        'system', 
        'daily_summary', 
        `Daily summary sent to ${successful}/${admins.length} admins`,
        successful > 0
      )

      console.log(`Daily summary sent: ${successful} successful, ${failed} failed`)

    } catch (error) {
      console.error('Failed to send daily summary:', error)
      await this.logNotification('system', 'daily_summary_error', error instanceof Error ? error.message : String(error), false)
    }
  }

  /**
   * Send detailed daily report with charts and analytics
   */
  async sendDetailedDailyReport(): Promise<void> {
    try {
      const admins = await this.getActiveAdmins()
      const reportData = await this.generateDailyReport()
      
      const detailedMessage = this.formatDetailedReport(reportData)

      for (const admin of admins) {
        await this.sendToAdmin(admin, detailedMessage, { parseMode: 'Markdown' })
      }

      await this.logNotification('system', 'detailed_daily_report', 'Detailed report sent to admins')

    } catch (error) {
      console.error('Failed to send detailed daily report:', error)
    }
  }

  /**
   * Send late arrival alert to admins
   */
  async sendLateAlert(employee: Employee, checkInTime: Date, minutesLate: number): Promise<void> {
    try {
      const admins = await this.getActiveAdmins()
      const employeeInfo: EmployeeInfo = {
        firstName: employee.firstName,
        lastName: employee.lastName || undefined,
        username: employee.username || undefined,
        telegramId: employee.telegramId
      }

      const message = MessageFormatter.formatLateAlert(employeeInfo, checkInTime, minutesLate)

      for (const admin of admins) {
        await this.sendToAdmin(admin, message, { parseMode: 'Markdown' })
      }

      await this.logNotification(employee.telegramId, 'late_alert', `${minutesLate} minutes late`)

    } catch (error) {
      console.error('Failed to send late alert:', error)
    }
  }

  /**
   * Send early departure alert to admins
   */
  async sendEarlyDepartureAlert(employee: Employee, checkOutTime: Date, minutesEarly: number): Promise<void> {
    try {
      const admins = await this.getActiveAdmins()
      const employeeInfo: EmployeeInfo = {
        firstName: employee.firstName,
        lastName: employee.lastName || undefined,
        username: employee.username || undefined,
        telegramId: employee.telegramId
      }

      const message = MessageFormatter.formatEarlyDepartureAlert(employeeInfo, checkOutTime, minutesEarly)

      for (const admin of admins) {
        await this.sendToAdmin(admin, message, { parseMode: 'Markdown' })
      }

      await this.logNotification(employee.telegramId, 'early_departure_alert', `${minutesEarly} minutes early`)

    } catch (error) {
      console.error('Failed to send early departure alert:', error)
    }
  }

  /**
   * Send absence alerts for employees who haven't checked in
   */
  async sendAbsenceAlerts(): Promise<void> {
    try {
      const admins = await this.getActiveAdmins()
      const absentees = await this.getAbsentEmployees()

      if (absentees.length === 0) {
        console.log('No absent employees found')
        return
      }

      const message = this.formatAbsenceAlert(absentees)

      for (const admin of admins) {
        await this.sendToAdmin(admin, message, { parseMode: 'Markdown' })
      }

      await this.logNotification('system', 'absence_alert', `${absentees.length} employees absent`)

    } catch (error) {
      console.error('Failed to send absence alerts:', error)
    }
  }

  /**
   * Send weekly summary to admins
   */
  async sendWeeklySummary(): Promise<void> {
    try {
      const admins = await this.getActiveAdmins()
      const weeklyData = await this.generateWeeklyReport()
      const message = this.formatWeeklySummary(weeklyData)

      for (const admin of admins) {
        await this.sendToAdmin(admin, message, { parseMode: 'Markdown' })
      }

      await this.logNotification('system', 'weekly_summary', 'Weekly summary sent to admins')

    } catch (error) {
      console.error('Failed to send weekly summary:', error)
    }
  }

  /**
   * Send monthly summary to admins
   */
  async sendMonthlySummary(): Promise<void> {
    try {
      const admins = await this.getActiveAdmins()
      const monthlyData = await this.generateMonthlyReport()
      const message = this.formatMonthlySummary(monthlyData)

      for (const admin of admins) {
        await this.sendToAdmin(admin, message, { parseMode: 'Markdown' })
      }

      await this.logNotification('system', 'monthly_summary', 'Monthly summary sent to admins')

    } catch (error) {
      console.error('Failed to send monthly summary:', error)
    }
  }

  /**
   * Send system health alerts
   */
  async sendHealthAlert(level: 'warning' | 'error' | 'critical', message: string, details?: any): Promise<void> {
    try {
      const admins = await this.getActiveAdmins()
      const alertMessage = this.formatHealthAlert(level, message, details)

      for (const admin of admins) {
        await this.sendToAdmin(admin, alertMessage, { parseMode: 'Markdown' })
      }

      await this.logNotification('system', `health_alert_${level}`, message)

    } catch (error) {
      console.error('Failed to send health alert:', error)
    }
  }

  /**
   * Send reminder notifications to employees
   */
  async sendEmployeeReminder(employee: Employee, type: 'checkout_reminder' | 'late_warning'): Promise<void> {
    try {
      let message = ''
      
      switch (type) {
        case 'checkout_reminder':
          message = '🕐 **Check-out Reminder**\n\n' +
            'You are still checked in. Don\'t forget to check out when you leave the office!\n\n' +
            '📍 Share your location to check out.'
          break
        case 'late_warning':
          message = '⏰ **Late Check-in Warning**\n\n' +
            'Work hours started at 9:00 AM. Please check in as soon as you arrive at the office.\n\n' +
            '📍 Share your location to check in.'
          break
      }

      await this.sendToEmployee(employee, message, { parseMode: 'Markdown' })
      await this.logNotification(employee.telegramId, type, message.substring(0, 100))

    } catch (error) {
      console.error('Failed to send employee reminder:', error)
    }
  }

  /**
   * Send custom notification to specific user
   */
  async sendCustomNotification(
    recipientId: string, 
    message: string, 
    options: NotificationOptions = {}
  ): Promise<boolean> {
    try {
      await this.bot.getBot().telegram.sendMessage(recipientId, message, {
        parse_mode: options.parseMode || 'Markdown',
        disable_notification: options.silentNotification,
        reply_markup: options.replyMarkup
      })

      await this.logNotification(recipientId, 'custom', message.substring(0, 100))
      return true

    } catch (error) {
      console.error(`Failed to send custom notification to ${recipientId}:`, error)
      await this.logNotification(recipientId, 'custom', message.substring(0, 100), false)
      return false
    }
  }

  /**
   * Broadcast message to all employees
   */
  async broadcastToAllEmployees(message: string, options: NotificationOptions = {}): Promise<void> {
    try {
      const employees = await prisma.employee.findMany({ where: { isActive: true } })
      
      const results = await Promise.allSettled(
        employees.map(emp => this.sendToEmployee(emp, message, options))
      )

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      await this.logNotification(
        'system', 
        'broadcast_employees', 
        `Broadcast sent to ${successful}/${employees.length} employees`,
        successful > 0
      )

      console.log(`Broadcast to employees: ${successful} successful, ${failed} failed`)

    } catch (error) {
      console.error('Failed to broadcast to employees:', error)
    }
  }

  /**
   * Broadcast message to all admins
   */
  async broadcastToAllAdmins(message: string, options: NotificationOptions = {}): Promise<void> {
    try {
      const admins = await this.getActiveAdmins()
      
      const results = await Promise.allSettled(
        admins.map(admin => this.sendToAdmin(admin, message, options))
      )

      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      await this.logNotification(
        'system', 
        'broadcast_admins', 
        `Broadcast sent to ${successful}/${admins.length} admins`,
        successful > 0
      )

      console.log(`Broadcast to admins: ${successful} successful, ${failed} failed`)

    } catch (error) {
      console.error('Failed to broadcast to admins:', error)
    }
  }

  // ============ PRIVATE HELPER METHODS ============

  private async sendToEmployee(employee: Employee, message: string, options: NotificationOptions = {}): Promise<void> {
    await this.bot.getBot().telegram.sendMessage(employee.telegramId, message, {
      parse_mode: options.parseMode || 'Markdown',
      disable_notification: options.silentNotification,
      reply_markup: options.replyMarkup
    })
  }

  private async sendToAdmin(admin: Admin, message: string, options: NotificationOptions = {}): Promise<void> {
    await this.bot.getBot().telegram.sendMessage(admin.telegramId, message, {
      parse_mode: options.parseMode || 'Markdown',
      disable_notification: options.silentNotification,
      reply_markup: options.replyMarkup
    })
  }

  private async getActiveAdmins(): Promise<Admin[]> {
    return await prisma.admin.findMany({ where: { isActive: true } })
  }

  private async generateDailyReport(): Promise<DailyReportData> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const totalEmployees = await prisma.employee.count({ where: { isActive: true } })
    
    const todayRecords = await prisma.attendanceRecord.findMany({
      where: { date: today },
      include: { employee: true }
    })

    const checkedIn = todayRecords.filter(r => r.checkInTime).length
    const checkedOut = todayRecords.filter(r => r.checkOutTime).length
    const lateCheckins = todayRecords.filter(r => r.isLate).length
    const earlyCheckouts = todayRecords.filter(r => r.isEarlyCheckout).length

    // Get absentees
    const checkedInEmployeeIds = todayRecords.map(r => r.employeeId)
    const absentees = await prisma.employee.findMany({
      where: {
        isActive: true,
        id: { notIn: checkedInEmployeeIds }
      }
    })

    // Get late employees
    const lateEmployees = todayRecords
      .filter(r => r.isLate)
      .map(r => r.employee)

    // Get early departures
    const earlyDepartures = todayRecords
      .filter(r => r.isEarlyCheckout)
      .map(r => r.employee)

    // Calculate average working hours
    const completedRecords = todayRecords.filter(r => r.workingHours !== null)
    const averageWorkingHours = completedRecords.length > 0
      ? completedRecords.reduce((sum, r) => sum + (r.workingHours || 0), 0) / completedRecords.length
      : 0

    return {
      date: today,
      totalEmployees,
      checkedIn,
      checkedOut,
      lateCheckins,
      earlyCheckouts,
      absentees,
      lateEmployees,
      earlyDepartures,
      attendanceRate: totalEmployees > 0 ? (checkedIn / totalEmployees) * 100 : 0,
      averageWorkingHours
    }
  }

  private async generateWeeklyReport(): Promise<any> {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    startDate.setHours(0, 0, 0, 0)

    const records = await prisma.attendanceRecord.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: { employee: true }
    })

    // Calculate weekly statistics
    const totalRecords = records.length
    const lateRecords = records.filter(r => r.isLate).length
    const earlyRecords = records.filter(r => r.isEarlyCheckout).length
    const completedRecords = records.filter(r => r.status === 'COMPLETE').length

    return {
      period: { start: startDate, end: endDate },
      totalRecords,
      lateRecords,
      earlyRecords,
      completedRecords,
      attendanceRate: totalRecords > 0 ? (completedRecords / totalRecords) * 100 : 0
    }
  }

  private async generateMonthlyReport(): Promise<any> {
    const endDate = new Date()
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)

    const records = await prisma.attendanceRecord.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: { employee: true }
    })

    // Calculate monthly statistics
    const totalRecords = records.length
    const lateRecords = records.filter(r => r.isLate).length
    const earlyRecords = records.filter(r => r.isEarlyCheckout).length
    const completedRecords = records.filter(r => r.status === 'COMPLETE').length

    return {
      period: { start: startDate, end: endDate },
      totalRecords,
      lateRecords,
      earlyRecords,
      completedRecords,
      attendanceRate: totalRecords > 0 ? (completedRecords / totalRecords) * 100 : 0
    }
  }

  private async getAbsentEmployees(): Promise<Employee[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const cutoffTime = new Date()
    cutoffTime.setHours(10, 0, 0, 0) // 10:00 AM cutoff

    if (new Date() < cutoffTime) {
      return [] // Too early to determine absences
    }

    const checkedInToday = await prisma.attendanceRecord.findMany({
      where: {
        date: today,
        checkInTime: { not: null }
      },
      select: { employeeId: true }
    })

    const checkedInEmployeeIds = checkedInToday.map(r => r.employeeId)

    return await prisma.employee.findMany({
      where: {
        isActive: true,
        id: { notIn: checkedInEmployeeIds }
      }
    })
  }

  private convertToSummaryData(reportData: DailyReportData): DailySummaryData {
    return {
      date: reportData.date,
      totalEmployees: reportData.totalEmployees,
      checkedIn: reportData.checkedIn,
      checkedOut: reportData.checkedOut,
      lateCheckins: reportData.lateCheckins,
      earlyCheckouts: reportData.earlyCheckouts,
      attendanceRate: reportData.attendanceRate
    }
  }

  private formatDetailedReport(data: DailyReportData): string {
    let message = `📊 **Detailed Daily Report**\n`
    message += `📅 ${data.date.toLocaleDateString()}\n\n`

    message += `📈 **Statistics:**\n`
    message += `• Total Employees: ${data.totalEmployees}\n`
    message += `• Checked In: ${data.checkedIn} (${data.attendanceRate.toFixed(1)}%)\n`
    message += `• Checked Out: ${data.checkedOut}\n`
    message += `• Late Arrivals: ${data.lateCheckins}\n`
    message += `• Early Departures: ${data.earlyCheckouts}\n`
    message += `• Average Hours: ${data.averageWorkingHours.toFixed(1)}h\n\n`

    if (data.absentees.length > 0) {
      message += `❌ **Absent (${data.absentees.length}):**\n`
      data.absentees.slice(0, 5).forEach(emp => {
        message += `• ${emp.firstName} ${emp.lastName || ''}\n`
      })
      if (data.absentees.length > 5) {
        message += `• ... and ${data.absentees.length - 5} more\n`
      }
      message += `\n`
    }

    if (data.lateEmployees.length > 0) {
      message += `⏰ **Late Arrivals (${data.lateEmployees.length}):**\n`
      data.lateEmployees.slice(0, 5).forEach(emp => {
        message += `• ${emp.firstName} ${emp.lastName || ''}\n`
      })
      if (data.lateEmployees.length > 5) {
        message += `• ... and ${data.lateEmployees.length - 5} more\n`
      }
      message += `\n`
    }

    if (data.earlyDepartures.length > 0) {
      message += `🏃 **Early Departures (${data.earlyDepartures.length}):**\n`
      data.earlyDepartures.slice(0, 5).forEach(emp => {
        message += `• ${emp.firstName} ${emp.lastName || ''}\n`
      })
      if (data.earlyDepartures.length > 5) {
        message += `• ... and ${data.earlyDepartures.length - 5} more\n`
      }
    }

    return message
  }

  private formatAbsenceAlert(absentees: Employee[]): string {
    let message = `❌ **Absence Alert**\n\n`
    message += `${absentees.length} employee(s) have not checked in yet:\n\n`

    absentees.slice(0, 10).forEach((emp, index) => {
      message += `${index + 1}. ${emp.firstName} ${emp.lastName || ''}\n`
      if (emp.username) message += `   @${emp.username}\n`
    })

    if (absentees.length > 10) {
      message += `\n... and ${absentees.length - 10} more employees\n`
    }

    message += `\n🕐 Time: ${new Date().toLocaleTimeString()}`

    return message
  }

  private formatWeeklySummary(data: any): string {
    return `📊 **Weekly Summary**\n\n` +
      `📅 ${data.period.start.toLocaleDateString()} - ${data.period.end.toLocaleDateString()}\n\n` +
      `📈 **Statistics:**\n` +
      `• Total Records: ${data.totalRecords}\n` +
      `• Completed Days: ${data.completedRecords}\n` +
      `• Late Arrivals: ${data.lateRecords}\n` +
      `• Early Departures: ${data.earlyRecords}\n` +
      `• Attendance Rate: ${data.attendanceRate.toFixed(1)}%`
  }

  private formatMonthlySummary(data: any): string {
    return `📊 **Monthly Summary**\n\n` +
      `📅 ${data.period.start.toLocaleDateString()} - ${data.period.end.toLocaleDateString()}\n\n` +
      `📈 **Statistics:**\n` +
      `• Total Records: ${data.totalRecords}\n` +
      `• Completed Days: ${data.completedRecords}\n` +
      `• Late Arrivals: ${data.lateRecords}\n` +
      `• Early Departures: ${data.earlyRecords}\n` +
      `• Attendance Rate: ${data.attendanceRate.toFixed(1)}%`
  }

  private formatHealthAlert(level: string, message: string, details?: any): string {
    const icons = { warning: '⚠️', error: '❌', critical: '🚨' }
    const icon = (icons as Record<string, string>)[level] || '⚠️'

    let alert = `${icon} **System Health Alert**\n\n`
    alert += `**Level:** ${level.toUpperCase()}\n`
    alert += `**Message:** ${message}\n`
    alert += `**Time:** ${new Date().toLocaleString()}\n`

    if (details) {
      alert += `\n**Details:**\n\`\`\`\n${JSON.stringify(details, null, 2)}\n\`\`\``
    }

    return alert
  }

  private async logNotification(
    recipient: string, 
    type: string, 
    message: string, 
    success: boolean = true
  ): Promise<void> {
    try {
      await prisma.notificationLog.create({
        data: {
          type,
          recipient,
          message: message.substring(0, 500),
          success
        }
      })
    } catch (error) {
      console.error('Failed to log notification:', error)
    }
  }
}

// Singleton instance
let notificationServiceInstance: NotificationService | null = null

export const getNotificationService = (): NotificationService => {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService()
  }
  return notificationServiceInstance
}

export default NotificationService 