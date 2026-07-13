# Task 10 Report: `reconcile-monorepo-change`

## Scope

Created only the Task 10 reconciliation-stage skill, its OpenAI metadata, and
its ported reconciliation contract. The skill is the final normal work-item
stage: it accepts only passed verification, writes passed reconciliation
evidence before changing planning records or active fields, reconciles current
truth, and closes the registration deterministically.

## RED

Before authoring, the no-guidance baseline ran:

```text
node -e "...assert all three reconcile-monorepo-change guidance paths exist..."
```

Exit code: `1`.

The control reported all three required paths missing. Without the new stage,
the pipeline had no explicit instruction that failed verification cannot be
reconciled as complete, that evidence must precede planning-field closure, or
that completed validation requires `nextSkill: null`.

## GREEN

The forward-use documentation check confirms that a passed-verification route
must preflight as `reconcile-monorepo-change`, create a revision-one passed
`reconciliation.md`, reconcile only current-truth planning records, preserve a
canonical-plan-derived next action, and only then change the active fields to
`none` / `none`. It requires both the completed work-item validator route and
the living-workflow validator. A failed, incomplete, malformed, stale, or
differently routed verification result is a stop condition and never produces
completion evidence.

The completed-route test uses the validator suite's isolated temporary fixture
with a passed current artifact chain and a cleared active registration. It
returned `valid: true`, `nextSkill: null`, and the completion status; no real
`docs/work-items` artifact or consumer `.scratch` state was created.

## Revision correction RED/GREEN

A fresh disposable fixture created a structurally valid chain whose current
request through verification artifacts are all revision `2`, with valid
superseded revision-`1` archives. The work-item validator returned
`valid: true`, `nextSkill: "reconcile-monorepo-change"`, and current
verification revision `2`, while the original Task 10 skill rejected that
state by requiring revision one and `verification@1`.

- RED: `@' ... valid revision-2 fixture and guidance assertion ... '@ | node -`
  - Exit `1`. It reported the validator-valid `verification@2` route and the
    hard-coded skill rejection.
- GREEN: `@' ... valid revision-2 fixture and corrected-guidance assertion ... '@ | node -`
  - Exit `0`. It confirms the corrected skill accepts validator-confirmed
    current revisions, creates only a new revision-one reconciliation artifact,
    and binds it to `verification@2`.

## Focused verification commands/results

- `node --test --test-name-pattern="a completed work item validates after active registration is cleared" scripts/validate-monorepo-work-item.test.mjs`
  - Exit `0`. The disposable completed-state validator route passed.
- `node -e "...assert the Task 10 skill and reference contain passed-evidence, current-truth, deterministic-closure, and completed-validation requirements..."`
  - Exit `0`. The forward-use guidance smoke check reported `GREEN`.
- `pnpm exec prettier --check .agents/skills/reconcile-monorepo-change/SKILL.md .agents/skills/reconcile-monorepo-change/agents/openai.yaml .agents/skills/reconcile-monorepo-change/references/reconciliation-contract.md`
  - Exit `0`. All matched files use Prettier code style.
- `node scripts/validate-living-workflow.mjs`
  - Exit `0`. The living workflow remains valid.
- `git diff --check`
  - Exit `0`. No whitespace errors were reported.

## Decisions

- Port the existing reconciliation contract's current-truth, risk, decision,
  evidence, approval, and 30-second `NEXT.md` requirements into the new
  work-item-specific reference.
- Treat passed verification as a hard precondition and require a complete
  passed reconciliation record before any canonical-plan, `NEXT.md`, or active
  registration update.
- Accept validator-confirmed current artifact revisions and bind the new
  reconciliation artifact to the current verification revision; only the new
  reconciliation artifact itself is fixed at revision one.
- Require both active fields to become `none` only after the evidence and
  current-truth updates, while preserving the next action derived from the
  canonical plan rather than inventing a new work item.

## Changed paths

- `.agents/skills/reconcile-monorepo-change/SKILL.md`
- `.agents/skills/reconcile-monorepo-change/agents/openai.yaml`
- `.agents/skills/reconcile-monorepo-change/references/reconciliation-contract.md`
- `.superpowers/sdd/task-10-report.md`

## Self-review

- The skill gates strictly on `Status: passed` verification and the validator's
  reconciliation route.
- It accepts a valid repaired/revised chain and uses the current verification
  revision in the new reconciliation header.
- It writes `reconciliation.md` before planning updates and closes the active
  registration only after that passed evidence exists.
- It requires the completed validator result and living-workflow validation,
  retains current-truth/idempotency discipline, and forbids a manufactured
  work item.
- It preserves the consumer `.scratch/features/` boundary, does not invoke
  `features-cli`, and forbids release, distribution, consumer-state, and Git
  history operations.

## Concerns

- None.
