import { Telegraf, Context } from 'telegraf'
import { message } from 'telegraf/filters'
import type { Update } from 'telegraf/types'
import { prisma } from './prisma'
import { validateLocation, calculateDistance } from '@/utils/location'
import { formatDateTimeForDisplay, isLateCheckIn, isEarlyCheckOut } from '@/utils/date'
import { MessageFormatter, type DailySummaryData, type EmployeeInfo } from '@/utils/telegram-formatters'
import { KeyboardBuilder } from '@/utils/telegram-keyboards'
import BotCommands from './bot-commands'
import type { 
  TelegramUser, 
  TelegramLocation, 
  TelegramContact,
  Employee,
  AttendanceRecord 
} from '@/types'

// Extend Telegraf Context with our custom properties
interface BotContext extends Context {
  employee?: Employee
  state: any
}

interface ConversationState {
  type: string
  data: any
  step?: number
}

class AttendanceBot {
  private bot: Telegraf<BotContext>
  private isInitialized = false

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is required')
    }

    this.bot = new Telegraf<BotContext>(token)
    this.setupMiddleware()
    this.setupHandlers()
  }

  private setupMiddleware() {
    // User authentication middleware
    this.bot.use(async (ctx, next) => {
      if (ctx.from) {
        // Load employee data if exists
        const employee = await prisma.employee.findUnique({
          where: { telegramId: ctx.from.id.toString() }
        })
        
        if (employee) {
          ctx.employee = employee
        }

        // Load conversation state if exists
        const state = await prisma.conversationState.findUnique({
          where: { telegramId: ctx.from.id.toString() }
        })

        if (state && state.expiresAt > new Date()) {
          ctx.state = JSON.parse(state.data as string)
        }
      }
      return next()
    })

    // Error handling middleware
    this.bot.catch((err, ctx) => {
      console.error('Bot error:', err)
      this.logServerActivity('bot_error', err instanceof Error ? err.message : String(err), { userId: ctx.from?.id })
      ctx.reply('❌ An error occurred. Please try again or contact support.')
    })
  }

  private setupHandlers() {
    // Employee Commands
    this.bot.start((ctx) => this.handleStart(ctx))
    this.bot.help((ctx) => this.handleHelp(ctx))
    this.bot.command('register', (ctx) => this.handleRegister(ctx))
    this.bot.command('status', (ctx) => this.handleStatus(ctx))
    this.bot.command('report', (ctx) => this.handleReport(ctx))
    this.bot.command('attendance', (ctx) => BotCommands.handleAttendance(ctx))
    this.bot.command('my_reports', (ctx) => BotCommands.handleMyReports(ctx))
    this.bot.command('leave_request', (ctx) => BotCommands.handleLeaveRequest(ctx))
    this.bot.command('notifications', (ctx) => BotCommands.handleNotifications(ctx))
    this.bot.command('overtime', (ctx) => BotCommands.handleOvertime(ctx))
    this.bot.command('schedule', (ctx) => BotCommands.handleSchedule(ctx))
    this.bot.command('change_info', (ctx) => BotCommands.handleChangeInfo(ctx))
    
    // Admin Commands  
    this.bot.command('admin', (ctx) => this.handleAdminPanel(ctx))
    this.bot.command('add_admin', (ctx) => this.handleAddAdmin(ctx))
    this.bot.command('list_employees', (ctx) => this.handleListEmployees(ctx))
    this.bot.command('exceptional_hours', (ctx) => this.handleExceptionalHours(ctx))
    this.bot.command('admin_report', (ctx) => this.handleAdminReport(ctx))
    this.bot.command('server_status', (ctx) => this.handleServerStatus(ctx))
    
    // Webhook Commands
    this.bot.command('set_webhook', (ctx) => this.handleSetWebhook(ctx))
    this.bot.command('webhook_info', (ctx) => this.handleWebhookInfo(ctx))
    this.bot.command('delete_webhook', (ctx) => this.handleDeleteWebhook(ctx))
    
    // Location and contact handlers
    this.bot.on(message('location'), (ctx) => this.handleLocation(ctx))
    this.bot.on(message('contact'), (ctx) => this.handleContact(ctx))
    
    // Text messages and callbacks
    this.bot.on(message('text'), (ctx) => this.handleTextMessage(ctx))
    this.bot.on('callback_query', (ctx) => this.handleCallbackQuery(ctx))
  }

  // ============ EMPLOYEE COMMANDS ============

  private async handleStart(ctx: BotContext) {
    const user = ctx.from!
    const employee = ctx.employee

    let message: string
    let keyboard: any

    if (employee) {
      // Check current attendance status
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const attendance = await prisma.attendanceRecord.findUnique({
        where: {
          employeeId_date: {
            employeeId: employee.id,
            date: today
          }
        }
      })

      const isCheckedIn = attendance && attendance.checkInTime && !attendance.checkOutTime

      message = MessageFormatter.formatWelcomeMessage(employee.firstName, true)
      keyboard = KeyboardBuilder.getLocationKeyboard(isCheckedIn || false)
    } else {
      message = MessageFormatter.formatWelcomeMessage(user.first_name, false)
      keyboard = KeyboardBuilder.getRegistrationKeyboard()
    }

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard as any
    })

    await this.logServerActivity('command_start', `User ${user.id} started bot`)
  }

  private async handleRegister(ctx: BotContext) {
    if (ctx.employee) {
      await ctx.reply('✅ You are already registered!')
      return
    }

    const keyboard = KeyboardBuilder.getContactKeyboard()
    await ctx.reply(
      '📝 Please share your contact information by clicking the "Share Contact" button below.',
      {
        parse_mode: 'Markdown',
        reply_markup: keyboard as any
      }
    )
  }

  private async handleContact(ctx: BotContext) {
    const contact = (ctx.message as any)?.contact
    const user = ctx.from!

    if (contact.user_id !== user.id) {
      await ctx.reply('❌ Please share your own contact information.')
      return
    }

    try {
      const employee = await prisma.employee.create({
        data: {
          telegramId: user.id.toString(),
          firstName: contact.first_name,
          lastName: contact.last_name || undefined,
          username: user.username || undefined,
          phoneNumber: contact.phone_number || undefined,
        }
      })

      const keyboard = KeyboardBuilder.getLocationKeyboard(false)
      await ctx.reply(
        '✅ **Registration Successful!**\n\n' +
        'Welcome to the Enhanced Attendance System!\n' +
        'You can now use the location sharing buttons to check in and out.',
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard as any
        }
      )

      await this.logServerActivity('employee_registered', `User ${user.id} registered`)
    } catch (error) {
      console.error('Registration error:', error)
      await ctx.reply('❌ Registration failed. Please try again later.')
    }
  }

  private async handleStatus(ctx: BotContext) {
    if (!ctx.employee) {
      await ctx.reply(MessageFormatter.formatErrorMessage('not_registered'))
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

    const message = MessageFormatter.formatAttendanceStatus(
      new Date(),
      attendance?.checkInTime || undefined,
      attendance?.checkOutTime || undefined,
      attendance?.isLate || false,
      attendance?.isEarlyCheckout || false,
      attendance?.workingHours || undefined
    )

    await ctx.reply(message, { parse_mode: 'Markdown' })
  }

  private async handleReport(ctx: BotContext) {
    if (!ctx.employee) {
      await ctx.reply(MessageFormatter.formatErrorMessage('not_registered'))
      return
    }

    const periodDays = 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)
    startDate.setHours(0, 0, 0, 0)

    const records = await prisma.attendanceRecord.findMany({
      where: {
        employeeId: ctx.employee.id,
        date: {
          gte: startDate
        }
      },
      orderBy: { date: 'desc' }
    })

    const employeeInfo: EmployeeInfo = {
      firstName: ctx.employee.firstName,
      lastName: ctx.employee.lastName || undefined,
      username: ctx.employee.username || undefined,
      telegramId: ctx.employee.telegramId
    }

    const reportData = records.map(record => ({
      date: record.date,
      checkInTime: record.checkInTime || undefined,
      checkOutTime: record.checkOutTime || undefined,
      isLate: record.isLate,
      isEarly: record.isEarlyCheckout,
      workingHours: record.workingHours || undefined
    }))

    const message = MessageFormatter.formatEmployeeReport(employeeInfo, reportData, periodDays)
    await ctx.reply(message, { parse_mode: 'Markdown' })
  }

  // ============ LOCATION HANDLING ============

  private async handleLocation(ctx: BotContext) {
    if (!ctx.employee) {
      await ctx.reply(MessageFormatter.formatErrorMessage('not_registered'))
      return
    }

    const location = (ctx.message as any)?.location
    const { isValid, distance } = await validateLocation(location.latitude, location.longitude)

    if (!isValid) {
      await ctx.reply(MessageFormatter.formatLocationDeniedMessage(distance))
      return
    }

    // Check current attendance status
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

    if (!attendance || !attendance.checkInTime) {
      await this.handleCheckIn(ctx, location, distance)
    } else if (!attendance.checkOutTime) {
      await this.handleCheckOut(ctx, location, distance, attendance)
    } else {
      await ctx.reply('✅ You have already completed your attendance for today.')
    }
  }

  private async handleCheckIn(ctx: BotContext, location: TelegramLocation, distance: number) {
    const employee = ctx.employee!
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const workStart = new Date()
    workStart.setHours(9, 0, 0, 0) // 9:00 AM

    const isLate = now > workStart

    try {
      const attendance = await prisma.attendanceRecord.create({
        data: {
          employeeId: employee.id,
          date: today,
          checkInTime: now,
          checkInLatitude: location.latitude,
          checkInLongitude: location.longitude,
          checkInDistance: distance,
          isLate,
          status: 'INCOMPLETE'
        }
      })

      const timeStr = formatDateTimeForDisplay(now)
      const message = MessageFormatter.formatCheckInSuccess(timeStr, isLate, distance)
      
      // Update keyboard to show check-out option
      const keyboard = KeyboardBuilder.getLocationKeyboard(true)
      
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard as any
      })

      // If late, ask for reason
      if (isLate) {
        await this.saveConversationState(ctx.from!.id.toString(), {
          type: 'late_reason',
          data: { attendanceId: attendance.id },
          step: 1
        })

        await ctx.reply(
          '⏰ You are checking in late. Please provide a reason:',
          {
            reply_markup: KeyboardBuilder.getReasonKeyboard('late') as any
          }
        )

        // Send alert to admins
        await this.sendLateAlertToAdmins(employee, now)
      }

      await this.logServerActivity('check_in', `Employee ${employee.id} checked in`, {
        distance,
        isLate,
        time: now.toISOString()
      })

    } catch (error) {
      console.error('Check-in error:', error)
      await ctx.reply('❌ Check-in failed. Please try again.')
    }
  }

  private async handleCheckOut(ctx: BotContext, location: TelegramLocation, distance: number, attendance: AttendanceRecord) {
    const employee = ctx.employee!
    const now = new Date()
    
    const workEnd = new Date()
    workEnd.setHours(17, 0, 0, 0) // 5:00 PM

    const isEarly = now < workEnd

    // Calculate working hours
    const workingHours = attendance.checkInTime 
      ? (now.getTime() - attendance.checkInTime.getTime()) / (1000 * 60 * 60)
      : 0

    try {
      await prisma.attendanceRecord.update({
        where: { id: attendance.id },
        data: {
          checkOutTime: now,
          checkOutLatitude: location.latitude,
          checkOutLongitude: location.longitude,
          checkOutDistance: distance,
          isEarlyCheckout: isEarly,
          workingHours,
          status: 'COMPLETE'
        }
      })

      const timeStr = formatDateTimeForDisplay(now)
      const message = MessageFormatter.formatCheckOutSuccess(timeStr, isEarly, workingHours)
      
      // Update keyboard to show check-in option for next day
      const keyboard = KeyboardBuilder.getLocationKeyboard(false)
      
      await ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard as any
      })

      // If early, ask for reason
      if (isEarly) {
        await this.saveConversationState(ctx.from!.id.toString(), {
          type: 'early_reason',
          data: { attendanceId: attendance.id },
          step: 1
        })

        await ctx.reply(
          '⏰ You are checking out early. Please provide a reason:',
          {
            reply_markup: KeyboardBuilder.getReasonKeyboard('early') as any
          }
        )

        // Send alert to admins
        await this.sendEarlyDepartureAlertToAdmins(employee, now)
      }

      await this.logServerActivity('check_out', `Employee ${employee.id} checked out`, {
        distance,
        isEarly,
        workingHours,
        time: now.toISOString()
      })

    } catch (error) {
      console.error('Check-out error:', error)
      await ctx.reply('❌ Check-out failed. Please try again.')
    }
  }

  // ============ ADMIN COMMANDS ============

  private async handleAdminPanel(ctx: BotContext) {
    if (!await this.isAdmin(ctx.from!.id.toString())) {
      await ctx.reply(MessageFormatter.formatErrorMessage('permission_denied'))
      return
    }

    const summary = await this.getDailySummary()
    const message = MessageFormatter.formatAdminDashboard(summary)
    const keyboard = KeyboardBuilder.getAdminKeyboard()

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard as any
    })
  }

  private async handleAddAdmin(ctx: BotContext) {
    if (!await this.isAdmin(ctx.from!.id.toString())) {
      await ctx.reply(MessageFormatter.formatErrorMessage('permission_denied'))
      return
    }

    const args = ctx.msg.has('text') ? ctx.msg.text.split(' ').slice(1) : null
    if (!args || args.length === 0) {
      await ctx.reply(
        '❓ **Add Admin**\n\n' +
        'Usage: `/add_admin <telegram_id>`\n\n' +
        'Example: `/add_admin 123456789`',
        { parse_mode: 'Markdown' }
      )
      return
    }

    const telegramId = args[0]
    
    try {
      // Check if user exists as employee
      const employee = await prisma.employee.findUnique({
        where: { telegramId }
      })

      if (!employee) {
        await ctx.reply('❌ User not found. They must be registered as an employee first.')
        return
      }

      // Check if already admin
      const existingAdmin = await prisma.admin.findUnique({
        where: { telegramId }
      })

      if (existingAdmin) {
        await ctx.reply('⚠️ User is already an administrator.')
        return
      }

      // Add as admin
      await prisma.admin.create({
        data: {
          telegramId,
          firstName: employee.firstName,
          lastName: employee.lastName,
          username: employee.username,
          grantedBy: ctx.from!.id.toString()
        }
      })

      await ctx.reply(
        `✅ **Admin Added Successfully**\n\n` +
        `👤 **User:** ${employee.firstName} ${employee.lastName || ''}\n` +
        `🆔 **ID:** \`${telegramId}\``,
        { parse_mode: 'Markdown' }
      )

      await this.logServerActivity('admin_added', `Admin ${telegramId} added by ${ctx.from!.id}`)

    } catch (error) {
      console.error('Add admin error:', error)
      await ctx.reply('❌ Failed to add admin. Please try again.')
    }
  }

  private async handleListEmployees(ctx: BotContext) {
    if (!await this.isAdmin(ctx.from!.id.toString())) {
      await ctx.reply(MessageFormatter.formatErrorMessage('permission_denied'))
      return
    }

    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      orderBy: { firstName: 'asc' },
      take: 10
    })

    if (employees.length === 0) {
      await ctx.reply('📋 No registered employees found.')
      return
    }

    let message = '👥 **Registered Employees**\n\n'
    
    for (const employee of employees) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const attendance = await prisma.attendanceRecord.findUnique({
        where: {
          employeeId_date: {
            employeeId: employee.id,
            date: today
          }
        }
      })

      const status = attendance?.checkInTime 
        ? (attendance.checkOutTime ? '✅ Complete' : '🟡 Working')
        : '❌ Absent'

      message += `👤 **${employee.firstName} ${employee.lastName || ''}**\n`
      message += `📱 @${employee.username || 'N/A'}\n`
      message += `🆔 \`${employee.telegramId}\`\n`
      message += `📊 ${status}\n\n`
    }

    await ctx.reply(message, { parse_mode: 'Markdown' })
  }

  private async handleAdminReport(ctx: BotContext) {
    if (!await this.isAdmin(ctx.from!.id.toString())) {
      await ctx.reply(MessageFormatter.formatErrorMessage('permission_denied'))
      return
    }

    const summary = await this.getDailySummary()
    const message = MessageFormatter.formatDailySummary(summary)
    const keyboard = KeyboardBuilder.getReportsKeyboard()

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard as any
    })
  }

  private async handleServerStatus(ctx: BotContext) {
    if (!await this.isAdmin(ctx.from!.id.toString())) {
      await ctx.reply(MessageFormatter.formatErrorMessage('permission_denied'))
      return
    }

    const uptime = process.uptime()
    const memoryUsage = process.memoryUsage()
    
    const employeeCount = await prisma.employee.count({ where: { isActive: true } })
    const adminCount = await prisma.admin.count({ where: { isActive: true } })
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayRecords = await prisma.attendanceRecord.count({
      where: { date: today }
    })

    const message = `🖥️ **Server Status**

⏱️ **Uptime:** ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m
💾 **Memory:** ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB used
📊 **Database:** Connected ✅

👥 **Users:**
• Employees: ${employeeCount}
• Admins: ${adminCount}
• Today's Records: ${todayRecords}

🕐 **System Time:** ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Cairo' })}
🌍 **Timezone:** Africa/Cairo

✅ **Status:** All systems operational`

    await ctx.reply(message, { parse_mode: 'Markdown' })
  }

  private async handleExceptionalHours(ctx: BotContext) {
    if (!await this.isAdmin(ctx.from!.id.toString())) {
      await ctx.reply(MessageFormatter.formatErrorMessage('permission_denied'))
      return
    }

    await ctx.reply(
      '⏰ **Exceptional Hours Management**\n\n' +
      'This feature allows setting custom work hours for specific employees on specific dates.\n\n' +
      'Format: `/exceptional_hours <telegram_id> <date> <start_time> <end_time> <reason>`\n\n' +
      'Example: `/exceptional_hours 123456789 2024-01-15 10:00 16:00 Half day - medical appointment`',
      { parse_mode: 'Markdown' }
    )
  }

  // ============ WEBHOOK COMMANDS ============

  private async handleSetWebhook(ctx: BotContext) {
    if (!await this.isAdmin(ctx.from!.id.toString())) {
      await ctx.reply(MessageFormatter.formatErrorMessage('permission_denied'))
      return
    }

    const webhookUrl = process.env.WEBHOOK_URL
    if (!webhookUrl) {
      await ctx.reply('❌ WEBHOOK_URL not configured in environment variables.')
      return
    }

    try {
      await this.bot.telegram.setWebhook(webhookUrl)
      await ctx.reply(
        `✅ **Webhook Set Successfully**\n\n` +
        `📡 **URL:** \`${webhookUrl}\`\n` +
        `🕐 **Time:** ${new Date().toLocaleString()}`,
        { parse_mode: 'Markdown' }
      )

      await this.logServerActivity('webhook_set', `Webhook set to ${webhookUrl}`)

    } catch (error) {
      console.error('Webhook set error:', error)
      await ctx.reply('❌ Failed to set webhook. Please check the URL and try again.')
    }
  }

  private async handleWebhookInfo(ctx: BotContext) {
    if (!await this.isAdmin(ctx.from!.id.toString())) {
      await ctx.reply(MessageFormatter.formatErrorMessage('permission_denied'))
      return
    }

    try {
      const info = await this.bot.telegram.getWebhookInfo()
      
      const message = `ℹ️ **Webhook Information**

📡 **URL:** \`${info.url || 'Not set'}\`
✅ **Has Certificate:** ${info.has_custom_certificate ? 'Yes' : 'No'}
📊 **Pending Updates:** ${info.pending_update_count}
🕐 **Last Error Date:** ${info.last_error_date ? new Date(info.last_error_date * 1000).toLocaleString() : 'None'}
❌ **Last Error:** \`${info.last_error_message || 'None'}\`
🔗 **IP Address:** \`${info.ip_address || 'Unknown'}\`
📝 **Allowed Updates:** ${info.allowed_updates?.join(', ') || 'All'}`

      await ctx.reply(message, { parse_mode: 'Markdown' })

    } catch (error) {
      console.error('Webhook info error:', error)
      await ctx.reply('❌ Failed to get webhook information.')
    }
  }

  private async handleDeleteWebhook(ctx: BotContext) {
    if (!await this.isAdmin(ctx.from!.id.toString())) {
      await ctx.reply(MessageFormatter.formatErrorMessage('permission_denied'))
      return
    }

    try {
      await this.bot.telegram.deleteWebhook()
      await ctx.reply('✅ Webhook deleted successfully.')
      await this.logServerActivity('webhook_deleted', 'Webhook deleted')

    } catch (error) {
      console.error('Webhook delete error:', error)
      await ctx.reply('❌ Failed to delete webhook.')
    }
  }

  // ============ TEXT AND CALLBACK HANDLING ============

  private async handleTextMessage(ctx: BotContext) {
    if (!ctx.from) return

    const text = ctx.msg.has('text') ? ctx.msg.text : undefined
    if (!text) return

    // Handle conversation states
    if (ctx.state) {
      await this.handleConversationState(ctx, ctx.state)
      return
    }

    // Handle quick action buttons
    switch (text) {
      case '📊 My Status':
        await this.handleStatus(ctx)
        break
      case '📈 My Report':
        await this.handleReport(ctx)
        break
      case '❓ Help':
        await this.handleHelp(ctx)
        break
      case '❌ Cancel':
        await this.clearConversationState(ctx.from.id.toString())
        await ctx.reply('❌ Cancelled.', { reply_markup: { remove_keyboard: true } })
        break
      default:
        // Handle admin commands or unknown text
        if (text.startsWith('/')) {
          await ctx.reply('❓ Unknown command. Use /help for available commands.')
        } else if (ctx.state) {
          await this.handleConversationState(ctx, ctx.state)
        }
        break
    }
  }

  private async handleConversationState(ctx: BotContext, state: ConversationState) {
    const text = ctx.msg.has('text') ? ctx.msg.text : undefined
    
    switch (state.type) {
      case 'late_reason':
        if (text && state.data.attendanceId) {
          await this.saveLateReason(ctx, state.data.attendanceId, text)
        }
        break
      case 'early_reason':
        if (text && state.data.attendanceId) {
          await this.saveEarlyReason(ctx, state.data.attendanceId, text)
        }
        break
    }
  }

  private async handleCallbackQuery(ctx: BotContext) {
    if (!('data' in ctx.callbackQuery!) || !ctx.callbackQuery.data) return

    const data = ctx.callbackQuery.data
    
    try {
      await ctx.answerCbQuery()
      
      // Handle admin panel callbacks
      if (data.startsWith('admin_')) {
        await this.handleAdminCallback(ctx, data)
      } else if (data.startsWith('reason_')) {
        await this.handleReasonCallback(ctx, data)
      } else if (data.startsWith('emp_')) {
        await this.handleEmployeeCallback(ctx, data)
      } else if (data.startsWith('webhook_')) {
        await this.handleWebhookCallback(ctx, data)
      } else if (data.startsWith('report_')) {
        await this.handleReportCallback(ctx, data)
      } else {
        // Handle new commands callbacks
        await BotCommands.handleCallback(ctx, data)
      }

    } catch (error) {
      console.error('Callback query error:', error)
      await ctx.answerCbQuery('❌ An error occurred')
    }
  }

  // ============ HELPER METHODS ============

  private async isAdmin(telegramId: string): Promise<boolean> {
    const admin = await prisma.admin.findUnique({
      where: { telegramId, isActive: true }
    })
    return !!admin
  }

  private async getDailySummary(): Promise<DailySummaryData> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const totalEmployees = await prisma.employee.count({ where: { isActive: true } })
    
    const todayRecords = await prisma.attendanceRecord.findMany({
      where: { date: today }
    })

    const checkedIn = todayRecords.filter(r => r.checkInTime).length
    const checkedOut = todayRecords.filter(r => r.checkOutTime).length
    const lateCheckins = todayRecords.filter(r => r.isLate).length
    const earlyCheckouts = todayRecords.filter(r => r.isEarlyCheckout).length

    return {
      date: today,
      totalEmployees,
      checkedIn,
      checkedOut,
      lateCheckins,
      earlyCheckouts,
      attendanceRate: totalEmployees > 0 ? (checkedIn / totalEmployees) * 100 : 0
    }
  }

  private async saveConversationState(telegramId: string, state: ConversationState) {
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // Expire in 1 hour

    await prisma.conversationState.upsert({
      where: { telegramId },
      create: {
        telegramId,
        state: state.type,
        data: JSON.stringify(state.data),
        expiresAt
      },
      update: {
        state: state.type,
        data: JSON.stringify(state.data),
        expiresAt
      }
    })
  }

  private async clearConversationState(telegramId: string) {
    await prisma.conversationState.deleteMany({
      where: { telegramId }
    })
  }

  private async saveLateReason(ctx: BotContext, attendanceId: number, reason: string) {
    await prisma.attendanceRecord.update({
      where: { id: attendanceId },
      data: { lateReason: reason }
    })

    await this.clearConversationState(ctx.from!.id.toString())
    await ctx.reply('✅ Late reason saved. Thank you!')
  }

  private async saveEarlyReason(ctx: BotContext, attendanceId: number, reason: string) {
    await prisma.attendanceRecord.update({
      where: { id: attendanceId },
      data: { earlyCheckoutReason: reason }
    })

    await this.clearConversationState(ctx.from!.id.toString())
    await ctx.reply('✅ Early departure reason saved. Thank you!')
  }

  private async sendLateAlertToAdmins(employee: Employee, checkInTime: Date) {
    const admins = await prisma.admin.findMany({ where: { isActive: true } })
    const workStart = new Date()
    workStart.setHours(9, 0, 0, 0)
    const minutesLate = Math.floor((checkInTime.getTime() - workStart.getTime()) / (1000 * 60))

    const employeeInfo: EmployeeInfo = {
      firstName: employee.firstName,
      lastName: employee.lastName || undefined,
      username: employee.username || undefined,
      telegramId: employee.telegramId
    }

    const message = MessageFormatter.formatLateAlert(employeeInfo, checkInTime, minutesLate)

    for (const admin of admins) {
      try {
        await this.bot.telegram.sendMessage(admin.telegramId, message, { parse_mode: 'Markdown' })
        await this.logNotification(admin.telegramId, 'late_alert', message.substring(0, 100))
      } catch (error) {
        console.error(`Failed to send late alert to admin ${admin.telegramId}:`, error)
      }
    }
  }

  private async sendEarlyDepartureAlertToAdmins(employee: Employee, checkOutTime: Date) {
    const admins = await prisma.admin.findMany({ where: { isActive: true } })
    const workEnd = new Date()
    workEnd.setHours(17, 0, 0, 0)
    const minutesEarly = Math.floor((workEnd.getTime() - checkOutTime.getTime()) / (1000 * 60))

    const employeeInfo: EmployeeInfo = {
      firstName: employee.firstName,
      lastName: employee.lastName || undefined,
      username: employee.username || undefined,
      telegramId: employee.telegramId
    }

    const message = MessageFormatter.formatEarlyDepartureAlert(employeeInfo, checkOutTime, minutesEarly)

    for (const admin of admins) {
      try {
        await this.bot.telegram.sendMessage(admin.telegramId, message, { parse_mode: 'Markdown' })
        await this.logNotification(admin.telegramId, 'early_departure_alert', message.substring(0, 100))
      } catch (error) {
        console.error(`Failed to send early departure alert to admin ${admin.telegramId}:`, error)
      }
    }
  }

  private async logServerActivity(type: string, message: string, metadata?: any) {
    try {
      await prisma.serverActivity.create({
        data: {
          type,
          message,
          metadata: metadata ? JSON.stringify(metadata) : undefined
        }
      })
    } catch (error) {
      console.error('Failed to log server activity:', error)
    }
  }

  private async logNotification(recipient: string, type: string, message: string, success: boolean = true) {
    try {
      await prisma.notificationLog.create({
        data: {
          type,
          recipient,
          message: message.substring(0, 500), // Truncate long messages
          success
        }
      })
    } catch (error) {
      console.error('Failed to log notification:', error)
    }
  }

  // ============ CALLBACK HANDLERS ============

  private async handleAdminCallback(ctx: BotContext, data: string) {
    switch (data) {
      case 'admin_employees':
        const keyboard = KeyboardBuilder.getEmployeeManagementKeyboard()
        await ctx.editMessageText('👥 **Employee Management**', {
          parse_mode: 'Markdown',
          reply_markup: keyboard as any
        })
        break
      case 'admin_reports':
        const reportsKeyboard = KeyboardBuilder.getReportsKeyboard()
        await ctx.editMessageText('📊 **Reports Dashboard**', {
          parse_mode: 'Markdown',
          reply_markup: reportsKeyboard as any
        })
        break
      case 'admin_webhook':
        const webhookKeyboard = KeyboardBuilder.getWebhookKeyboard()
        await ctx.editMessageText('📡 **Webhook Management**', {
          parse_mode: 'Markdown',
          reply_markup: webhookKeyboard as any
        })
        break
      case 'admin_health':
        await this.handleServerStatus(ctx)
        break
    }
  }

  private async handleReasonCallback(ctx: BotContext, data: string) {
    const reason = data.replace('reason_', '').replace('_', ' ')
    
    if (ctx.state) {
      if (ctx.state.type === 'late_reason') {
        await this.saveLateReason(ctx, ctx.state.data.attendanceId, reason)
      } else if (ctx.state.type === 'early_reason') {
        await this.saveEarlyReason(ctx, ctx.state.data.attendanceId, reason)
      }
    }
  }

  private async handleEmployeeCallback(ctx: BotContext, data: string) {
    // Handle employee management callbacks
    if (data === 'emp_list_all') {
      await this.handleListEmployees(ctx)
    }
  }

  private async handleWebhookCallback(ctx: BotContext, data: string) {
    switch (data) {
      case 'webhook_set':
        await this.handleSetWebhook(ctx)
        break
      case 'webhook_info':
        await this.handleWebhookInfo(ctx)
        break
      case 'webhook_delete':
        await this.handleDeleteWebhook(ctx)
        break
    }
  }

  private async handleReportCallback(ctx: BotContext, data: string) {
    switch (data) {
      case 'report_today':
        const summary = await this.getDailySummary()
        const message = MessageFormatter.formatDailySummary(summary)
        await ctx.editMessageText(message, { parse_mode: 'Markdown' })
        break
    }
  }

  private async handleHelp(ctx: BotContext) {
    const employee = ctx.employee
    const isAdmin = await this.isAdmin(ctx.from!.id.toString())

    let helpText = `🆘 **Help - El Mansoura CIH Attendance**\n\n`

    if (employee) {
      helpText += `**Employee Commands:**\n` +
        `• Share Location - Check in/out at office\n` +
        `• /attendance - Check today's status\n` +
        `• /status - Current attendance status\n` +
        `• /report - Attendance history\n` +
        `• /my_reports - Personal reports\n` +
        `• /schedule - Work schedule\n` +
        `• /leave_request - Request leave\n` +
        `• /overtime - Request overtime\n` +
        `• /notifications - Notification settings\n` +
        `• /change_info - Update information\n\n`
    } else {
      helpText += `**Registration:**\n` +
        `• /register - Register as new employee\n\n`
    }

    if (isAdmin) {
      helpText += `**Admin Commands:**\n` +
        `• /admin - Admin control panel\n` +
        `• /list_employees - View all employees\n` +
        `• /add_admin <user_id> - Grant admin access\n` +
        `• /admin_report - System reports\n` +
        `• /server_status - System health\n` +
        `• /set_webhook - Configure webhook\n` +
        `• /webhook_info - Webhook status\n` +
        `• /delete_webhook - Remove webhook\n\n`
    }

    helpText += `**Location Requirements:**\n` +
      `📍 Must be within 100m of office\n` +
      `📍 GPS coordinates are validated\n` +
      `📍 Manual entry is disabled for security\n\n` +
      `**Office Location:**\n` +
      `🏢 El Mansoura CIH\n` +
      `📍 29R3+7Q El Mansoura 1\n` +
      `🌍 31.0417°N, 31.3778°E`

    await ctx.reply(helpText, { parse_mode: 'Markdown' })
  }

  // ============ PUBLIC METHODS ============

  public async setWebhook(url: string, options?: any) {
    return this.bot.telegram.setWebhook(url, options)
  }

  public async handleWebhook(update: Update) {
    return this.bot.handleUpdate(update)
  }

  public async launch() {
    if (!this.isInitialized) {
      await this.bot.launch()
      this.isInitialized = true
      await this.logServerActivity('bot_started', 'Telegram bot launched successfully')
      console.log('🤖 Telegram bot started successfully')
    }
  }

  public async stop(reason?: string) {
    if (this.isInitialized) {
      await this.bot.stop(reason)
      this.isInitialized = false
      await this.logServerActivity('bot_stopped', reason || 'Bot stopped')
      console.log('🛑 Telegram bot stopped')
    }
  }

  public getBot() {
    return this.bot
  }
}

// Singleton pattern
let botInstance: AttendanceBot | null = null

export const getBot = () => {
  if (!botInstance) {
    botInstance = new AttendanceBot()
  }
  return botInstance
}

export { AttendanceBot } 
export default AttendanceBot 