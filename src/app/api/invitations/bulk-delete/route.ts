/**
 * Bulk Delete Invitations API
 * Delete multiple invitations at once
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface BulkDeleteRequest {
  tokens: string[]
}

// POST /api/invitations/bulk-delete - Delete multiple invitations
export async function POST(request: NextRequest) {
  try {
    const body: BulkDeleteRequest = await request.json()

    if (!body.tokens || !Array.isArray(body.tokens) || body.tokens.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tokens array is required' },
        { status: 400 }
      )
    }

    // Find all invitations to validate they exist and can be deleted
    const invitations = await prisma.employeeInvitation.findMany({
      where: {
        token: {
          in: body.tokens
        }
      }
    })

    if (invitations.length !== body.tokens.length) {
      return NextResponse.json(
        { success: false, error: 'Some invitation tokens are invalid' },
        { status: 404 }
      )
    }

    // Check if any invitations are accepted (cannot be deleted)
    const acceptedInvitations = invitations.filter(inv => inv.status === 'ACCEPTED')
    if (acceptedInvitations.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete ${acceptedInvitations.length} accepted invitation(s)`,
          acceptedTokens: acceptedInvitations.map(inv => inv.token)
        },
        { status: 400 }
      )
    }

    // Delete all invitations
    const deleteResult = await prisma.employeeInvitation.deleteMany({
      where: {
        token: {
          in: body.tokens
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `${deleteResult.count} invitation(s) deleted successfully`,
      deletedCount: deleteResult.count
    })

  } catch (error) {
    console.error('Error bulk deleting invitations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete invitations' },
      { status: 500 }
    )
  }
}