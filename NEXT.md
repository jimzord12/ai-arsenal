# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-07-29
**Project:** AI Arsenal monorepo
**State:** Workflow v2 is delivered. Private Trello CLI `0.4.0` release SHA `9818bf6a359d53d95705f0b9685416cf06837d5b` passed Quality and Portability, was packed with checksum evidence, installed globally by native pnpm, and passed generated-shim help/docs plus disposable first/repeat byte proof.
**Current phase:** Push post-install truth and confirm final exact-SHA CI
**Active work item:** `none`
**Pipeline step:** `none`

## Next Action

Commit and push this post-install evidence/current truth, then require final exact-SHA Quality and Portability success and prove clean local/remote equality.

## Why This Is Next

- Workflow v2 is current repository authority and preserves historical v1 work-item readability.
- Release `verification@4` passed after final review reported zero Critical, High, or Medium findings.
- Package, root, workflow, packed-candidate, root-lint, and whitespace gates pass.

## Requirements

- [x] Preserve delivered Workflow v2 and historical v1 compatibility.
- [x] Generate only private `@jz/ai-arsenal-trello-work-cli@0.4.0` through Changesets.
- [x] Verify deterministic transformed payload bytes, redirect containment, sentinel preservation, and repeat identity.
- [x] Pass independent review, verification, and repository reconciliation.
- [x] Commit/push and pass exact-SHA Quality and Portability CI.
- [x] Pack/checksum that clean CI-green commit and install the exact tarball globally with native pnpm.
- [x] Verify global package/version/generated shim/help/docs and disposable first/repeat byte proof.
- [ ] Record post-install evidence/current truth, commit/push, pass final exact-SHA CI, and finish clean with `master == origin/master`.

## Blockers / Escalation

- No blocker or escalation is known.
- Publication and Trello access remain prohibited.

## Done When

- Durable evidence names release/final SHAs, CI URLs, tarball path/checksum, installed package/version/shim smokes, and first/repeat byte proof.
- Final Quality and Portability pass; local `master` equals `origin/master`; status is clean.

## Source of Truth

- `AGENTS.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- `docs/workflow/templates/work-item/work-item.md`
- `docs/work-items/2026-07-29-release-trello-skills-installer/`
- `packages/trello-work-cli/package.json`
- `scripts/verify-trello-skills-install-bytes.mjs`
