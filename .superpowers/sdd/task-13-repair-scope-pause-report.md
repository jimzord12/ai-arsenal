# Task 13 repair — scope decision pause

## Defect

The scope skill instructed an agent to create a ready contract that recorded an
unanswered approval decision, but also prohibited the `NEXT.md` advancement
required for that ready contract. The validator would therefore select
`plan-monorepo-change` while `NEXT.md` remained on `scope-monorepo-change`.

## Repair

An unresolved decision that prevents reliable contract scope now stops before
any current `change-contract.md` is created or updated. The active route stays
at `scope-monorepo-change` until direct user input resolves the decision. The
normal template-based contract creation and handoff validation resume only
after that answer.

## Boundary

No workflow schema, validator route, `NEXT.md`, product code, consumer state,
release, or Git history was changed.

## Verification

- Focused guidance assertions confirm the old pending-contract instruction is
  absent and the pre-contract pause, preserved route, and resumed validation
  instructions are present.
- Prettier check, workflow tests, workflow validator, and focused diff check
  were run after the edit.
