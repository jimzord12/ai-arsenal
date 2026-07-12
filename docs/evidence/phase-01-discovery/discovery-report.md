# Phase 1 Discovery Report

## Source and provenance

- Source worktree: `C:\Users\jimzord12\Documents\ICS\github\ics-vcr.worktrees\remote-logging-system`
- Worktree branch: `remote-logging-system`
- Worktree commit: `faca92f6d8747043083d50cf6110f4b5eb03ccfa`
- CLI junction: `scripts/features-cli` targets `C:\Users\jimzord12\Documents\ICS\github\ics-vcr\scripts\features-cli`.
- State junction: `.scratch` targets `C:\Users\jimzord12\Documents\ICS\github\ics-vcr\.scratch`.
- Both paths are Git-ignored at `.gitignore:176` and `.gitignore:184`; the worktree commit identifies the consumer context, not a versioned CLI revision.
- The CLI migration baseline must therefore be established by a recorded file inventory and hashes when migration begins.

## Source instructions and tooling

- Governing files read: `AGENTS.md`, `CLAUDE.md`, `docs/CONVENTIONS.md`, `docs/ROUTINES.md`, and `docs/quirks/index.md`.
- Referenced but absent: `docs/VCR-SKILLS.md`, `docs/WORKING_WITH_ME.md`, `docs/RULES.md`, and `CONTRIBUTING.md`.
- Source environment observed: Windows, Node `20.19.4`, npm `11.6.2`, Bun `1.3.14`.
- Source application uses npm, Jest 29, Babel-Jest, and root-wide TypeScript configuration; the CLI has no manifest of its own.
- The documented focused suite passed: 5 suites, 109 tests, 0 failures.

## Architecture

- `bin.ts:1-12`: Bun executable entrypoint and process-level error mapping.
- `cli.ts:27-41`, `cli.ts:126-609`: help text and handwritten command dispatch.
- `features-state.ts`: feature registry, path validation, shared lock, and feature transaction recovery.
- `issues-state.ts`: canonical Markdown parsing, derived issue state, selection, transitions, and issue mutations.
- `milestone-state.ts`: milestone-plan parsing, DAG validation, and decomposition marker mutation.
- `progress-state.ts`: derived workflow frontier and warnings.
- `milestone-progress.ts`: secondary standalone report entrypoint.
- `status-scanner.ts`: unreferenced by current production modules; retain until migration review confirms it is obsolete.
- Production imports are limited to Node built-ins and sibling modules. There are no application imports, network calls, subprocesses, environment variables, home-directory state, runtime assets, or third-party runtime dependencies.

## Runtime and path contract

- The executable uses `process.cwd()` as the project root (`cli.ts:611-623`).
- There is no upward root discovery. Invoking from a nested directory targets that nested directory.
- Normal state lives below `<cwd>/.scratch/`.
- Focus paths must remain inside the feature workspace and reject absolute paths, traversal, and symlink/junction escape (`features-state.ts:222-253`, `features-state.ts:513-535`).
- `reopen-issue --reason-file` intentionally accepts an absolute path or a path relative to `cwd`.

## Persisted contracts

- Feature state is `.scratch/features-status.json`, schema version `"2"`.
- Feature statuses are `todo`, `in-progress`, `paused`, and `archived`; phases are `design` and `implementation`.
- Exactly one feature may be `in-progress`.
- Feature directories are `.scratch/features/NNN-slug/`.
- Issue Markdown is canonical; `issues-status.json` is derived and has no schema-version field.
- Required issue metadata before the first H1 is `Status`, `Method`, `Complexity`, and `BlockedBy`.
- Milestone authority is the single fenced milestone plan in `SPEC.md`; decomposition is an ISO timestamp.
- Contract readiness is derived from sibling `change-contract.md` files.
- Public CLI output and exit behavior are consumed by workflow skills and must not change without approval.

## Data safety and concurrency

- Writers generally share an exclusive-create `.scratch/features-status.lock` and fail immediately on contention.
- The lock has no retry, timeout, PID-liveness check, or stale-lock cleanup.
- `updateFeature` uses snapshots and a fail-closed recovery journal for multi-file changes.
- Writes use direct `writeFile`, not temp-file-plus-rename replacement.
- `createFeature`, issue mutations, `sync-issues`, and milestone mutation lack equivalent end-to-end recovery.
- `markMilestoneDecomposed` does not acquire the shared lock.
- Reads do not lock and may observe an in-flight direct write.
- The current effective policy is single-writer with fail-fast contention, but crash atomicity is incomplete.

## Testing baseline

- Existing tests are colocated Jest suites using isolated `mkdtemp` workspaces.
- Jest-specific mocking and fake-timer APIs make preserving Jest the lowest-risk migration choice.
- Strong coverage exists for parsing, transitions, path containment, held locks, rollback/recovery, malformed state, milestone DAGs, byte preservation, and idempotency.
- Missing coverage: black-box Bun process execution, executable/shebang behavior, packed installation, real concurrent processes, stale locks, and partial failure for issue/milestone writes.
- `status-scanner.ts` has no dedicated test file in this source copy.

## Grounded direction

- Migrate the production modules and existing tests without changing command output, schemas, `cwd` behavior, or lifecycle rules.
- Create a private workspace package named `@jz/ai-arsenal-features-cli` with executable name `features-cli`.
- Keep Bun as the runtime and Jest as the initial test runner.
- Use a source-distributed npm-compatible package requiring Bun; do not bundle initially because there are no runtime assets or dependencies that justify it.
- Verify a packed tarball in a clean consumer and keep registry publication out of scope.
- Characterize current behavior before migration, then address uncovered atomicity/concurrency risks only through separately approved, test-first changes.
