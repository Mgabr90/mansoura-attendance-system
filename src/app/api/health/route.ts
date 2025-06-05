/**
 * Health Monitor API Endpoint
 * Provides comprehensive system health status
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import HealthMonitor from '@/lib/health-monitor'

export async function GET(request: NextRequest) {
  return withAuth(request, async (session) => {
    try {
      // Get comprehensive health status
      const healthStatus = await HealthMonitor.getHealthStatus()

      return NextResponse.json({
        success: true,
        data: healthStatus
      })

    } catch (error) {
      console.error('Health check error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to get health status',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (session) => {
    try {
      const { action, alertId } = await request.json()

      switch (action) {
        case 'resolve_alert':
          if (!alertId) {
            return NextResponse.json(
              { success: false, error: 'Alert ID is required' },
              { status: 400 }
            )
          }

          const resolved = HealthMonitor.resolveAlert(alertId)
          
          return NextResponse.json({
            success: true,
            resolved,
            message: resolved ? 'Alert resolved successfully' : 'Alert not found'
          })

        case 'check_attention':
          const needsAttention = await HealthMonitor.needsAttention()
          
          return NextResponse.json({
            success: true,
            needsAttention,
            message: needsAttention ? 'System needs attention' : 'System is healthy'
          })

        default:
          return NextResponse.json(
            { success: false, error: 'Invalid action' },
            { status: 400 }
          )
      }

    } catch (error) {
      console.error('Health action error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to process health action',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  })
} 