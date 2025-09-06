/**
 * Export & Analytics Module
 * Handles data export in multiple formats (PDF, Excel, CSV)
 */

import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

// Types
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'json'
  filename?: string
  title?: string
  includeHeaders?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface ReportData {
  headers: string[]
  rows: any[][]
  title: string
  summary?: Record<string, any>
}

class ExportService {
  /**
   * Export attendance data
   */
  static async exportAttendance(options: ExportOptions): Promise<string> {
    const { dateRange, format } = options
    
    const whereClause: Prisma.AttendanceRecordWhereInput = {}
    if (dateRange) {
      whereClause.date = {
        gte: dateRange.start,
        lte: dateRange.end
      }
    }

    const records = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            department: true,
            position: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    const reportData: ReportData = {
      title: 'Attendance Report',
      headers: [
        'Date',
        'Employee Name', 
        'Department',
        'Position',
        'Check In',
        'Check Out',
        'Working Hours',
        'Status',
        'Late',
        'Early Departure'
      ],
      rows: records.map(record => [
        this.formatDate(record.date),
        `${record.employee.firstName} ${record.employee.lastName || ''}`.trim(),
        record.employee.department || '',
        record.employee.position || '',
        record.checkInTime ? this.formatTime(record.checkInTime) : '',
        record.checkOutTime ? this.formatTime(record.checkOutTime) : '',
        record.workingHours?.toString() || '0',
        record.status,
        record.isLate ? 'Yes' : 'No',
        record.isEarlyCheckout ? 'Yes' : 'No'
      ]),
      summary: {
        totalRecords: records.length,
        presentDays: records.filter(r => r.checkInTime).length,
        lateDays: records.filter(r => r.isLate).length,
        earlyDepartures: records.filter(r => r.isEarlyCheckout).length
      }
    }

    return this.generateExport(reportData, options)
  }

  /**
   * Export employee data
   */
  static async exportEmployees(options: ExportOptions): Promise<string> {
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { attendanceRecords: true }
        }
      },
      orderBy: { firstName: 'asc' }
    })

    const reportData: ReportData = {
      title: 'Employee Report',
      headers: [
        'ID',
        'First Name',
        'Last Name',
        'Username',
        'Department',
        'Position',
        'Phone',
        'Telegram ID',
        'Total Records',
        'Created At'
      ],
      rows: employees.map(emp => [
        emp.id,
        emp.firstName,
        emp.lastName || '',
        emp.username || '',
        emp.department || '',
        emp.position || '',
        emp.phoneNumber || '',
        emp.telegramId,
        emp._count.attendanceRecords.toString(),
        this.formatDate(emp.registeredAt)
      ]),
      summary: {
        totalEmployees: employees.length,
        averageRecords: Math.round(
          employees.reduce((sum, emp) => sum + emp._count.attendanceRecords, 0) / employees.length
        )
      }
    }

    return this.generateExport(reportData, options)
  }

  /**
   * Export analytics data
   */
  static async exportAnalytics(options: ExportOptions & { type: string }): Promise<string> {
    const { type, dateRange } = options

    switch (type) {
      case 'attendance_rate':
        return this.exportAttendanceRate(options)
      case 'department_summary':
        return this.exportDepartmentSummary(options)
      case 'late_arrivals':
        return this.exportLateArrivals(options)
      default:
        throw new Error('Invalid analytics type')
    }
  }

  /**
   * Generate export in specified format
   */
  private static async generateExport(data: ReportData, options: ExportOptions): Promise<string> {
    switch (options.format) {
      case 'csv':
        return this.generateCSV(data, options)
      case 'json':
        return this.generateJSON(data, options)
      case 'excel':
        return this.generateExcel(data, options)
      case 'pdf':
        return this.generatePDF(data, options)
      default:
        throw new Error('Unsupported export format')
    }
  }

  /**
   * Generate CSV format
   */
  private static generateCSV(data: ReportData, options: ExportOptions): string {
    const { headers, rows } = data
    
    let csv = ''
    
    // Add title if provided
    if (data.title) {
      csv += `"${data.title}"\n`
      csv += `"Generated: ${new Date().toISOString()}"\n\n`
    }

    // Add headers
    if (options.includeHeaders !== false) {
      csv += headers.map(h => `"${h}"`).join(',') + '\n'
    }

    // Add rows
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n'
    })

    // Add summary if provided
    if (data.summary) {
      csv += '\n"Summary"\n'
      Object.entries(data.summary).forEach(([key, value]) => {
        csv += `"${key}","${value}"\n`
      })
    }

    return csv
  }

  /**
   * Generate JSON format
   */
  private static generateJSON(data: ReportData, options: ExportOptions): string {
    const { headers, rows, title, summary } = data

    const jsonData = {
      title,
      generatedAt: new Date().toISOString(),
      summary,
      data: rows.map(row => {
        const obj: Record<string, any> = {}
        headers.forEach((header, index) => {
          obj[header] = row[index]
        })
        return obj
      })
    }

    return JSON.stringify(jsonData, null, 2)
  }

  /**
   * Generate Excel format (simplified - would need xlsx library for full implementation)
   */
  private static generateExcel(data: ReportData, options: ExportOptions): string {
    // For now, return CSV format as placeholder
    // In production, would use libraries like xlsx or exceljs
    return this.generateCSV(data, options)
  }

  /**
   * Generate PDF format (simplified - would need PDF library for full implementation)
   */
  private static generatePDF(data: ReportData, options: ExportOptions): string {
    // For now, return text format as placeholder
    // In production, would use libraries like jsPDF or puppeteer
    let content = `${data.title}\n${'='.repeat(50)}\n\n`
    
    if (data.summary) {
      content += 'Summary:\n'
      Object.entries(data.summary).forEach(([key, value]) => {
        content += `${key}: ${value}\n`
      })
      content += '\n'
    }

    content += data.headers.join('\t') + '\n'
    content += '-'.repeat(80) + '\n'
    
    data.rows.forEach(row => {
      content += row.join('\t') + '\n'
    })

    return content
  }

  /**
   * Export attendance rate analytics
   */
  private static async exportAttendanceRate(options: ExportOptions): Promise<string> {
    const { dateRange } = options

    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      include: {
        attendanceRecords: {
          where: dateRange ? {
            date: {
              gte: dateRange.start,
              lte: dateRange.end
            }
          } : {}
        }
      }
    })

    const reportData: ReportData = {
      title: 'Attendance Rate Analysis',
      headers: [
        'Employee',
        'Department',
        'Total Days',
        'Present Days',
        'Absent Days',
        'Attendance Rate',
        'Late Days',
        'Early Departures'
      ],
      rows: employees.map(emp => {
        const totalDays = emp.attendanceRecords.length
        const presentDays = emp.attendanceRecords.filter(r => r.checkInTime).length
        const absentDays = totalDays - presentDays
        const rate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : '0.0'
        const lateDays = emp.attendanceRecords.filter(r => r.isLate).length
        const earlyDepartures = emp.attendanceRecords.filter(r => r.isEarlyCheckout).length

        return [
          `${emp.firstName} ${emp.lastName || ''}`.trim(),
          emp.department || '',
          totalDays.toString(),
          presentDays.toString(),
          absentDays.toString(),
          `${rate}%`,
          lateDays.toString(),
          earlyDepartures.toString()
        ]
      }),
      summary: {
        totalEmployees: employees.length,
        averageAttendanceRate: employees.length > 0 
          ? ((employees.reduce((sum, emp) => {
              const totalDays = emp.attendanceRecords.length
              const presentDays = emp.attendanceRecords.filter(r => r.checkInTime).length
              return sum + (totalDays > 0 ? (presentDays / totalDays) * 100 : 0)
            }, 0) / employees.length).toFixed(1)) + '%'
          : '0%'
      }
    }

    return this.generateExport(reportData, options)
  }

  /**
   * Export department summary
   */
  private static async exportDepartmentSummary(options: ExportOptions): Promise<string> {
    const departments = await prisma.employee.groupBy({
      by: ['department'],
      where: { isActive: true },
      _count: { id: true }
    })

    const reportData: ReportData = {
      title: 'Department Summary',
      headers: ['Department', 'Employee Count', 'Percentage'],
      rows: [],
      summary: {
        totalDepartments: departments.length,
        totalEmployees: departments.reduce((sum, dept) => sum + dept._count.id, 0)
      }
    }

    const totalEmployees = reportData.summary?.totalEmployees as number || 0

    reportData.rows = departments.map(dept => [
      dept.department || 'Unknown',
      dept._count.id.toString(),
      `${((dept._count.id / totalEmployees) * 100).toFixed(1)}%`
    ])

    return this.generateExport(reportData, options)
  }

  /**
   * Export late arrivals analysis
   */
  private static async exportLateArrivals(options: ExportOptions): Promise<string> {
    const { dateRange } = options

    const lateRecords = await prisma.attendanceRecord.findMany({
      where: {
        isLate: true,
        ...(dateRange && {
          date: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        })
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            department: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    const reportData: ReportData = {
      title: 'Late Arrivals Analysis',
      headers: [
        'Date',
        'Employee',
        'Department',
        'Check In Time',
        'Minutes Late',
        'Reason'
      ],
      rows: lateRecords.map(record => [
        this.formatDate(record.date),
        `${record.employee.firstName} ${record.employee.lastName || ''}`.trim(),
        record.employee.department || '',
        record.checkInTime ? this.formatTime(record.checkInTime) : '',
        record.isLate ? 'Yes' : 'No',
        record.lateReason || ''
      ]),
      summary: {
        totalLateInstances: lateRecords.length,
        uniqueEmployees: new Set(lateRecords.map(r => r.employeeId)).size
      }
    }

    return this.generateExport(reportData, options)
  }

  // Utility methods
  private static formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  private static formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }
}

// Export for better modularity
export { ExportService }
export default ExportService 