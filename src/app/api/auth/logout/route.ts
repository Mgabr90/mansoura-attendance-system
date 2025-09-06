/**
 * Authentication API - Logout Endpoint
 * Handles admin logout and session cleanup
 */

import { NextRequest } from 'next/server'
import AuthService from '@/lib/auth'

export function POST(_request: NextRequest) {
  // Simply clear the session cookie
  return AuthService.clearSession()
} 