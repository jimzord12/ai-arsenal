# Workflow Observations

## Real read-only workflow

- Working directory: source worktree root.
- Runtime: Bun `1.3.14`.
- `status` reported two legacy-migration features and one current implementation feature.
- `progress --feature remote-logging-mvp-v2 --json` reported a clean `implement-issue` frontier for issue `9`.
- `get-issue --next` returned the same issue with `contracted: true` and `nextAction: implement`.
- Interpretation: `progress --json` is the authoritative router; selection output supplies the next issue-level action.
- Filesystem changes: none.

## Disposable feature lifecycle

- Workspace: a dedicated directory under Windows `%TEMP%`, outside both repositories; removed after observation.
- `init`: exit `0`; created `.scratch/features-status.json` and `.scratch/features/`.
- `create-feature sample-feature`: exit `0`; allocated ID `1`, status `todo`, phase `design`, and directory `001-sample-feature`.
- `update-feature sample-feature --status in-progress --phase design`: exit `0`; activated the feature.
- `get-feature`: exit `0`; returned the activated feature.
- Interpretation: state is rooted strictly in the invocation `cwd`, and normal feature mutations produce only `.scratch` state.

## Disposable issue lifecycle

- Initial canonical issue: `Status: ready-for-agent`, `Method: tdd`, `Complexity: 1`, `BlockedBy: none`.
- `sync-issues --feature sample-feature`: exit `0`; wrote derived `issues-status.json`.
- `get-issue --next`: exit `0`; returned issue `1`, `contracted: false`, `nextAction: contract`.
- `update-status` transitions `ready-for-agent → in-progress → in-review → done`: all exited `0`.
- Final canonical Markdown preserved the body and stored `Status: done`; derived JSON agreed.
- Interpretation: canonical Markdown and derived JSON are intentionally coupled across mutations.

## Invalid request

- Command: `definitely-invalid`.
- Exit: `1`.
- stderr: `Unknown command. Run --help for supported commands.`
- Filesystem changes: none beyond pre-existing disposable state.

## Recovery-required case

- Initial state: valid disposable feature and issue state plus a synthetic `.scratch/features-status.recovery-required.json`.
- Command: `status`.
- Exit: `1`.
- stderr named the journal and instructed restoration before journal removal and retry.
- Filesystem changes: none.
- Interpretation: all feature-state reads fail closed while a recovery journal exists.

## Focused automated verification

- Command: `npx jest --runTestsByPath` over the five suites documented in the CLI README, with `--runInBand`.
- Result: 5 suites passed; 109 tests passed; 0 failed.
- An additional attempt to run `status-scanner.test.ts` failed because that file does not exist; this is a coverage gap, not a failing product test.
