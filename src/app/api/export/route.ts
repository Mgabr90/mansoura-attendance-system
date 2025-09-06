/**
 * Export API Endpoint
 * Handles data export requests with authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import ExportService, { type ExportOptions } from '@/lib/export'

interface ExportRequest {
  type: string
  format?: string
  dateRange?: {
    start: string
    end: string
  }
  filename?: string
  analyticsType?: string
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (_session) => {
    try {
      const body = await request.json() as ExportRequest
      const { 
        type, 
        format = 'csv', 
        dateRange,
        filename,
        analyticsType 
      } = body

      // Validate required parameters
      if (!type) {
        return NextResponse.json(
          { success: false, error: 'Export type is required' },
          { status: 400 }
        )
      }

      // Parse date range if provided
      let parsedDateRange: { start: Date; end: Date } | undefined = undefined
      if (dateRange?.start && dateRange?.end) {
        parsedDateRange = {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end)
        }
      }

      // Prepare export options
      const options: ExportOptions = {
        format: format as "json" | "csv" | "excel" | "pdf",
        filename,
        dateRange: parsedDateRange,
        includeHeaders: true,
        title: `${type.replace('_', ' ').toUpperCase()} Export`
      }

      let exportData: string

      // Handle different export types
      switch (type) {
        case 'attendance':
          exportData = await ExportService.exportAttendance(options)
          break

        case 'employees':
          exportData = await ExportService.exportEmployees(options)
          break

        case 'analytics':
          if (!analyticsType) {
            return NextResponse.json(
              { success: false, error: 'Analytics type is required for analytics export' },
              { status: 400 }
            )
          }
          exportData = await ExportService.exportAnalytics({
            ...options,
            type: analyticsType
          })
          break

        default:
          return NextResponse.json(
            { success: false, error: 'Invalid export type' },
            { status: 400 }
          )
      }

      // Determine content type
      const contentTypes: Record<string, string> = {
        csv: 'text/csv',
        json: 'application/json',
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        pdf: 'application/pdf'
      }

      const contentType = contentTypes[format as string] || 'text/plain'
      
      // Generate filename if not provided
      const timestamp = new Date().toISOString().split('T')[0]
      const defaultFilename = `${type}-export-${timestamp}.${format}`
      const exportFilename = filename || defaultFilename

      // Return file response
      return new NextResponse(exportData, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${exportFilename}"`,
          'Cache-Control': 'no-cache'
        }
      })

    } catch (error) {
      console.error('Export error:', error)
      return NextResponse.json(
        { success: false, error: 'Export failed' },
        { status: 500 }
      )
    }
  })
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (_session) => {
    // Return available export options
    return NextResponse.json({
      success: true,
      exportTypes: [
        {
          id: 'attendance',
          name: 'Attendance Records',
          description: 'Export employee attendance records with check-in/out times'
        },
        {
          id: 'employees',
          name: 'Employee List',
          description: 'Export employee information and statistics'
        },
        {
          id: 'analytics',
          name: 'Analytics Reports',
          description: 'Export analytics data and reports',
          subtypes: [
            { id: 'attendance_rate', name: 'Attendance Rate Analysis' },
            { id: 'department_summary', name: 'Department Summary' },
            { id: 'late_arrivals', name: 'Late Arrivals Analysis' }
          ]
        }
      ],
      formats: [
        { id: 'csv', name: 'CSV', description: 'Comma-separated values' },
        { id: 'json', name: 'JSON', description: 'JavaScript Object Notation' },
        { id: 'excel', name: 'Excel', description: 'Microsoft Excel format' },
        { id: 'pdf', name: 'PDF', description: 'Portable Document Format' }
      ]
    })
  })
} 