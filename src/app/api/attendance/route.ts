import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AttendanceStatus } from '@prisma/client'
import { calculateDistance } from '@/utils/location'
import { isWithinWorkHours, isLateArrival, isEarlyDeparture } from '@/utils/date'

// Office coordinates - El Mansoura CIH
const OFFICE_LAT = 31.0417
const OFFICE_LNG = 31.3778
const ALLOWED_RADIUS = 100 // meters

interface AttendanceRequest {
  telegramId: string
  latitude: number
  longitude: number
  action: 'CHECK_IN' | 'CHECK_OUT'
  reason?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const telegramId = searchParams.get('telegramId')
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let whereClause: any = {}

    if (telegramId) {
      const employee = await prisma.employee.findUnique({
        where: { telegramId }
      })
      if (!employee) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
      }
      whereClause.employeeId = employee.id
    }

    if (date) {
      const targetDate = new Date(date)
      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(targetDate)
      endOfDay.setHours(23, 59, 59, 999)

      whereClause.createdAt = {
        gte: startOfDay,
        lte: endOfDay
      }
    } else if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            telegramId: true,
            department: true,
            position: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ attendanceRecords })
  } catch (error) {
    console.error('Error fetching attendance records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance records' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AttendanceRequest = await request.json()
    const { telegramId, latitude, longitude, action, reason } = body

    // Validate required fields
    if (!telegramId || !latitude || !longitude || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find employee
    const employee = await prisma.employee.findUnique({
      where: { telegramId }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found. Please register first.' },
        { status: 404 }
      )
    }

    // Calculate distance from office
    const distance = calculateDistance(
      OFFICE_LAT,
      OFFICE_LNG,
      latitude,
      longitude
    )

    // Check if within allowed radius
    if (distance > ALLOWED_RADIUS) {
      return NextResponse.json(
        { 
          error: `You are ${Math.round(distance)}m away from the office. Please be within ${ALLOWED_RADIUS}m to check ${action.toLowerCase()}.`,
          distance: Math.round(distance),
          allowedRadius: ALLOWED_RADIUS
        },
        { status: 400 }
      )
    }

    const now = new Date()

    // Check for existing attendance record today
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    const todayRecord = await prisma.attendanceRecord.findFirst({
      where: {
        employeeId: employee.id,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    let status: AttendanceStatus = 'PRESENT'
    let isLate = false
    let isEarly = false
    let checkInTime: Date | null = null
    let checkOutTime: Date | null = null

    if (action === 'CHECK_IN') {
      // Check if already checked in today
      if (todayRecord && todayRecord.checkInTime && !todayRecord.checkOutTime) {
        return NextResponse.json(
          { error: 'You have already checked in today' },
          { status: 400 }
        )
      }

      checkInTime = now
      isLate = isLateArrival(now)
      
      if (isLate) {
        status = 'LATE'
      }

      // If there's an existing record for today (checked out), update it
      if (todayRecord) {
        const updatedRecord = await prisma.attendanceRecord.update({
          where: { id: todayRecord.id },
          data: {
            checkInTime,
            status,
            isLate,
            lateReason: isLate ? reason : null,
            distance: Math.round(distance),
            checkInLatitude: latitude,
            checkInLongitude: longitude,
            updatedAt: now
          }
        })
        return NextResponse.json({ record: updatedRecord, message: 'Checked in successfully' })
      }
    } else if (action === 'CHECK_OUT') {
      // Check if checked in today
      if (!todayRecord || !todayRecord.checkInTime) {
        return NextResponse.json(
          { error: 'You must check in first before checking out' },
          { status: 400 }
        )
      }

      // Check if already checked out
      if (todayRecord.checkOutTime) {
        return NextResponse.json(
          { error: 'You have already checked out today' },
          { status: 400 }
        )
      }

      checkOutTime = now
      isEarly = isEarlyDeparture(now)
      
      // Calculate working hours
      const workingMinutes = Math.floor(
        (now.getTime() - todayRecord.checkInTime.getTime()) / (1000 * 60)
      )

      const updatedRecord = await prisma.attendanceRecord.update({
        where: { id: todayRecord.id },
        data: {
          checkOutTime,
          workingMinutes,
          isEarlyDeparture: isEarly,
          earlyDepartureReason: isEarly ? reason : null,
          checkOutLatitude: latitude,
          checkOutLongitude: longitude,
          updatedAt: now
        }
      })

      return NextResponse.json({ 
        record: updatedRecord, 
        message: 'Checked out successfully',
        workingHours: Math.floor(workingMinutes / 60),
        workingMinutes: workingMinutes % 60
      })
    }

    // Create new attendance record for check-in
    const attendanceRecord = await prisma.attendanceRecord.create({
      data: {
        employeeId: employee.id,
        status,
        checkInTime,
        isLate,
        lateReason: isLate ? reason : null,
        distance: Math.round(distance),
        checkInLatitude: latitude,
        checkInLongitude: longitude,
        createdAt: now,
        updatedAt: now
      }
    })

    // Log the activity
    await prisma.serverActivity.create({
      data: {
        action: 'ATTENDANCE_RECORDED',
        details: `Employee ${employee.firstName} ${employee.lastName} ${action.toLowerCase()}`,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ 
      record: attendanceRecord, 
      message: `Checked in successfully${isLate ? ' (Late arrival noted)' : ''}`,
      distance: Math.round(distance)
    })

  } catch (error) {
    console.error('Error processing attendance:', error)
    return NextResponse.json(
      { error: 'Failed to process attendance' },
      { status: 500 }
    )
  }
} 