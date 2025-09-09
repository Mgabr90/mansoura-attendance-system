/**
 * Invitation Management API
 * Handle cancellation, resending, and status updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT /api/invitations/[token]/manage - Update invitation status
export async function PUT(
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

    if (!body.action) {
      return NextResponse.json(
        { success: false, error: 'Action is required (cancel, resend, extend)' },
        { status: 400 }
      )
    }

    // Find invitation
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

    let updateData: Record<string, unknown> = {}

    switch (body.action) {
      case 'cancel':
        if (invitation.status === 'ACCEPTED') {
          return NextResponse.json(
            { success: false, error: 'Cannot cancel accepted invitation' },
            { status: 400 }
          )
        }
        updateData = { status: 'CANCELLED' }
        break

      case 'resend':
        if (invitation.status !== 'PENDING') {
          return NextResponse.json(
            { success: false, error: 'Can only resend pending invitations' },
            { status: 400 }
          )
        }
        // Extend expiration when resending
        const newExpiration = new Date()
        newExpiration.setDate(newExpiration.getDate() + 7)
        updateData = { expiresAt: newExpiration }
        break

      case 'extend':
        if (invitation.status !== 'PENDING') {
          return NextResponse.json(
            { success: false, error: 'Can only extend pending invitations' },
            { status: 400 }
          )
        }
        const extendedExpiration = new Date()
        extendedExpiration.setDate(extendedExpiration.getDate() + (body.days || 7))
        updateData = { expiresAt: extendedExpiration }
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: cancel, resend, or extend' },
          { status: 400 }
        )
    }

    // Update invitation
    const updatedInvitation = await prisma.employeeInvitation.update({
      where: {
        id: invitation.id
      },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedInvitation.id,
        status: updatedInvitation.status,
        expiresAt: updatedInvitation.expiresAt,
        action: body.action
      }
    })

  } catch (error) {
    console.error('Error managing invitation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to manage invitation' },
      { status: 500 }
    )
  }
}

// DELETE /api/invitations/[token]/manage - Delete invitation
export async function DELETE(
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

    // Find and delete invitation
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

    if (invitation.status === 'ACCEPTED') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete accepted invitation' },
        { status: 400 }
      )
    }

    await prisma.employeeInvitation.delete({
      where: {
        id: invitation.id
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Invitation deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting invitation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete invitation' },
      { status: 500 }
    )
  }
}