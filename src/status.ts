/**
 * Status Command Module
 *
 * Displays the current configuration and setup status.
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { getConfigPath, loadConfig } from './config.js'

/**
 * Runs the status command: prints config, vault health, and hook info.
 */
export function runStatus(): void {
  console.log('git-to-daily status\n')

  // 1. Config file
  const configPath = getConfigPath()
  const config = loadConfig()

  console.log(`Config: ${configPath}`)
  if (config) {
    console.log(`  vaultPath: ${config.vaultPath}`)
  } else {
    console.log('  (not found -- run "git-to-daily init" to set up)')
  }

  // 2. Vault health
  console.log()
  if (config) {
    const vaultExists = fs.existsSync(config.vaultPath)
    const hasObsidian = vaultExists && fs.existsSync(path.join(config.vaultPath, '.obsidian'))
    console.log(`Vault path exists: ${vaultExists ? 'yes' : 'NO'}`)
    console.log(`Has .obsidian:     ${hasObsidian ? 'yes' : 'NO'}`)
  } else {
    console.log('Vault: (no config)')
  }

  // 3. Global hooks path
  console.log()
  try {
    const hooksPath = execSync('git config --global core.hooksPath', { encoding: 'utf-8' }).trim()
    console.log(`Global core.hooksPath: ${hooksPath}`)
    const globalHook = path.join(hooksPath, 'post-commit')
    if (fs.existsSync(globalHook)) {
      const content = fs.readFileSync(globalHook, 'utf-8')
      const hasGitToDaily = content.includes('git-to-daily')
      console.log(`  post-commit hook:  ${hasGitToDaily ? 'installed (git-to-daily)' : 'exists (other)'}`)
    } else {
      console.log('  post-commit hook:  not found')
    }
  } catch {
    console.log('Global core.hooksPath: (not set)')
  }

  // 4. CLI in PATH
  console.log()
  try {
    const which = execSync('command -v git-to-daily', { encoding: 'utf-8', shell: '/bin/sh' }).trim()
    console.log(`CLI in PATH: yes (${which})`)
  } catch {
    console.log('CLI in PATH: no')
  }

  // 5. Local repo hook (if in a git repo)
  const localGitDir = path.join(process.cwd(), '.git')
  if (fs.existsSync(localGitDir)) {
    const localHook = path.join(localGitDir, 'hooks', 'post-commit')
    console.log()
    if (fs.existsSync(localHook)) {
      const content = fs.readFileSync(localHook, 'utf-8')
      const hasGitToDaily = content.includes('git-to-daily')
      console.log(`Local .git/hooks/post-commit: ${hasGitToDaily ? 'installed (git-to-daily)' : 'exists (other)'}`)
    } else {
      console.log('Local .git/hooks/post-commit: not found')
    }
  }
}
