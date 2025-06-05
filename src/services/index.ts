/**
 * Services Index - Central Export Hub
 * Business logic services and external integrations
 */

// Core Services
export { AuthService } from '@/lib/auth'
export { ExportService } from '@/lib/export'
export { HealthMonitor } from '@/lib/health-monitor'

// Background Services
export { default as CronService } from './cron-service'
export { default as NotificationService } from './notification'
export { default as StartupService } from './startup'

// Data Services
export { default as EmployeeService } from './employee'
export { default as AttendanceService } from './attendance'
export { default as ReportService } from './report'

// External Services
export { default as TelegramBotService } from './telegram-bot'
export { default as EmailService } from './email'
export { default as SMSService } from './sms'

// Cache & Storage Services
export { default as CacheService } from './cache'
export { default as FileStorageService } from './file-storage'

// Analytics Services
export { default as AnalyticsService } from './analytics'
export { default as MetricsService } from './metrics'

// Service Manager - Orchestrates all services
export { default as ServiceManager } from './service-manager'

// Export types
export * from './types' 