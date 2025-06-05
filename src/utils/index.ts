/**
 * Utils Index - Central Export Hub
 * Utility functions and helpers organized by domain
 */

// Core Utilities
export { cn, formatError, sleep } from './core'

// Date & Time Utilities
export { 
  formatDate, 
  formatTime, 
  formatDateTime,
  formatRelativeTime,
  isWorkingDay,
  calculateWorkingHours,
  getWorkingDaysInMonth
} from './date'

// Validation Utilities
export {
  validateEmail,
  validatePassword,
  validateEmployeeId,
  validatePhoneNumber,
  sanitizeInput
} from './validation'

// Format Utilities
export {
  formatCurrency,
  formatPercentage,
  formatFileSize,
  formatDuration,
  truncateText
} from './format'

// Array & Object Utilities
export {
  groupBy,
  sortBy,
  filterBy,
  deduplicate,
  flattenArray,
  deepClone,
  mergeDeep
} from './array'

// Storage Utilities
export {
  localStorage,
  sessionStorage,
  cookieStorage
} from './storage'

// API Utilities
export {
  buildQueryString,
  parseApiError,
  retryWithBackoff,
  debounce,
  throttle
} from './api'

// Chart & Analytics Utilities
export {
  generateChartColors,
  calculateTrends,
  formatChartData,
  aggregateData
} from './analytics'

// Telegram Utilities
export {
  formatTelegramMessage,
  createInlineKeyboard,
  parseCommand,
  sanitizeTelegramInput
} from './telegram-formatters'

// Export types
export * from './types' 