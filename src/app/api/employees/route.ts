import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface CreateEmployeeRequest {
  telegramId: string
  firstName: string
  lastName: string
  phoneNumber?: string
  department?: string
  position?: string
  isActive?: boolean
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const telegramId = searchParams.get('telegramId')
    const department = searchParams.get('department')
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    let whereClause: any = {}

    if (telegramId) {
      whereClause.telegramId = telegramId
    }

    if (department) {
      whereClause.department = department
    }

    if (isActive !== null) {
      whereClause.isActive = isActive === 'true'
    }

    const skip = (page - 1) * limit

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where: whereClause,
        include: {
          attendanceRecords: {
            where: {
              createdAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0))
              }
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          },
          _count: {
            select: {
              attendanceRecords: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.employee.count({ where: whereClause })
    ])

    const enrichedEmployees = employees.map(employee => ({
      ...employee,
      todayAttendance: employee.attendanceRecords[0] || null,
      totalAttendanceRecords: employee._count.attendanceRecords
    }))

    return NextResponse.json({
      employees: enrichedEmployees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateEmployeeRequest = await request.json()
    const { 
      telegramId, 
      firstName, 
      lastName, 
      phoneNumber, 
      department, 
      position,
      isActive = true 
    } = body

    // Validate required fields
    if (!telegramId || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields: telegramId, firstName, lastName' },
        { status: 400 }
      )
    }

    // Check if employee already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { telegramId }
    })

    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Employee with this Telegram ID already exists' },
        { status: 409 }
      )
    }

    // Create new employee
    const employee = await prisma.employee.create({
      data: {
        telegramId,
        firstName,
        lastName,
        phoneNumber,
        department,
        position,
        isActive,
        registrationDate: new Date()
      }
    })

    // Log the activity
    await prisma.serverActivity.create({
      data: {
        action: 'EMPLOYEE_CREATED',
        details: `New employee created: ${firstName} ${lastName} (${telegramId})`,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ employee, message: 'Employee created successfully' })
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    })

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Update employee
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    })

    // Log the activity
    await prisma.serverActivity.create({
      data: {
        action: 'EMPLOYEE_UPDATED',
        details: `Employee updated: ${updatedEmployee.firstName} ${updatedEmployee.lastName}`,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ 
      employee: updatedEmployee, 
      message: 'Employee updated successfully' 
    })
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id }
    })

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Instead of hard delete, mark as inactive
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    // Log the activity
    await prisma.serverActivity.create({
      data: {
        action: 'EMPLOYEE_DEACTIVATED',
        details: `Employee deactivated: ${existingEmployee.firstName} ${existingEmployee.lastName}`,
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return NextResponse.json({ 
      message: 'Employee deactivated successfully' 
    })
  } catch (error) {
    console.error('Error deactivating employee:', error)
    return NextResponse.json(
      { error: 'Failed to deactivate employee' },
      { status: 500 }
    )
  }
} 