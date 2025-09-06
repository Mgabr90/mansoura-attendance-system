/**
 * Dashboard Feature Component
 * Main dashboard with attendance overview and statistics
 */

'use client'

import React, { useState, useEffect } from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { useDashboard } from '@/src'
import { useAuth } from '@/src'
import AttendanceChart from '../charts/AttendanceChart'
import NotificationCenter from './NotificationCenter'

interface DashboardStats {
  totalEmployees: number
  presentToday: number
  lateArrivals: number
  attendanceRate: number
  monthlyAverage: number
}

interface DashboardProps {
  className?: string
}

const Dashboard: React.FC<DashboardProps> = ({ className }) => {
  const { user } = useAuth()
  const { stats, loading, error, refreshStats } = useDashboard()
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today')

  const StatCard: React.FC<{
    title: string
    value: string | number
    icon: React.ReactNode
    trend?: { value: number; isPositive: boolean }
    loading?: boolean
  }> = ({ title, value, icon, trend, loading }) => (
    <Card variant="elevated" padding="md">
      <Card.Body>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-center mt-2">
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              )}
              {trend && (
                <span className={`ml-2 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
                </span>
              )}
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            {icon}
          </div>
        </div>
      </Card.Body>
    </Card>
  )

  if (error) {
    return (
      <div className="p-6">
        <Card variant="outline" className="border-red-200">
          <Card.Body>
            <div className="text-center">
              <p className="text-red-600">Failed to load dashboard data</p>
              <Button 
                variant="outline" 
                onClick={refreshStats}
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName}
          </h1>
          <p className="text-gray-600">
            Here's what's happening at El Mansoura CIH today
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedPeriod === 'today' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('today')}
          >
            Today
          </Button>
          <Button
            variant={selectedPeriod === 'week' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('week')}
          >
            Week
          </Button>
          <Button
            variant={selectedPeriod === 'month' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('month')}
          >
            Month
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={stats?.totalEmployees || 0}
          icon={<UsersIcon className="h-6 w-6 text-blue-600" />}
          loading={loading}
        />
        <StatCard
          title="Present Today"
          value={stats?.presentToday || 0}
          icon={<CheckCircleIcon className="h-6 w-6 text-green-600" />}
          trend={{ value: 5, isPositive: true }}
          loading={loading}
        />
        <StatCard
          title="Late Arrivals"
          value={stats?.lateArrivals || 0}
          icon={<ClockIcon className="h-6 w-6 text-orange-600" />}
          trend={{ value: 2, isPositive: false }}
          loading={loading}
        />
        <StatCard
          title="Attendance Rate"
          value={`${stats?.attendanceRate || 0}%`}
          icon={<ChartBarIcon className="h-6 w-6 text-purple-600" />}
          trend={{ value: 3, isPositive: true }}
          loading={loading}
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="elevated">
          <Card.Header>
            <Card.Title>Attendance Trends</Card.Title>
            <Card.Description>
              Last 7 days attendance overview
            </Card.Description>
          </Card.Header>
          <Card.Body>
            <AttendanceChart data={stats?.weeklyTrends?.map(trend => ({
              date: trend.date,
              present: trend.present,
              absent: trend.total - trend.present,
              late: 0
            })) || []} />
          </Card.Body>
        </Card>

        <Card variant="elevated">
          <Card.Header>
            <Card.Title>Recent Activity</Card.Title>
            <Card.Description>
              Latest attendance events
            </Card.Description>
          </Card.Header>
          <Card.Body>
            <NotificationCenter />
          </Card.Body>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card variant="outline">
        <Card.Header>
          <Card.Title>Quick Actions</Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="primary" 
              leftIcon={<PlusIcon className="h-4 w-4" />}
            >
              Add Employee
            </Button>
            <Button 
              variant="outline" 
              leftIcon={<DocumentIcon className="h-4 w-4" />}
            >
              Generate Report
            </Button>
            <Button 
              variant="outline" 
              leftIcon={<SettingsIcon className="h-4 w-4" />}
            >
              System Settings
            </Button>
            <Button 
              variant="ghost" 
              leftIcon={<RefreshIcon className="h-4 w-4" />}
              onClick={refreshStats}
              loading={loading}
            >
              Refresh Data
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  )
}

// Heroicons components (these would normally be imported from @heroicons/react)
const UsersIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
)

const CheckCircleIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ClockIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ChartBarIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const PlusIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const DocumentIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const SettingsIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const RefreshIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

export default Dashboard 