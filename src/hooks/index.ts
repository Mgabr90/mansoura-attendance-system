/**
 * Hooks Index - Central Export Hub
 * Custom hooks for state management and business logic
 */

// Authentication & Session
export { default as useAuth } from './useAuth'
export { default as useSession } from './useSession'

// Data Hooks
export { default as useDashboard } from './useDashboard'
export { default as useEmployees } from './useEmployees'
export { default as useAttendance } from './useAttendance'
export { default as useReports } from './useReports'
export { default as useNotifications } from './useNotifications'

// UI State Hooks
export { default as useModal } from './useModal'
export { default as useToast } from './useToast'
export { default as useLocalStorage } from './useLocalStorage'
export { default as useDebounce } from './useDebounce'

// Form Hooks
export { default as useForm } from './useForm'
export { default as useFormValidation } from './useFormValidation'

// API Hooks
export { default as useApi } from './useApi'
export { default as usePagination } from './usePagination'

// Chart & Analytics
export { default as useChartData } from './useChartData'
export { default as useAnalytics } from './useAnalytics'

// Export types
export * from './types' 