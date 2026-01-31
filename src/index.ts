#!/usr/bin/env node
/**
 * git-to-daily CLI Entry Point
 *
 * Created by Agent 1
 */

import { Command } from 'commander'
import { getTodaysCommits } from './git-parser.js'
import { generateDailyLog } from './generator.js'
import {
  writeToVault,
  readExistingLog,
  weeklyLogExists,
  monthlyLogExists,
  writeWeeklyLog,
  writeMonthlyLog,
} from './writer.js'
import { mergeCommits, extractCommitHashes } from './log-parser.js'
import { readDailyLogsInRange } from './daily-log-reader.js'
import {
  isNewWeek,
  isNewMonth,
  getPreviousWeekRange,
  getPreviousMonthRange,
} from './period-utils.js'
import {
  buildWeeklyLogData,
  buildMonthlyLogData,
  generateWeeklyLog,
  generateMonthlyLog,
} from './summary-generator.js'
import type { Config } from './types.js'

const program = new Command()

program
  .name('git-to-daily')
  .description('Generate Obsidian daily logs from git commits')
  .version('0.1.0')

program
  .command('generate')
  .description('Generate a daily log from today\'s git commits')
  .requiredOption('--vault <path>', 'Path to your Obsidian vault')
  .option('--project <name>', 'Project name (defaults to current directory name)')
  .action(async (options) => {
    try {
      // Build config from CLI options
      const config: Config = {
        vaultPath: options.vault,
        projectName: options.project,
      }

      console.log('🔍 Fetching today\'s commits...')

      // Get commits from git parser (Agent 2's code)
      const localCommits = await getTodaysCommits()

      // Read existing daily log if it exists
      const existingContent = await readExistingLog(config)

      // Check for new commits by comparing with existing log
      let commits = localCommits
      let newCommitCount = localCommits.length

      if (existingContent) {
        const existingHashes = extractCommitHashes(existingContent)

        // Count how many local commits are new (not in existing log)
        newCommitCount = localCommits.filter(
          (c) => !existingHashes.has(c.hash.substring(0, 7))
        ).length

        if (newCommitCount === 0) {
          console.log('📝 No new commits to add.')
          console.log('💡 Daily log is already up to date!')
          process.exit(0)
        }

        // Merge local commits with any commits from existing log
        // (preserves commits from other machines)
        commits = mergeCommits(localCommits, existingContent)
        console.log(`✅ Found ${newCommitCount} new commit${newCommitCount > 1 ? 's' : ''} (${commits.length} total)`)
      } else {
        if (localCommits.length === 0) {
          console.log('📝 No commits found for today.')
          console.log('💡 Make some commits and try again!')
          process.exit(0)
        }
        console.log(`✅ Found ${localCommits.length} commit${localCommits.length > 1 ? 's' : ''}`)
      }

      // Generate markdown (Agent 1's generator)
      console.log('📄 Generating daily log...')
      const markdown = generateDailyLog(commits)

      // Write to vault (Agent 1's writer)
      console.log('💾 Writing to vault...')
      const filePath = await writeToVault(markdown, config)

      console.log(`✨ Daily log ${existingContent ? 'updated' : 'created'}: ${filePath}`)

      // Check if we need to generate weekly/monthly summaries
      await generatePeriodSummaries(config)

    } catch (error) {
      if (error instanceof Error) {
        console.error(`❌ Error: ${error.message}`)
      } else {
        console.error('❌ An unknown error occurred')
      }
      process.exit(1)
    }
  })

/**
 * Checks for period boundaries and generates weekly/monthly summaries
 */
async function generatePeriodSummaries(config: Config): Promise<void> {
  const today = new Date()

  // Check for weekly summary (on Mondays, generate last week's summary)
  if (isNewWeek(today)) {
    await tryGenerateWeeklySummary(config, today)
  }

  // Check for monthly summary (on 1st, generate last month's summary)
  if (isNewMonth(today)) {
    await tryGenerateMonthlySummary(config, today)
  }
}

/**
 * Attempts to generate a weekly summary if it doesn't exist
 */
async function tryGenerateWeeklySummary(config: Config, today: Date): Promise<void> {
  const { start, end } = getPreviousWeekRange(today)

  // Skip if weekly log already exists
  if (await weeklyLogExists(config, start)) {
    return
  }

  console.log('\n📅 New week detected! Checking for last week\'s activity...')

  // Read daily logs from last week
  const summaries = await readDailyLogsInRange(config, start, end)

  // Only generate if there were multiple days with activity
  if (summaries.length < 2) {
    console.log('   Skipping weekly summary (less than 2 active days)')
    return
  }

  // Build and generate the weekly log
  const weeklyData = buildWeeklyLogData(summaries, start, end)
  const markdown = generateWeeklyLog(weeklyData)
  const filePath = await writeWeeklyLog(markdown, config, start)

  console.log(`📊 Weekly summary created: ${filePath}`)
}

/**
 * Attempts to generate a monthly summary if it doesn't exist
 */
async function tryGenerateMonthlySummary(config: Config, today: Date): Promise<void> {
  const { start, end } = getPreviousMonthRange(today)

  // Skip if monthly log already exists
  if (await monthlyLogExists(config, start)) {
    return
  }

  console.log('\n📆 New month detected! Checking for last month\'s activity...')

  // Read daily logs from last month
  const summaries = await readDailyLogsInRange(config, start, end)

  // Only generate if there were multiple days with activity
  if (summaries.length < 2) {
    console.log('   Skipping monthly summary (less than 2 active days)')
    return
  }

  // Build and generate the monthly log
  const monthlyData = buildMonthlyLogData(summaries, start)
  const markdown = generateMonthlyLog(monthlyData)
  const filePath = await writeMonthlyLog(markdown, config, start)

  console.log(`📈 Monthly summary created: ${filePath}`)
}

// Parse arguments
program.parse()
