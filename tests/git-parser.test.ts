/**
 * Unit tests for the Git Parser
 *
 * Tests git operations and commit extraction.
 * Uses mocking to avoid requiring an actual git repository.
 * Created by Agent 3.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTodaysCommits } from '../src/git-parser.js'

// Mock simple-git
vi.mock('simple-git', () => {
  const mockGit = {
    checkIsRepo: vi.fn(),
    log: vi.fn(),
    raw: vi.fn(),
  }

  return {
    default: vi.fn(() => mockGit),
    __mockGit: mockGit, // Export for test access
  }
})

// Import the mock after setting it up
import simpleGit from 'simple-git'

// Helper to get the mock instance
function getMockGit() {
  return (simpleGit as any)()
}

describe('getTodaysCommits', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
  })

  it('should throw an error if not in a git repository', async () => {
    const mockGit = getMockGit()
    mockGit.checkIsRepo.mockResolvedValue(false)

    await expect(getTodaysCommits()).rejects.toThrow(
      'Not a git repository. Please run this command from within a git repository.'
    )
  })

  it('should return empty array when no commits today', async () => {
    const mockGit = getMockGit()
    mockGit.checkIsRepo.mockResolvedValue(true)
    mockGit.log.mockResolvedValue({
      all: [],
      latest: null,
      total: 0,
    })

    const result = await getTodaysCommits()

    expect(result).toEqual([])
    expect(mockGit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        '--since': expect.any(String),
      })
    )
  })

  it('should return commits from today', async () => {
    const mockGit = getMockGit()
    mockGit.checkIsRepo.mockResolvedValue(true)
    mockGit.log.mockResolvedValue({
      all: [
        {
          hash: 'abc123',
          message: 'feat: add feature',
          author_name: 'Test Developer',
          date: '2026-01-31T10:00:00Z',
        },
      ],
      latest: null,
      total: 1,
    })

    // Mock the git diff command for file changes
    mockGit.raw.mockResolvedValue('A\tsrc/newfile.ts\nM\tsrc/existing.ts')

    const result = await getTodaysCommits()

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      hash: 'abc123',
      message: 'feat: add feature',
      author: 'Test Developer',
      timestamp: new Date('2026-01-31T10:00:00Z'),
      files: [
        { path: 'src/newfile.ts', status: 'added' },
        { path: 'src/existing.ts', status: 'modified' },
      ],
    })
  })

  it('should handle multiple commits', async () => {
    const mockGit = getMockGit()
    mockGit.checkIsRepo.mockResolvedValue(true)
    mockGit.log.mockResolvedValue({
      all: [
        {
          hash: 'commit1',
          message: 'first commit',
          author_name: 'Dev 1',
          date: '2026-01-31T09:00:00Z',
        },
        {
          hash: 'commit2',
          message: 'second commit',
          author_name: 'Dev 2',
          date: '2026-01-31T10:00:00Z',
        },
      ],
      latest: null,
      total: 2,
    })

    mockGit.raw
      .mockResolvedValueOnce('M\tsrc/file1.ts')
      .mockResolvedValueOnce('A\tsrc/file2.ts\nD\tsrc/oldfile.ts')

    const result = await getTodaysCommits()

    expect(result).toHaveLength(2)
    expect(result[0].hash).toBe('commit1')
    expect(result[1].hash).toBe('commit2')
  })

  it('should correctly parse added file status', async () => {
    const mockGit = getMockGit()
    mockGit.checkIsRepo.mockResolvedValue(true)
    mockGit.log.mockResolvedValue({
      all: [
        {
          hash: 'hash1',
          message: 'add file',
          author_name: 'Dev',
          date: '2026-01-31T10:00:00Z',
        },
      ],
      latest: null,
      total: 1,
    })

    mockGit.raw.mockResolvedValue('A\tsrc/newfile.ts')

    const result = await getTodaysCommits()

    expect(result[0].files).toEqual([{ path: 'src/newfile.ts', status: 'added' }])
  })

  it('should correctly parse modified file status', async () => {
    const mockGit = getMockGit()
    mockGit.checkIsRepo.mockResolvedValue(true)
    mockGit.log.mockResolvedValue({
      all: [
        {
          hash: 'hash1',
          message: 'modify file',
          author_name: 'Dev',
          date: '2026-01-31T10:00:00Z',
        },
      ],
      latest: null,
      total: 1,
    })

    mockGit.raw.mockResolvedValue('M\tsrc/existing.ts')

    const result = await getTodaysCommits()

    expect(result[0].files).toEqual([{ path: 'src/existing.ts', status: 'modified' }])
  })

  it('should correctly parse deleted file status', async () => {
    const mockGit = getMockGit()
    mockGit.checkIsRepo.mockResolvedValue(true)
    mockGit.log.mockResolvedValue({
      all: [
        {
          hash: 'hash1',
          message: 'delete file',
          author_name: 'Dev',
          date: '2026-01-31T10:00:00Z',
        },
      ],
      latest: null,
      total: 1,
    })

    mockGit.raw.mockResolvedValue('D\tsrc/oldfile.ts')

    const result = await getTodaysCommits()

    expect(result[0].files).toEqual([{ path: 'src/oldfile.ts', status: 'deleted' }])
  })

  it('should handle renamed files as modified', async () => {
    const mockGit = getMockGit()
    mockGit.checkIsRepo.mockResolvedValue(true)
    mockGit.log.mockResolvedValue({
      all: [
        {
          hash: 'hash1',
          message: 'rename file',
          author_name: 'Dev',
          date: '2026-01-31T10:00:00Z',
        },
      ],
      latest: null,
      total: 1,
    })

    // Renamed files show as R in git diff
    mockGit.raw.mockResolvedValue('R\told.ts\tnew.ts')

    const result = await getTodaysCommits()

    // Renamed files should be treated as modified
    expect(result[0].files).toEqual([{ path: 'new.ts', status: 'modified' }])
  })

  it('should handle empty file changes gracefully', async () => {
    const mockGit = getMockGit()
    mockGit.checkIsRepo.mockResolvedValue(true)
    mockGit.log.mockResolvedValue({
      all: [
        {
          hash: 'hash1',
          message: 'empty commit',
          author_name: 'Dev',
          date: '2026-01-31T10:00:00Z',
        },
      ],
      latest: null,
      total: 1,
    })

    mockGit.raw.mockResolvedValue('')

    const result = await getTodaysCommits()

    expect(result[0].files).toEqual([])
  })

  it('should handle git diff errors gracefully', async () => {
    const mockGit = getMockGit()
    mockGit.checkIsRepo.mockResolvedValue(true)
    mockGit.log.mockResolvedValue({
      all: [
        {
          hash: 'hash1',
          message: 'commit',
          author_name: 'Dev',
          date: '2026-01-31T10:00:00Z',
        },
      ],
      latest: null,
      total: 1,
    })

    // Simulate git diff failure
    mockGit.raw.mockRejectedValue(new Error('git diff failed'))

    const result = await getTodaysCommits()

    // Should return commit with empty files array
    expect(result[0].files).toEqual([])
  })

  it('should throw helpful error on git log failure', async () => {
    const mockGit = getMockGit()
    mockGit.checkIsRepo.mockResolvedValue(true)
    mockGit.log.mockRejectedValue(new Error('git log failed'))

    await expect(getTodaysCommits()).rejects.toThrow('Failed to retrieve git commits: git log failed')
  })

  it('should use today\'s midnight as --since parameter', async () => {
    const mockGit = getMockGit()
    mockGit.checkIsRepo.mockResolvedValue(true)
    mockGit.log.mockResolvedValue({ all: [], latest: null, total: 0 })

    await getTodaysCommits()

    // Verify that --since is set to today's midnight
    const logCall = mockGit.log.mock.calls[0][0]
    expect(logCall).toHaveProperty('--since')

    const sinceDate = new Date(logCall['--since'])
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    expect(sinceDate.getDate()).toBe(today.getDate())
    expect(sinceDate.getMonth()).toBe(today.getMonth())
    expect(sinceDate.getFullYear()).toBe(today.getFullYear())
  })

  it('should handle commits with no author name', async () => {
    const mockGit = getMockGit()
    mockGit.checkIsRepo.mockResolvedValue(true)
    mockGit.log.mockResolvedValue({
      all: [
        {
          hash: 'hash1',
          message: 'commit',
          author_name: '',
          date: '2026-01-31T10:00:00Z',
        },
      ],
      latest: null,
      total: 1,
    })

    mockGit.raw.mockResolvedValue('')

    const result = await getTodaysCommits()

    expect(result[0].author).toBe('')
  })
})
