# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-07-30
**Project:** AI Arsenal monorepo
**State:** Private Trello CLI `0.4.1` release `59e04349e56d984bf22021a8dd1fb30f563b65e7` and evidence snapshot `1149b5044594dc3a0c53e62d1e4360fa5b88ca34` passed exact-SHA Quality and Portability CI. The exact SHA-256 `7d52253d335e9555d1fede9693955522611c8e58dfdbfae61469ace68d546035` artifact is globally registered and independently passes generated-shim help/docs, installed compact-record/preflight smoke, and repeatable managed-skill byte proof. The work item is delivered; Greek Essence WU-20 remains untouched.
**Current phase:** Implement the self-contained bundled Trello skill installer
**Active work item:** `2026-07-30-make-trello-skills-install-self-contained`
**Pipeline step:** `deliver-monorepo-change`

## Next Action

Implement the validated compact contract in `docs/work-items/2026-07-30-make-trello-skills-install-self-contained/work-item.md` through `implement-monorepo-change`.

## Why This Is Next

- All Trello mutation/recovery acceptance criteria passed review, final verification, versioned delivery, exact-SHA CI, and installed-artifact proof.
- Evidence snapshot `1149b5044594dc3a0c53e62d1e4360fa5b88ca34` passed Quality `30565284534` and Portability `30565284322`.
- Both workflow validators accept the delivered item and confirm that no work item is active.

## Requirements

- [x] Add exact final-description budget preflight with structured no-write evidence.
- [x] Write compact versioned operation records while preserving exact legacy replay semantics.
- [x] Repair transition dry-run CLI output and resolved Open Questions readiness semantics.
- [x] Align protocol, packaged managed skills, docs, tests, and installer byte proof.
- [x] Commit/push `0.4.1`, pass exact-SHA CI, pack that exact commit, and prove the globally registered artifact is byte-identical.
- [x] Verify installed package/version, generated shim, help/docs, compact-record/preflight behavior, and first/repeat managed-skill bytes.
- [x] Commit/push durable post-install evidence, pass its exact-SHA CI, close the item, and clear active registration.

## Blockers / Escalation

- No blocker or dangerous deletion is known.
- Greek Essence WU-20/WU-19, registry publication, and live Trello mutation are outside the authorized boundary.

## Done When

- The next direct request is captured as one bounded Workflow v2 item before implementation.
- Existing release, installation, and no-Greek-Essence boundaries remain current truth unless later evidence changes them.

## Source of Truth

- `AGENTS.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- `docs/workflow/templates/work-item/work-item.md`
- `docs/work-items/2026-07-30-fix-trello-mutation-recovery/work-item.md`
- `packages/trello-work-cli/package.json`
- `packages/trello-work-cli/src/mutation.ts`
- `packages/trello-work-cli/src/update.ts`
- `packages/trello-work-cli/src/transition.ts`
- `scripts/verify-trello-skills-install-bytes.mjs`
