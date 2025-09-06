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

interface UpdateEmployeeRequest {
  id: string | number
  telegramId?: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
  department?: string
  position?: string
  isActive?: boolean
}

interface _DeleteEmployeeRequest {
  id: string | number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const telegramId = searchParams.get('telegramId')
    const department = searchParams.get('department')
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const whereClause: Record<string, unknown> = {}

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
          registeredAt: 'desc'
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
    const body = await request.json() as CreateEmployeeRequest
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
        isActive
      }
    })

    // Log the activity
    await prisma.serverActivity.create({
      data: {
        type: 'EMPLOYEE_CREATED',
        message: `New employee created: ${firstName} ${lastName || ''} (${telegramId})`,
        metadata: {
          employeeId: employee.id,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
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
    const body = await request.json() as UpdateEmployeeRequest
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    const employeeId = parseInt(id as string)
    if (isNaN(employeeId)) {
      return NextResponse.json(
        { error: 'Invalid employee ID' },
        { status: 400 }
      )
    }

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id: employeeId }
    })

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Update employee
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    })

    // Log the activity
    await prisma.serverActivity.create({
      data: {
        type: 'EMPLOYEE_UPDATED',
        message: `Employee updated: ${updatedEmployee.firstName} ${updatedEmployee.lastName || ''}`,
        metadata: {
          employeeId,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
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

    const employeeId = parseInt(id)
    if (isNaN(employeeId)) {
      return NextResponse.json(
        { error: 'Invalid employee ID' },
        { status: 400 }
      )
    }

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id: employeeId }
    })

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Instead of hard delete, mark as inactive
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        isActive: false
      }
    })

    // Log the activity
    await prisma.serverActivity.create({
      data: {
        type: 'EMPLOYEE_DEACTIVATED',
        message: `Employee deactivated: ${existingEmployee.firstName} ${existingEmployee.lastName || ''}`,
        metadata: {
          employeeId,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
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