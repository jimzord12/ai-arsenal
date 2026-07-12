# Phase 1 Risk Register

## High

- Unversioned source baseline: the CLI is Git-ignored and junction-shared. Record hashes at migration start and preserve the source copy for rollback.
- Partial multi-file mutations: issue and milestone writes can leave canonical and derived state inconsistent after interruption. Lock and recovery behavior require test-first hardening before source retirement.
- Public workflow coupling: skills parse command output, exit status, schemas, and frontier semantics. Migration must preserve behavior before any redesign.
- `cwd` sensitivity: invoking from the wrong directory silently targets a different `.scratch`. Preserve the contract and document root invocation; nested invocation behavior needs explicit tests.

## Medium

- Lock limitations: fail-fast contention exists, but stale locks have no liveness or recovery mechanism.
- Unlocked milestone mutation: `markMilestoneDecomposed` can race other writers.
- Direct writes: no temp-file-plus-rename replacement protects readers from partial content.
- Mixed invocation styles: explicit Bun, `npx tsx`, and wished-for bare executable paths can diverge.
- Windows junction behavior: shared `.scratch` and path-containment logic need Windows E2E coverage.
- Circular module dependency between feature and issue state complicates refactoring; preserve it initially and refactor only with characterization coverage.

## Low or controlled

- Runtime dependencies: none; package asset omission risk is low.
- Network/security/privacy: no network, telemetry, secrets, or user-home configuration exists.
- Registry ownership: irrelevant to the private, non-published initial distribution.
- Runtime replacement: Bun remains user-locked and installed.

## Explicit initial policy

- Support one writer at a time with fail-fast lock contention.
- Do not promise automatic stale-lock recovery in the migration release.
- Preserve valid user-authored Markdown byte-for-byte outside intended metadata edits.
- Treat any recovery journal as a hard stop requiring explicit restoration.
- Do not remove the original CLI or junction until packed-artifact parity and all consumer cutovers pass and the user approves deletion.
