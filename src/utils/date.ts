import { format, startOfDay, endOfDay, addDays, subDays } from 'date-fns'

// Work hours configuration
const DEFAULT_WORK_START = process.env.DEFAULT_WORK_START || '09:00'
const DEFAULT_WORK_END = process.env.DEFAULT_WORK_END || '17:00'

/**
 * Format date and time for display
 */
export function formatDateTimeForDisplay(date: Date): string {
  return format(date, 'MMM dd, yyyy HH:mm')
}

/**
 * Format date only for display
 */
export function formatDateForDisplay(date: Date): string {
  return format(date, 'MMM dd, yyyy')
}

/**
 * Format time only for display
 */
export function formatTimeForDisplay(date: Date): string {
  return format(date, 'HH:mm')
}

/**
 * Parse time string (HH:mm) to Date object for today
 */
export function parseTimeToday(timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number)
  const today = new Date()
  today.setHours(hours, minutes, 0, 0)
  return today
}

/**
 * Check if check-in time is late
 */
export function isLateCheckIn(checkInTime: Date): boolean {
  const workStart = parseTimeToday(DEFAULT_WORK_START)
  return checkInTime > workStart
}

/**
 * Check if arrival is late (alias for isLateCheckIn)
 */
export function isLateArrival(checkInTime: Date): boolean {
  return isLateCheckIn(checkInTime)
}

/**
 * Check if check-out time is early
 */
export function isEarlyCheckOut(checkOutTime: Date): boolean {
  const workEnd = parseTimeToday(DEFAULT_WORK_END)
  return checkOutTime < workEnd
}

/**
 * Check if departure is early (alias for isEarlyCheckOut)
 */
export function isEarlyDeparture(checkOutTime: Date): boolean {
  return isEarlyCheckOut(checkOutTime)
}

/**
 * Calculate working hours between check-in and check-out
 */
export function calculateWorkingHours(checkIn: Date, checkOut: Date): number {
  const diffMs = checkOut.getTime() - checkIn.getTime()
  return diffMs / (1000 * 60 * 60) // Convert to hours
}

/**
 * Get default work hours
 */
export function getDefaultWorkHours(): { start: string; end: string } {
  return {
    start: DEFAULT_WORK_START,
    end: DEFAULT_WORK_END
  }
}

/**
 * Check if current time is within work hours
 */
export function isWithinWorkHours(date?: Date): boolean {
  const now = date || new Date()
  const workStart = parseTimeToday(DEFAULT_WORK_START)
  const workEnd = parseTimeToday(DEFAULT_WORK_END)
  
  return now >= workStart && now <= workEnd
}

/**
 * Get time until work starts (in minutes)
 */
export function getMinutesUntilWorkStarts(date?: Date): number {
  const now = date || new Date()
  const workStart = parseTimeToday(DEFAULT_WORK_START)
  
  if (now >= workStart) {
    return 0
  }
  
  return Math.ceil((workStart.getTime() - now.getTime()) / (1000 * 60))
}

/**
 * Get time until work ends (in minutes)
 */
export function getMinutesUntilWorkEnds(date?: Date): number {
  const now = date || new Date()
  const workEnd = parseTimeToday(DEFAULT_WORK_END)
  
  if (now >= workEnd) {
    return 0
  }
  
  return Math.ceil((workEnd.getTime() - now.getTime()) / (1000 * 60))
}

/**
 * Get how late someone is (in minutes)
 */
export function getLatenessInMinutes(checkInTime: Date): number {
  const workStart = parseTimeToday(DEFAULT_WORK_START)
  
  if (checkInTime <= workStart) {
    return 0
  }
  
  return Math.ceil((checkInTime.getTime() - workStart.getTime()) / (1000 * 60))
}

/**
 * Get how early someone left (in minutes)
 */
export function getEarlyDepartureInMinutes(checkOutTime: Date): number {
  const workEnd = parseTimeToday(DEFAULT_WORK_END)
  
  if (checkOutTime >= workEnd) {
    return 0
  }
  
  return Math.ceil((workEnd.getTime() - checkOutTime.getTime()) / (1000 * 60))
}

/**
 * Check if a date is a weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday or Saturday
}

/**
 * Get work days between two dates (excluding weekends)
 */
export function getWorkDaysBetween(startDate: Date, endDate: Date): Date[] {
  const workDays: Date[] = []
  let currentDate = startOfDay(startDate)
  const end = startOfDay(endDate)
  
  while (currentDate <= end) {
    if (!isWeekend(currentDate)) {
      workDays.push(new Date(currentDate))
    }
    currentDate = addDays(currentDate, 1)
  }
  
  return workDays
}

/**
 * Get date range for different periods
 */
export function getDateRange(period: 'today' | 'yesterday' | 'week' | 'month' | 'custom', customStart?: Date, customEnd?: Date): { start: Date; end: Date } {
  const now = new Date()
  
  switch (period) {
    case 'today':
      return {
        start: startOfDay(now),
        end: endOfDay(now)
      }
    
    case 'yesterday':
      const yesterday = subDays(now, 1)
      return {
        start: startOfDay(yesterday),
        end: endOfDay(yesterday)
      }
    
    case 'week':
      const weekStart = subDays(now, 7)
      return {
        start: startOfDay(weekStart),
        end: endOfDay(now)
      }
    
    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return {
        start: startOfDay(monthStart),
        end: endOfDay(now)
      }
    
    case 'custom':
      if (!customStart || !customEnd) {
        throw new Error('Custom date range requires start and end dates')
      }
      return {
        start: startOfDay(customStart),
        end: endOfDay(customEnd)
      }
    
    default:
      throw new Error('Invalid period specified')
  }
}

/**
 * Format duration in hours and minutes
 */
export function formatDuration(hours: number): string {
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)
  
  if (wholeHours === 0) {
    return `${minutes}m`
  }
  
  if (minutes === 0) {
    return `${wholeHours}h`
  }
  
  return `${wholeHours}h ${minutes}m`
}

/**
 * Get timezone offset in hours
 */
export function getTimezoneOffset(): number {
  return new Date().getTimezoneOffset() / -60
}

/**
 * Convert UTC date to local timezone
 */
export function toLocalTime(utcDate: Date): Date {
  return new Date(utcDate.getTime() - (utcDate.getTimezoneOffset() * 60000))
}

/**
 * Convert local date to UTC
 */
export function toUTC(localDate: Date): Date {
  return new Date(localDate.getTime() + (localDate.getTimezoneOffset() * 60000))
}

/**
 * Get human-readable time difference
 */
export function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMinutes < 1) {
    return 'Just now'
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  }
  if (diffDays === 1) {
    return 'Yesterday'
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`
  }
  
  return formatDateForDisplay(date)
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * Get Egyptian timezone date
 */
export function getEgyptianTime(): Date {
  return new Date(new Date().toLocaleString("en-US", {timeZone: "Africa/Cairo"}))
} 