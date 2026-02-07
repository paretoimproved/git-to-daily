/**
 * Init Command Module
 *
 * Handles first-time setup: vault detection, config creation, and git hook installation.
 */

import fs from 'fs'
import path from 'path'
import os from 'os'
import readline from 'readline'
import { execSync } from 'child_process'
import { saveConfig } from './config.js'

interface InitOptions {
  vault?: string
  local?: boolean
}

const HOOK_SCRIPT = `#!/bin/sh
# git-to-daily: auto-generate daily log on commit
if command -v git-to-daily >/dev/null 2>&1; then
  git-to-daily generate 2>/dev/null
fi
exit 0
`

/**
 * Runs the init command: detect vault, save config, install hook.
 */
export async function runInit(options: InitOptions): Promise<void> {
  console.log('git-to-daily init\n')

  // 1. Resolve vault path
  let vaultPath: string

  if (options.vault) {
    vaultPath = path.resolve(options.vault)
    if (!isValidVault(vaultPath)) {
      console.error(`Error: "${vaultPath}" is not a valid Obsidian vault (missing .obsidian directory).`)
      process.exit(1)
    }
    console.log(`Using vault: ${vaultPath}`)
  } else {
    const detected = detectVaults()
    if (detected.length === 1) {
      vaultPath = detected[0]
      console.log(`Found vault: ${vaultPath}`)
    } else if (detected.length > 1) {
      vaultPath = await promptVaultSelection(detected)
    } else {
      console.log('No Obsidian vaults detected.')
      vaultPath = await promptManualPath()
    }
  }

  // 2. Save config
  saveConfig({ vaultPath })
  console.log(`\nConfig saved.`)

  // 3. Install git hook
  if (options.local) {
    installLocalHook()
  } else {
    installGlobalHook()
  }

  // 4. Summary
  console.log('\n--- Setup complete ---')
  console.log(`  Vault:  ${vaultPath}`)
  console.log(`  Hook:   ${options.local ? 'local (.git/hooks/post-commit)' : 'global (~/.config/git/hooks/post-commit)'}`)
  console.log('\nRun "git-to-daily status" to verify your setup.')
}

/**
 * Scans common directories for Obsidian vaults (directories containing .obsidian).
 */
function detectVaults(): string[] {
  const home = os.homedir()
  const searchDirs = [
    home,
    path.join(home, 'Documents'),
    path.join(home, 'Desktop'),
    path.join(home, 'Library', 'Mobile Documents', 'iCloud~md~obsidian', 'Documents'),
  ]

  const vaults: string[] = []

  for (const dir of searchDirs) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        if (entry.name.startsWith('.')) continue
        const candidate = path.join(dir, entry.name)
        if (isValidVault(candidate)) {
          vaults.push(candidate)
        }
      }
    } catch {
      // Directory doesn't exist or isn't readable, skip
    }
  }

  // Deduplicate (same vault reachable from multiple search dirs)
  return [...new Set(vaults)]
}

/**
 * Checks if a path is a valid Obsidian vault (directory with .obsidian inside).
 */
function isValidVault(vaultPath: string): boolean {
  try {
    const stat = fs.statSync(vaultPath)
    if (!stat.isDirectory()) return false
    const obsidianDir = path.join(vaultPath, '.obsidian')
    const obsidianStat = fs.statSync(obsidianDir)
    return obsidianStat.isDirectory()
  } catch {
    return false
  }
}

/**
 * Prompts the user to select from detected vaults.
 */
async function promptVaultSelection(vaults: string[]): Promise<string> {
  console.log('Multiple Obsidian vaults found:\n')
  vaults.forEach((v, i) => {
    console.log(`  ${i + 1}) ${v}`)
  })
  console.log()

  const answer = await question(`Select a vault (1-${vaults.length}): `)
  const index = parseInt(answer, 10) - 1

  if (isNaN(index) || index < 0 || index >= vaults.length) {
    console.error('Invalid selection.')
    process.exit(1)
  }

  return vaults[index]
}

/**
 * Prompts the user to manually enter a vault path.
 */
async function promptManualPath(): Promise<string> {
  const answer = await question('Enter the path to your Obsidian vault: ')
  const resolved = path.resolve(answer.trim())

  if (!isValidVault(resolved)) {
    console.error(`Error: "${resolved}" is not a valid Obsidian vault (missing .obsidian directory).`)
    process.exit(1)
  }

  return resolved
}

/**
 * Simple readline question wrapper.
 */
function question(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

/**
 * Installs the post-commit hook globally via ~/.config/git/hooks.
 */
function installGlobalHook(): void {
  const hooksDir = path.join(os.homedir(), '.config', 'git', 'hooks')
  const hookPath = path.join(hooksDir, 'post-commit')

  // Check if core.hooksPath is already set to a different location
  try {
    const existing = execSync('git config --global core.hooksPath', { encoding: 'utf-8' }).trim()
    if (existing && existing !== hooksDir) {
      console.log(`\nWarning: core.hooksPath is already set to "${existing}".`)
      console.log(`Overwriting to "${hooksDir}".`)
      console.log('If you had hooks in the previous path, you may need to move them.')
    }
  } catch {
    // Not set yet, which is fine
  }

  fs.mkdirSync(hooksDir, { recursive: true })
  fs.writeFileSync(hookPath, HOOK_SCRIPT, { mode: 0o755 })
  execSync(`git config --global core.hooksPath ${hooksDir}`)
  console.log(`\nGlobal hook installed: ${hookPath}`)
}

/**
 * Installs the post-commit hook locally in the current repo's .git/hooks.
 */
function installLocalHook(): void {
  const gitDir = path.join(process.cwd(), '.git')

  if (!fs.existsSync(gitDir)) {
    console.error('Error: Not in a git repository. Run this from the root of a git project, or omit --local.')
    process.exit(1)
  }

  const hooksDir = path.join(gitDir, 'hooks')
  const hookPath = path.join(hooksDir, 'post-commit')

  fs.mkdirSync(hooksDir, { recursive: true })
  fs.writeFileSync(hookPath, HOOK_SCRIPT, { mode: 0o755 })
  console.log(`\nLocal hook installed: ${hookPath}`)
}
