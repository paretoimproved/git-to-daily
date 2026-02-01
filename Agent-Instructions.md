# Agent Instructions for git-to-daily

**Copy-paste these prompts to start each agent in Claude Code**

---

## Agent 1: Core CLI & Generation

```
I'm Agent 1: Core CLI & Markdown Generation

PROJECT CONTEXT:
- Building git-to-daily: A CLI tool that generates Obsidian daily logs from git commits
- Read Context.md for full project state
- Read Feature-Plan.md for technical design

MY SCOPE:
- Focus: CLI framework, markdown generation, file writing
- Files I'll create:
  - src/index.ts (CLI entry point)
  - src/generator.ts (markdown generation)
  - src/writer.ts (file writing)
  - package.json, tsconfig.json (config)
- Don't touch: src/git-parser.ts, src/types.ts (Agent 2's files)

MY TASKS:
1. Initialize npm project with TypeScript
   - Add dependencies: commander, simple-git, @types/node
   - Configure TypeScript for ESM
   - Add build and dev scripts

2. Create CLI entry point (src/index.ts)
   - Use Commander.js
   - Implement "generate" command
   - Accept --vault and --project flags
   - Call generator and writer

3. Create markdown generator (src/generator.ts)
   - Accept commit data (use mock data initially)
   - Format into Daily Log template
   - Return markdown string

4. Create file writer (src/writer.ts)
   - Accept markdown and vault path
   - Write to: {vault}/01-Projects/{project}/Daily/{date}.md
   - Handle file write errors

5. Integration with Agent 2
   - Once Agent 2 provides git-parser.ts
   - Import and call getTodaysCommits()
   - Pass data to generator

6. Basic error handling
   - Check if in git repo
   - Check vault path exists
   - Show helpful error messages

COORDINATION:
- Update Context.md "Active Work" when I start
- Use Agent-Communication.md to notify Agent 2 when I need the parser
- Create Handoff-To-Testing.md when done for Agent 3
- Log progress with "[Agent 1]" prefix in Daily Log

INTEGRATION POINT:
I need Agent 2 to provide:
- src/types.ts with Commit, FileChange interfaces
- src/git-parser.ts with getTodaysCommits() function

I can start with mock data like:

const mockCommits: Commit[] = [
  {
    hash: 'abc123',
    message: 'feat: add user profile',
    author: 'dev',
    timestamp: new Date(),
    files: [{ path: 'src/profile.ts', status: 'added' }]
  }
]

START HERE:
1. Create project structure
2. Initialize package.json with TypeScript
3. Build CLI with mock data
4. Once Agent 2 is ready, integrate real git parser
```

---

## Agent 2: Git Integration

```
I'm Agent 2: Git Integration & Data Parsing

PROJECT CONTEXT:
- Building git-to-daily: A CLI tool that generates Obsidian daily logs from git commits
- Read Context.md for full project state
- Read Feature-Plan.md for technical design

MY SCOPE:
- Focus: Git repository parsing and data extraction
- Files I'll create:
  - src/git-parser.ts (git operations)
  - src/types.ts (TypeScript interfaces)
- Don't touch: src/index.ts, src/generator.ts, src/writer.ts (Agent 1's files)

MY TASKS:
1. Define TypeScript interfaces (src/types.ts)
   - Commit interface (hash, message, author, timestamp, files)
   - FileChange interface (path, status)
   - DailyLogData interface
   - Config interface
   - Export all for Agent 1 to use

2. Implement git parser (src/git-parser.ts)
   - Import simple-git
   - Create getTodaysCommits() function
   - Get commits since midnight today
   - Extract commit metadata (message, author, time)
   - Extract files changed in each commit
   - Map to Commit[] interface

3. Error handling
   - Check if current directory is a git repo
   - Handle "no commits today" case
   - Handle simple-git errors gracefully

4. Export clean API
   - Export getTodaysCommits() as main function
   - Document with JSDoc comments
   - Keep implementation details private

COORDINATION:
- Update Context.md "Active Work" when I start
- Notify Agent 1 in Agent-Communication.md when types are ready
- Notify Agent 1 when parser is complete and tested
- Log progress with "[Agent 2]" prefix in Daily Log

PROVIDED TO AGENT 1:
Agent 1 will import my work like this:

import { getTodaysCommits } from './git-parser'
import type { Commit, Config } from './types'

const commits = await getTodaysCommits()

IMPLEMENTATION HINTS:
- Use simple-git's log() method
- Filter commits by date >= today 00:00:00
- Use git.diff() or git.show() for file changes
- Consider caching if repo is large (future optimization)

START HERE:
1. Create src/types.ts with all interfaces
2. Create src/git-parser.ts with getTodaysCommits()
3. Test manually in the project directory
4. Notify Agent 1 that interfaces are ready
```

---

## Agent 3: Testing & Documentation

```
I'm Agent 3: Testing & Documentation

PROJECT CONTEXT:
- Building git-to-daily: A CLI tool that generates Obsidian daily logs from git commits
- Read Context.md for full project state
- Read Feature-Plan.md for technical design
- Wait for Agents 1 & 2 to complete before starting

MY SCOPE:
- Focus: Comprehensive testing and documentation
- Files I'll create:
  - tests/generator.test.ts (unit tests for generator)
  - tests/git-parser.test.ts (unit tests for git parser)
  - tests/integration.test.ts (end-to-end test)
  - examples/ (sample outputs)
- Files I'll update:
  - README.md (usage documentation)

WAIT FOR:
- Agent 1 & 2 to complete implementation
- Handoff-To-Testing.md with integration notes
- Working build (npm run build succeeds)

MY TASKS:
1. Set up testing framework
   - Add vitest dependency
   - Configure vitest.config.ts
   - Add test scripts to package.json

2. Unit test: Markdown Generator
   - Test with various commit data
   - Test edge cases (no commits, many commits)
   - Verify markdown format

3. Unit test: Git Parser
   - Create test git repo or use mocks
   - Test getTodaysCommits()
   - Test error cases

4. Integration test
   - Create test git repo
   - Make test commits
   - Run CLI
   - Verify output file exists and is correct

5. Update documentation
   - Add installation instructions to README
   - Add usage examples
   - Add configuration options
   - Add troubleshooting section

6. Create examples
   - Sample output in examples/sample-daily-log.md
   - Show what the generated log looks like

COORDINATION:
- Read Handoff-To-Testing.md from Agents 1 & 2
- Update Context.md "Active Work" to Completed when done
- Log all test results with "[Agent 3]" prefix
- Extract any testing patterns to Knowledge base

SUCCESS CRITERIA:
- All tests pass
- Test coverage >80% for core logic
- README is clear and complete
- Examples are helpful

START HERE:
1. Wait for Handoff-To-Testing.md
2. Review code from Agents 1 & 2
3. Set up vitest
4. Write tests starting with easiest (generator)
5. Document everything
```

---

## Agent 4: Cross-Platform Hook & Testing

```
I'm Agent 4: Cross-Platform Hook Compatibility

PROJECT CONTEXT:
- git-to-daily post-commit hook must work across Windows, macOS, and Linux
- Read Feature-Plan-Hook-Fix.md for technical details on past issues
- Read Context.md for project state

MY SCOPE:
- Focus: Hook reliability, cross-platform testing, documentation accuracy
- Files I maintain:
  - .githooks/post-commit (cross-platform hook)
  - README.md (troubleshooting section)
- Files I create:
  - tests/hook.test.ts (hook logic tests)

MY RESPONSIBILITIES:

1. Maintain cross-platform hook compatibility
   - Test on Windows (Git Bash, PowerShell)
   - Test on macOS/Linux
   - Handle path differences (C:\ vs /)
   - Handle dirname edge cases

2. Vault detection reliability
   - Parent directory traversal
   - Sibling directory detection
   - Grandparent sibling detection (~/Projects + ~/DevVault)
   - Environment variable fallback
   - Windows-specific fallback paths

3. Testing scenarios to cover:
   - Project inside vault (parent detection)
   - Project alongside vault (sibling detection)
   - Project in ~/Projects with vault in ~/DevVault (grandparent)
   - Environment variable only
   - Windows drive root handling (C:)

4. Documentation accuracy
   - Ensure README matches actual behavior
   - Keep troubleshooting section up to date
   - Document any new detection methods

KNOWN ISSUES (FIXED):
- Windows infinite loop: dirname "C:" returns "C:" forever
  - Fix: Track prev_dir to detect when dirname stops changing
- Shallow sibling detection: Only checked direct siblings
  - Fix: Also check common vault names at grandparent level
- Env var not available in hooks: Windows doesn't pass env vars to git hooks
  - Fix: Add Windows fallback paths ($HOME/DevVault, etc.)

START HERE:
1. Read Feature-Plan-Hook-Fix.md for context
2. Verify .githooks/post-commit has all fixes
3. Create tests/hook.test.ts
4. Manual test on Windows with common structures
5. Update README if any gaps found
```

---

## Coordination Notes

### Start Order
1. **Agents 1 & 2**: Start simultaneously (parallel work)
2. **Agent 3**: Starts after Agents 1 & 2 complete

### Communication
- Use **Agent-Communication.md** for messages
- Update **Context.md "Active Work"** regularly
- Create **Handoff-To-Testing.md** before Agent 3 starts

### Integration Points
1. **Agent 2 → Agent 1**: Types and git parser API
2. **Agents 1 & 2 → Agent 3**: Working implementation and handoff notes

### Files Not to Touch (By Agent)
- **Agent 1**: Don't touch git-parser.ts, types.ts
- **Agent 2**: Don't touch index.ts, generator.ts, writer.ts
- **Agent 3**: Only add tests, don't modify src/* unless bugs found

---

## Ready to Start?

1. Create the project directory: `C:\Users\brand\git-to-daily`
2. Open 2 Claude Code sessions (Agents 1 & 2)
3. Copy-paste the prompts above
4. Watch them coordinate via Obsidian!
