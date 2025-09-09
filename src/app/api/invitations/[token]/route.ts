/**
 * Individual Invitation API
 * Handles validation and acceptance of specific invitations
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/invitations/[token] - Validate invitation token
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    // Find invitation by token
    const invitation = await prisma.employeeInvitation.findUnique({
      where: {
        token: token
      },
      include: {
        employee: true
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invalid invitation token' },
        { status: 404 }
      )
    }

    // Check if invitation has expired
    const now = new Date()
    if (invitation.expiresAt < now) {
      // Update status to EXPIRED if not already
      if (invitation.status === 'PENDING') {
        await prisma.employeeInvitation.update({
          where: { id: invitation.id },
          data: { status: 'EXPIRED' }
        })
      }

      return NextResponse.json(
        { success: false, error: 'Invitation has expired' },
        { status: 410 }
      )
    }

    // Check if invitation is already accepted
    if (invitation.status === 'ACCEPTED') {
      return NextResponse.json({
        success: false,
        error: 'Invitation already accepted',
        data: {
          employee: invitation.employee
        }
      }, { status: 409 })
    }

    // Check if invitation is cancelled
    if (invitation.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'Invitation has been cancelled' },
        { status: 410 }
      )
    }

    // Return valid invitation data
    return NextResponse.json({
      success: true,
      data: {
        id: invitation.id,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        department: invitation.department,
        position: invitation.position,
        email: invitation.email,
        phoneNumber: invitation.phoneNumber,
        invitedAt: invitation.invitedAt,
        expiresAt: invitation.expiresAt,
        status: invitation.status
      }
    })

  } catch (error) {
    console.error('Error validating invitation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to validate invitation' },
      { status: 500 }
    )
  }
}

// POST /api/invitations/[token]/accept - Accept invitation and create employee
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const body = await request.json()

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    if (!body.telegramId) {
      return NextResponse.json(
        { success: false, error: 'telegramId is required' },
        { status: 400 }
      )
    }

    // Validate invitation first
    const invitation = await prisma.employeeInvitation.findUnique({
      where: {
        token: token
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invalid invitation token' },
        { status: 404 }
      )
    }

    // Check expiration and status
    const now = new Date()
    if (invitation.expiresAt < now || invitation.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Invitation is no longer valid' },
        { status: 410 }
      )
    }

    // Check if employee with this telegram ID already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: {
        telegramId: body.telegramId
      }
    })

    if (existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee with this Telegram ID already exists' },
        { status: 409 }
      )
    }

    // Create employee record using invitation data + telegram info
    const employee = await prisma.employee.create({
      data: {
        telegramId: body.telegramId,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        username: body.username,
        phoneNumber: body.phoneNumber || invitation.phoneNumber,
        department: invitation.department,
        position: invitation.position,
        isActive: true
      }
    })

    // Update invitation as accepted
    await prisma.employeeInvitation.update({
      where: {
        id: invitation.id
      },
      data: {
        status: 'ACCEPTED',
        acceptedAt: now,
        employeeId: employee.id
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          telegramId: employee.telegramId,
          firstName: employee.firstName,
          lastName: employee.lastName,
          department: employee.department,
          position: employee.position,
          registeredAt: employee.registeredAt
        },
        invitation: {
          id: invitation.id,
          acceptedAt: now,
          status: 'ACCEPTED'
        }
      }
    })

  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}