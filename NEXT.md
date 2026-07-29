# NEXT

**Workflow version:** 2.0
**Last reconciled:** 2026-07-29
**Project:** AI Arsenal monorepo
**State:** Workflow v2 repair cycle 1 is implemented, verified, and delivered locally on `workflow-v2`; push was intentionally excluded.
**Current phase:** Await the next bounded request
**Active work item:** `none`
**Pipeline step:** `none`

## Next Action

Await the next explicit bounded request and route it through `orchestrate-monorepo-work`.

## Why This Is Next

- Workflow v2 uses define → implement → review/repair → verify → deliver and one compact `work-item.md`.
- One consolidated review/repair cycle resolved all required findings; 45 workflow tests and all required final gates passed.
- Historical v1 work items remain readable through a small compatibility path; no migration framework was added.

## Delivered Workflow Decisions

- Default Tier 2 for one to six trusted users; smallest reliable solution.
- Five-stage workflow with one compact durable record.
- Time proportionality check every five agent turns; elapsed estimate is not automatic failure.
- Maximum four consolidated repair/re-review cycles with severity and acceptance-based repair rules.
- Full gates once on the stable snapshot; rerun only invalidated checks after repairs.
- Direct approval only for dangerous deletion/irreversible loss; hard prerequisites block honestly.

## Requirements

- [x] Update the minimum authoritative workflow docs, active skills, compact template, validator, and focused tests.
- [x] Preserve historical v1 readability without migration machinery.
- [x] Pass 45 workflow tests, both workflow validators, and whitespace validation.
- [x] Commit conventionally on `workflow-v2` without pushing.

## Blockers / Escalation

- No blocker is known.
- No blocker remains for Workflow v2 delivery.

## Done When

- The conventional commit exists locally on `workflow-v2` and has not been pushed.

## After This

Await the next explicit bounded request and route it through `orchestrate-monorepo-work`.

## Source of Truth

- `AGENTS.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- `docs/workflow/templates/work-item/work-item.md`
- `scripts/validate-monorepo-work-item.mjs`
- `.agents/skills/orchestrate-monorepo-work/SKILL.md`
