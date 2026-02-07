/**
 * Config Module
 *
 * Handles reading and writing the git-to-daily configuration file
 * stored at ~/.config/git-to-daily/config.json.
 */

import fs from 'fs'
import path from 'path'
import os from 'os'

export interface AppConfig {
  vaultPath: string
}

/**
 * Returns the path to the config file: ~/.config/git-to-daily/config.json
 */
export function getConfigPath(): string {
  return path.join(os.homedir(), '.config', 'git-to-daily', 'config.json')
}

/**
 * Loads the config from disk. Returns null if the file doesn't exist or is invalid.
 */
export function loadConfig(): AppConfig | null {
  const configPath = getConfigPath()
  try {
    const raw = fs.readFileSync(configPath, 'utf-8')
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.vaultPath === 'string') {
      return parsed as AppConfig
    }
    return null
  } catch {
    return null
  }
}

/**
 * Saves the config to disk, creating parent directories if needed.
 */
export function saveConfig(config: AppConfig): void {
  const configPath = getConfigPath()
  const dir = path.dirname(configPath)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8')
}
