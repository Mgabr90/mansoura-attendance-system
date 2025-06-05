/**
 * Core Utilities
 * Essential utility functions used throughout the application
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines class names with Tailwind CSS merge support
 * Useful for conditional styling and component composition
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats error messages for consistent display
 * Handles different error types and provides fallback messages
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  if (typeof error === 'object' && error !== null) {
    // Handle API error responses
    if ('message' in error && typeof error.message === 'string') {
      return error.message
    }
    
    // Handle validation errors
    if ('errors' in error && Array.isArray(error.errors)) {
      return error.errors.join(', ')
    }
  }
  
  return 'An unexpected error occurred'
}

/**
 * Sleep function for testing and rate limiting
 * Returns a promise that resolves after the specified delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generates a unique ID string
 * Useful for React keys and temporary IDs
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Safely parses JSON with error handling
 * Returns null if parsing fails
 */
export function safeJsonParse<T = any>(json: string): T | null {
  try {
    return JSON.parse(json) as T
  } catch {
    return null
  }
}

/**
 * Converts a value to a boolean safely
 * Handles various truthy/falsy representations
 */
export function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value
  }
  
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim()
    return normalized === 'true' || normalized === '1' || normalized === 'yes'
  }
  
  if (typeof value === 'number') {
    return value !== 0
  }
  
  return Boolean(value)
}

/**
 * Creates a stable sort function for arrays
 * Maintains relative order of equal elements
 */
export function stableSort<T>(
  array: T[],
  compareFn: (a: T, b: T) => number
): T[] {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number])
  
  stabilizedThis.sort((a, b) => {
    const order = compareFn(a[0], b[0])
    if (order !== 0) return order
    return a[1] - b[1]
  })
  
  return stabilizedThis.map(el => el[0])
}

/**
 * Capitalizes the first letter of a string
 * Useful for display formatting
 */
export function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Converts camelCase/PascalCase to kebab-case
 * Useful for CSS class names and API endpoints
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

/**
 * Converts kebab-case to camelCase
 * Useful for converting API responses to JS conventions
 */
export function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Checks if a value is empty (null, undefined, empty string, empty array, empty object)
 * Useful for form validation and conditional rendering
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true
  }
  
  if (typeof value === 'string') {
    return value.trim().length === 0
  }
  
  if (Array.isArray(value)) {
    return value.length === 0
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length === 0
  }
  
  return false
}

/**
 * Creates a range of numbers
 * Useful for pagination and loops
 */
export function range(start: number, end?: number, step = 1): number[] {
  if (end === undefined) {
    end = start
    start = 0
  }
  
  const result: number[] = []
  
  if (step > 0) {
    for (let i = start; i < end; i += step) {
      result.push(i)
    }
  } else if (step < 0) {
    for (let i = start; i > end; i += step) {
      result.push(i)
    }
  }
  
  return result
}

/**
 * Clamps a number between min and max values
 * Useful for ensuring values stay within bounds
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
} 