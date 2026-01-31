/**
 * Period Utilities Module
 *
 * Provides utilities for detecting calendar period boundaries
 * and calculating previous week/month ranges.
 */

/**
 * Checks if today is the start of a new week (Monday)
 */
export function isNewWeek(date: Date = new Date()): boolean {
  return date.getDay() === 1 // Monday
}

/**
 * Checks if today is the start of a new month (1st)
 */
export function isNewMonth(date: Date = new Date()): boolean {
  return date.getDate() === 1
}

/**
 * Gets the ISO week number for a date
 */
export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

/**
 * Gets the ISO week year (may differ from calendar year at year boundaries)
 */
export function getISOWeekYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  return d.getUTCFullYear()
}

/**
 * Gets the previous week's date range (Monday to Sunday)
 *
 * @param date - Reference date (defaults to today)
 * @returns Object with start (Monday) and end (Sunday) dates
 */
export function getPreviousWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  const current = new Date(date)
  const dayOfWeek = current.getDay()

  // Calculate days to subtract to get to previous Monday
  // If today is Monday (1), go back 7 days
  // If today is Sunday (0), go back 6 days to get to Monday
  // Otherwise, go back (dayOfWeek - 1 + 7) days
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const daysBack = daysToMonday + 7

  const monday = new Date(current)
  monday.setDate(current.getDate() - daysBack)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return { start: monday, end: sunday }
}

/**
 * Gets the previous month's date range
 *
 * @param date - Reference date (defaults to today)
 * @returns Object with start (1st) and end (last day) dates
 */
export function getPreviousMonthRange(date: Date = new Date()): { start: Date; end: Date } {
  const current = new Date(date)

  // Go to previous month
  const prevMonth = new Date(current.getFullYear(), current.getMonth() - 1, 1)

  const start = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1)
  start.setHours(0, 0, 0, 0)

  // Last day of previous month
  const end = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

/**
 * Formats a week ID in ISO format (YYYY-Www)
 */
export function formatWeekId(date: Date): string {
  const year = getISOWeekYear(date)
  const week = getISOWeekNumber(date)
  return `${year}-W${week.toString().padStart(2, '0')}`
}

/**
 * Formats a month ID (YYYY-MM)
 */
export function formatMonthId(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Formats a date as YYYY-MM-DD (using local timezone)
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Formats a human-readable month name (e.g., "January 2026")
 */
export function formatMonthName(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/**
 * Formats a human-readable date range (e.g., "Jan 27 - Feb 2, 2026")
 */
export function formatDateRange(start: Date, end: Date): string {
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
  const startDay = start.getDate()
  const endDay = end.getDate()
  const year = end.getFullYear()

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`
}

/**
 * Gets all dates in a range (inclusive)
 */
export function getDatesInRange(start: Date, end: Date): Date[] {
  const dates: Date[] = []
  const current = new Date(start)
  current.setHours(0, 0, 0, 0)

  const endDate = new Date(end)
  endDate.setHours(0, 0, 0, 0)

  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  return dates
}
