# git-to-daily

**A CLI tool that generates Obsidian daily logs from git commits**

## Status
- **Status**: Active
- **Start Date**: 2026-01-31
- **Tech Stack**: Node.js, TypeScript, simple-git
- **Repository**: (to be created)

## Overview
Automatically generate daily log entries by parsing git commits and file changes. Saves developers time and ensures daily logs stay up-to-date.

## Current Sprint/Milestone
**Current Focus**: MVP - Basic functionality

**Goals**:
- [ ] Parse git commits from today
- [ ] Extract file changes and commit messages
- [ ] Generate markdown in Daily Log format
- [ ] Write to Obsidian vault
- [ ] Basic CLI with `git-to-daily generate` command

**Target Date**: Today (MVP in one session)

## Quick Links
- [[Architecture]] - System design
- [[Context]] - Current working memory
- [[Decisions]] - Architecture Decision Records
- [[Feature-Plan]] - Detailed feature breakdown

## Multi-Agent Plan

### Agent 1: Core CLI & File Writing
- **Focus**: CLI setup, markdown generation, file writing
- **Files**: `src/index.ts`, `src/generator.ts`, `src/writer.ts`
- **Outputs**: Working CLI that can write markdown files

### Agent 2: Git Integration
- **Focus**: Git commit parsing, file change detection
- **Files**: `src/git-parser.ts`, `src/types.ts`
- **Outputs**: Clean API for getting commit data

### Agent 3: Testing & Documentation
- **Focus**: Unit tests, README, usage examples
- **Files**: `tests/`, `README.md`, `examples/`
- **Outputs**: Tested, documented tool

## Installation

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn
- Git installed on your system
- An Obsidian vault

### Install from Source
```bash
# Clone the repository
git clone [repo-url]
cd git-to-daily

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional)
npm link
```

### Install from npm (when published)
```bash
npm install -g git-to-daily
```

## Usage

### Basic Usage
Run `git-to-daily` from within any git repository to generate a daily log from today's commits:

```bash
git-to-daily generate --vault /path/to/your/obsidian/vault --project my-project
```

### Command Line Options

#### `generate` command
Generates a daily log from today's git commits.

**Required flags:**
- `--vault <path>` - Path to your Obsidian vault directory

**Optional flags:**
- `--project <name>` - Project name (defaults to current directory name)

### Examples

**Basic usage with vault path:**
```bash
git-to-daily generate --vault ~/Documents/MyVault
```

**Specify a custom project name:**
```bash
git-to-daily generate --vault ~/Documents/MyVault --project web-app
```

**Using with npm link (after running `npm link`):**
```bash
cd /path/to/your/project
git-to-daily generate --vault ~/Documents/Obsidian --project my-awesome-app
```

**Using without global installation:**
```bash
node dist/index.js generate --vault /path/to/vault --project my-project
```

### Output

The tool creates a markdown file at:
```
{vault}/01-Projects/{project}/Daily/{YYYY-MM-DD}.md
```

For example, if you run:
```bash
git-to-daily generate --vault ~/Vault --project my-app
```

On 2026-01-31, it creates:
```
~/Vault/01-Projects/my-app/Daily/2026-01-31.md
```

### What Gets Generated

The daily log includes:
- **Session Info**: Date, duration (calculated from commit timestamps), focus area (inferred from commit messages)
- **Work Completed**: Checkbox list of all commit messages
- **Code Changes**: List of files modified with status emojis (➕ added, ✏️ modified, 🗑️ deleted)
- **Commits**: Detailed commit log with hashes, authors, timestamps, and file counts

See [examples/sample-daily-log.md](examples/sample-daily-log.md) for a complete example.

## MVP Features
1. ✅ Parse commits from today
2. ✅ Extract commit messages and files
3. ✅ Generate Daily Log markdown
4. ✅ Write to Obsidian vault path
5. ✅ Basic error handling

## Future Enhancements (Post-MVP)
- Date range support (`--since`, `--until`)
- Filter by author
- Custom template support
- Append vs overwrite modes
- Smart categorization of changes

## Troubleshooting

### "Not a git repository" error
**Problem**: You're not running the command from within a git repository.

**Solution**: Navigate to a directory that contains a `.git` folder:
```bash
cd /path/to/your/git/project
git-to-daily generate --vault ~/Vault
```

### "Vault path does not exist" error
**Problem**: The specified vault path is invalid or doesn't exist.

**Solution**: Verify your vault path is correct:
```bash
# Check if the path exists
ls /path/to/your/vault

# Use absolute path
git-to-daily generate --vault /Users/username/Documents/Obsidian
```

### "No commits found for today" message
**Problem**: You haven't made any commits today.

**Solution**: This is normal! Make some commits and try again:
```bash
git add .
git commit -m "feat: add new feature"
git-to-daily generate --vault ~/Vault
```

### Permission errors when writing files
**Problem**: The tool doesn't have permission to write to the vault directory.

**Solution**: Check directory permissions:
```bash
# Check permissions
ls -la /path/to/vault

# Fix permissions if needed
chmod 755 /path/to/vault
```

## Development

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Building
```bash
# Build once
npm run build

# Build in watch mode (for development)
npm run dev
```

### Project Structure
```
git-to-daily/
├── src/
│   ├── index.ts           # CLI entry point
│   ├── git-parser.ts      # Git operations
│   ├── generator.ts       # Markdown generation
│   ├── writer.ts          # File writing
│   └── types.ts           # TypeScript types
├── tests/
│   ├── git-parser.test.ts # Git parser tests
│   ├── generator.test.ts  # Generator tests
│   ├── writer.test.ts     # Writer tests
│   └── integration.test.ts # End-to-end tests
├── examples/
│   └── sample-daily-log.md # Example output
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Submit a pull request

## License

MIT

## Success Metrics
- Generates accurate daily log in <5 seconds
- Works with any git repository
- Outputs valid markdown in DevVault format
- Test coverage >80% for core logic
