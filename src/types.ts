/**
 * Type definitions for git-to-daily
 *
 * These interfaces define the data structures used across the application.
 * Created by Agent 2 for use by Agent 1.
 */

/**
 * Represents a single git commit with metadata and file changes
 */
export interface Commit {
  /** Full commit hash (SHA) */
  hash: string

  /** Commit message (first line typically) */
  message: string

  /** Author name */
  author: string

  /** Commit timestamp */
  timestamp: Date

  /** List of files changed in this commit */
  files: FileChange[]
}

/**
 * Represents a file change in a commit
 */
export interface FileChange {
  /** Relative path to the file from repo root */
  path: string

  /** Type of change */
  status: 'added' | 'modified' | 'deleted'
}

/**
 * Daily log data structure for markdown generation
 */
export interface DailyLogData {
  /** Date string (YYYY-MM-DD format) */
  date: string

  /** List of commits for this day */
  commits: Commit[]
}

/**
 * Configuration options for the CLI tool
 */
export interface Config {
  /** Path to Obsidian vault */
  vaultPath: string

  /** Optional project name for better log organization */
  projectName?: string
}

/**
 * Aggregated data for a daily log (used in weekly/monthly summaries)
 */
export interface DailySummary {
  /** Date string (YYYY-MM-DD format) */
  date: string

  /** Number of commits that day */
  commitCount: number

  /** Number of files changed that day */
  filesChanged: number

  /** Inferred focus area for the day */
  focusArea: string

  /** List of commit messages */
  commitMessages: string[]
}

/**
 * Weekly log data structure for markdown generation
 */
export interface WeeklyLogData {
  /** ISO week string (YYYY-Www format) */
  weekId: string

  /** Start date of the week (Monday) */
  startDate: string

  /** End date of the week (Sunday) */
  endDate: string

  /** Daily summaries for each day with activity */
  dailySummaries: DailySummary[]

  /** Total commits for the week */
  totalCommits: number

  /** Total files changed for the week */
  totalFilesChanged: number

  /** Number of active days (days with commits) */
  activeDays: number
}

/**
 * Monthly log data structure for markdown generation
 */
export interface MonthlyLogData {
  /** Month string (YYYY-MM format) */
  monthId: string

  /** Human-readable month name (e.g., "January 2026") */
  monthName: string

  /** Daily summaries for each day with activity */
  dailySummaries: DailySummary[]

  /** Total commits for the month */
  totalCommits: number

  /** Total files changed for the month */
  totalFilesChanged: number

  /** Number of active days (days with commits) */
  activeDays: number

  /** Weekly breakdown within the month */
  weeklyBreakdown: { weekNumber: number; commits: number }[]
}
