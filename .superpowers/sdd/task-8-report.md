# Task 8 Report: `implement-monorepo-change`

## Scope

Created only the Task 8 implementation-stage skill and its OpenAI metadata.
The skill consumes the ready contract, digest-bound approved plan, approval,
and current worktree; it permits only contract-scoped implementation changes,
the implementation report, and the single `NEXT.md` handoff to verification.

## RED

A fresh no-guidance control under a 20-minute deadline asked to edit source
immediately. It correctly checked the current contract, approval, scoped
instructions, test-first execution, and durable reporting, but incorrectly
proposed reconciliation after implementation. The Task 8 skill now makes the
boundary explicit: it ends with `implementation-report.md`, advances only the
pipeline handoff as needed, and requires
`nextSkill: "verify-monorepo-change"`; it must not reconcile, verify, release,
mutate consumer state, or mutate Git history.

## GREEN

Using the same no-guidance 20-minute deadline input, a forward-use agent read
the new skill and then applied its implementation boundary: it read the
required artifacts and scoped instructions; checked the active ID and
revision-one state; required validator preflight with `valid: true` and
`nextSkill: "implement-monorepo-change"`; compared the contract hard walls and
test seams with planned paths; observed a focused behavioral test fail; made
the smallest conforming change; observed that test pass; ran the required
implementation checks; completed the revision-one implementation report;
changed only `NEXT.md` to `verify-monorepo-change`; and required a final
validator result of `valid: true` with `nextSkill: "verify-monorepo-change"`.
It explicitly stopped there without verification or reconciliation.

Separately, the disposable validator fixture contained matching revision-one
contract, plan, and approval digest plus active `NEXT.md` state. It added a
ready revision-one implementation report, changed only its fixture pipeline
step to `verify-monorepo-change`, and ran the current validator. The JSON
result was `valid: true` with `nextSkill: "verify-monorepo-change"`. The
fixture was removed after the check.

## Focused verification

- `node scripts/validate-monorepo-work-item.mjs --work-item 2026-07-13-task-8-green --json` in the isolated fixture: passed; `valid: true`, `nextSkill: "verify-monorepo-change"`.
- `pnpm format:check`: passed; all matched files use Prettier code style.
- `git diff --check`: passed; no whitespace errors.

## Decisions

- Require the validator preflight to prove the approval digest and route before any edits.
- Require focused red-green execution for every behavior change; documentation-only work still requires formatter and workflow validation.
- Keep verification and reconciliation as later-stage responsibilities.

## Changed paths

- `.agents/skills/implement-monorepo-change/SKILL.md`
- `.agents/skills/implement-monorepo-change/agents/openai.yaml`
- `.superpowers/sdd/task-8-report.md`

## Concerns

- None.
