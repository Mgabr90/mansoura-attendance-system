/**
 * Health endpoint redirect
 * Redirects /health to /api/health to fix 404 errors
 */

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.redirect(new URL('/api/health', process.env.NEXTAUTH_URL || 'http://localhost:3000'))
}

export async function OPTIONS() {
  return NextResponse.redirect(new URL('/api/health', process.env.NEXTAUTH_URL || 'http://localhost:3000'))
}