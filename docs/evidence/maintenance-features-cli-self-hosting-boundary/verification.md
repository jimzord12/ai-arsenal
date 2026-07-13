# features-cli Self-Hosting Boundary Verification

Date: 2026-07-13

## Verified rule

- `packages/features-cli/AGENTS.md` exists and prohibits using `features-cli` to manage, plan, or track work on `packages/features-cli` itself.
- The scoped instructions direct package maintenance to the AI Arsenal living-plan workflow, verification evidence, package validation, Changesets, and approval gates.
- The rule preserves `features-cli` for consumer-project feature workflows.

## Validation

| Command | Result |
| --- | --- |
| `pnpm format:check` | Passed. |
| `node scripts/validate-living-workflow.mjs` | Passed. |
