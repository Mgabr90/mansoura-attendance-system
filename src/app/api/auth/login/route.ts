/**
 * Authentication API - Login Endpoint
 * Handles admin login with Telegram ID
 */

import { NextRequest, NextResponse } from 'next/server'
import AuthService from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json() as { telegramId: string }
    const { telegramId } = requestBody

    if (!telegramId) {
      return NextResponse.json(
        { success: false, error: 'Telegram ID is required' },
        { status: 400 }
      )
    }

    // Authenticate admin
    const authResult = await AuthService.authenticateAdmin(telegramId)

    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    // Create session token
    const token = await AuthService.createSession(authResult.admin)

    // Return authenticated response with session cookie
    return AuthService.createAuthenticatedResponse({
      success: true,
      admin: {
        id: authResult.admin?.id,
        firstName: authResult.admin?.firstName,
        lastName: authResult.admin?.lastName,
        role: authResult.admin?.role,
        telegramId: authResult.admin?.telegramId
      },
      message: 'Login successful'
    }, token)

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 