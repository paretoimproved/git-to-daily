/**
 * Log Parser Module
 *
 * Parses existing daily log files to extract commit data.
 * Used for merging commits from multiple machines.
 */

import type { Commit, FileChange } from './types.js'

/**
 * Parses an existing daily log markdown file and extracts commit data
 *
 * @param content - The markdown content of the daily log
 * @returns Array of commits parsed from the log
 */
export function parseExistingLog(content: string): Commit[] {
  const commits: Commit[] = []

  // Find the Commits section - it's between "## Commits" and the next section or end
  const commitsMatch = content.match(/## Commits\s*```([\s\S]*?)```/)
  if (!commitsMatch) {
    return commits
  }

  const commitsBlock = commitsMatch[1]

  // Parse each commit block
  // Format:
  // **HH:MM** - message
  // - Hash: `abc1234`
  // - Author: Name
  // - Files changed: N
  const commitPattern = /\*\*(\d{2}:\d{2})\*\* - (.+?)\n- Hash: `([a-f0-9]+)`\n- Author: (.+?)\n- Files changed: (\d+)/g

  let match
  while ((match = commitPattern.exec(commitsBlock)) !== null) {
    const [, time, message, hash, author, fileCount] = match

    // Reconstruct timestamp from time (use today's date)
    const today = new Date()
    const [hours, minutes] = time.split(':').map(Number)
    today.setHours(hours, minutes, 0, 0)

    commits.push({
      hash,
      message,
      author,
      timestamp: today,
      files: [], // Files aren't fully preserved in commit log, but we have the count
    })
  }

  // Also try to extract file changes from the Code Changes section
  const fileChanges = parseFileChanges(content)

  // Match file changes to commits by message
  for (const commit of commits) {
    const matchingFiles = fileChanges.filter((fc) => fc.commitMessage === commit.message)
    if (matchingFiles.length > 0) {
      commit.files = matchingFiles.map((fc) => ({
        path: fc.path,
        status: fc.status,
      }))
    }
  }

  return commits
}

/**
 * Extracts commit hashes from an existing daily log
 *
 * @param content - The markdown content
 * @returns Set of commit hashes (short form, 7 chars)
 */
export function extractCommitHashes(content: string): Set<string> {
  const hashes = new Set<string>()

  // Match patterns like: Hash: `abc1234`
  const hashPattern = /Hash: `([a-f0-9]+)`/g
  let match

  while ((match = hashPattern.exec(content)) !== null) {
    hashes.add(match[1])
  }

  return hashes
}

interface FileChangeWithCommit extends FileChange {
  commitMessage: string
}

/**
 * Parses file changes from the Code Changes section
 */
function parseFileChanges(content: string): FileChangeWithCommit[] {
  const changes: FileChangeWithCommit[] = []

  // Find the Code Changes section
  const codeChangesMatch = content.match(/## Code Changes[\s\S]*?### Files Modified([\s\S]*?)(?=##|---|\n\n## |$)/)
  if (!codeChangesMatch) {
    return changes
  }

  const filesBlock = codeChangesMatch[1]

  // Parse each file entry
  // Format:   - ➕ `path/to/file` - commit message
  //           - ✏️ `path/to/file` - commit message
  //           - 🗑️ `path/to/file` - commit message
  const filePattern = /- ([➕✏️🗑️📝]) `(.+?)` - (.+)/g

  let match
  while ((match = filePattern.exec(filesBlock)) !== null) {
    const [, emoji, path, commitMessage] = match

    let status: FileChange['status']
    if (emoji === '➕') {
      status = 'added'
    } else if (emoji === '🗑️') {
      status = 'deleted'
    } else {
      status = 'modified'
    }

    changes.push({
      path,
      status,
      commitMessage,
    })
  }

  return changes
}

/**
 * Merges commits from local git with commits from existing log
 * Preserves commits from other machines that aren't in local history
 *
 * @param localCommits - Commits from local git history
 * @param existingLogContent - Content of existing daily log file
 * @returns Merged array of commits, sorted by timestamp (newest first)
 */
export function mergeCommits(localCommits: Commit[], existingLogContent: string): Commit[] {
  const existingCommits = parseExistingLog(existingLogContent)
  const localHashes = new Set(localCommits.map((c) => c.hash.substring(0, 7)))

  // Start with all local commits
  const merged = [...localCommits]

  // Add any existing commits that aren't in local history
  for (const existingCommit of existingCommits) {
    const shortHash = existingCommit.hash.substring(0, 7)
    if (!localHashes.has(shortHash)) {
      merged.push(existingCommit)
    }
  }

  // Sort by timestamp, newest first (to match original behavior)
  merged.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return merged
}
