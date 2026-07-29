# Work Item

Work item: 2026-07-29-workflow-v2
Workflow: 2
Stage: deliver
Status: delivered
Started at: 2026-07-29T17:37:37+03:00
Max time: 90 minutes
Last time check: 2026-07-29T17:37:37+03:00
Turns since time check: 1
Review cycles: 4
Required findings remaining: no
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none

## Goal

Replace the active eight-stage monorepo ceremony with a coherent Tier 2
define → implement → review/repair → verify → deliver workflow backed by one
compact work-item record.

## Non-goals

- No speculative security, enterprise, or migration framework.
- No deletion of historical v1 work items, skills, or templates.
- No CLI product behavior, release, publication, global installation, or main-checkout change.
- No push; delivery ends with a conventional commit on `workflow-v2`.

## Acceptance criteria

- Current authority and pipeline documentation describe only the five-stage v2 workflow for new work.
- New work uses one `work-item.md` containing the required definition, timing, implementation, review, and verification evidence.
- The validator routes v2 items, enforces a time check by five turns, limits review/repair to four cycles, preserves direct approval only for dangerous work, and keeps v1 items readable.
- Active repository skills implement define, implement, consolidated review/repair, verify, and deliver semantics.
- Focused workflow tests, the full workflow test command, the living workflow validator, and whitespace validation pass.
- The final snapshot is committed conventionally on `workflow-v2` and is not pushed.

## Implementation summary

- Added the compact v2 template and define/review/deliver skills; updated the router, implementation, and verification skills with v2-first behavior while retaining marked v1 compatibility text.
- Updated `AGENTS.md`, the normative pipeline document, and canonical section 8 to make the five-stage Tier 2 workflow authoritative.
- Extended the work-item validator with compact routing, proportionality, review-cycle, approval, prerequisite, and legacy compatibility behavior.
- Reworked living-workflow validation around the six active v2 skills and compact template.
- Focused red run: `node --test --test-name-pattern="compact v2|v2 enforces|v2 requires|completed v2" scripts/validate-monorepo-work-item.test.mjs` failed 4/4 before implementation.
- Focused green runs: the same four tests passed; `node --test scripts/validate-monorepo-work-item.test.mjs` passed 29/29 including all retained v1 cases.
- Repair-cycle focused red runs demonstrated the missing valid-stop, explicit final-verification, and current-guidance reversion protections; the recorded-turn coverage already passed because the validator correctly checks only durable state.
- The matching focused green runs passed 3/3 work-item validator cases and 2/2 living-workflow reversion cases.
- The first stable workflow run passed 44/45 and exposed a finding-1 fixture/whitespace assumption in the new guidance guard; the focused correction accepts Markdown line wrapping while still requiring all material v2 tokens.

## Review findings and repairs

- Review cycle 1 consolidated and repaired exactly four Medium findings: current overview/bootstrap guidance could revert to v1 undetected; turn accounting was incomplete across stages and implied observability the validator does not have; dangerous approval-required and hard-prerequisite stops were conflated with structural corruption; and delivered state was not bound to an explicit passed final-verification result or narrow delivery-invalidated reruns.
- Added focused regressions, updated the current overview and initializer template, defined one five-stage operator counter rule, modeled the three intentional blocked reasons as valid stops, required `Result: passed` for deliver state, and constrained delivery reruns to checks invalidated by its edits.
- Lint and formatting corrections made while stabilizing this same repair are not additional review cycles. No scope expansion was made.
- Review cycle 2 found one remaining Medium contradiction: two current routing paths still named the retired v1 capture stage. Both now route new bounded work to `define-monorepo-change`, and the living-workflow validator has a focused regression preventing recurrence.
- Review cycle 3 found one remaining Medium wording contradiction: current compatibility guidance still named stale approval and digest authorization. Those v1 concepts were removed, and the existing routing regression now rejects all three retired terms.
- Review cycle 4 found one remaining Medium triggerability issue: retained v1 skills still advertised themselves for normal new work. All retained v1-only skills are now explicitly non-triggerable historical compatibility references, and living-workflow validation enforces those markers.
- Focused repair evidence passed and no required finding remains; the four-cycle review cap is exhausted and the stable snapshot handed off to final verification.

## Final verification

Result: passed

- `node scripts/validate-monorepo-work-item.mjs --current --json` — exit 0; the active cycle-1 item validly routed to `verify-monorepo-change` before final verification.
- `pnpm test:workflow` — exit 0; 47/47 workflow and compatibility tests passed on the repaired stable snapshot.
- `node scripts/validate-living-workflow.mjs` — exit 0; all 23 required files passed and `NEXT.md` remained within its orientation budget.
- `git diff --check` — exit 0; no whitespace errors.
- Delivery-invalidated checks only: the selected-item validator returned valid delivered state with no next skill; the living-workflow validator passed 23 required files; and `git diff --check` exited 0.
