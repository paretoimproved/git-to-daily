/**
 * Integration tests for git-to-daily CLI
 *
 * Tests the full end-to-end flow from git parsing through to file writing.
 * Created by Agent 3.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getTodaysCommits } from '../src/git-parser.js'
import { generateDailyLog } from '../src/generator.js'
import { writeToVault } from '../src/writer.js'
import type { Commit } from '../src/types.js'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

describe('Integration: Full CLI Flow', () => {
  let tempVaultPath: string

  beforeEach(async () => {
    // Create a temporary vault directory for testing
    tempVaultPath = path.join(os.tmpdir(), `git-to-daily-test-${Date.now()}`)
    await fs.mkdir(tempVaultPath, { recursive: true })
  })

  afterEach(async () => {
    // Clean up temporary vault
    try {
      await fs.rm(tempVaultPath, { recursive: true, force: true })
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  it('should generate and write a complete daily log from commit data', async () => {
    // Create mock commit data
    const commits: Commit[] = [
      {
        hash: 'abc123def456',
        message: 'feat: add user authentication',
        author: 'Test Developer',
        timestamp: new Date('2026-01-31T10:00:00Z'),
        files: [
          { path: 'src/auth.ts', status: 'added' },
          { path: 'src/utils.ts', status: 'modified' },
        ],
      },
      {
        hash: 'def456abc123',
        message: 'fix: resolve login bug',
        author: 'Test Developer',
        timestamp: new Date('2026-01-31T11:30:00Z'),
        files: [
          { path: 'src/auth.ts', status: 'modified' },
        ],
      },
    ]

    // Step 1: Generate markdown
    const markdown = generateDailyLog(commits)

    // Verify markdown structure
    expect(markdown).toContain('# Daily Log')
    expect(markdown).toContain('feat: add user authentication')
    expect(markdown).toContain('fix: resolve login bug')
    expect(markdown).toContain('src/auth.ts')
    expect(markdown).toContain('src/utils.ts')

    // Step 2: Write to vault
    const filePath = await writeToVault(markdown, {
      vaultPath: tempVaultPath,
      projectName: 'test-project',
    })

    // Verify file was created
    expect(filePath).toMatch(/\.md$/)
    const fileExists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false)
    expect(fileExists).toBe(true)

    // Verify file content
    const fileContent = await fs.readFile(filePath, 'utf-8')
    expect(fileContent).toBe(markdown)
    expect(fileContent).toContain('feat: add user authentication')
  })

  it('should handle empty commit list gracefully', async () => {
    const commits: Commit[] = []

    const markdown = generateDailyLog(commits)
    expect(markdown).toContain('No activity')
    expect(markdown).toContain('Duration: N/A')

    const filePath = await writeToVault(markdown, {
      vaultPath: tempVaultPath,
      projectName: 'empty-project',
    })

    const fileContent = await fs.readFile(filePath, 'utf-8')
    expect(fileContent).toContain('No activity')
  })

  it('should create the correct directory structure', async () => {
    const commits: Commit[] = [
      {
        hash: 'test123',
        message: 'test commit',
        author: 'Developer',
        timestamp: new Date(),
        files: [],
      },
    ]

    const markdown = generateDailyLog(commits)
    await writeToVault(markdown, {
      vaultPath: tempVaultPath,
      projectName: 'structure-test',
    })

    // Verify directory structure
    const projectsDir = path.join(tempVaultPath, '01-Projects')
    const projectDir = path.join(projectsDir, 'structure-test')
    const dailyDir = path.join(projectDir, 'Daily')

    const projectsDirExists = await fs
      .access(projectsDir)
      .then(() => true)
      .catch(() => false)
    const projectDirExists = await fs
      .access(projectDir)
      .then(() => true)
      .catch(() => false)
    const dailyDirExists = await fs
      .access(dailyDir)
      .then(() => true)
      .catch(() => false)

    expect(projectsDirExists).toBe(true)
    expect(projectDirExists).toBe(true)
    expect(dailyDirExists).toBe(true)
  })

  it('should create file with today\'s date in filename', async () => {
    const commits: Commit[] = [
      {
        hash: 'date123',
        message: 'test',
        author: 'Dev',
        timestamp: new Date(),
        files: [],
      },
    ]

    const markdown = generateDailyLog(commits)
    const filePath = await writeToVault(markdown, {
      vaultPath: tempVaultPath,
      projectName: 'date-test',
    })

    const today = new Date().toISOString().split('T')[0]
    expect(filePath).toContain(today)
    expect(filePath).toMatch(new RegExp(`${today}\\.md$`))
  })

  it('should handle multiple file changes across commits', async () => {
    const commits: Commit[] = [
      {
        hash: 'multi1',
        message: 'first change',
        author: 'Dev',
        timestamp: new Date('2026-01-31T09:00:00Z'),
        files: [
          { path: 'src/file1.ts', status: 'added' },
          { path: 'src/file2.ts', status: 'added' },
        ],
      },
      {
        hash: 'multi2',
        message: 'second change',
        author: 'Dev',
        timestamp: new Date('2026-01-31T10:00:00Z'),
        files: [
          { path: 'src/file1.ts', status: 'modified' },
          { path: 'src/file3.ts', status: 'added' },
        ],
      },
      {
        hash: 'multi3',
        message: 'third change',
        author: 'Dev',
        timestamp: new Date('2026-01-31T11:00:00Z'),
        files: [{ path: 'src/file2.ts', status: 'deleted' }],
      },
    ]

    const markdown = generateDailyLog(commits)
    const filePath = await writeToVault(markdown, {
      vaultPath: tempVaultPath,
      projectName: 'multi-test',
    })

    const fileContent = await fs.readFile(filePath, 'utf-8')

    // Verify all files are mentioned
    expect(fileContent).toContain('src/file1.ts')
    expect(fileContent).toContain('src/file2.ts')
    expect(fileContent).toContain('src/file3.ts')

    // Verify all commits are logged
    expect(fileContent).toContain('first change')
    expect(fileContent).toContain('second change')
    expect(fileContent).toContain('third change')

    // Verify duration calculation (2 hours)
    expect(fileContent).toContain('2h')
  })

  it('should preserve markdown formatting in generated output', async () => {
    const commits: Commit[] = [
      {
        hash: 'format123',
        message: 'feat: implement **bold** feature',
        author: 'Dev',
        timestamp: new Date(),
        files: [{ path: 'src/feature.ts', status: 'added' }],
      },
    ]

    const markdown = generateDailyLog(commits)
    const filePath = await writeToVault(markdown, {
      vaultPath: tempVaultPath,
      projectName: 'format-test',
    })

    const fileContent = await fs.readFile(filePath, 'utf-8')

    // Verify markdown structure is preserved
    expect(fileContent).toContain('# Daily Log')
    expect(fileContent).toContain('## Session Info')
    expect(fileContent).toContain('## Work Completed')
    expect(fileContent).toContain('## Code Changes')
    expect(fileContent).toContain('## Commits')
    expect(fileContent).toContain('---')
  })

  it('should infer correct focus area from multiple commits', async () => {
    const commits: Commit[] = [
      {
        hash: 'focus1',
        message: 'test: add unit tests for auth',
        author: 'Dev',
        timestamp: new Date('2026-01-31T09:00:00Z'),
        files: [{ path: 'tests/auth.test.ts', status: 'added' }],
      },
      {
        hash: 'focus2',
        message: 'test: add integration tests',
        author: 'Dev',
        timestamp: new Date('2026-01-31T10:00:00Z'),
        files: [{ path: 'tests/integration.test.ts', status: 'added' }],
      },
    ]

    const markdown = generateDailyLog(commits)
    expect(markdown).toContain('Focus Area: Testing')

    const filePath = await writeToVault(markdown, {
      vaultPath: tempVaultPath,
      projectName: 'focus-test',
    })

    const fileContent = await fs.readFile(filePath, 'utf-8')
    expect(fileContent).toContain('Focus Area: Testing')
  })
})

describe('Integration: Error Handling', () => {
  it('should throw meaningful error for invalid vault path', async () => {
    const markdown = '# Test'
    const invalidPath = '/this/path/does/not/exist/at/all'

    await expect(
      writeToVault(markdown, {
        vaultPath: invalidPath,
        projectName: 'test',
      })
    ).rejects.toThrow('Vault path does not exist')
  })

  it('should include helpful context in error messages', async () => {
    const markdown = '# Test'
    const invalidPath = '/invalid/vault'

    try {
      await writeToVault(markdown, {
        vaultPath: invalidPath,
        projectName: 'test',
      })
      expect.fail('Should have thrown an error')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      if (error instanceof Error) {
        expect(error.message).toContain(invalidPath)
        expect(error.message).toContain('--vault')
      }
    }
  })
})
