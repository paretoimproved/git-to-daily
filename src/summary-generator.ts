/**
 * Summary Generator Module
 *
 * Generates weekly and monthly summary markdown from daily log data.
 */

import type { DailySummary, WeeklyLogData, MonthlyLogData } from './types.js'
import {
  formatWeekId,
  formatMonthId,
  formatMonthName,
  formatDateRange,
  formatDate,
  getISOWeekNumber,
} from './period-utils.js'
import { aggregateFocusAreas, getTopCommits } from './daily-log-reader.js'

/**
 * Builds WeeklyLogData from daily summaries
 */
export function buildWeeklyLogData(
  summaries: DailySummary[],
  weekStart: Date,
  weekEnd: Date
): WeeklyLogData {
  const totalCommits = summaries.reduce((sum, s) => sum + s.commitCount, 0)
  const totalFilesChanged = summaries.reduce((sum, s) => sum + s.filesChanged, 0)

  return {
    weekId: formatWeekId(weekStart),
    startDate: formatDate(weekStart),
    endDate: formatDate(weekEnd),
    dailySummaries: summaries,
    totalCommits,
    totalFilesChanged,
    activeDays: summaries.length,
  }
}

/**
 * Builds MonthlyLogData from daily summaries
 */
export function buildMonthlyLogData(
  summaries: DailySummary[],
  monthDate: Date
): MonthlyLogData {
  const totalCommits = summaries.reduce((sum, s) => sum + s.commitCount, 0)
  const totalFilesChanged = summaries.reduce((sum, s) => sum + s.filesChanged, 0)

  // Calculate weekly breakdown
  const weeklyBreakdown = calculateWeeklyBreakdown(summaries)

  return {
    monthId: formatMonthId(monthDate),
    monthName: formatMonthName(monthDate),
    dailySummaries: summaries,
    totalCommits,
    totalFilesChanged,
    activeDays: summaries.length,
    weeklyBreakdown,
  }
}

/**
 * Calculates commits per week within a month
 */
function calculateWeeklyBreakdown(summaries: DailySummary[]): { weekNumber: number; commits: number }[] {
  const weekMap = new Map<number, number>()

  for (const summary of summaries) {
    const date = parseLocalDate(summary.date)
    const weekNum = getISOWeekNumber(date)
    const current = weekMap.get(weekNum) || 0
    weekMap.set(weekNum, current + summary.commitCount)
  }

  return Array.from(weekMap.entries())
    .map(([weekNumber, commits]) => ({ weekNumber, commits }))
    .sort((a, b) => a.weekNumber - b.weekNumber)
}

/**
 * Parses a YYYY-MM-DD date string as a local date (not UTC)
 */
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0) // noon to avoid DST issues
}

/**
 * Generates a Weekly Log markdown document
 */
export function generateWeeklyLog(data: WeeklyLogData): string {
  const dateRange = formatDateRange(parseLocalDate(data.startDate), parseLocalDate(data.endDate))

  const sections = [
    generateWeeklyHeader(data.weekId, dateRange),
    generateWeeklySummary(data),
    generateFocusAreasSection(data.dailySummaries),
    generateDailyBreakdownTable(data.dailySummaries),
    generateHighlightsSection(data.dailySummaries),
    generateSummaryFooter(),
  ]

  return sections.join('\n\n')
}

/**
 * Generates a Monthly Log markdown document
 */
export function generateMonthlyLog(data: MonthlyLogData): string {
  const sections = [
    generateMonthlyHeader(data.monthName),
    generateMonthlySummary(data),
    generateFocusAreasSection(data.dailySummaries),
    generateWeeklyBreakdownTable(data.weeklyBreakdown),
    generateDailyBreakdownTable(data.dailySummaries),
    generateHighlightsSection(data.dailySummaries, 15),
    generateSummaryFooter(),
  ]

  return sections.join('\n\n')
}

// --- Header generators ---

function generateWeeklyHeader(weekId: string, dateRange: string): string {
  return `# Weekly Log - ${weekId} (${dateRange})`
}

function generateMonthlyHeader(monthName: string): string {
  return `# Monthly Log - ${monthName}`
}

// --- Summary section generators ---

function generateWeeklySummary(data: WeeklyLogData): string {
  return [
    '## Summary',
    `- **Total Commits**: ${data.totalCommits}`,
    `- **Total Files Changed**: ${data.totalFilesChanged}`,
    `- **Active Days**: ${data.activeDays}/7`,
  ].join('\n')
}

function generateMonthlySummary(data: MonthlyLogData): string {
  const daysInMonth = new Date(
    parseInt(data.monthId.split('-')[0]),
    parseInt(data.monthId.split('-')[1]),
    0
  ).getDate()

  return [
    '## Summary',
    `- **Total Commits**: ${data.totalCommits}`,
    `- **Total Files Changed**: ${data.totalFilesChanged}`,
    `- **Active Days**: ${data.activeDays}/${daysInMonth}`,
    `- **Weeks Active**: ${data.weeklyBreakdown.length}`,
  ].join('\n')
}

// --- Focus areas section ---

function generateFocusAreasSection(summaries: DailySummary[]): string {
  const focusCounts = aggregateFocusAreas(summaries)

  // Sort by commit count descending
  const sortedFocus = Array.from(focusCounts.entries())
    .sort((a, b) => b[1] - a[1])

  const lines = sortedFocus.map(([area, count]) => `- ${area}: ${count} commits`)

  return ['## Focus Areas', ...lines].join('\n')
}

// --- Daily breakdown table ---

function generateDailyBreakdownTable(summaries: DailySummary[]): string {
  const header = '| Date | Day | Commits | Focus |'
  const separator = '|------|-----|---------|-------|'

  const rows = summaries.map((s) => {
    const date = parseLocalDate(s.date)
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
    const shortDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `| ${shortDate} | ${dayName} | ${s.commitCount} | ${s.focusArea} |`
  })

  return ['## Daily Breakdown', header, separator, ...rows].join('\n')
}

// --- Weekly breakdown table (for monthly logs) ---

function generateWeeklyBreakdownTable(breakdown: { weekNumber: number; commits: number }[]): string {
  const header = '| Week | Commits |'
  const separator = '|------|---------|'

  const rows = breakdown.map((w) => `| W${w.weekNumber} | ${w.commits} |`)

  return ['## Weekly Breakdown', header, separator, ...rows].join('\n')
}

// --- Highlights section ---

function generateHighlightsSection(summaries: DailySummary[], limit: number = 10): string {
  const topCommits = getTopCommits(summaries, limit)

  const lines = topCommits.map((msg) => `- ✅ ${msg}`)

  return ['## Highlights', ...lines].join('\n')
}

// --- Footer ---

function generateSummaryFooter(): string {
  return [
    '---',
    '',
    '## Generated by git-to-daily',
    'This summary was automatically generated from daily logs.',
  ].join('\n')
}
