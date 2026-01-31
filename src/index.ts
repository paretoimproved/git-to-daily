#!/usr/bin/env node
/**
 * git-to-daily CLI Entry Point
 *
 * Created by Agent 1
 */

import { Command } from 'commander'
import { getTodaysCommits } from './git-parser.js'
import { generateDailyLog } from './generator.js'
import { writeToVault, readExistingLog } from './writer.js'
import { mergeCommits, extractCommitHashes } from './log-parser.js'
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

    } catch (error) {
      if (error instanceof Error) {
        console.error(`❌ Error: ${error.message}`)
      } else {
        console.error('❌ An unknown error occurred')
      }
      process.exit(1)
    }
  })

// Parse arguments
program.parse()
