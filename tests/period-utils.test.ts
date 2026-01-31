import { describe, it, expect } from 'vitest'
import {
  isNewWeek,
  isNewMonth,
  getISOWeekNumber,
  getPreviousWeekRange,
  getPreviousMonthRange,
  formatWeekId,
  formatMonthId,
  formatDate,
  formatMonthName,
  formatDateRange,
  getDatesInRange,
} from '../src/period-utils.js'

// Helper to create local dates without timezone issues
function localDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 12, 0, 0) // noon to avoid DST issues
}

describe('period-utils', () => {
  describe('isNewWeek', () => {
    it('should return true for Monday', () => {
      const monday = localDate(2026, 1, 26) // Monday Jan 26, 2026
      expect(isNewWeek(monday)).toBe(true)
    })

    it('should return false for other days', () => {
      const tuesday = localDate(2026, 1, 27)
      const sunday = localDate(2026, 2, 1)
      expect(isNewWeek(tuesday)).toBe(false)
      expect(isNewWeek(sunday)).toBe(false)
    })
  })

  describe('isNewMonth', () => {
    it('should return true for the 1st', () => {
      const first = localDate(2026, 2, 1)
      expect(isNewMonth(first)).toBe(true)
    })

    it('should return false for other days', () => {
      const second = localDate(2026, 2, 2)
      const fifteenth = localDate(2026, 1, 15)
      expect(isNewMonth(second)).toBe(false)
      expect(isNewMonth(fifteenth)).toBe(false)
    })
  })

  describe('getISOWeekNumber', () => {
    it('should return correct week number', () => {
      const jan1 = localDate(2026, 1, 1) // Week 1
      const jan31 = localDate(2026, 1, 31) // Week 5
      expect(getISOWeekNumber(jan1)).toBe(1)
      expect(getISOWeekNumber(jan31)).toBe(5)
    })
  })

  describe('getPreviousWeekRange', () => {
    it('should return previous week Monday-Sunday', () => {
      const monday = localDate(2026, 2, 2) // Monday Feb 2
      const { start, end } = getPreviousWeekRange(monday)

      expect(formatDate(start)).toBe('2026-01-26')
      expect(formatDate(end)).toBe('2026-02-01')
    })

    it('should work from any day of the week', () => {
      const friday = localDate(2026, 2, 6) // Friday Feb 6
      const { start, end } = getPreviousWeekRange(friday)

      // Previous week should be Jan 26 - Feb 1
      expect(formatDate(start)).toBe('2026-01-26')
      expect(formatDate(end)).toBe('2026-02-01')
    })
  })

  describe('getPreviousMonthRange', () => {
    it('should return previous month first to last day', () => {
      const feb1 = localDate(2026, 2, 1)
      const { start, end } = getPreviousMonthRange(feb1)

      expect(formatDate(start)).toBe('2026-01-01')
      expect(formatDate(end)).toBe('2026-01-31')
    })

    it('should handle varying month lengths', () => {
      const march1 = localDate(2026, 3, 1)
      const { start, end } = getPreviousMonthRange(march1)

      expect(formatDate(start)).toBe('2026-02-01')
      expect(formatDate(end)).toBe('2026-02-28') // Non-leap year
    })
  })

  describe('formatWeekId', () => {
    it('should format as YYYY-Www', () => {
      const date = localDate(2026, 1, 31)
      expect(formatWeekId(date)).toBe('2026-W05')
    })

    it('should pad single digit week numbers', () => {
      const date = localDate(2026, 1, 5)
      expect(formatWeekId(date)).toBe('2026-W02')
    })
  })

  describe('formatMonthId', () => {
    it('should format as YYYY-MM', () => {
      const date = localDate(2026, 1, 15)
      expect(formatMonthId(date)).toBe('2026-01')
    })

    it('should pad single digit months', () => {
      const date = localDate(2026, 5, 15)
      expect(formatMonthId(date)).toBe('2026-05')
    })
  })

  describe('formatMonthName', () => {
    it('should return human readable month name', () => {
      const date = localDate(2026, 1, 15)
      expect(formatMonthName(date)).toBe('January 2026')
    })
  })

  describe('formatDateRange', () => {
    it('should format range within same month', () => {
      const start = localDate(2026, 1, 26)
      const end = localDate(2026, 1, 31)
      expect(formatDateRange(start, end)).toBe('Jan 26 - 31, 2026')
    })

    it('should format range spanning months', () => {
      const start = localDate(2026, 1, 26)
      const end = localDate(2026, 2, 1)
      expect(formatDateRange(start, end)).toBe('Jan 26 - Feb 1, 2026')
    })
  })

  describe('getDatesInRange', () => {
    it('should return all dates inclusive', () => {
      const start = localDate(2026, 1, 28)
      const end = localDate(2026, 1, 31)
      const dates = getDatesInRange(start, end)

      expect(dates.length).toBe(4)
      expect(formatDate(dates[0])).toBe('2026-01-28')
      expect(formatDate(dates[3])).toBe('2026-01-31')
    })
  })
})
