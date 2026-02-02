# Daily Log Management

Handle git-to-daily operations based on user request.

## Actions

### `/daily` or `/daily generate`
Regenerate today's daily log using git-to-daily CLI:
```bash
git-to-daily generate --vault "$GIT_TO_DAILY_VAULT"
```

Report success or any errors encountered.

### `/daily view`
Read and display today's daily log from the vault.

1. Get vault path from `$GIT_TO_DAILY_VAULT` environment variable
2. Determine current project from the working directory name
3. Read the file at: `$GIT_TO_DAILY_VAULT/01-Projects/<project>/Daily/<YYYY-MM-DD>.md`
4. Display the contents to the user

### `/daily notes <text>`
Append user notes to today's daily log in a "## Session Notes" section.

1. Read the current daily log file
2. If "## Session Notes" section exists, append the new note with timestamp
3. If section doesn't exist, add it before any existing notes or at the end
4. Format: `- [HH:MM] <note text>`

### `/daily summary [week|month]`
Generate weekly or monthly summaries on demand.

For weekly: `git-to-daily generate --vault "$GIT_TO_DAILY_VAULT" --weekly`
For monthly: `git-to-daily generate --vault "$GIT_TO_DAILY_VAULT" --monthly`

If no argument provided, generate both if applicable.
