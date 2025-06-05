/**
 * El Mansoura CIH Attendance System - Main Module Index
 * Central export hub for all application modules
 * 
 * Usage:
 * import { Button, Card, useAuth, formatDate, ServiceManager } from '@/src'
 * 
 * Or domain-specific imports:
 * import { Button, Card } from '@/src/components'
 * import { useAuth, useDashboard } from '@/src/hooks'
 * import { formatDate, cn } from '@/src/utils'
 */

// ====================
// UI COMPONENTS
// ====================
export * from './components'

// ====================
// CUSTOM HOOKS
// ====================
export * from './hooks'

// ====================
// UTILITY FUNCTIONS
// ====================
export * from './utils'

// ====================
// SERVICES & BUSINESS LOGIC
// ====================
export * from './services'

// ====================
// TYPE DEFINITIONS
// ====================
export * from './types'

// ====================
// LIB MODULES
// ====================
export * from './lib/auth'
export * from './lib/export'
export * from './lib/health-monitor'
export * from './lib/bot-commands'

// ====================
// FEATURE MODULES
// ====================

/**
 * Authentication Module
 * Complete authentication system with hooks and components
 */
export const AuthModule = {
  // Hooks
  useAuth: () => import('./hooks/useAuth'),
  useSession: () => import('./hooks/useSession'),
  
  // Components
  LoginForm: () => import('./components/forms/LoginForm'),
  
  // Services
  AuthService: () => import('./lib/auth')
}

/**
 * Dashboard Module
 * Dashboard components, hooks, and utilities
 */
export const DashboardModule = {
  // Components
  Dashboard: () => import('./components/features/Dashboard'),
  AttendanceCard: () => import('./components/features/AttendanceCard'),
  
  // Hooks
  useDashboard: () => import('./hooks/useDashboard'),
  
  // Charts
  AttendanceChart: () => import('./components/charts/AttendanceChart')
}

/**
 * Employee Management Module
 * Employee-related components and functionality
 */
export const EmployeeModule = {
  // Components
  EmployeeList: () => import('./components/features/EmployeeList'),
  EmployeeForm: () => import('./components/forms/EmployeeForm'),
  
  // Hooks
  useEmployees: () => import('./hooks/useEmployees'),
  
  // Services
  EmployeeService: () => import('./services/employee')
}

/**
 * Reports & Analytics Module
 * Reporting components and export functionality
 */
export const ReportsModule = {
  // Components
  ReportsPanel: () => import('./components/features/ReportsPanel'),
  
  // Hooks
  useReports: () => import('./hooks/useReports'),
  useAnalytics: () => import('./hooks/useAnalytics'),
  
  // Services
  ExportService: () => import('./lib/export'),
  ReportService: () => import('./services/report')
}

/**
 * Telegram Bot Module
 * Bot commands and Telegram integration
 */
export const TelegramModule = {
  // Services
  TelegramBotService: () => import('./services/telegram-bot'),
  BotCommands: () => import('./lib/bot-commands'),
  
  // Utilities
  TelegramFormatters: () => import('./utils/telegram-formatters'),
  TelegramKeyboards: () => import('./utils/telegram-keyboards')
}

// ====================
// SYSTEM MODULES
// ====================

/**
 * System Health Module
 * Health monitoring and system status
 */
export const HealthModule = {
  // Services
  HealthMonitor: () => import('./lib/health-monitor'),
  
  // Hooks
  useHealth: () => import('./hooks/useHealth')
}

/**
 * Notification Module
 * Notification system and user alerts
 */
export const NotificationModule = {
  // Components
  NotificationCenter: () => import('./components/features/NotificationCenter'),
  
  // Hooks
  useNotifications: () => import('./hooks/useNotifications'),
  
  // Services
  NotificationService: () => import('./services/notification')
}

// ====================
// DEVELOPMENT UTILITIES
// ====================

/**
 * Development tools and testing utilities
 * Only available in development mode
 */
export const DevModule = process.env.NODE_ENV === 'development' ? {
  // Testing utilities
  mockData: () => import('./utils/mock-data'),
  testHelpers: () => import('./utils/test-helpers'),
  
  // Development components
  DevTools: () => import('./components/dev/DevTools'),
  ApiDebugger: () => import('./components/dev/ApiDebugger')
} : {}

// ====================
// MODULE METADATA
// ====================

export const ModuleInfo = {
  name: 'El Mansoura CIH Attendance System',
  version: '2.0.0',
  description: 'Modern, modular attendance management system',
  architecture: 'Modular Next.js with TypeScript',
  modules: [
    'Authentication',
    'Dashboard', 
    'Employee Management',
    'Reports & Analytics',
    'Telegram Bot',
    'System Health',
    'Notifications'
  ],
  features: [
    'JWT Authentication',
    'Real-time Dashboard',
    'Telegram Bot Integration',
    'Advanced Reporting',
    'Health Monitoring',
    'Modular Architecture',
    'TypeScript Support'
  ]
} 