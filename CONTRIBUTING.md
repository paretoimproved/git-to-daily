# Contributing to git-to-daily

## Getting Started

```bash
git clone https://github.com/paretoimproved/git-to-daily.git
cd git-to-daily
npm install
npm run build
npm test
```

## Development

### Build and watch for changes

```bash
npm run dev
```

This runs `tsc --watch` so the `dist/` output stays up to date as you edit source files.

### Run from source

```bash
node dist/index.js generate --vault /path/to/vault
```

Or link globally during development:

```bash
npm link
git-to-daily generate --vault /path/to/vault
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# With coverage
npm test -- --coverage
```

Tests use [Vitest](https://vitest.dev/). Test files live in `tests/` and follow the `*.test.ts` naming convention.

## Project Structure

```
git-to-daily/
  src/
    index.ts              # CLI entry point (Commander.js)
    config.ts             # Configuration loading and resolution
    git-parser.ts         # Git commit parsing via simple-git
    generator.ts          # Daily log markdown generation
    summary-generator.ts  # Weekly/monthly summary generation
    writer.ts             # File writing to Obsidian vault
    log-parser.ts         # Parse existing daily logs for merging
    daily-log-reader.ts   # Read daily logs for period aggregation
    period-utils.ts       # Date and calendar period utilities
    types.ts              # Shared TypeScript types
  tests/
    *.test.ts             # Unit and integration tests
  dist/                   # Compiled output (not checked in)
```

## Architecture

- **CLI layer** (`index.ts`): Uses Commander.js to define commands (`init`, `generate`, `status`). Resolves config and orchestrates the pipeline.
- **Config** (`config.ts`): Loads per-repo, global, and env-var configuration. Handles `init` wizard and `.git-to-daily.json` files.
- **Git parsing** (`git-parser.ts`): Uses `simple-git` to extract today's commits with file change details.
- **Generation** (`generator.ts`, `summary-generator.ts`): Transforms commit data into structured markdown for daily, weekly, and monthly logs.
- **Writing** (`writer.ts`): Writes markdown files to the correct vault paths, creating directories as needed.
- **Merging** (`log-parser.ts`): Parses existing daily logs so new commits can be merged without losing data from other machines.

## Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b my-feature`)
3. Make your changes and add tests
4. Ensure all tests pass (`npm test`)
5. Submit a pull request
