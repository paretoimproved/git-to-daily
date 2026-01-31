/**
 * Daily Log Reader Module
 *
 * Reads and parses existing daily log files for aggregation
 * into weekly and monthly summaries.
 */

import { promises as fs } from 'fs'
import path from 'path'
import type { Config, DailySummary } from './types.js'
import { formatDate, getDatesInRange } from './period-utils.js'

/**
 * Reads all daily logs within a date range for a project
 *
 * @param config - Configuration with vault path and project name
 * @param startDate - Start of the date range (inclusive)
 * @param endDate - End of the date range (inclusive)
 * @returns Array of daily summaries for days that have logs
 */
export async function readDailyLogsInRange(
  config: Config,
  startDate: Date,
  endDate: Date
): Promise<DailySummary[]> {
  const projectName = config.projectName || getProjectNameFromCwd()
  const dailyDir = path.join(config.vaultPath, '01-Projects', 'Daily', projectName)

  const dates = getDatesInRange(startDate, endDate)
  const summaries: DailySummary[] = []

  for (const date of dates) {
    const dateStr = formatDate(date)
    const filePath = path.join(dailyDir, `${dateStr}.md`)

    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const summary = parseDailyLogToSummary(content, dateStr)
      if (summary.commitCount > 0) {
        summaries.push(summary)
      }
    } catch {
      // File doesn't exist for this date, skip
      continue
    }
  }

  return summaries
}

/**
 * Parses a daily log markdown file into a DailySummary
 */
function parseDailyLogToSummary(content: string, date: string): DailySummary {
  const commitMessages = extractCommitMessages(content)
  const filesChanged = countFilesChanged(content)
  const focusArea = extractFocusArea(content)

  return {
    date,
    commitCount: commitMessages.length,
    filesChanged,
    focusArea,
    commitMessages,
  }
}

/**
 * Extracts commit messages from the Work Completed section
 */
function extractCommitMessages(content: string): string[] {
  const messages: string[] = []

  // Match lines in Work Completed section: - ✅ message
  const taskPattern = /- ✅ (.+)/g
  let match

  while ((match = taskPattern.exec(content)) !== null) {
    messages.push(match[1])
  }

  return messages
}

/**
 * Counts files changed from the Code Changes section
 */
function countFilesChanged(content: string): number {
  // Count lines matching the file change pattern
  const filePattern = /- [➕✏️🗑️📝] `/g
  const matches = content.match(filePattern)
  return matches ? matches.length : 0
}

/**
 * Extracts the focus area from Session Info section
 */
function extractFocusArea(content: string): string {
  const focusMatch = content.match(/\*\*Focus Area\*\*: (.+)/)
  return focusMatch ? focusMatch[1] : 'Development'
}

/**
 * Gets the project name from the current working directory
 */
function getProjectNameFromCwd(): string {
  return path.basename(process.cwd())
}

/**
 * Aggregates focus areas and returns counts
 */
export function aggregateFocusAreas(summaries: DailySummary[]): Map<string, number> {
  const focusCounts = new Map<string, number>()

  for (const summary of summaries) {
    const current = focusCounts.get(summary.focusArea) || 0
    focusCounts.set(summary.focusArea, current + summary.commitCount)
  }

  return focusCounts
}

/**
 * Gets the top N commit messages by recency
 */
export function getTopCommits(summaries: DailySummary[], limit: number = 10): string[] {
  const allMessages: string[] = []

  // Summaries are expected to be sorted by date, so we iterate in order
  for (const summary of summaries) {
    allMessages.push(...summary.commitMessages)
  }

  return allMessages.slice(0, limit)
}
