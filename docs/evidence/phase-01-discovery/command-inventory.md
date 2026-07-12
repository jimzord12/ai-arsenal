# Command Inventory

## Entrypoints

- Primary: `bun scripts/features-cli/bin.ts <command>`.
- Secondary: `bun scripts/features-cli/milestone-progress.ts <feature-slug>`.
- Current help and README define `features-cli` as the intended executable name.

## Commands

- `init`: creates `.scratch/features-status.json` and `.scratch/features/`.
- `create-feature <slug>`: allocates the next ID, writes a `todo`/`design` feature record, and creates `NNN-slug/`.
- `status`: prints all features with derived artifact, milestone, issue, frontier, and warning summaries.
- `progress [--feature <slug>] [--json]`: authoritative read-only workflow router.
- `list-issues [--feature <slug>] [--actionable]`: lists canonical derived issues.
- `get-issue <--next|--next-contract|--resume> [--feature <slug>]`: selects implementation, contract, or resumable work.
- `get-feature`: prints the single current feature.
- `update-feature <slug> [--status] [--phase] [--focus] [--pause-current]`: updates lifecycle/routing with recovery protection.
- `mark-milestone-decomposed <milestone-slug> [--feature <slug>]`: stamps the canonical milestone plan.
- `sync-issues [--feature <slug>]`: regenerates derived `issues-status.json`.
- `update-blockers <id> --blockers <none|ids> [--feature <slug>]`: edits canonical issue dependencies and regenerates derived state.
- `update-status <id> --status <status> [--feature <slug>] [--force]`: validates and performs issue lifecycle transitions.
- `reopen-issue <id> --phase <red|green> <--reason|--reason-file> [--feature <slug>] [--force]`: appends reopen metadata and routes resumed work.
- `help | --help`: prints help and exits zero.

## Output and error contract

- Normal output is line-oriented human-readable text; `progress --json` provides the machine-readable router contract.
- Domain errors write a specific message to stderr and exit `1`.
- Unknown commands exit `1` with `Unknown command. Run --help for supported commands.`
- Success exits `0`; there is no exit taxonomy beyond `0` and `1`.
- Newer commands reject duplicate or unknown flags through strict parsing; older command branches use permissive manual flag lookup. Preserve current behavior during migration.

## Verified live reads

- `--help`: exit `0`; complete command list printed.
- `status` against the real source worktree: exit `0`; three features reported.
- `progress --feature remote-logging-mvp-v2 --json`: exit `0`; frontier `implement-issue`, issue `9`.
- `get-issue --next --feature remote-logging-mvp-v2`: exit `0`; issue `9`, `contracted: true`, `nextAction: implement`.
- Invalid feature and unknown command: exit `1` with no filesystem mutation.
