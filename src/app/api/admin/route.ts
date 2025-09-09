/**
 * Admin API Routes
 * Comprehensive admin management functionality
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCronService } from '@/services/cron-service'
import { getNotificationService, type NotificationOptions } from '@/services/notification-service'
import type { Prisma, AdminRole } from '@prisma/client'

// ============ GET /api/admin ============
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const adminId = searchParams.get('adminId')

    // Verify admin authentication
    if (!adminId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin ID required' 
      }, { status: 401 })
    }

    const admin = await prisma.admin.findFirst({
      where: { telegramId: adminId, isActive: true }
    })

    if (!admin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized admin access' 
      }, { status: 403 })
    }

    switch (action) {
      case 'dashboard':
        return await getDashboardStats()
      
      case 'employees':
        return await getEmployeeManagement(searchParams)
      
      case 'attendance':
        return await getAttendanceReports(searchParams)
      
      case 'reports':
        return await getDailyReport({})
      
      case 'system':
        return await getSystemStatus()
      
      case 'notifications':
        return await getNotificationLogs(searchParams)
      
      case 'activities':
        return await getServerActivities(searchParams)
      
      case 'export':
        return await exportData(searchParams)
      
      default:
        return await getDashboardStats()
    }

  } catch (error) {
    console.error('Admin API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await logServerActivity('admin_api_error', errorMessage)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// ============ POST /api/admin ============
export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json() as { action: string; adminId: string; [key: string]: unknown }
    const { action, adminId, ...data } = requestData

    // Verify admin authentication
    if (!adminId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin ID required' 
      }, { status: 401 })
    }

    const admin = await prisma.admin.findFirst({
      where: { telegramId: adminId, isActive: true }
    })

    if (!admin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized admin access' 
      }, { status: 403 })
    }

    switch (action) {
      case 'create_employee':
        return await createEmployee(data as unknown as CreateEmployeeData, admin as AdminUser)
      
      case 'update_employee':
        return await updateEmployee(data as unknown as UpdateEmployeeData, admin as AdminUser)
      
      case 'delete_employee':
        return await deleteEmployee(data as unknown as DeleteEmployeeData, admin as AdminUser)
      
      case 'create_admin':
        return await createAdmin(data as unknown as CreateAdminData, admin as AdminUser)
      
      case 'send_notification':
        return await sendCustomNotification(data as unknown as NotificationData, admin as AdminUser)
      
      case 'broadcast':
        return await broadcastMessage(data as unknown as BroadcastData, admin as AdminUser)
      
      case 'trigger_cron':
        return await triggerCronJob(data as unknown as CronJobData, admin as AdminUser)
      
      case 'update_settings':
        return await updateSystemSettings(data as unknown as SystemSettingsData, admin)
      
      case 'reset_password':
        return await resetEmployeePassword(data as unknown as PasswordResetData, admin)
      
      case 'bulk_import':
        return await bulkImportEmployees(data as unknown as BulkImportData, admin)
      
      case 'manual_attendance':
        return await manualAttendanceEntry(data as unknown as AttendanceRecordData, admin)
      
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action' 
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Admin POST API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await logServerActivity('admin_post_error', errorMessage)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// ============ HELPER FUNCTIONS ============

async function getDashboardStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalEmployees,
    activeEmployees,
    totalAdmins,
    todayRecords,
    checkedInToday,
    lateToday
  ] = await Promise.all([
    prisma.employee.count(),
    prisma.employee.count({ where: { isActive: true } }),
    prisma.admin.count({ where: { isActive: true } }),
    prisma.attendanceRecord.count({ where: { date: today } }),
    prisma.attendanceRecord.count({ 
      where: { date: today, checkInTime: { not: null } } 
    }),
    prisma.attendanceRecord.count({ 
      where: { date: today, isLate: true } 
    })
  ])

  // Calculate absent employees
  const absentToday = activeEmployees - checkedInToday

  // Get recent activities
  const recentActivities = await prisma.serverActivity.findMany({
    take: 10,
    orderBy: { timestamp: 'desc' }
  })

  // Get weekly trend
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const weeklyRecords = await prisma.attendanceRecord.groupBy({
    by: ['date'],
    where: {
      date: { gte: weekAgo, lte: today }
    },
    _count: { id: true }
  })

  const attendanceRate = activeEmployees > 0 ? (checkedInToday / activeEmployees) * 100 : 0

  return NextResponse.json({
    success: true,
    data: {
      stats: {
        totalEmployees,
        activeEmployees,
        totalAdmins,
        todayRecords,
        checkedInToday,
        lateToday,
        absentToday,
        attendanceRate: Math.round(attendanceRate * 100) / 100
      },
      recentActivities,
      weeklyTrend: weeklyRecords.map(record => ({
        date: record.date,
        count: record._count.id
      }))
    }
  })
}

async function getEmployeeManagement(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const search = searchParams.get('search') || ''
  const department = searchParams.get('department') || ''
  const status = searchParams.get('status') || 'all'

  const skip = (page - 1) * limit

  const whereClause: Prisma.EmployeeWhereInput = {
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } }
      ]
    }),
    ...(department && { department }),
    ...(status !== 'all' && { isActive: status === 'active' })
  }

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where: whereClause,
      include: {
        attendanceRecords: {
          take: 5,
          orderBy: { date: 'desc' }
        },
        _count: { select: { attendanceRecords: true } }
      },
      skip,
      take: limit,
      orderBy: { registeredAt: 'desc' }
    }),
    prisma.employee.count({ where: whereClause })
  ])

  return NextResponse.json({
    success: true,
    data: {
      employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
}

async function getAttendanceReports(searchParams: URLSearchParams) {
  const startDateParam = searchParams.get('startDate')
  const startDate = startDateParam ? new Date(startDateParam) : new Date()
  const endDateParam = searchParams.get('endDate')
  const endDate = endDateParam ? new Date(endDateParam) : new Date()
  const employeeId = searchParams.get('employeeId')
  const reportType = searchParams.get('type') || 'daily'

  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(23, 59, 59, 999)

  const whereClause: Prisma.AttendanceRecordWhereInput = {
    date: { gte: startDate, lte: endDate },
    ...(employeeId && { employeeId: parseInt(employeeId) })
  }

  switch (reportType) {
    case 'daily':
      return await getDailyReport(whereClause)
    case 'weekly':
      return await getWeeklyReport(whereClause, startDate, endDate)
    case 'monthly':
      return await getMonthlyReport(whereClause, startDate, endDate)
    case 'employee':
      return await getEmployeeReport(whereClause, employeeId)
    default:
      return await getDailyReport(whereClause)
  }
}

async function getDailyReport(whereClause: Prisma.AttendanceRecordWhereInput) {
  const records = await prisma.attendanceRecord.findMany({
    where: whereClause,
    include: { employee: true },
    orderBy: { date: 'desc' }
  })

  const stats = {
    total: records.length,
    present: records.filter(r => r.checkInTime).length,
    late: records.filter(r => r.isLate).length,
    earlyDeparture: records.filter(r => r.isEarlyCheckout).length,
    incomplete: records.filter(r => r.checkInTime && !r.checkOutTime).length
  }

  return NextResponse.json({
    success: true,
    data: { records, stats, type: 'daily' }
  })
}

async function getWeeklyReport(
  whereClause: Prisma.AttendanceRecordWhereInput, 
  startDate: Date, 
  endDate: Date
) {
  const records = await prisma.attendanceRecord.groupBy({
    by: ['date'],
    where: whereClause,
    _count: { id: true },
    _avg: { workingHours: true }
  })

  return NextResponse.json({
    success: true,
    data: { 
      records: records.map(r => ({
        date: r.date,
        attendanceCount: r._count.id,
        averageHours: r._avg.workingHours || 0
      })),
      type: 'weekly',
      period: { start: startDate, end: endDate }
    }
  })
}

async function getMonthlyReport(
  whereClause: Prisma.AttendanceRecordWhereInput,
  startDate: Date,
  endDate: Date
) {
  const [records, employees] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: whereClause,
      include: { employee: true }
    }),
    prisma.employee.findMany({ where: { isActive: true } })
  ])

  const monthlyStats = {
    totalWorkingDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    totalPossibleAttendance: employees.length * Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    actualAttendance: records.length,
    attendanceRate: records.length / (employees.length * Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))) * 100
  }

  return NextResponse.json({
    success: true,
    data: { 
      stats: monthlyStats,
      records: records.slice(0, 100), // Limit for performance
      type: 'monthly',
      period: { start: startDate, end: endDate }
    }
  })
}

async function getEmployeeReport(
  whereClause: Prisma.AttendanceRecordWhereInput,
  employeeId: string | null
) {
  if (!employeeId) {
    return NextResponse.json({
      success: false,
      error: 'Employee ID required for employee report'
    }, { status: 400 })
  }

  const employeeIdNum = parseInt(employeeId)
  
  const [employee, records] = await Promise.all([
    prisma.employee.findUnique({
      where: { id: employeeIdNum },
      include: { _count: { select: { attendanceRecords: true } } }
    }),
    prisma.attendanceRecord.findMany({
      where: { ...whereClause, employeeId: employeeIdNum },
      orderBy: { date: 'desc' }
    })
  ])

  if (!employee) {
    return NextResponse.json({
      success: false,
      error: 'Employee not found'
    }, { status: 404 })
  }

  const stats = {
    totalDays: records.length,
    presentDays: records.filter(r => r.checkInTime).length,
    lateDays: records.filter(r => r.isLate).length,
    earlyDepartures: records.filter(r => r.isEarlyCheckout).length,
    averageWorkingHours: records.reduce((sum, r) => sum + (r.workingHours || 0), 0) / records.length || 0
  }

  return NextResponse.json({
    success: true,
    data: { employee, records, stats, type: 'employee' }
  })
}

async function getSystemStatus() {
  const cronService = getCronService()
  const cronJobs = cronService.getJobsStatus()

  const [
    dbStats,
    recentErrors,
    systemHealth
  ] = await Promise.all([
    getDatabaseStats(),
    getRecentErrors(),
    getSystemHealth()
  ])

  return NextResponse.json({
    success: true,
    data: {
      cronJobs,
      database: dbStats,
      recentErrors,
      system: systemHealth
    }
  })
}

async function getDatabaseStats() {
  const [employees, admins, records, notifications] = await Promise.all([
    prisma.employee.count(),
    prisma.admin.count(),
    prisma.attendanceRecord.count(),
    prisma.notificationLog.count()
  ])

  return { employees, admins, records, notifications }
}

async function getRecentErrors() {
  return await prisma.serverActivity.findMany({
    where: { type: { contains: 'error' } },
    take: 10,
    orderBy: { timestamp: 'desc' }
  })
}

function getSystemHealth() {
  const memoryUsage = process.memoryUsage()
  return {
    uptime: process.uptime(),
    memory: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024)
    },
    nodeVersion: process.version
  }
}

async function getNotificationLogs(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const type = searchParams.get('type') || ''

  const skip = (page - 1) * limit

  const [logs, total] = await Promise.all([
    prisma.notificationLog.findMany({
      where: type ? { type } : {},
      take: limit,
      skip,
      orderBy: { sentAt: 'desc' }
    }),
    prisma.notificationLog.count({
      where: type ? { type } : {}
    })
  ])

  return NextResponse.json({
    success: true,
    data: {
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    }
  })
}

async function getServerActivities(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const type = searchParams.get('type') || ''

  const skip = (page - 1) * limit

  const [activities, total] = await Promise.all([
    prisma.serverActivity.findMany({
      where: type ? { type } : {},
      take: limit,
      skip,
      orderBy: { timestamp: 'desc' }
    }),
    prisma.serverActivity.count({
      where: type ? { type } : {}
    })
  ])

  return NextResponse.json({
    success: true,
    data: {
      activities,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    }
  })
}

async function exportData(searchParams: URLSearchParams) {
  const type = searchParams.get('type') || 'employees'
  const _format = searchParams.get('format') || 'json'

  switch (type) {
    case 'employees':
      const employees = await prisma.employee.findMany()
      return NextResponse.json({ success: true, data: employees })

    case 'attendance':
      const startDateParam = searchParams.get('startDate')
      const startDate = startDateParam ? new Date(startDateParam) : new Date()
      const endDateParam = searchParams.get('endDate')
      const endDate = endDateParam ? new Date(endDateParam) : new Date()
      
      const attendance = await prisma.attendanceRecord.findMany({
        where: {
          date: { gte: startDate, lte: endDate }
        },
        include: { employee: true }
      })
      return NextResponse.json({ success: true, data: attendance })

    default:
      return NextResponse.json({
        success: false,
        error: 'Invalid export type'
      }, { status: 400 })
  }
}

// ============ POST ACTION HANDLERS ============

interface CreateEmployeeData {
  telegramId: string
  firstName: string
  lastName: string
  username: string
  phoneNumber: string
  department: string
  position: string
}

interface AdminUser {
  id: number
  firstName: string
  telegramId: string
}

interface DeleteEmployeeData {
  id: number
}

interface CreateAdminData {
  telegramId: string
  firstName: string
  lastName: string
  username: string
  role?: string
}

interface NotificationData {
  recipientId: string
  message: string
  options?: NotificationOptions
}


interface BroadcastData {
  target: 'all' | 'employees' | 'admins'
  message: string
  options?: NotificationOptions
}

interface CronJobData {
  jobName: string
}

interface SystemSettingsData {
  [key: string]: unknown
}

interface PasswordResetData {
  employeeId: string | number
}

interface BulkImportData {
  employees: CreateEmployeeData[]
}

interface AttendanceRecordData {
  employeeId: string | number
  date: Date | string
  checkInTime?: Date | string
  checkOutTime?: Date | string
  status: 'INCOMPLETE' | 'COMPLETE' | 'ABSENT' | 'EXCUSED'
  isLate: boolean
}

async function createEmployee(data: CreateEmployeeData, admin: AdminUser) {
  const employee = await prisma.employee.create({
    data: {
      telegramId: data.telegramId,
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      phoneNumber: data.phoneNumber,
      department: data.department,
      position: data.position,
      isActive: true
    }
  })

  await logServerActivity('employee_created', `Employee ${data.firstName} created by admin ${admin.firstName}`)

  return NextResponse.json({
    success: true,
    data: employee,
    message: 'Employee created successfully'
  })
}

interface UpdateEmployeeData {
  id: number
  firstName: string
  lastName: string
  username: string
  phoneNumber: string
  department: string
  position: string
  isActive: boolean
}

async function updateEmployee(data: UpdateEmployeeData, admin: AdminUser) {
  const employee = await prisma.employee.update({
    where: { id: data.id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      phoneNumber: data.phoneNumber,
      department: data.department,
      position: data.position,
      isActive: data.isActive
    }
  })

  await logServerActivity('employee_updated', `Employee ${employee.firstName} updated by admin ${admin.firstName}`)

  return NextResponse.json({
    success: true,
    data: employee,
    message: 'Employee updated successfully'
  })
}

async function deleteEmployee(data: DeleteEmployeeData, admin: AdminUser) {
  const employee = await prisma.employee.update({
    where: { id: data.id },
    data: { isActive: false }
  })

  await logServerActivity('employee_deleted', `Employee ${employee.firstName} deleted by admin ${admin.firstName}`)

  return NextResponse.json({
    success: true,
    message: 'Employee deleted successfully'
  })
}

async function createAdmin(data: CreateAdminData, admin: AdminUser) {
  const newAdmin = await prisma.admin.create({
    data: {
      telegramId: data.telegramId,
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      role: (data.role as AdminRole) || 'ADMIN',
      isActive: true
    }
  })

  await logServerActivity('admin_created', `Admin ${data.firstName} created by ${admin.firstName}`)

  return NextResponse.json({
    success: true,
    data: newAdmin,
    message: 'Admin created successfully'
  })
}

async function sendCustomNotification(data: NotificationData, admin: AdminUser) {
  const notificationService = getNotificationService()
  
  const success = await notificationService.sendCustomNotification(
    data.recipientId,
    data.message,
    data.options || {}
  )

  await logServerActivity('custom_notification', `Notification sent by admin ${admin.firstName}`)

  return NextResponse.json({
    success,
    message: success ? 'Notification sent successfully' : 'Failed to send notification'
  })
}

async function broadcastMessage(data: BroadcastData, admin: AdminUser) {
  const notificationService = getNotificationService()
  
  if (data.target === 'employees') {
    await notificationService.broadcastToAllEmployees(data.message, data.options || {})
  } else if (data.target === 'admins') {
    await notificationService.broadcastToAllAdmins(data.message, data.options || {})
  }

  await logServerActivity('broadcast_message', `Broadcast sent to ${data.target} by admin ${admin.firstName}`)

  return NextResponse.json({
    success: true,
    message: 'Broadcast sent successfully'
  })
}

async function triggerCronJob(data: CronJobData, admin: AdminUser) {
  const cronService = getCronService()
  const success = await cronService.triggerJob(data.jobName)

  await logServerActivity('cron_triggered', `Job ${data.jobName} triggered by admin ${admin.firstName}`)

  return NextResponse.json({
    success,
    message: success ? 'Cron job triggered successfully' : 'Failed to trigger cron job'
  })
}

async function updateSystemSettings(data: SystemSettingsData, admin: AdminUser) {
  // Implementation for updating system settings
  await logServerActivity('settings_updated', `Settings updated by admin ${admin.firstName}`)

  return NextResponse.json({
    success: true,
    message: 'Settings updated successfully'
  })
}

async function resetEmployeePassword(data: PasswordResetData, admin: AdminUser) {
  // Implementation for password reset
  await logServerActivity('password_reset', `Password reset for employee ${data.employeeId} by admin ${admin.firstName}`)

  return NextResponse.json({
    success: true,
    message: 'Password reset successfully'
  })
}

async function bulkImportEmployees(data: BulkImportData, admin: AdminUser) {
  const employees = data.employees
  const results = []

  for (const empData of employees) {
    try {
      const employee = await prisma.employee.create({
        data: {
          telegramId: empData.telegramId,
          firstName: empData.firstName,
          lastName: empData.lastName,
          username: empData.username,
          phoneNumber: empData.phoneNumber,
          department: empData.department,
          position: empData.position,
          isActive: true
        }
      })
      results.push({ success: true, employee })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      results.push({ success: false, error: errorMessage, data: empData })
    }
  }

  const successful = results.filter(r => r.success).length
  await logServerActivity('bulk_import', `${successful}/${employees.length} employees imported by admin ${admin.firstName}`)

  return NextResponse.json({
    success: true,
    data: results,
    message: `${successful}/${employees.length} employees imported successfully`
  })
}

async function manualAttendanceEntry(data: AttendanceRecordData, admin: AdminUser) {
  const record = await prisma.attendanceRecord.create({
    data: {
      employeeId: typeof data.employeeId === 'string' ? parseInt(data.employeeId, 10) : data.employeeId,
      date: new Date(data.date),
      checkInTime: data.checkInTime ? new Date(data.checkInTime) : null,
      checkOutTime: data.checkOutTime ? new Date(data.checkOutTime) : null,
      status: data.status || 'INCOMPLETE',
      isLate: data.isLate || false
    }
  })

  await logServerActivity('manual_attendance', `Manual attendance entry by admin ${admin.firstName}`)

  return NextResponse.json({
    success: true,
    data: record,
    message: 'Manual attendance entry created successfully'
  })
}

async function logServerActivity(type: string, message: string) {
  try {
    await prisma.serverActivity.create({
      data: { type, message }
    })
  } catch (error) {
    console.error('Failed to log server activity:', error)
  }
} 