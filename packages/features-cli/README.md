# features-cli

Private, agent-facing workflow state tooling for local feature work under `.scratch/features/`.

This package is the AI Arsenal migration boundary for the original junction-shared CLI. It remains private, requires Bun, and intentionally preserves the original command, output, exit-code, `cwd`, and persistence contracts.

## Purpose

`features-cli` stores only durable lifecycle facts and derives the current workflow frontier from canonical artifacts:

- stored: feature status, phase, optional focus, issue status;
- derived: artifact readiness, contract readiness, milestone progress, actionable issues, warnings, and the next workflow stage.

Workflow skills are the primary callers. The installed executable runs the packaged TypeScript source directly with Bun 1.3.14; it does not expose a TypeScript import API.

Install a packed tarball into a consumer project, then invoke the executable from that project's root:

```powershell
pnpm add <path-to-jz-ai-arsenal-features-cli.tgz>
pnpm exec features-cli progress --feature <feature-slug> --json
```

The npm-compatible package is source-distributed and private. The `features-cli` command shim honors the entrypoint's `#!/usr/bin/env bun` shebang, so Bun must be installed and available on `PATH`. Registry publication and automated publication are intentionally out of scope.

## Common commands

```powershell
pnpm exec features-cli --help
pnpm exec features-cli status
pnpm exec features-cli progress [--feature <slug>] [--json]
pnpm exec features-cli update-feature <slug> --status <status> --phase <phase> --focus <path|none>
pnpm exec features-cli update-feature <slug> --status in-progress --pause-current
pnpm exec features-cli sync-issues --feature <slug>
pnpm exec features-cli get-issue --next --feature <slug>
pnpm exec features-cli get-issue --next-contract --feature <slug>
pnpm exec features-cli mark-milestone-decomposed <milestone-slug> --feature <slug>
```

Run `--help` for the complete issue mutation and reopen commands.

## Issue selection

- `get-issue --next` returns the highest-priority actionable issue and reports its derived `contracted: true|false` and `nextAction: contract|implement` values.
- `get-issue --next-contract` returns the highest-priority uncontracted `ready-for-agent` issue whose blockers are either terminal (`done` / `wontfix`) or already contracted. It may identify contract work ahead of the immediate implementation frontier.
- Contract state comes only from the issue's sibling `change-contract.md`; it is not an issue status and is never stored in `issues-status.json`.
- `progress --feature <slug> --json` remains the authoritative router for the next immediate workflow action.

## State rules

- Exactly one feature may be `in-progress`; `paused` preserves its phase and focus.
- Phase is explicit: `design` or `implementation`.
- Focus is optional, feature-relative, and must resolve inside the feature workspace.
- Switching away from another current feature requires prior human approval and one atomic `--pause-current` call.
- `issues-status.json` is derived from canonical issue Markdown; regenerate it with `sync-issues`.
- Milestones are decomposed only by an ISO timestamp in the fenced `SPEC.md` milestone plan. Issue tags alone are not authoritative.
- The final implementation frontier is `feature-review`; a future review workflow owns archival.

## Recovery

Feature-state writers share a repository lock. Interrupted multi-file updates fail closed through `.scratch/features-status.recovery-required.json`; restore the snapshots recorded there before removing the journal and retrying.

## Focused verification

```powershell
pnpm --filter @jz/ai-arsenal-features-cli test
pnpm --filter @jz/ai-arsenal-features-cli typecheck
pnpm --filter @jz/ai-arsenal-features-cli lint
pnpm --filter @jz/ai-arsenal-features-cli pack
pnpm --filter @jz/ai-arsenal-features-cli validate
```

## Packaging contract

The package intentionally packs exactly package metadata, this README, and the eight production TypeScript modules under `src/`. Tests, fixtures, coverage, configuration, archives, and generated artifacts are excluded.

`pnpm --filter @jz/ai-arsenal-features-cli validate` runs strict publint against the pnpm-packed view. The real distribution path is still a packed tarball installed into a consumer that has Bun available on `PATH`.

Use the root Changesets workflow for version and changelog updates. Automated npm publication is intentionally not configured.
