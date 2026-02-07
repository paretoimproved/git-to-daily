/**
 * Git Parser Module
 *
 * Handles git repository operations and commit extraction.
 * Created by Agent 2.
 */

import simpleGit, { SimpleGit, LogResult, DefaultLogFields } from 'simple-git'
import { Commit, FileChange } from './types.js'

/**
 * Gets all commits made today (since midnight)
 *
 * @returns Array of commits with metadata and file changes
 * @throws Error if not in a git repository or git operations fail
 */
export async function getTodaysCommits(): Promise<Commit[]> {
  const git: SimpleGit = simpleGit()

  // Check if we're in a git repository
  const isRepo = await git.checkIsRepo()
  if (!isRepo) {
    throw new Error('Not a git repository. Please run this command from within a git repository.')
  }

  // Calculate today's midnight timestamp
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sinceDate = today.toISOString()

  try {
    // Get all commits since midnight today
    const log: LogResult<DefaultLogFields> = await git.log({
      '--since': sinceDate,
    })

    // If no commits today, return empty array
    if (!log.all || log.all.length === 0) {
      return []
    }

    // Map git log entries to Commit objects
    const commits: Commit[] = await Promise.all(
      log.all.map(async (logEntry) => {
        const files = await getFilesChangedWithStatus(git, logEntry.hash)

        return {
          hash: logEntry.hash,
          message: logEntry.message,
          author: logEntry.author_name,
          timestamp: new Date(logEntry.date),
          files,
        }
      })
    )

    return commits
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to retrieve git commits: ${error.message}`)
    }
    throw new Error('Failed to retrieve git commits: Unknown error')
  }
}

/**
 * Gets the list of files changed in a specific commit using git diff --name-status
 * This provides accurate file status (added/modified/deleted)
 *
 * @param git - SimpleGit instance
 * @param commitHash - Hash of the commit to analyze
 * @returns Array of file changes with paths and status
 */
async function getFilesChangedWithStatus(git: SimpleGit, commitHash: string): Promise<FileChange[]> {
  try {
    // Use git diff with --name-status for accurate file status
    const result = await git.raw(['diff', '--name-status', `${commitHash}^`, commitHash])

    const files: FileChange[] = []
    const lines = result.trim().split('\n')

    for (const line of lines) {
      if (!line.trim()) continue

      // Format: "A\tpath/to/file" or "M\tpath/to/file" or "D\tpath/to/file"
      const parts = line.split('\t')
      if (parts.length < 2) continue

      const statusCode = parts[0].trim().charAt(0)
      // For renames (R), the new path is in parts[2]
      const filePath = (statusCode === 'R' && parts.length >= 3)
        ? parts[2].trim()
        : parts[1].trim()

      let status: FileChange['status']
      if (statusCode === 'A') {
        status = 'added'
      } else if (statusCode === 'D') {
        status = 'deleted'
      } else {
        status = 'modified'
      }

      files.push({
        path: filePath,
        status,
      })
    }

    return files
  } catch (error) {
    // Fallback to empty array if command fails
    return []
  }
}
