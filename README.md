# git-to-daily

Automatically generate Obsidian daily logs from your git commits.

## Quick Start

```bash
npm install -g git-to-daily
git-to-daily init
```

`init` walks you through setup: it finds your Obsidian vault and installs a post-commit hook so daily logs are generated automatically after every commit.

## What You Get

Every time you commit, git-to-daily creates or updates a daily log in your Obsidian vault:

```markdown
# Daily Log - 2026-01-31

## Session Info
- **Date**: 2026-01-31
- **Duration**: 3h 45m
- **Focus Area**: Feature development

## Work Completed
### Tasks
- feat: implement user authentication system
- feat: add login and signup forms
- refactor: clean up auth validation logic
- test: add unit tests for auth module

## Code Changes
### Files Modified
  - src/auth/AuthProvider.tsx - feat: implement user authentication system
  - src/components/LoginForm.tsx - feat: add login and signup forms
  - src/utils/validation.ts - refactor: clean up auth validation logic
  - tests/auth.test.ts - test: add unit tests for auth module

## Commits
  09:00 - feat: implement user authentication system (a1b2c3d)
  10:30 - feat: add login and signup forms (e4f5g6h)
  11:45 - refactor: clean up auth validation logic (i7j8k9l)
  12:15 - test: add unit tests for auth module (m1n2o3p)
```

## Commands

### `git-to-daily init`

One-time setup wizard. Detects your Obsidian vault, saves config, and installs a post-commit hook.

- `--vault <path>` -- Skip auto-detection and use this vault path
- `--local` -- Install hook in current repo only (default is global for all repos)

### `git-to-daily generate`

Manually generate or update today's daily log.

- `--vault <path>` -- Path to your Obsidian vault (reads from config if omitted)
- `--project <name>` -- Project name (defaults to current directory name)

### `git-to-daily status`

Show current configuration, vault status, and hook installation status.

## Configuration

After running `init`, config is saved to `~/.config/git-to-daily/config.json`.

Vault path resolution order:
1. `--vault` flag (if provided)
2. Config file (`~/.config/git-to-daily/config.json`)
3. `GIT_TO_DAILY_VAULT` environment variable
4. Auto-detection (traverse parent directories for `.obsidian`)

## How It Works

When you run `git-to-daily init`, a post-commit Git hook is installed. After every `git commit`, the hook runs `git-to-daily generate`, which:

1. Parses today's commits from the local git log
2. Merges with any existing daily log (preserving commits from other machines)
3. Generates a structured markdown file
4. Writes it to `{vault}/01-Projects/{project}/Daily/{YYYY-MM-DD}.md`

The tool is non-destructive -- it only appends new commits and never removes existing content.

## Weekly & Monthly Summaries

git-to-daily automatically generates summary logs when calendar periods change:

- **Weekly summaries** are created on Mondays, covering the previous Mon-Sun
- **Monthly summaries** are created on the 1st, covering the previous month

Summaries include total commits, files changed, active days, focus area breakdowns, and highlights. They are only generated when there were at least 2 active days in the period.

Output paths:
- Weekly: `{vault}/01-Projects/Weekly/{project}/{YYYY-Www}.md`
- Monthly: `{vault}/01-Projects/Monthly/{project}/{YYYY-MM}.md`

## Troubleshooting

**"Not a git repository" error**
Run the command from inside a git repository (a directory with a `.git` folder).

**"Vault path does not exist" error**
Verify your vault path: `ls /path/to/your/vault`. Use an absolute path.

**"No commits found for today"**
This is expected if you haven't committed yet today. Make a commit and try again.

**Hook not running after commits**
Run `git-to-daily status` to check if the hook is installed. Re-run `git-to-daily init` to reinstall.

**Permission errors writing to vault**
Check that the vault directory is writable: `ls -la /path/to/vault`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, project structure, and how to run tests.

## License

[MIT](LICENSE)
