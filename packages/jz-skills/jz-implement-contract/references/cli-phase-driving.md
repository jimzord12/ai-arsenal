# CLI phase driving

Load this before changing issue status.

Run commands from the repository root in PowerShell. `features-cli` must be on
`PATH`:

```powershell
features-cli --help
```

Always pass `--feature <feature-slug>` for deterministic feature selection. For feature 003, use `--feature remote-logging-mvp-v2` because another feature may be the single `in-progress` feature.

## Select or resume

```powershell
features-cli get-issue --next --feature <feature-slug>
features-cli get-issue --next-contract --feature <feature-slug>
features-cli get-issue --resume --feature <feature-slug>
```

Use `--next` for a new actionable issue and read its `contracted` / `nextAction` fields. `nextAction: implement` is runnable here; `nextAction: contract` routes to `jz-issue-to-contract`. Use `--next-contract` only to locate dependency-ready contract work ahead. Use `--resume` when a previous Stage 5 run stopped while the issue was `in-progress` or `in-review`.

## Normal transition path

```powershell
features-cli update-status <id> --status in-progress --feature <feature-slug>

# implementation loop + verification

features-cli update-status <id> --status in-review --feature <feature-slug>

# fresh code-review -> immutable reviews/<NN>-review.md
# PASS -> finalize implementation-report.md and satisfy completion-artifact done gate

features-cli update-status <id> --status done --feature <feature-slug>
```

`in-progress -> done` is intentionally invalid. The review and completion-artifact gates are mandatory. Read `completion-artifacts.md` before the final transition.

Do not use `--force` for normal work.

## Review failed

Use the sanctioned rejection path:

```powershell
features-cli reopen-issue <id> --phase red --reason-file <reviews/NN-review.md> --feature <feature-slug>
features-cli reopen-issue <id> --phase green --reason-file <reviews/NN-review.md> --feature <feature-slug>
```

The immutable numbered review report is the durable reason file for review findings.

`reopen-issue` only works from `in-review` unless forced. It:

- sets `Status: ready-for-agent`;
- sets `Phase: red` or `Phase: green`;
- increments `Reopens`;
- appends a dated `## Reopen History` entry to `issue.md`;
- regenerates `issues-status.json`.

Reopened issues jump ahead of fresh actionable issues in `get-issue --next`, so finish the returned work before starting new issues.

## Phase caveat

The current `update-status` command changes only `Status`. It does not set `Phase` during normal red / green / review movement. Treat `Phase` as reliable after `reopen-issue`, not as a complete live progress marker unless the CLI is enhanced later.

If you need to record a detailed mid-run handoff, write it in the final response or use the issue's reopen history when review fails; do not hand-edit `issues-status.json`.
