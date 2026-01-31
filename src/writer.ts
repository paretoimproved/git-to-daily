/**
 * File Writer Module
 *
 * Handles writing daily logs to the Obsidian vault.
 * Created by Agent 1.
 */

import { promises as fs } from 'fs'
import path from 'path'
import type { Config } from './types.js'

/**
 * Writes the daily log markdown to the Obsidian vault
 *
 * @param markdown - The markdown content to write
 * @param config - Configuration with vault path and project name
 * @returns The full path to the created file
 * @throws Error if vault path doesn't exist or write fails
 */
export async function writeToVault(markdown: string, config: Config): Promise<string> {
  // Validate vault path exists
  try {
    await fs.access(config.vaultPath)
  } catch {
    throw new Error(
      `Vault path does not exist: ${config.vaultPath}\n` +
        'Please check the --vault path and try again.'
    )
  }

  // Determine project name (from config or current directory)
  const projectName = config.projectName || getProjectNameFromCwd()

  // Build the output path: {vault}/01-Projects/{project}/Daily/{date}.md
  const date = formatDate(new Date())
  const dailyDir = path.join(config.vaultPath, '01-Projects', projectName, 'Daily')
  const filePath = path.join(dailyDir, `${date}.md`)

  // Create directories if they don't exist
  try {
    await fs.mkdir(dailyDir, { recursive: true })
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create directory ${dailyDir}: ${error.message}`)
    }
    throw new Error(`Failed to create directory ${dailyDir}`)
  }

  // Write the markdown file
  try {
    await fs.writeFile(filePath, markdown, 'utf-8')
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to write file ${filePath}: ${error.message}`)
    }
    throw new Error(`Failed to write file ${filePath}`)
  }

  return filePath
}

/**
 * Gets the project name from the current working directory
 */
function getProjectNameFromCwd(): string {
  return path.basename(process.cwd())
}

/**
 * Formats a date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}
