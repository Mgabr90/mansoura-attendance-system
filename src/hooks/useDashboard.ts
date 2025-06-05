/**
 * useDashboard Hook - Dashboard State Management
 * Manages dashboard statistics and data fetching
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useApi } from './useApi'

interface DashboardStats {
  totalEmployees: number
  presentToday: number
  lateArrivals: number
  attendanceRate: number
  monthlyAverage: number
  departmentStats: Array<{
    name: string
    present: number
    total: number
    rate: number
  }>
  recentActivity: Array<{
    id: string
    employeeName: string
    action: 'check_in' | 'check_out' | 'late_arrival'
    timestamp: string
    location?: string
  }>
  weeklyTrends: Array<{
    date: string
    present: number
    total: number
    rate: number
  }>
}

interface UseDashboardReturn {
  stats: DashboardStats | null
  loading: boolean
  error: string | null
  refreshStats: () => Promise<void>
  getStatsForPeriod: (period: 'today' | 'week' | 'month') => Promise<void>
}

const useDashboard = (): UseDashboardReturn => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { fetchData } = useApi()

  const fetchDashboardStats = useCallback(async (period: 'today' | 'week' | 'month' = 'today') => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetchData(`/api/reports/dashboard?period=${period}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard statistics')
      }

      const data = await response.json()
      setStats(data.stats)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard'
      setError(errorMessage)
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [fetchData])

  const refreshStats = useCallback(async () => {
    await fetchDashboardStats()
  }, [fetchDashboardStats])

  const getStatsForPeriod = useCallback(async (period: 'today' | 'week' | 'month') => {
    await fetchDashboardStats(period)
  }, [fetchDashboardStats])

  // Initial data fetch
  useEffect(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

  // Auto-refresh every 5 minutes for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchDashboardStats()
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [fetchDashboardStats, loading])

  return {
    stats,
    loading,
    error,
    refreshStats,
    getStatsForPeriod
  }
}

export default useDashboard 