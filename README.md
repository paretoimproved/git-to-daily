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
- [Architecture](Architecture.md) - System design
- [Context](Context.md) - Current working memory
- [Feature-Plan](Feature-Plan.md) - Detailed feature breakdown

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

**Option 1: Global Hooks (Recommended)**

Set up global hooks so ALL git repositories automatically generate daily logs:

```bash
# Create a global hooks directory
mkdir -p ~/.git-hooks

# Copy the post-commit hook
cp .githooks/post-commit ~/.git-hooks/
chmod +x ~/.git-hooks/post-commit

# Set globally for all repos
git config --global core.hooksPath ~/.git-hooks
```

Now every `git commit` in any repository will trigger git-to-daily (if it can find your vault).

**To disable for a specific repo:**
```bash
cd /path/to/repo
git config core.hooksPath .git/hooks  # Use default local hooks
```

**To remove global hooks entirely:**
```bash
git config --global --unset core.hooksPath
```

**Option 2: Per-Repository Setup**

If you prefer to enable git-to-daily only for specific repos:

```bash
# Copy the hook to your target repository
cp .githooks/post-commit /path/to/other-repo/.git/hooks/post-commit
chmod +x /path/to/other-repo/.git/hooks/post-commit

# Or point to a shared hooks directory
git config core.hooksPath /path/to/git-to-daily/.githooks
```

### Configuration

**Auto-detection (recommended)**: The hook automatically detects your Obsidian vault using this priority order:

1. **Parent directories** - Walks up from your repo looking for `.obsidian/`
2. **Sibling directories** - Checks folders alongside your repo for `.obsidian/`
3. **Grandparent siblings** - Checks common vault names (`DevVault`, `Vault`, `ObsidianVault`, `Notes`) at grandparent level
4. **Environment variable** - Falls back to `GIT_TO_DAILY_VAULT`
5. **Windows fallbacks** - Checks `$HOME/DevVault` and similar common locations

**Example structures that work automatically:**

```
# Structure 1: Project inside vault
YourVault/              ← Auto-detected (parent has .obsidian/)
├── .obsidian/
└── 01-Projects/
    └── my-project/     ← Hook finds vault automatically

# Structure 2: Project alongside vault
~/code/
├── DevVault/           ← Auto-detected (sibling has .obsidian/)
│   └── .obsidian/
└── my-project/         ← Hook finds vault automatically

# Structure 3: Common ~/Projects + ~/DevVault setup
~/
├── DevVault/           ← Auto-detected (grandparent sibling)
│   └── .obsidian/
└── Projects/
    └── my-project/     ← Hook finds vault automatically
```

**Manual configuration**: If auto-detection doesn't work, set the `GIT_TO_DAILY_VAULT` environment variable:

**Windows (PowerShell - permanent):**
```powershell
[System.Environment]::SetEnvironmentVariable('GIT_TO_DAILY_VAULT', 'C:\Users\YourName\Documents\Obsidian', 'User')
```

**macOS/Linux (add to ~/.bashrc or ~/.zshrc):**
```bash
export GIT_TO_DAILY_VAULT="$HOME/Documents/Obsidian"
```

### Recommended Project Structure

For the best workflow, especially when syncing notes across machines, we recommend separating code and planning docs:

```
~/
├── DevVault/                          ← Obsidian vault (syncs via git)
│   └── 01-Projects/
│       └── my-project/                ← Planning docs only
│           ├── Context.md
│           ├── Feature-Plan.md
│           └── Daily/                 ← git-to-daily writes here
│
└── Projects/                          ← Code repositories
    └── my-project/                    ← Has own git repo
        ├── src/
        ├── tests/
        ├── docs/ → DevVault link      ← Symlink to planning docs
        └── CLAUDE.md
```

**Benefits:**
- Planning docs sync across machines via DevVault
- Code repos are self-contained with their own git history
- Daily logs auto-sync (git-to-daily writes to DevVault)
- Claude Code can access docs via the symlink

**Setup (one-time per project):**

```bash
# Windows (use junction)
mklink /J "C:\Users\you\Projects\my-project\docs" "C:\Users\you\DevVault\01-Projects\my-project"

# macOS/Linux (use symlink)
ln -s ~/DevVault/01-Projects/my-project ~/Projects/my-project/docs
```

**Add to your project's .gitignore:**
```gitignore
# Docs symlink (tracked separately in DevVault)
docs/
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

## Claude Code Integration

git-to-daily includes a `/daily` slash command for Claude Code users.

### Available Commands

| Command | Description |
|---------|-------------|
| `/daily` | Regenerate today's daily log |
| `/daily view` | Display today's log content |
| `/daily notes <text>` | Add session notes to today's log |
| `/daily summary` | Generate weekly/monthly summaries on demand |

### Setup

The command is automatically available when working in a project that has git-to-daily installed. For global access, copy the command to your personal Claude config:

```bash
cp .claude/commands/daily.md ~/.claude/commands/
```

### Usage Examples

```
/daily              # Regenerate today's log after manual changes
/daily view         # Quick peek at what you've done today
/daily notes "Fixed the auth bug, needs testing"
/daily summary      # Force generate weekly/monthly summaries
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

### Post-commit hook doesn't trigger / Daily log not updating
**Problem**: You're making commits but daily logs aren't being created.

**Solution**: Debug the hook step by step:

1. **Verify hook is installed:**
   ```bash
   # Check if using global hooks
   git config --get core.hooksPath

   # Verify hook exists and is executable
   ls -la ~/.git-hooks/post-commit  # or your hooks path
   ```

2. **Enable debug logging:**
   Add these lines to the top of your post-commit hook (after `#!/bin/sh`):
   ```sh
   DEBUG_LOG="$HOME/hook-debug.log"
   echo "=== POST-COMMIT $(date) ===" >> "$DEBUG_LOG"
   echo "REPO_ROOT: $REPO_ROOT" >> "$DEBUG_LOG"
   # Add more echo statements to trace execution
   ```

3. **Check the debug log after a commit:**
   ```bash
   cat ~/hook-debug.log
   ```

4. **Common issues:**
   - **Vault not found**: Verify your vault has a `.obsidian/` folder
   - **Wrong structure**: Ensure your project structure matches one of the supported layouts
   - **git-to-daily not found**: Install globally with `npm link` or ensure dist/index.js exists

### Hook hangs or takes forever (Windows)
**Problem**: On Windows, the hook seems to hang after a commit.

**Solution**: This was a bug in older versions where `dirname "C:"` returns `C:` causing an infinite loop. Update your hook:
```bash
# Get the latest hook
cp /path/to/git-to-daily/.githooks/post-commit ~/.git-hooks/post-commit
```

Or manually update `find_vault_in_parents()` to include:
```sh
local prev_dir=""
while [ "$dir" != "/" ] && [ "$dir" != "" ] && [ "$dir" != "$prev_dir" ]; do
    # ... existing code ...
    prev_dir="$dir"
    dir="$(dirname "$dir")"
done
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
