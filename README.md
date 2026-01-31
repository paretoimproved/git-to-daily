# git-to-daily

**A CLI tool that generates Obsidian daily logs from git commits**

## Status
- **Status**: Active
- **Start Date**: 2026-01-31
- **Tech Stack**: Node.js, TypeScript, simple-git
- **Repository**: (to be created)

## Overview
Automatically generate daily log entries by parsing git commits and file changes. Saves developers time and ensures daily logs stay up-to-date.

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

## Git Hook Integration

git-to-daily can automatically generate daily logs after each commit using a post-commit hook.

### How It Works

**Trigger Event**: The hook runs after every successful `git commit` command.

When triggered, it:
1. Detects the project name from the repository directory
2. Runs `git-to-daily generate` with your configured vault path
3. Creates/updates the daily log file in your Obsidian vault

### Installation

#### Automatic (for this repository)
Hooks are automatically installed when you run `npm install` (via the `prepare` script).

#### Manual Setup
```bash
npm run hooks:install
```

#### For Other Repositories
```bash
# Option 1: Copy the hook to your target repository
cp .githooks/post-commit /path/to/other-repo/.git/hooks/post-commit
chmod +x /path/to/other-repo/.git/hooks/post-commit

# Option 2: Use core.hooksPath to point to a shared hooks directory
git config core.hooksPath /path/to/git-to-daily/.githooks
```

### Configuration

**Auto-detection (recommended)**: If your project is inside your Obsidian vault, the hook automatically detects the vault by looking for the `.obsidian` folder. No configuration needed!

```
YourVault/              ← Auto-detected as vault (has .obsidian/)
├── .obsidian/
└── 01-Projects/
    └── my-project/     ← Hook finds vault automatically
```

**Manual configuration**: For projects outside your vault, set the `GIT_TO_DAILY_VAULT` environment variable:

**Windows (PowerShell - permanent):**
```powershell
[System.Environment]::SetEnvironmentVariable('GIT_TO_DAILY_VAULT', 'C:\Users\YourName\Documents\Obsidian', 'User')
```

**macOS/Linux (add to ~/.bashrc or ~/.zshrc):**
```bash
export GIT_TO_DAILY_VAULT="$HOME/Documents/Obsidian"
```

### Disabling the Hook

**Temporarily** (unset the environment variable):
```bash
unset GIT_TO_DAILY_VAULT   # macOS/Linux
set GIT_TO_DAILY_VAULT=    # Windows cmd
```

**Permanently** (remove hook configuration):
```bash
git config --unset core.hooksPath
```

## Weekly & Monthly Summaries

git-to-daily automatically generates weekly and monthly summary logs when calendar periods change.

### How It Works

**Weekly Summaries** (triggered on Mondays):
- When you make a commit on a Monday, the tool checks if the previous week (Mon-Sun) has at least 2 days with activity
- If so, it generates a weekly summary aggregating all daily logs from that week
- Output: `{vault}/01-Projects/Weekly/{project}/{YYYY-Www}.md`

**Monthly Summaries** (triggered on the 1st):
- When you make a commit on the 1st of a month, the tool checks if the previous month has at least 2 days with activity
- If so, it generates a monthly summary aggregating all daily logs from that month
- Output: `{vault}/01-Projects/Monthly/{project}/{YYYY-MM}.md`

### What Gets Generated

**Weekly Summary includes:**
- Total commits and files changed for the week
- Active days count (e.g., 5/7)
- Focus areas breakdown (Feature development, Bug fixes, etc.)
- Daily breakdown table
- Highlights (top commit messages)

**Monthly Summary includes:**
- Total commits and files changed for the month
- Active days count
- Weekly breakdown within the month
- Focus areas breakdown
- Daily breakdown table
- Highlights (top 15 commit messages)

### Example Weekly Log
```markdown
# Weekly Log - 2026-W05 (Jan 26 - Feb 1, 2026)

## Summary
- **Total Commits**: 23
- **Total Files Changed**: 47
- **Active Days**: 5/7

## Focus Areas
- Feature development: 12 commits
- Bug fixes: 6 commits
- Refactoring: 5 commits

## Daily Breakdown
| Date | Day | Commits | Focus |
|------|-----|---------|-------|
| Jan 26 | Mon | 5 | Feature development |
| Jan 27 | Tue | 4 | Bug fixes |
...
```

### Notes
- Summaries are only generated once per period (won't overwrite existing)
- Requires at least 2 active days to generate (avoids sparse summaries)
- Integrates seamlessly with the post-commit hook

## Future Enhancements (Post-MVP)
- Date range support (`--since`, `--until`)
- Filter by author
- Custom template support
- Configuration file support (`.git-to-daily.json`)
- npm package publishing
- Smart categorization of changes (auto-categorize by commit type)

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
│   ├── generator.ts       # Daily log markdown generation
│   ├── summary-generator.ts # Weekly/monthly summary generation
│   ├── writer.ts          # File writing
│   ├── log-parser.ts      # Parse existing daily logs
│   ├── daily-log-reader.ts # Read daily logs for aggregation
│   ├── period-utils.ts    # Date/period utilities
│   └── types.ts           # TypeScript types
├── tests/
│   ├── git-parser.test.ts # Git parser tests
│   ├── generator.test.ts  # Generator tests
│   ├── writer.test.ts     # Writer tests
│   ├── period-utils.test.ts # Period utilities tests
│   ├── summary-generator.test.ts # Summary generator tests
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
