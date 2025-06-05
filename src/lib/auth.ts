/**
 * Authentication & Session Management Module
 * Clean, modular approach to web authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { JWTPayload, SignJWT, jwtVerify } from 'jose'
import { prisma } from './prisma'
import { cookies } from 'next/headers'

// Types
export interface SessionData {
  adminId: string
  telegramId: string
  role: string
  firstName: string
  expiresAt: number
}

export interface AuthResult {
  success: boolean
  admin?: any
  error?: string
}

// Constants
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key')
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

class AuthService {
  /**
   * Authenticate admin with Telegram ID
   */
  static async authenticateAdmin(telegramId: string): Promise<AuthResult> {
    try {
      const admin = await prisma.admin.findFirst({
        where: { 
          telegramId,
          isActive: true 
        }
      })

      if (!admin) {
        return { 
          success: false, 
          error: 'Admin not found or inactive' 
        }
      }

      // Log authentication
      await prisma.serverActivity.create({
        data: {
          type: 'admin_login',
          message: `Admin ${admin.firstName} logged in`,
                      metadata: JSON.stringify({ telegramId, timestamp: new Date() })
  }
}

// Export as default and named export for flexibility
export default AuthService
export { AuthService }

// Export utility function for middleware
export async function withAuth(
  request: NextRequest,
  handler: (session: SessionData) => Promise<NextResponse>
): Promise<NextResponse> {
  const session = await AuthService.getSessionFromRequest(request)
  
  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    )
  }

  return handler(session)
})

      return { 
        success: true, 
        admin 
      }

    } catch (error) {
      console.error('Authentication error:', error)
      return { 
        success: false, 
        error: 'Authentication failed' 
      }
    }
  }

  /**
   * Create JWT session token
   */
  static async createSession(admin: any): Promise<string> {
    const sessionData: SessionData = {
      adminId: admin.id,
      telegramId: admin.telegramId,
      role: admin.role,
      firstName: admin.firstName,
      expiresAt: Date.now() + SESSION_DURATION
    }

    const token = await new SignJWT(sessionData)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET)

    return token
  }

  /**
   * Verify and decode session token
   */
  static async verifySession(token: string): Promise<SessionData | null> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)
      const sessionData = payload as any

      // Check if session is expired
      if (sessionData.expiresAt < Date.now()) {
        return null
      }

      // Verify admin still exists and is active
      const admin = await prisma.admin.findFirst({
        where: {
          id: sessionData.adminId,
          isActive: true
        }
      })

      if (!admin) {
        return null
      }

      return sessionData as SessionData

    } catch (error) {
      console.error('Session verification error:', error)
      return null
    }
  }

  /**
   * Get session from request cookies
   */
  static async getSessionFromRequest(request: NextRequest): Promise<SessionData | null> {
    const token = request.cookies.get('session')?.value
    if (!token) return null

    return await this.verifySession(token)
  }

  /**
   * Create authenticated response with session cookie
   */
  static createAuthenticatedResponse(data: any, token: string): NextResponse {
    const response = NextResponse.json(data)
    
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_DURATION / 1000,
      path: '/'
    })

    return response
  }

  /**
   * Clear session cookie
   */
  static clearSession(): NextResponse {
    const response = NextResponse.json({ success: true })
    response.cookies.delete('session')
    return response
  }

  /**
   * Check if user has required role
   */
  static hasRole(session: SessionData, requiredRole: string): boolean {
    const rolePriority = {
      'SUPER_ADMIN': 3,
      'ADMIN': 2,
      'MODERATOR': 1
    }

    const userPriority = rolePriority[session.role] || 0
    const requiredPriority = rolePriority[requiredRole] || 0

    return userPriority >= requiredPriority
  }

  /**
   * Middleware for protected routes
   */
  static async requireAuth(
    request: NextRequest, 
    requiredRole?: string
  ): Promise<{ success: true; session: SessionData } | { success: false; response: NextResponse }> {
    const session = await this.getSessionFromRequest(request)

    if (!session) {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    if (requiredRole && !this.hasRole(session, requiredRole)) {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
    }

    return { success: true, session }
  }
}

// Utility functions for API routes
export async function withAuth<T>(
  request: NextRequest,
  handler: (session: SessionData) => Promise<T>,
  requiredRole?: string
): Promise<NextResponse | T> {
  const authResult = await AuthService.requireAuth(request, requiredRole)
  
  if (!authResult.success) {
    return authResult.response
  }

  try {
    return await handler(authResult.session)
  } catch (error) {
    console.error('Handler error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export singleton
export default AuthService 