# Feature Plan: Cross-Platform Hook Compatibility

**Status**: Planned
**Priority**: Critical
**Created**: 2026-02-01

## Problem Statement

The git-to-daily post-commit hook fails silently on Windows and in common project structures where the code repository and Obsidian vault are not directly adjacent.

### Bugs Identified

1. **Windows Infinite Loop**: `find_vault_in_parents()` loops forever because `dirname "C:"` returns `C:`, never reaching `/` or empty string
2. **Shallow Sibling Detection**: Only checks siblings at parent level, missing the common `~/Projects/` + `~/DevVault/` structure
3. **Environment Variable Not Available**: `GIT_TO_DAILY_VAULT` isn't passed to git hooks on Windows
4. **No Windows Fallbacks**: Doesn't check common locations like `$HOME/DevVault`

### Impact

- Users who follow the "Recommended Project Structure" in README experience silent failures
- Windows users experience hangs or infinite loops
- No error messages - hooks just silently do nothing

## Solution

### Phase 1: Fix the Hook (Agent 4)

Update `.githooks/post-commit` with:

#### 1.1 Fix Windows Infinite Loop
```sh
find_vault_in_parents() {
    local dir="$1"
    local prev_dir=""  # Track previous to detect infinite loop
    while [ "$dir" != "/" ] && [ "$dir" != "" ] && [ "$dir" != "$prev_dir" ]; do
        if [ -d "$dir/.obsidian" ]; then
            echo "$dir"
            return 0
        fi
        prev_dir="$dir"
        dir="$(dirname "$dir")"
    done
    return 1
}
```

#### 1.2 Add Grandparent Sibling Check
```sh
find_vault_in_siblings() {
    local parent_dir="$(dirname "$1")"
    # Check siblings at parent level
    for sibling in "$parent_dir"/*; do
        if [ -d "$sibling/.obsidian" ]; then
            echo "$sibling"
            return 0
        fi
    done
    # Check common vault names at grandparent level
    local grandparent_dir="$(dirname "$parent_dir")"
    if [ "$grandparent_dir" != "/" ] && [ "$grandparent_dir" != "" ]; then
        for vault_name in DevVault Vault ObsidianVault Notes; do
            if [ -d "$grandparent_dir/$vault_name/.obsidian" ]; then
                echo "$grandparent_dir/$vault_name"
                return 0
            fi
        done
    fi
    return 1
}
```

#### 1.3 Add Windows Fallback Paths
```sh
# Windows fallback: check common locations if env var not available
if [ -z "$VAULT_PATH" ]; then
    for candidate in "$HOME/DevVault" "/c/Users/$USER/DevVault" "$USERPROFILE/DevVault"; do
        if [ -d "$candidate/.obsidian" ]; then
            VAULT_PATH="$candidate"
            break
        fi
    done
fi
```

### Phase 2: Update Documentation (Agent 4)

Update README.md:

1. **Vault Detection Hierarchy** - Document the full detection order:
   ```
   1. Parent directories (for projects inside vault)
   2. Sibling directories (for projects alongside vault)
   3. Grandparent sibling directories (for ~/Projects + ~/DevVault)
   4. GIT_TO_DAILY_VAULT environment variable
   5. Windows fallback locations ($HOME/DevVault, etc.)
   ```

2. **Add Troubleshooting Section** for "Hook doesn't trigger":
   - How to debug with `DEBUG_LOG`
   - Common vault detection failures
   - How to verify hook is running

3. **Update Recommended Structure** to explicitly show it works

### Phase 3: Add Hook Testing (Agent 4)

Create `tests/hook.test.ts`:
- Test hook detection logic with mock file systems
- Test Windows path handling
- Test all fallback scenarios

## Files to Modify

| File | Changes |
|------|---------|
| `.githooks/post-commit` | Apply all three fixes |
| `README.md` | Update vault detection docs, add troubleshooting |
| `tests/hook.test.ts` | New file for hook logic tests |

## Agent Instructions

### Agent 4: Cross-Platform Hook & Testing

```
I'm Agent 4: Cross-Platform Hook Compatibility

PROJECT CONTEXT:
- git-to-daily post-commit hook fails on Windows and common project structures
- Read Feature-Plan-Hook-Fix.md for full technical details
- Read Context.md for project state

MY SCOPE:
- Focus: Fix hook, update docs, add tests
- Files I'll modify:
  - .githooks/post-commit (apply fixes)
  - README.md (update documentation)
- Files I'll create:
  - tests/hook.test.ts (hook logic tests)

MY TASKS:
1. Update .githooks/post-commit
   - Fix Windows infinite loop (add prev_dir check)
   - Add grandparent sibling detection
   - Add Windows fallback paths
   - Keep backward compatibility

2. Update README.md
   - Document full vault detection hierarchy
   - Add troubleshooting for "hook not triggering"
   - Verify Recommended Structure matches reality

3. Add hook tests
   - Test find_vault_in_parents with mock paths
   - Test find_vault_in_siblings with mock paths
   - Test Windows-specific scenarios
   - Test fallback priority order

4. Manual verification
   - Test on Windows with Projects/DevVault structure
   - Test on repo inside vault
   - Test on repo with env var set
   - Verify all scenarios work

ACCEPTANCE CRITERIA:
- Hook works on Windows without hanging
- Hook finds ~/DevVault when repo is in ~/Projects/
- All tests pass
- README accurately describes behavior

START HERE:
1. Read Feature-Plan-Hook-Fix.md
2. Apply fixes to .githooks/post-commit
3. Update README documentation
4. Create tests/hook.test.ts
5. Manual test all scenarios
```

## Verification Checklist

- [ ] Hook finds vault when project is inside vault
- [ ] Hook finds vault when project is sibling of vault
- [ ] Hook finds vault when project is in `~/Projects/` and vault is `~/DevVault/`
- [ ] Hook doesn't hang on Windows drive roots
- [ ] Hook respects `GIT_TO_DAILY_VAULT` env var
- [ ] Hook falls back to common Windows locations
- [ ] README documents all detection methods
- [ ] Tests cover all scenarios

## Notes

The fixes in this plan have already been tested and verified working on the global hook at `~/.git-hooks/post-commit`. This plan is to bring those fixes into the shipped hook in the repository.
