# NEXT

**Workflow version:** 1.0
**Last reconciled:** 2026-07-29
**Project:** AI Arsenal monorepo
**State:** Trello Flow CLI `0.2.0` exact-SHA Git/CI capture, global native Windows installation, and allowlisted TestingBoard onboarding workbook are complete.
**Current phase:** Maintenance / verified Trello Work Unit CLI live boundary
**Active work item:** `none`
**Pipeline step:** `none`

## Next Action

Decide whether Git Bash invocation of the globally installed `jz-trello-flow` pnpm shim is a supported compatibility requirement before opening a bounded implementation change.

## Why This Is Next

- Commit `2e33014cecfd481993a799e1b7b4b7bb674d2d68` is on `master` and `origin/master`.
- Quality run `30400791878` and Portability run `30400791849` passed for that exact SHA.
- Global pnpm reports `@jz/ai-arsenal-trello-work-cli@0.2.0`; native Windows `jz-trello-flow --help` succeeds.
- The onboarding workbook passed all 14 checks only on TestingBoard `6a16bbf1fea5389eb39636b7`; its Inbox is empty, generated Work Units are in Done, and disposable lists are closed.
- Direct Git Bash invocation currently fails to resolve the generated global shim's package entrypoint, so support should be decided explicitly rather than assumed.

## Requirements

- [ ] Confirm whether Git Bash is an intended invocation environment for globally installed Bun-backed pnpm executables.
- [ ] If required, capture a separate bounded work item for diagnosis and a cross-shell regression seam.
- [ ] Preserve native Windows behavior, package identity, the retired-alias boundary, and exact packed contents.

## Blockers / Approval

- No blocker affects native Windows use or the completed TestingBoard validation.
- Publication, production-board access, global-installation changes, and source deletion remain separately approval-gated.

## Done When

- Current completed release/live evidence remains accurate, and any Git Bash compatibility work starts only after its support requirement is confirmed.

## After This

- Resume the next explicitly selected bounded monorepo change.

## Source of Truth

- `AGENTS.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- GitHub Actions runs `30400791878` and `30400791849`
- TestingBoard ID `6a16bbf1fea5389eb39636b7`
