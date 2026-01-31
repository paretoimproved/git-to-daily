/**
 * Unit tests for the File Writer
 *
 * Tests file writing operations to the Obsidian vault.
 * Uses mocking to avoid actual file system operations.
 * Created by Agent 3.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { writeToVault } from '../src/writer.js'
import type { Config } from '../src/types.js'

// Mock the fs module
vi.mock('fs', () => ({
  promises: {
    access: vi.fn(),
    mkdir: vi.fn(),
    writeFile: vi.fn(),
  },
}))

// Mock path module to ensure consistent behavior across platforms
vi.mock('path', async () => {
  const actual = await vi.importActual<typeof import('path')>('path')
  return {
    ...actual,
    join: vi.fn((...args) => args.join('/')),
    basename: vi.fn((p) => p.split('/').pop()),
  }
})

import { promises as fs } from 'fs'
import path from 'path'

describe('writeToVault', () => {
  const mockMarkdown = '# Test Daily Log\n\nTest content'

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock process.cwd() to return a consistent value
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project')
  })

  it('should write markdown to the correct vault location', async () => {
    const config: Config = {
      vaultPath: '/path/to/vault',
      projectName: 'my-project',
    }

    // Mock successful file operations
    vi.mocked(fs.access).mockResolvedValue(undefined)
    vi.mocked(fs.mkdir).mockResolvedValue(undefined)
    vi.mocked(fs.writeFile).mockResolvedValue(undefined)

    const result = await writeToVault(mockMarkdown, config)

    // Verify vault path was checked
    expect(fs.access).toHaveBeenCalledWith('/path/to/vault')

    // Verify directory was created
    expect(fs.mkdir).toHaveBeenCalledWith(
      expect.stringContaining('01-Projects/my-project/Daily'),
      { recursive: true }
    )

    // Verify file was written
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringMatching(/\.md$/),
      mockMarkdown,
      'utf-8'
    )

    // Verify return value is a valid file path
    expect(result).toMatch(/\.md$/)
    expect(result).toContain('my-project')
  })

  it('should throw error if vault path does not exist', async () => {
    const config: Config = {
      vaultPath: '/invalid/path',
      projectName: 'my-project',
    }

    // Mock vault path check to fail
    vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'))

    await expect(writeToVault(mockMarkdown, config)).rejects.toThrow(
      'Vault path does not exist: /invalid/path'
    )

    // Should not attempt to write if vault doesn't exist
    expect(fs.writeFile).not.toHaveBeenCalled()
  })

  it('should use current directory name if projectName not provided', async () => {
    const config: Config = {
      vaultPath: '/path/to/vault',
      // projectName is optional
    }

    vi.mocked(fs.access).mockResolvedValue(undefined)
    vi.mocked(fs.mkdir).mockResolvedValue(undefined)
    vi.mocked(fs.writeFile).mockResolvedValue(undefined)

    await writeToVault(mockMarkdown, config)

    // Should use 'project' (from mocked cwd '/test/project')
    expect(fs.mkdir).toHaveBeenCalledWith(
      expect.stringContaining('project/Daily'),
      { recursive: true }
    )
  })

  it('should create directory structure if it does not exist', async () => {
    const config: Config = {
      vaultPath: '/path/to/vault',
      projectName: 'new-project',
    }

    vi.mocked(fs.access).mockResolvedValue(undefined)
    vi.mocked(fs.mkdir).mockResolvedValue(undefined)
    vi.mocked(fs.writeFile).mockResolvedValue(undefined)

    await writeToVault(mockMarkdown, config)

    // Should create directory with recursive flag
    expect(fs.mkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true })
  })

  it('should throw error if directory creation fails', async () => {
    const config: Config = {
      vaultPath: '/path/to/vault',
      projectName: 'my-project',
    }

    vi.mocked(fs.access).mockResolvedValue(undefined)
    vi.mocked(fs.mkdir).mockRejectedValue(new Error('Permission denied'))

    await expect(writeToVault(mockMarkdown, config)).rejects.toThrow(
      'Failed to create directory'
    )
  })

  it('should throw error if file write fails', async () => {
    const config: Config = {
      vaultPath: '/path/to/vault',
      projectName: 'my-project',
    }

    vi.mocked(fs.access).mockResolvedValue(undefined)
    vi.mocked(fs.mkdir).mockResolvedValue(undefined)
    vi.mocked(fs.writeFile).mockRejectedValue(new Error('Disk full'))

    await expect(writeToVault(mockMarkdown, config)).rejects.toThrow('Failed to write file')
  })

  it('should format file path with today\'s date', async () => {
    const config: Config = {
      vaultPath: '/path/to/vault',
      projectName: 'my-project',
    }

    vi.mocked(fs.access).mockResolvedValue(undefined)
    vi.mocked(fs.mkdir).mockResolvedValue(undefined)
    vi.mocked(fs.writeFile).mockResolvedValue(undefined)

    const result = await writeToVault(mockMarkdown, config)

    // Should include today's date in YYYY-MM-DD format
    const datePattern = /\d{4}-\d{2}-\d{2}\.md$/
    expect(result).toMatch(datePattern)
  })

  it('should follow the vault structure: {vault}/01-Projects/{project}/Daily/{date}.md', async () => {
    const config: Config = {
      vaultPath: '/my/vault',
      projectName: 'awesome-project',
    }

    vi.mocked(fs.access).mockResolvedValue(undefined)
    vi.mocked(fs.mkdir).mockResolvedValue(undefined)
    vi.mocked(fs.writeFile).mockResolvedValue(undefined)

    const result = await writeToVault(mockMarkdown, config)

    expect(result).toContain('/my/vault')
    expect(result).toContain('01-Projects')
    expect(result).toContain('awesome-project')
    expect(result).toContain('Daily')
  })

  it('should handle vault paths with trailing slashes', async () => {
    const config: Config = {
      vaultPath: '/path/to/vault/',
      projectName: 'my-project',
    }

    vi.mocked(fs.access).mockResolvedValue(undefined)
    vi.mocked(fs.mkdir).mockResolvedValue(undefined)
    vi.mocked(fs.writeFile).mockResolvedValue(undefined)

    await writeToVault(mockMarkdown, config)

    // Should still work correctly
    expect(fs.access).toHaveBeenCalledWith('/path/to/vault/')
    expect(fs.writeFile).toHaveBeenCalled()
  })

  it('should write markdown content exactly as provided', async () => {
    const config: Config = {
      vaultPath: '/path/to/vault',
      projectName: 'my-project',
    }

    const complexMarkdown = `# Test
## Section
- Item 1
- Item 2

**Bold** and *italic*`

    vi.mocked(fs.access).mockResolvedValue(undefined)
    vi.mocked(fs.mkdir).mockResolvedValue(undefined)
    vi.mocked(fs.writeFile).mockResolvedValue(undefined)

    await writeToVault(complexMarkdown, config)

    // Should write exact content
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.any(String),
      complexMarkdown,
      'utf-8'
    )
  })

  it('should return the full path to the created file', async () => {
    const config: Config = {
      vaultPath: '/path/to/vault',
      projectName: 'my-project',
    }

    vi.mocked(fs.access).mockResolvedValue(undefined)
    vi.mocked(fs.mkdir).mockResolvedValue(undefined)
    vi.mocked(fs.writeFile).mockResolvedValue(undefined)

    const result = await writeToVault(mockMarkdown, config)

    // Should be a complete file path
    expect(result).toContain('/path/to/vault')
    expect(result).toContain('.md')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
