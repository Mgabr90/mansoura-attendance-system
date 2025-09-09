/**
 * Employee Invitations API
 * Handles invitation generation, validation, and management
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

interface CreateInvitationRequest {
  firstName: string
  lastName?: string
  department?: string
  position?: string
  email?: string
  phoneNumber?: string
  invitedBy: string // Admin telegram ID
  expiresInDays?: number
}

interface InvitationResponse {
  id: string
  token: string
  invitationLink: string
  qrCodeData?: string
  status: string
  expiresAt: Date
}

// POST /api/invitations - Create new invitation
export async function POST(request: NextRequest) {
  try {
    const body: CreateInvitationRequest = await request.json()

    // Validate required fields
    if (!body.firstName || !body.invitedBy) {
      return NextResponse.json(
        { success: false, error: 'firstName and invitedBy are required' },
        { status: 400 }
      )
    }

    // Generate unique token
    const token = randomUUID().replace(/-/g, '')

    // Calculate expiration date (default: 7 days)
    const expiresInDays = body.expiresInDays || 7
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiresInDays)

    // Create invitation record
    const invitation = await prisma.employeeInvitation.create({
      data: {
        token,
        firstName: body.firstName,
        lastName: body.lastName,
        department: body.department,
        position: body.position,
        email: body.email,
        phoneNumber: body.phoneNumber,
        invitedBy: body.invitedBy,
        expiresAt,
        status: 'PENDING'
      }
    })

    // Generate invitation link
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'CIH_Mansoura_bot'
    const invitationLink = `https://t.me/${botUsername}?start=invite_${token}`

    const response: InvitationResponse = {
      id: invitation.id,
      token: invitation.token,
      invitationLink,
      status: invitation.status,
      expiresAt: invitation.expiresAt
    }

    return NextResponse.json({
      success: true,
      data: response
    })

  } catch (error) {
    console.error('Error creating invitation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create invitation' },
      { status: 500 }
    )
  }
}

// GET /api/invitations - List all invitations (admin view)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const invitedBy = searchParams.get('invitedBy')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const whereClause: Record<string, unknown> = {}

    if (status) {
      whereClause.status = status.toUpperCase()
    }

    if (invitedBy) {
      whereClause.invitedBy = invitedBy
    }

    const invitations = await prisma.employeeInvitation.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            telegramId: true,
            firstName: true,
            lastName: true,
            registeredAt: true
          }
        }
      },
      orderBy: {
        invitedAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.employeeInvitation.count({
      where: whereClause
    })

    return NextResponse.json({
      success: true,
      data: {
        invitations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}