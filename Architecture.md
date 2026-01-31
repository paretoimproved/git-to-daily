# Architecture - git-to-daily

## System Overview

**Purpose**: CLI tool that generates Obsidian daily logs from git commits

**Tech Stack**: Node.js, TypeScript, simple-git, Commander.js

## High-Level Architecture

```
┌──────────────────────────────────────────┐
│           User / Developer               │
└────────────────┬─────────────────────────┘
                 │
                 │ $ git-to-daily generate
                 ▼
┌──────────────────────────────────────────┐
│         CLI Entry Point                  │
│         (src/index.ts)                   │
│                                          │
│  - Parse command line arguments          │
│  - Validate configuration                │
│  - Orchestrate workflow                  │
└───────┬──────────────────┬───────────────┘
        │                  │
        │ get commits      │ generate + write
        ▼                  ▼
┌──────────────┐    ┌──────────────┐
│  Git Parser  │    │  Generator   │
│              │    │              │
│ - Read repo  │    │ - Format MD  │
│ - Get today  │    │ - Template   │
│ - Extract    │    │              │
└──────────────┘    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ File Writer  │
                    │              │
                    │ - Write file │
                    │ - Handle err │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Obsidian     │
                    │ Vault        │
                    └──────────────┘
```

## Component Details

### 1. CLI Entry Point (`src/index.ts`)
**Responsibility**: Command line interface and orchestration

**Dependencies**:
- Commander.js (CLI framework)
- git-parser (data source)
- generator (formatting)
- writer (output)

**Functions**:
- `main()`: Entry point
- Parse CLI arguments
- Validate configuration
- Call components in sequence
- Handle top-level errors

**Configuration**:
- `--vault <path>`: Path to Obsidian vault
- `--project <name>`: Project name within vault

### 2. Git Parser (`src/git-parser.ts`)
**Responsibility**: Extract commit data from git repository

**Dependencies**:
- simple-git library
- types.ts (interfaces)

**Functions**:
- `getTodaysCommits(): Promise<Commit[]>`
  - Get all commits since midnight
  - Extract metadata (message, author, timestamp)
  - Extract file changes per commit
  - Return structured data

**Error Handling**:
- Not a git repository
- No commits today (return empty array)
- Git operation failures

### 3. Markdown Generator (`src/generator.ts`)
**Responsibility**: Format commit data into Daily Log markdown

**Dependencies**:
- types.ts (interfaces)

**Functions**:
- `createDailyLog(data: DailyLogData): string`
  - Format header with date
  - Generate "Work Completed" section
  - List files changed
  - Include commit messages
  - Return markdown string

**Template**:
- Based on DevVault Daily Log template
- Sections: Session Info, Work Completed, Code Changes

### 4. File Writer (`src/writer.ts`)
**Responsibility**: Write markdown to Obsidian vault

**Dependencies**:
- Node.js fs/promises
- Node.js path

**Functions**:
- `save(markdown: string, config: Config): Promise<void>`
  - Construct path: `{vault}/01-Projects/{project}/Daily/{date}.md`
  - Ensure directory exists
  - Write file
  - Handle errors

**Error Handling**:
- Vault path doesn't exist
- No write permissions
- Disk full

## Data Flow

```
1. User runs CLI
   ↓
2. CLI validates config
   ↓
3. Git Parser reads repository
   ↓
4. Git Parser returns Commit[]
   ↓
5. Generator formats to markdown
   ↓
6. Writer saves to vault
   ↓
7. CLI confirms success
```

## Type Definitions (`src/types.ts`)

```typescript
// Core data structure from git
interface Commit {
  hash: string
  message: string
  author: string
  timestamp: Date
  files: FileChange[]
}

// File change detail
interface FileChange {
  path: string
  status: 'added' | 'modified' | 'deleted'
}

// Data for log generation
interface DailyLogData {
  date: string
  commits: Commit[]
}

// User configuration
interface Config {
  vaultPath: string
  projectName: string
}
```

## Error Handling Strategy

### Validation Errors (Before execution)
- Not in git repository → Exit with helpful message
- Vault path invalid → Exit with path error
- Missing required flags → Show usage help

### Runtime Errors (During execution)
- Git operations fail → Log error, exit gracefully
- File write fails → Log error with permissions hint
- Unexpected errors → Log error, preserve stack trace

### User-Friendly Messages
```bash
# Good error message
Error: Not in a git repository
Run this command from within a git repository.

# Bad error message
Error: ENOENT
```

## Testing Strategy

### Unit Tests
- **Generator**: Mock commit data → verify markdown output
- **Git Parser**: Test repo or mocks → verify data extraction
- **Writer**: Temp directory → verify file creation

### Integration Test
- Create test git repo
- Make commits
- Run CLI
- Assert output file exists and is correct

### Manual Test
- Run on git-to-daily's own repo (dogfooding)
- Run on DevVault repo
- Test error cases

## Performance Considerations

### MVP (Good Enough)
- Parse only today's commits (~10-100 commits typical)
- Simple string concatenation for markdown
- Synchronous file write

### Future Optimizations (If Needed)
- Pagination for large commit counts
- Streaming for markdown generation
- Parallel file operations

## Security Considerations

### Inputs
- Vault path: Validate, prevent path traversal
- Project name: Sanitize, prevent directory traversal

### Git Operations
- Read-only operations only
- No git write operations
- Safe to run on any repo

### File Writing
- Only write to specified vault path
- Don't overwrite without confirmation (future: append mode)

## Extension Points (Future)

### Custom Templates
```typescript
interface Template {
  header: (data: DailyLogData) => string
  commits: (commits: Commit[]) => string
  footer: () => string
}
```

### Plugins
```typescript
interface Plugin {
  beforeGenerate?: (data: DailyLogData) => DailyLogData
  afterGenerate?: (markdown: string) => string
}
```

### Configuration File
```json
{
  "vaultPath": "~/DevVault",
  "projectName": "my-app",
  "template": "custom-template.md",
  "plugins": ["smart-categorize"]
}
```

## Deployment

### NPM Package
```bash
npm install -g git-to-daily
```

### Local Development
```bash
npm run build
npm link
```

## Related Patterns
- CLI tool architecture (Commander.js pattern)
- Repository pattern (git-parser abstracts git operations)
- Template pattern (markdown generation)
- Strategy pattern (future: custom templates)

## Decision Records
See [[Decisions]] for ADRs on key architectural choices
