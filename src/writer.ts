/**
 * File Writer Module
 *
 * Handles writing daily, weekly, and monthly logs to the Obsidian vault.
 * Created by Agent 1.
 */

import { promises as fs } from 'fs'
import path from 'path'
import type { Config } from './types.js'
import { formatWeekId, formatMonthId } from './period-utils.js'

/**
 * Gets the path to today's daily log file
 *
 * Output structure: {vault}/01-Projects/{project}/Daily/{date}.md
 * This keeps daily logs within each project folder, making projects
 * self-contained and easier to archive or move as complete units.
 *
 * @param config - Configuration with vault path and project name
 * @returns The full path to today's daily log file
 */
export function getDailyLogPath(config: Config): string {
  const projectName = config.projectName || getProjectNameFromCwd()
  const date = formatDate(new Date())
  const dailyDir = path.join(config.vaultPath, '01-Projects', projectName, 'Daily')
  return path.join(dailyDir, `${date}.md`)
}

/**
 * Reads the existing daily log content if it exists
 *
 * @param config - Configuration with vault path and project name
 * @returns The existing file content, or null if file doesn't exist
 */
export async function readExistingLog(config: Config): Promise<string | null> {
  const filePath = getDailyLogPath(config)

  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return content
  } catch {
    // File doesn't exist or can't be read
    return null
  }
}

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
  // Daily logs live within each project for self-contained organization
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
 * Formats a date as YYYY-MM-DD using local timezone
 */
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Gets the path to a weekly log file
 *
 * Output structure: {vault}/01-Projects/Weekly/{project}/{YYYY-Www}.md
 *
 * @param config - Configuration with vault path and project name
 * @param weekStart - Any date within the target week
 * @returns The full path to the weekly log file
 */
export function getWeeklyLogPath(config: Config, weekStart: Date): string {
  const projectName = config.projectName || getProjectNameFromCwd()
  const weekId = formatWeekId(weekStart)
  const weeklyDir = path.join(config.vaultPath, '01-Projects', 'Weekly', projectName)
  return path.join(weeklyDir, `${weekId}.md`)
}

/**
 * Gets the path to a monthly log file
 *
 * Output structure: {vault}/01-Projects/Monthly/{project}/{YYYY-MM}.md
 *
 * @param config - Configuration with vault path and project name
 * @param monthDate - Any date within the target month
 * @returns The full path to the monthly log file
 */
export function getMonthlyLogPath(config: Config, monthDate: Date): string {
  const projectName = config.projectName || getProjectNameFromCwd()
  const monthId = formatMonthId(monthDate)
  const monthlyDir = path.join(config.vaultPath, '01-Projects', 'Monthly', projectName)
  return path.join(monthlyDir, `${monthId}.md`)
}

/**
 * Checks if a weekly log already exists
 */
export async function weeklyLogExists(config: Config, weekStart: Date): Promise<boolean> {
  const filePath = getWeeklyLogPath(config, weekStart)
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Checks if a monthly log already exists
 */
export async function monthlyLogExists(config: Config, monthDate: Date): Promise<boolean> {
  const filePath = getMonthlyLogPath(config, monthDate)
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Writes a weekly log to the vault
 *
 * @param markdown - The markdown content to write
 * @param config - Configuration with vault path and project name
 * @param weekStart - Any date within the target week
 * @returns The full path to the created file
 */
export async function writeWeeklyLog(
  markdown: string,
  config: Config,
  weekStart: Date
): Promise<string> {
  const projectName = config.projectName || getProjectNameFromCwd()
  const weekId = formatWeekId(weekStart)
  const weeklyDir = path.join(config.vaultPath, '01-Projects', 'Weekly', projectName)
  const filePath = path.join(weeklyDir, `${weekId}.md`)

  // Create directories if they don't exist
  await fs.mkdir(weeklyDir, { recursive: true })

  // Write the markdown file
  await fs.writeFile(filePath, markdown, 'utf-8')

  return filePath
}

/**
 * Writes a monthly log to the vault
 *
 * @param markdown - The markdown content to write
 * @param config - Configuration with vault path and project name
 * @param monthDate - Any date within the target month
 * @returns The full path to the created file
 */
export async function writeMonthlyLog(
  markdown: string,
  config: Config,
  monthDate: Date
): Promise<string> {
  const projectName = config.projectName || getProjectNameFromCwd()
  const monthId = formatMonthId(monthDate)
  const monthlyDir = path.join(config.vaultPath, '01-Projects', 'Monthly', projectName)
  const filePath = path.join(monthlyDir, `${monthId}.md`)

  // Create directories if they don't exist
  await fs.mkdir(monthlyDir, { recursive: true })

  // Write the markdown file
  await fs.writeFile(filePath, markdown, 'utf-8')

  return filePath
}
