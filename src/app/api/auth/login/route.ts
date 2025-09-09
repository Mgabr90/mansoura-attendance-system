import { NextRequest, NextResponse } from 'next/server'
import AuthService from '@/lib/auth'
import { Admin } from '@prisma/client'

interface AuthResult {
  success: boolean;
  admin?: Admin | null;
  error?: string;
}

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
    const authResult: AuthResult = await AuthService.authenticateAdmin(telegramId)

    if (!authResult.success || !authResult.admin) {
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
        id: authResult.admin.id,
        firstName: authResult.admin.firstName,
        lastName: authResult.admin.lastName,
        role: authResult.admin.role,
        telegramId: authResult.admin.telegramId
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