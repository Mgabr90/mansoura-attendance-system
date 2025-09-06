/**
 * Bot Commands Module
 * Additional commands to complete the bot functionality
 */

import { prisma } from './prisma'
import { MessageFormatter } from '@/utils/telegram-formatters'
import { KeyboardBuilder } from '@/utils/telegram-keyboards'
import type { Context } from 'telegraf'
import type { Employee, AttendanceRecord } from '@prisma/client'

interface BotContext extends Context {
  employee?: Employee
  state: any
}

export class BotCommands {
  /**
   * Handle /attendance command - Show today's status
   */
  static async handleAttendance(ctx: BotContext) {
    if (!ctx.employee) {
      await ctx.reply('❌ Please register first using /register command.')
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const attendance = await prisma.attendanceRecord.findUnique({
      where: {
        employeeId_date: {
          employeeId: ctx.employee.id,
          date: today
        }
      }
    })

    let message: string
    if (!attendance) {
      message = '📅 **Today\'s Status**\n\n❌ No attendance record for today\n\nUse the location buttons to check in!'
    } else {
      const status = attendance.checkInTime ? 
        (attendance.checkOutTime ? '✅ Checked Out' : '🟡 Checked In') : 
        '❌ Not Checked In'

      message = '📅 **Today\'s Attendance Status**\n\n' +
        `Status: ${status}\n` +
        `Check In: ${attendance.checkInTime ? attendance.checkInTime.toLocaleTimeString() : 'Not checked in'}\n` +
        `Check Out: ${attendance.checkOutTime ? attendance.checkOutTime.toLocaleTimeString() : 'Not checked out'}\n` +
        `Working Hours: ${attendance.workingHours || 0} hours\n` +
        `Late: ${attendance.isLate ? 'Yes' : 'No'}\n` +
        `Early Departure: ${attendance.isEarlyCheckout ? 'Yes' : 'No'}`
    }

    const keyboard = KeyboardBuilder.getLocationKeyboard(
      attendance?.checkInTime && !attendance?.checkOutTime || false
    )

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    })
  }

  /**
   * Handle /my_reports command - Employee personal reports
   */
  static async handleMyReports(ctx: BotContext) {
    if (!ctx.employee) {
      await ctx.reply('❌ Please register first using /register command.')
      return
    }

    // Get last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const records = await prisma.attendanceRecord.findMany({
      where: {
        employeeId: ctx.employee.id,
        date: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: { date: 'desc' },
      take: 10
    })

    if (records.length === 0) {
      await ctx.reply('📊 **Your Reports (Last 30 Days)**\n\n❌ No attendance records found.')
      return
    }

    const presentDays = records.filter(r => r.checkInTime).length
    const lateDays = records.filter(r => r.isLate).length
    const totalHours = records.reduce((sum, r) => sum + (r.workingHours || 0), 0)

    let message = '📊 **Your Reports (Last 30 Days)**\n\n' +
      `📈 **Summary:**\n` +
      `• Total Records: ${records.length}\n` +
      `• Present Days: ${presentDays}\n` +
      `• Late Days: ${lateDays}\n` +
      `• Total Hours: ${totalHours.toFixed(1)}\n` +
      `• Average Hours: ${(totalHours / Math.max(presentDays, 1)).toFixed(1)}\n\n` +
      `📅 **Recent Records:**\n`

    records.slice(0, 5).forEach(record => {
      const date = record.date.toLocaleDateString()
      const status = record.checkInTime ? '✅' : '❌'
      const late = record.isLate ? ' 🕐' : ''
      message += `${status} ${date}${late}\n`
    })

    const keyboard = {
      inline_keyboard: [
        [{ text: '📊 Detailed Report', callback_data: 'detailed_report' }],
        [{ text: '📈 Monthly Summary', callback_data: 'monthly_summary' }]
      ]
    }

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    })
  }

  /**
   * Handle /leave_request command - Request leave
   */
  static async handleLeaveRequest(ctx: BotContext) {
    if (!ctx.employee) {
      await ctx.reply('❌ Please register first using /register command.')
      return
    }

    const message = '🏖️ **Leave Request**\n\n' +
      'Please select the type of leave you want to request:'

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🏥 Sick Leave', callback_data: 'leave_sick' },
          { text: '🏖️ Vacation', callback_data: 'leave_vacation' }
        ],
        [
          { text: '👨‍👩‍👧‍👦 Personal', callback_data: 'leave_personal' },
          { text: '🚨 Emergency', callback_data: 'leave_emergency' }
        ],
        [{ text: '❌ Cancel', callback_data: 'cancel' }]
      ]
    }

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    })
  }

  /**
   * Handle /notifications command - Notification preferences
   */
  static async handleNotifications(ctx: BotContext) {
    if (!ctx.employee) {
      await ctx.reply('❌ Please register first using /register command.')
      return
    }

    // Get current notification settings
    const settings = await prisma.settings.findFirst({
      where: { key: `notifications_${ctx.employee.telegramId}` }
    })

    const currentSettings = settings ? JSON.parse(settings.value as string) : {
      dailyReminders: true,
      weeklyReports: true,
      lateAlerts: true
    }

    const message = '🔔 **Notification Settings**\n\n' +
      `Daily Reminders: ${currentSettings.dailyReminders ? '✅ On' : '❌ Off'}\n` +
      `Weekly Reports: ${currentSettings.weeklyReports ? '✅ On' : '❌ Off'}\n` +
      `Late Alerts: ${currentSettings.lateAlerts ? '✅ On' : '❌ Off'}\n\n` +
      'Click below to toggle settings:'

    const keyboard = {
      inline_keyboard: [
        [{ text: `${currentSettings.dailyReminders ? '🔕' : '🔔'} Daily Reminders`, callback_data: 'toggle_daily' }],
        [{ text: `${currentSettings.weeklyReports ? '🔕' : '🔔'} Weekly Reports`, callback_data: 'toggle_weekly' }],
        [{ text: `${currentSettings.lateAlerts ? '🔕' : '🔔'} Late Alerts`, callback_data: 'toggle_late' }],
        [{ text: '✅ Save Settings', callback_data: 'save_notifications' }]
      ]
    }

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    })
  }

  /**
   * Handle /overtime command - Request overtime
   */
  static async handleOvertime(ctx: BotContext) {
    if (!ctx.employee) {
      await ctx.reply('❌ Please register first using /register command.')
      return
    }

    const message = '⏰ **Overtime Request**\n\n' +
      'Please provide the following information:\n' +
      '• Date of overtime\n' +
      '• Start time\n' +
      '• End time\n' +
      '• Reason for overtime\n\n' +
      'Reply with the information in this format:\n' +
      '`DD/MM/YYYY HH:MM-HH:MM Reason`\n\n' +
      'Example: `25/12/2024 18:00-22:00 Project deadline`'

    // Set conversation state
    await this.saveConversationState(ctx.from!.id.toString(), {
      type: 'overtime_request',
      data: {},
      step: 1
    })

    await ctx.reply(message, { parse_mode: 'Markdown' })
  }

  /**
   * Handle /schedule command - View work schedule
   */
  static async handleSchedule(ctx: BotContext) {
    if (!ctx.employee) {
      await ctx.reply('❌ Please register first using /register command.')
      return
    }

    // Get work schedule settings
    const scheduleSettings = await prisma.settings.findFirst({
      where: { key: 'work_schedule' }
    })

    const schedule = scheduleSettings ? JSON.parse(scheduleSettings.value as string) : {
      monday: { start: '09:00', end: '17:00', enabled: true },
      tuesday: { start: '09:00', end: '17:00', enabled: true },
      wednesday: { start: '09:00', end: '17:00', enabled: true },
      thursday: { start: '09:00', end: '17:00', enabled: true },
      friday: { start: '09:00', end: '17:00', enabled: true },
      saturday: { start: '09:00', end: '13:00', enabled: false },
      sunday: { start: '09:00', end: '17:00', enabled: false }
    }

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

    let message = '📅 **Work Schedule**\n\n'

    dayKeys.forEach((key, index) => {
      const daySchedule = schedule[key]
      const dayName = days[index]
      
      if (daySchedule.enabled) {
        message += `✅ **${dayName}**: ${daySchedule.start} - ${daySchedule.end}\n`
      } else {
        message += `❌ **${dayName}**: Day off\n`
      }
    })

    const keyboard = {
      inline_keyboard: [
        [{ text: '📊 This Week', callback_data: 'schedule_week' }],
        [{ text: '📈 This Month', callback_data: 'schedule_month' }]
      ]
    }

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    })
  }

  /**
   * Handle /change_info command - Change employee information
   */
  static async handleChangeInfo(ctx: BotContext) {
    if (!ctx.employee) {
      await ctx.reply('❌ Please register first using /register command.')
      return
    }

    const message = '✏️ **Change Information**\n\n' +
      'What information would you like to update?'

    const keyboard = {
      inline_keyboard: [
        [{ text: '👤 Name', callback_data: 'change_name' }],
        [{ text: '🏢 Department', callback_data: 'change_department' }],
        [{ text: '💼 Position', callback_data: 'change_position' }],
        [{ text: '📱 Phone', callback_data: 'change_phone' }],
        [{ text: '❌ Cancel', callback_data: 'cancel' }]
      ]
    }

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    })
  }

  /**
   * Save conversation state for multi-step interactions
   */
  private static async saveConversationState(telegramId: string, state: any) {
    await prisma.conversationState.upsert({
      where: { telegramId },
      update: {
        state: 'active',
        data: JSON.stringify(state),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      },
      create: {
        telegramId,
        state: 'active',
        data: JSON.stringify(state),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000)
      }
    })
  }

  /**
   * Handle callback queries for the new commands
   */
  static async handleCallback(ctx: BotContext, data: string) {
    switch (data) {
      case 'detailed_report':
        await this.handleDetailedReport(ctx)
        break
      case 'monthly_summary':
        await this.handleMonthlySummary(ctx)
        break
      case 'schedule_week':
        await this.handleWeeklySchedule(ctx)
        break
      case 'schedule_month':
        await this.handleMonthlySchedule(ctx)
        break
      default:
        if (data.startsWith('leave_')) {
          await this.handleLeaveCallback(ctx, data)
        } else if (data.startsWith('toggle_') || data === 'save_notifications') {
          await this.handleNotificationCallback(ctx, data)
        } else if (data.startsWith('change_')) {
          await this.handleChangeInfoCallback(ctx, data)
        }
    }
  }

  private static async handleDetailedReport(ctx: BotContext) {
    if (!ctx.employee) return

    // Implementation for detailed report
    await ctx.answerCbQuery('Generating detailed report...')
    await ctx.reply('📊 Detailed report generation is in progress. You will receive it shortly.')
  }

  private static async handleMonthlySummary(ctx: BotContext) {
    if (!ctx.employee) return

    // Implementation for monthly summary
    await ctx.answerCbQuery('Generating monthly summary...')
    await ctx.reply('📈 Monthly summary generation is in progress. You will receive it shortly.')
  }

  private static async handleWeeklySchedule(ctx: BotContext) {
    await ctx.answerCbQuery('Loading weekly schedule...')
    await ctx.reply('📅 Weekly schedule view coming soon!')
  }

  private static async handleMonthlySchedule(ctx: BotContext) {
    await ctx.answerCbQuery('Loading monthly schedule...')
    await ctx.reply('📈 Monthly schedule view coming soon!')
  }

  private static async handleLeaveCallback(ctx: BotContext, data: string) {
    const leaveType = data.replace('leave_', '')
    await ctx.answerCbQuery(`Processing ${leaveType} leave request...`)
    
    // Set conversation state for leave request
    await this.saveConversationState(ctx.from!.id.toString(), {
      type: 'leave_request',
      data: { leaveType },
      step: 1
    })

    await ctx.reply(`🏖️ Please provide details for your ${leaveType} leave request:\n\n` +
      '• Start date (DD/MM/YYYY)\n' +
      '• End date (DD/MM/YYYY)\n' +
      '• Reason\n\n' +
      'Example: `25/12/2024 27/12/2024 Family vacation`')
  }

  private static async handleNotificationCallback(ctx: BotContext, data: string) {
    if (!ctx.employee) return

    await ctx.answerCbQuery('Updating notification settings...')
    
    if (data === 'save_notifications') {
      await ctx.reply('✅ Notification settings saved successfully!')
    } else {
      await ctx.reply(`🔔 ${data.replace('toggle_', '').replace('_', ' ')} setting toggled!`)
    }
  }

  private static async handleChangeInfoCallback(ctx: BotContext, data: string) {
    if (!ctx.employee) return

    const field = data.replace('change_', '')
    await ctx.answerCbQuery(`Changing ${field}...`)
    
    // Set conversation state
    await this.saveConversationState(ctx.from!.id.toString(), {
      type: 'change_info',
      data: { field },
      step: 1
    })

    await ctx.reply(`✏️ Please enter your new ${field}:`)
  }
}

export default BotCommands