import { Prisma } from '@prisma/client'

// Re-export Prisma types
export type {
  Employee,
  AttendanceRecord,
  ExceptionalHours,
  Admin,
  WebUser,
  ConversationState,
  NotificationLog,
  ServerActivity,
  Settings,
  AttendanceStatus,
  AdminRole,
  SettingType,
} from '@prisma/client'

// Extended types with relations
export type EmployeeWithAttendance = Prisma.EmployeeGetPayload<{
  include: {
    attendanceRecords: true
    exceptionalHours: true
  }
}>

export type AttendanceRecordWithEmployee = Prisma.AttendanceRecordGetPayload<{
  include: {
    employee: true
  }
}>

// Telegram types
export interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

export interface TelegramLocation {
  longitude: number
  latitude: number
  live_period?: number
  heading?: number
  horizontal_accuracy?: number
  proximity_alert_radius?: number
}

export interface TelegramContact {
  phone_number: string
  first_name: string
  last_name?: string
  user_id?: number
  vcard?: string
}

// Bot context types
export interface BotContext {
  user: TelegramUser
  location?: TelegramLocation
  contact?: TelegramContact
  state?: ConversationState
}

// Location types
export interface Coordinates {
  latitude: number
  longitude: number
}

export interface LocationValidation {
  isValid: boolean
  distance: number
  coordinates: Coordinates
}

// Authentication types
export interface AuthUser {
  id: number
  username: string
  role: AdminRole
}

export interface JWTPayload {
  userId: number
  username: string
  role: AdminRole
  iat: number
  exp: number
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Dashboard types
export interface DashboardStats {
  totalEmployees: number
  presentToday: number
  absentToday: number
  lateToday: number
  averageWorkingHours: number
}

export interface AttendanceChartData {
  date: string
  present: number
  absent: number
  late: number
}

export interface MonthlyAttendance {
  month: string
  attendanceRate: number
  averageWorkingHours: number
}

// Form types
export interface CheckInData {
  latitude: number
  longitude: number
  timestamp: Date
}

export interface CheckOutData {
  latitude: number
  longitude: number
  timestamp: Date
}

export interface EmployeeRegistrationData {
  telegramId: string
  firstName: string
  lastName?: string
  username?: string
  phoneNumber?: string
  department?: string
  position?: string
}

export interface ExceptionalHoursData {
  employeeId: number
  date: Date
  startTime: string
  endTime: string
  reason?: string
}

// Settings types
export interface AppSettings {
  officeLocation: Coordinates
  officeRadius: number
  workHours: {
    start: string
    end: string
  }
  notifications: {
    enabled: boolean
    dailyReportTime: string
  }
}

// Report types
export interface AttendanceReport {
  employee: Pick<Employee, 'id' | 'firstName' | 'lastName' | 'department'>
  records: AttendanceRecord[]
  stats: {
    totalDays: number
    presentDays: number
    absentDays: number
    lateDays: number
    averageWorkingHours: number
  }
}

export interface DailyReport {
  date: Date
  totalEmployees: number
  present: AttendanceRecordWithEmployee[]
  absent: Employee[]
  late: AttendanceRecordWithEmployee[]
  summary: {
    attendanceRate: number
    punctualityRate: number
    averageWorkingHours: number
  }
}

// Filter types
export interface AttendanceFilters {
  startDate?: Date
  endDate?: Date
  employeeId?: number
  department?: string
  status?: AttendanceStatus
}

export interface EmployeeFilters {
  department?: string
  isActive?: boolean
  search?: string
}

// Webhook types
export interface TelegramWebhook {
  update_id: number
  message?: any
  edited_message?: any
  channel_post?: any
  edited_channel_post?: any
  inline_query?: any
  chosen_inline_result?: any
  callback_query?: any
}

// Error types
export interface AppError extends Error {
  code?: string
  statusCode?: number
  details?: any
}

// Notification types
export interface NotificationData {
  type: 'daily_summary' | 'late_alert' | 'absence_alert' | 'system_alert'
  recipient: string
  templateData: Record<string, any>
}

// Export validation schemas (Zod)
export interface ValidationSchema {
  checkIn: any
  checkOut: any
  registration: any
  exceptionalHours: any
  login: any
} 