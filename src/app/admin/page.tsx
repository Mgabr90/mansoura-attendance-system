'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  UsersIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import { Modal, EmployeeForm, AdminPanel } from '@/src'

interface DashboardStats {
  totalEmployees: number
  activeToday: number
  checkedIn: number
  lateArrivals: number
  workingHours: {
    total: number
    average: number
  }
}

interface RecentActivity {
  id: string
  employeeName: string
  action: 'CHECK_IN' | 'CHECK_OUT'
  timestamp: string
  location: string
  isLate?: boolean
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [showDailyReport, setShowDailyReport] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const fetchDashboardData = async () => {
    try {
      // Fetch real data from API
      const [employeesRes, attendanceRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/attendance?period=today')
      ])

      const employees = employeesRes.ok ? await employeesRes.json() : { data: [] }
      const attendance = attendanceRes.ok ? await attendanceRes.json() : { data: [] }

      const employeeData = employees.data || []
      const attendanceData = attendance.data || []

      // Calculate real stats
      const totalEmployees = employeeData.length
      const activeToday = attendanceData.filter((record: any) => 
        record.checkInTime || record.checkOutTime
      ).length
      const checkedIn = attendanceData.filter((record: any) => 
        record.checkInTime && !record.checkOutTime
      ).length
      const lateArrivals = attendanceData.filter((record: any) => 
        record.isLate === true
      ).length

      // Calculate working hours
      const totalHours = attendanceData.reduce((total: number, record: any) => {
        if (record.checkInTime && record.checkOutTime) {
          const checkIn = new Date(record.checkInTime)
          const checkOut = new Date(record.checkOutTime)
          const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
          return total + hours
        }
        return total
      }, 0)

      const realStats: DashboardStats = {
        totalEmployees,
        activeToday,
        checkedIn,
        lateArrivals,
        workingHours: {
          total: Math.round(totalHours),
          average: totalEmployees > 0 ? Math.round((totalHours / totalEmployees) * 10) / 10 : 0
        }
      }

      // Convert attendance data to recent activity
      const recentActivityData: RecentActivity[] = attendanceData
        .slice(0, 5) // Get most recent 5 records
        .map((record: any, index: number) => ({
          id: record.id?.toString() || index.toString(),
          employeeName: record.employee?.firstName 
            ? `${record.employee.firstName} ${record.employee.lastName || ''}`.trim()
            : 'Unknown Employee',
          action: record.checkOutTime ? 'CHECK_OUT' : 'CHECK_IN',
          timestamp: (record.checkOutTime || record.checkInTime || new Date()).toString(),
          location: 'El Mansoura CIH Office',
          isLate: record.isLate || false
        }))

      setStats(realStats)
      setRecentActivity(recentActivityData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Set empty states on error
      setStats({
        totalEmployees: 0,
        activeToday: 0,
        checkedIn: 0,
        lateArrivals: 0,
        workingHours: { total: 0, average: 0 }
      })
      setRecentActivity([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchDashboardData()
  }, [])

  const handleAddEmployee = () => {
    setShowAddEmployee(true)
  }

  const handleEmployeeSubmit = async (employeeData: any) => {
    try {
      // Always generate invitation (invitation-only workflow)
      const invitationResponse = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: employeeData.name.split(' ')[0],
          lastName: employeeData.name.split(' ').slice(1).join(' ') || undefined,
          department: employeeData.department,
          position: employeeData.position,
          email: employeeData.email,
          phoneNumber: employeeData.phone,
          invitedBy: 'admin', // TODO: Get actual admin telegram ID
          expiresInDays: 7
        }),
      })

      if (invitationResponse.ok) {
        const invitationData = await invitationResponse.json()
        return invitationData.data // Return invitation data for the form to display
      } else {
        alert('Failed to generate invitation. Please try again.')
        return null
      }
    } catch (error) {
      console.error('Error handling employee invitation:', error)
      alert('Error: ' + error.message)
    }
  }

  const handleDailyReport = async () => {
    try {
      const response = await fetch('/api/reports?type=daily')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `daily_report_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        console.error('Failed to download report')
      }
    } catch (error) {
      console.error('Error downloading report:', error)
    }
  }

  const handleSettings = () => {
    setShowSettings(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">El Mansoura CIH Attendance System</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="btn-primary">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Employees
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {stats?.totalEmployees}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-success-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Today
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {stats?.activeToday}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Checked In
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {stats?.checkedIn}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-warning-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Late Arrivals
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {stats?.lateArrivals}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="flow-root">
                <ul className="-mb-8">
                  {recentActivity.map((activity, index) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {index !== recentActivity.length - 1 && (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                              activity.action === 'CHECK_IN' 
                                ? activity.isLate 
                                  ? 'bg-warning-500' 
                                  : 'bg-success-500'
                                : 'bg-blue-500'
                            }`}>
                              {activity.action === 'CHECK_IN' ? (
                                <ClockIcon className="h-4 w-4 text-white" />
                              ) : (
                                <CheckCircleIcon className="h-4 w-4 text-white" />
                              )}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                <span className="font-medium text-gray-900">
                                  {activity.employeeName}
                                </span>{' '}
                                {activity.action === 'CHECK_IN' ? 'checked in' : 'checked out'}
                                {activity.isLate && (
                                  <span className="text-warning-600 font-medium"> (Late)</span>
                                )}
                              </p>
                              <p className="text-xs text-gray-400 flex items-center">
                                <MapPinIcon className="h-3 w-3 mr-1" />
                                {activity.location}
                              </p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {new Date(activity.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Today's Summary
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ChartBarIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-600">Total Working Hours</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {stats?.workingHours.total}h
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-600">Average Hours</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {stats?.workingHours.average}h
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-600">Office Location</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    El Mansoura CIH
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UsersIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-600">Attendance Rate</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {stats ? Math.round((stats.activeToday / stats.totalEmployees) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="card">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                  onClick={handleAddEmployee}
                  className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                >
                  Add Employee
                </button>
                <button 
                  onClick={() => void handleDailyReport()}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                >
                  Daily Report
                </button>
                <button 
                  onClick={handleSettings}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                >
                  System Settings
                </button>
                <Link
                  href="https://t.me/CIH_Mansoura_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Test Bot
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Employee Modal */}
      <Modal
        isOpen={showAddEmployee}
        onClose={() => setShowAddEmployee(false)}
        title="Add New Employee"
        size="lg"
      >
        <EmployeeForm
          onSubmit={handleEmployeeSubmit}
          onCancel={() => setShowAddEmployee(false)}
        />
      </Modal>

      {/* System Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="System Settings"
        size="xl"
      >
        <AdminPanel />
      </Modal>
    </div>
  )
} 