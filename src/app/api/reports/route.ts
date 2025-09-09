/**
 * Reports API Routes
 * Comprehensive reporting functionality for attendance system
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  return withAuth(request, async (_session) => {
    try {
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'daily'
    const startDate = new Date(searchParams.get('startDate') ?? new Date())
    const endDate = new Date(searchParams.get('endDate') ?? new Date())
    const employeeId = searchParams.get('employeeId') || undefined
    const department = searchParams.get('department') || undefined

    // Set proper time boundaries
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)

    let reportData

    switch (reportType) {
      case 'daily':
        reportData = await generateDailyReport(startDate, endDate, employeeId, department)
        break
      case 'weekly':
        reportData = await generateWeeklyReport(startDate, endDate, department)
        break
      case 'monthly':
        reportData = await generateMonthlyReport(startDate, endDate, department)
        break
      case 'employee':
        if (!employeeId) {
            return NextResponse.json({
              success: false,
              error: 'Employee ID is required for employee report'
            }, { status: 400 })
        }
        reportData = await generateEmployeeReport(employeeId, startDate, endDate)
        break
      case 'department':
        if (!department) {
            return NextResponse.json({
              success: false,
              error: 'Department is required for department report'
            }, { status: 400 })
        }
        reportData = await generateDepartmentReport(department, startDate, endDate)
        break
      case 'summary':
        reportData = await generateSummaryReport(startDate, endDate)
        break
      case 'late_arrivals':
        reportData = await generateLateArrivalsReport(startDate, endDate, department)
        break
      case 'early_departures':
        reportData = await generateEarlyDeparturesReport(startDate, endDate, department)
        break
      case 'attendance_rate':
        reportData = await generateAttendanceRateReport(startDate, endDate, department)
        break
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid report type'
        }, { status: 400 })
    }

    // Log report generation
    await logServerActivity('report_generated', `${reportType} report generated for ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`)

    return NextResponse.json({
      success: true,
      data: reportData,
      metadata: {
        type: reportType,
        period: { start: startDate, end: endDate },
        generatedAt: new Date()
      }
    })

  } catch (error) {
    console.error('Reports API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await logServerActivity('report_error', errorMessage)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate report'
    }, { status: 500 })
    }
  })
}

// ============ REPORT GENERATORS ============

async function generateDailyReport(startDate: Date, endDate: Date, employeeId?: string, department?: string) {
  const whereClause: Prisma.AttendanceRecordWhereInput = {
    date: { gte: startDate, lte: endDate },
    ...(employeeId && { employeeId: parseInt(employeeId) }),
    ...(department && { employee: { department } })
  }

  const [records, employees] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            department: true,
            position: true
          }
        }
      },
      orderBy: [{ date: 'desc' }, { checkInTime: 'asc' }]
    }),
    prisma.employee.findMany({
      where: {
        isActive: true,
        ...(department && { department })
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        department: true
      }
    })
  ])

  // Calculate daily statistics
  const dailyStats: Record<string, {
    date: Date;
    total: number;
    present: number;
    late: number;
    earlyDeparture: number;
    averageHours: number;
    records: (typeof records[0])[];
  }> = {}
  
  records.forEach(record => {
    const dateKey = record.date.toISOString().split('T')[0]
    if (!dailyStats[dateKey]) {
      dailyStats[dateKey] = {
        date: record.date,
        total: 0,
        present: 0,
        late: 0,
        earlyDeparture: 0,
        averageHours: 0,
        records: []
      }
    }

    dailyStats[dateKey].total++
    if (record.checkInTime) {
      dailyStats[dateKey].present++
    }
    if (record.isLate) {
      dailyStats[dateKey].late++
    }
    if (record.isEarlyCheckout) {
      dailyStats[dateKey].earlyDeparture++
    }
    dailyStats[dateKey].records.push(record)
  })

  // Calculate average working hours for each day
  Object.keys(dailyStats).forEach(dateKey => {
    const dayRecords = dailyStats[dateKey].records
    const completedRecords = dayRecords.filter((r) => r.workingHours !== null)
    dailyStats[dateKey].averageHours = completedRecords.length > 0
      ? completedRecords.reduce((sum, r) => sum + (r.workingHours || 0), 0) / completedRecords.length
      : 0
  })

  return {
    dailyBreakdown: Object.values(dailyStats),
    summary: {
      totalRecords: records.length,
      totalEmployees: employees.length,
      attendanceRate: employees.length > 0 ? (records.filter(r => r.checkInTime).length / records.length) * 100 : 0,
      averageWorkingHours: records.filter(r => r.workingHours).reduce((sum, r) => sum + (r.workingHours || 0), 0) / (records.filter(r => r.workingHours).length || 1)
    },
    details: records
  }
}

async function generateWeeklyReport(startDate: Date, endDate: Date, department?: string) {
  const whereClause: Prisma.AttendanceRecordWhereInput = {
    date: { gte: startDate, lte: endDate },
    ...(department && { employee: { department } })
  }

  const records = await prisma.attendanceRecord.groupBy({
    by: ['date'],
    where: whereClause,
    _count: { id: true },
    _avg: { workingHours: true }
  })

  const weeklyData: Record<string, {
    weekStart: Date;
    totalDays: number;
    totalAttendance: number;
    averageHours: number;
    averageAttendancePerDay?: number;
  }> = {}
  records.forEach(record => {
    const weekStart = getWeekStart(record.date)
    const weekKey = weekStart.toISOString().split('T')[0]
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        weekStart,
        totalDays: 0,
        totalAttendance: 0,
        averageHours: 0
      }
    }
    
    weeklyData[weekKey].totalDays++
    weeklyData[weekKey].totalAttendance += record._count.id
    weeklyData[weekKey].averageHours += record._avg.workingHours || 0
  })

  // Calculate weekly averages
  Object.keys(weeklyData).forEach(weekKey => {
    const week = weeklyData[weekKey]
    if (week.totalDays > 0) {
        week.averageHours = week.averageHours / week.totalDays
        week.averageAttendancePerDay = week.totalAttendance / week.totalDays
    }
  })

  return {
    weeklyBreakdown: Object.values(weeklyData),
    summary: {
      totalWeeks: Object.keys(weeklyData).length,
      averageWeeklyAttendance: Object.values(weeklyData).reduce((sum, week) => sum + week.totalAttendance, 0) / Object.keys(weeklyData).length
    }
  }
}

async function generateMonthlyReport(startDate: Date, endDate: Date, department?: string) {
  const whereClause: Prisma.AttendanceRecordWhereInput = {
    date: { gte: startDate, lte: endDate },
    ...(department && { employee: { department } })
  }

  const [records, employees] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: whereClause,
      include: { employee: true }
    }),
    prisma.employee.findMany({
      where: {
        isActive: true,
        ...(department && { department })
      }
    })
  ])

  // Group by months
  const monthlyData: Record<string, {
    month: string;
    totalRecords: number;
    presentDays: number;
    lateDays: number;
    earlyDepartures: number;
    totalWorkingHours: number;
    averageHours: number;
    attendanceRate?: number;
  }> = {}
  records.forEach(record => {
    const monthKey = `${record.date.getFullYear()}-${(record.date.getMonth() + 1).toString().padStart(2, '0')}`
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        totalRecords: 0,
        presentDays: 0,
        lateDays: 0,
        earlyDepartures: 0,
        totalWorkingHours: 0,
        averageHours: 0
      }
    }
    
    monthlyData[monthKey].totalRecords++
    if (record.checkInTime) {
      monthlyData[monthKey].presentDays++
    }
    if (record.isLate) {
      monthlyData[monthKey].lateDays++
    }
    if (record.isEarlyCheckout) {
      monthlyData[monthKey].earlyDepartures++
    }
    if (record.workingHours) {
      monthlyData[monthKey].totalWorkingHours += record.workingHours
    }
  })

  // Calculate monthly averages
  Object.keys(monthlyData).forEach(monthKey => {
    const month = monthlyData[monthKey]
    if (month.presentDays > 0) {
        month.averageHours = month.totalWorkingHours / month.presentDays
    }
    if (month.totalRecords > 0) {
        month.attendanceRate = month.presentDays / month.totalRecords * 100
    }
  })

  return {
    monthlyBreakdown: Object.values(monthlyData),
    summary: {
      totalMonths: Object.keys(monthlyData).length,
      totalRecords: records.length,
      totalEmployees: employees.length
    }
  }
}

async function generateEmployeeReport(employeeId: string, startDate: Date, endDate: Date) {
  const [employee, records] = await Promise.all([
    prisma.employee.findUnique({
      where: { id: parseInt(employeeId) },
      include: {
        _count: { select: { attendanceRecords: true } }
      }
    }),
    prisma.attendanceRecord.findMany({
      where: {
        employeeId: parseInt(employeeId),
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'desc' }
    })
  ])

  if (!employee) {
    throw new Error('Employee not found')
  }

  const stats = {
    totalDays: records.length,
    presentDays: records.filter(r => r.checkInTime).length,
    absentDays: records.filter(r => !r.checkInTime).length,
    lateDays: records.filter(r => r.isLate).length,
    earlyDepartures: records.filter(r => r.isEarlyCheckout).length,
    completeDays: records.filter(r => r.status === 'COMPLETE').length,
    totalWorkingHours: records.reduce((sum, r) => sum + (r.workingHours || 0), 0),
    averageWorkingHours: records.filter(r => r.workingHours).reduce((sum, r) => sum + (r.workingHours || 0), 0) / (records.filter(r => r.workingHours).length || 1),
    attendanceRate: records.length > 0 ? (records.filter(r => r.checkInTime).length / records.length) * 100 : 0
  }

  return {
    employee: {
      id: employee.id,
      name: `${employee.firstName} ${employee.lastName || ''}`,
      department: employee.department,
      position: employee.position
    },
    statistics: stats,
    records: records.slice(0, 100) // Limit for performance
  }
}

  async function generateDepartmentReport(department: string, startDate: Date, endDate: Date) {
  const [employees, records] = await Promise.all([
    prisma.employee.findMany({
      where: { department, isActive: true }
    }),
    prisma.attendanceRecord.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        employee: { department }
      },
      include: { employee: true }
    })
  ])

  // Group by employees
  const employeeStats: Record<string, {
    employee: (typeof employees[0]);
    totalDays: number;
    presentDays: number;
    lateDays: number;
    totalHours: number;
  }> = {}
  employees.forEach(emp => {
    employeeStats[emp.id] = {
      employee: emp,
      totalDays: 0,
      presentDays: 0,
      lateDays: 0,
      totalHours: 0
    }
  })

  records.forEach(record => {
    if (employeeStats[record.employeeId]) {
      employeeStats[record.employeeId].totalDays++
      if (record.checkInTime) {
        employeeStats[record.employeeId].presentDays++
      }
      if (record.isLate) {
        employeeStats[record.employeeId].lateDays++
      }
      if (record.workingHours) {
        employeeStats[record.employeeId].totalHours += record.workingHours
      }
    }
  })

  const departmentSummary = {
    department,
    totalEmployees: employees.length,
    totalRecords: records.length,
    averageAttendanceRate: employees.length > 0 ? Object.values(employeeStats).reduce((sum, emp) => 
      sum + (emp.totalDays > 0 ? (emp.presentDays / emp.totalDays) * 100 : 0), 0
    ) / employees.length : 0,
    totalLateInstances: records.filter(r => r.isLate).length
  }

  return {
    departmentSummary,
    employeeBreakdown: Object.values(employeeStats)
  }
}

async function generateSummaryReport(startDate: Date, endDate: Date) {
  const [totalEmployees, totalRecords, lateRecords, earlyRecords] = await Promise.all([
    prisma.employee.count({ where: { isActive: true } }),
    prisma.attendanceRecord.count({ where: { date: { gte: startDate, lte: endDate } } }),
    prisma.attendanceRecord.count({ where: { date: { gte: startDate, lte: endDate }, isLate: true } }),
    prisma.attendanceRecord.count({ where: { date: { gte: startDate, lte: endDate }, isEarlyCheckout: true } })
  ])

  // Department breakdown
  const departments = await prisma.employee.groupBy({
    by: ['department'],
    where: { isActive: true },
    _count: { id: true }
  })

  return {
    overview: {
      totalEmployees,
      totalRecords,
      lateRecords,
      earlyRecords,
      period: { start: startDate, end: endDate }
    },
    departmentBreakdown: departments.map(dept => ({
      department: dept.department,
      employeeCount: dept._count.id
    }))
  }
}

async function generateLateArrivalsReport(startDate: Date, endDate: Date, department?: string) {
  const records = await prisma.attendanceRecord.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      isLate: true,
      ...(department && { employee: { department } })
    },
    include: { employee: true },
    orderBy: { date: 'desc' }
  })

  // Group by employee
  const employeeLateStats: Record<string, {
    employee: (typeof records[0])['employee'];
    lateCount: number;
    records: (typeof records[0])[];
  }> = {}
  records.forEach(record => {
    if (!employeeLateStats[record.employeeId]) {
      employeeLateStats[record.employeeId] = {
        employee: record.employee,
        lateCount: 0,
        records: []
      }
    }
    employeeLateStats[record.employeeId].lateCount++
    employeeLateStats[record.employeeId].records.push(record)
  })

  return {
    summary: {
      totalLateInstances: records.length,
      uniqueEmployees: Object.keys(employeeLateStats).length
    },
    employeeBreakdown: Object.values(employeeLateStats),
    allRecords: records
  }
}

async function generateEarlyDeparturesReport(startDate: Date, endDate: Date, department?: string) {
  const records = await prisma.attendanceRecord.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      isEarlyCheckout: true,
      ...(department && { employee: { department } })
    },
    include: { employee: true },
    orderBy: { date: 'desc' }
  })

  return {
    summary: {
      totalEarlyDepartures: records.length
    },
    records
  }
}

async function generateAttendanceRateReport(startDate: Date, endDate: Date, department?: string) {
  const employees = await prisma.employee.findMany({
    where: {
      isActive: true,
      ...(department && { department })
    },
    include: {
      attendanceRecords: {
        where: {
          date: { gte: startDate, lte: endDate }
        }
      }
    }
  })

  const attendanceRates = employees.map(employee => {
    const totalDays = employee.attendanceRecords.length
    const presentDays = employee.attendanceRecords.filter(r => r.checkInTime).length
    const rate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0

    return {
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName || ''}`,
        department: employee.department
      },
      totalDays,
      presentDays,
      attendanceRate: rate
    }
  })

  return {
    summary: {
      averageAttendanceRate: attendanceRates.reduce((sum, emp) => sum + emp.attendanceRate, 0) / attendanceRates.length || 0,
      totalEmployees: employees.length
    },
    employeeRates: attendanceRates.sort((a, b) => b.attendanceRate - a.attendanceRate)
  }
}

// ============ HELPER FUNCTIONS ============

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(d.setDate(diff))
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