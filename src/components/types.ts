/**
 * Component Types
 * Shared TypeScript interfaces for components
 */

// Common UI Props
export interface BaseProps {
  className?: string
  children?: React.ReactNode
}

// Employee Types
export interface Employee {
  id: string
  name: string
  telegramId: string
  department: string
  position: string
  phone?: string
  email?: string
  startDate: string
  isActive: boolean
  lastSeen?: Date
}

// Attendance Types
export interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName?: string
  date: string
  checkInTime?: Date | string
  checkOutTime?: Date | string
  status: 'present' | 'absent' | 'late' | 'pending'
  location?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Chart Data Types
export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

export interface DepartmentStats {
  department: string
  present: number
  total: number
  attendanceRate: number
}

// Form Types
export interface FormField {
  name: string
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'time' | 'select' | 'textarea'
  label: string
  placeholder?: string
  required?: boolean
  options?: Array<{ value: string; label: string }>
  validation?: (value: any) => string | undefined
}

// API Response Types
export interface ComponentApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Pagination Types
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Filter Types
export interface AttendanceFilter {
  startDate?: string
  endDate?: string
  department?: string
  status?: AttendanceRecord['status']
  employeeId?: string
}

// Dashboard Stats
export interface DashboardStats {
  totalEmployees: number
  presentToday: number
  absentToday: number
  lateToday: number
  attendanceRate: number
  trends: ChartDataPoint[]
  departmentStats: DepartmentStats[]
}

// Admin Types
export interface AdminUser {
  id: string
  telegramId: string
  firstName: string
  role: 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN'
  isActive: boolean
  createdAt: Date
  lastLogin?: Date
}

// Notification Types
export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: Date
  actions?: Array<{
    label: string
    action: string
    variant?: 'primary' | 'secondary'
  }>
}