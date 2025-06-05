/**
 * Authentication API - Session Verification
 * Checks current session validity
 */

import { NextRequest, NextResponse } from 'next/server'
import AuthService from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await AuthService.getSessionFromRequest(request)

  if (!session) {
    return NextResponse.json(
      { success: false, authenticated: false },
      { status: 401 }
    )
  }

  return NextResponse.json({
    success: true,
    authenticated: true,
    admin: {
      id: session.adminId,
      firstName: session.firstName,
      role: session.role,
      telegramId: session.telegramId
    }
  })
} 