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
