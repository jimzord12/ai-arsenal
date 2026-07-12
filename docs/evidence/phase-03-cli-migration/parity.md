# Phase 3 CLI Parity

## Compared boundaries

Representative workflows ran through Bun against both:

- Source: `C:\\Users\\jimzord12\\Documents\\ICS\\github\\ics-vcr.worktrees\\remote-logging-system\\scripts\\features-cli\\bin.ts`
- Migrated: `packages/features-cli/src/bin.ts`
- State: separate isolated directories under Windows `%TEMP%`, removed after comparison

## Reproduce

Run from the AI Arsenal root:

```powershell
.\scripts\verify-features-cli-parity.ps1 `
  -SourceCli C:\Users\jimzord12\Documents\ICS\github\ics-vcr.worktrees\remote-logging-system\scripts\features-cli\bin.ts
```

The checked-in verifier creates separate temporary workspaces, runs every command listed below through Bun, normalizes only `lastUpdated` values generated independently by each run, compares canonical issue bytes exactly, prints a JSON result for every boundary, fails when any comparison differs, and removes both workspaces in `finally`.

Verified result on 2026-07-12: exit `0`; 14 boundary comparisons matched and 0 failed.

## Matching results

- Exact exit codes and normalized output matched for `--help`, `init`, `create-feature`, `update-feature`, `get-feature`, `status`, `progress --json`, an unknown command, `sync-issues`, `get-issue --next`, and `update-status`.
- Successful commands remained exit `0`; the unknown command remained exit `1` with the same error text.
- Canonical issue Markdown matched byte-for-byte after mutation.
- Derived `issues-status.json` matched after replacing only independently generated `lastUpdated` values with a timestamp marker.
- Feature schema-v2 state matched after replacing only independently generated top-level and feature `lastUpdated` values with a timestamp marker.
- The raw feature-state comparison differed only because source and destination workflows ran sequentially and therefore generated different timestamps.

## Characterization layer

`packages/features-cli/test/characterization.test.ts` adds nine command-boundary cases covering:

- Exact help behavior.
- Feature lifecycle and schema version `"2"`.
- Human status and machine-readable progress routing.
- Issue lifecycle plus canonical/derived coupling.
- Invalid input and non-mutation.
- Recovery-required fail-closed behavior.
- Strict invocation-`cwd` rooting.
- BOM, CRLF, and unrelated-byte preservation during milestone mutation.
- Held-lock fail-fast behavior and non-mutation.

The migrated suite contains 118 tests across six suites. The original 109 tests remain colocated with migrated production modules.
