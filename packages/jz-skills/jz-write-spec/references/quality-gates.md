# Implementation SPEC Quality Gates

Run these gates before presenting the SPEC.

## Gate 1 — Self-contained contract

The SPEC fails if a fresh agent would need chat history to understand:

- what to build
- why it exists
- which decisions are locked
- which files matter
- which patterns to follow
- how data flows
- how errors behave
- how to test and validate

Allowed: source references for traceability.

Not allowed: depending on external context without summarizing the needed facts.

## Gate 2 — No placeholders

The SPEC fails if it contains:

- TBD
- TODO
- FIXME
- “decide later”
- “add proper validation”
- “handle edge cases” without listing them
- “follow existing pattern” without describing the pattern
- “write tests” without naming test types/cases
- “etc.” in requirements, contracts, or acceptance criteria

## Gate 3 — Decision coverage

For each locked decision:

- It appears in the Decision Ledger.
- It is reflected in target design or requirements.
- It has implementation impact.
- It has acceptance/test coverage when testable.

## Gate 4 — Evidence coverage

Every affected subsystem must have current-state evidence:

- exact path
- relevant symbol/component/function/config/test
- what the evidence proves

If evidence cannot be found, the SPEC must say so and explain the assumption.

## Gate 5 — Requirement traceability

Every functional requirement must map to:

- implementation location or target module
- acceptance criteria
- at least one test idea

## Gate 6 — Interface completeness

Every proposed public function/component/type/API must define:

- name
- responsibility
- inputs
- outputs
- errors/failure behavior
- consumers

## Gate 7 — Error and edge-case completeness

The SPEC must cover:

- happy path
- invalid input
- missing data
- network/service failure where relevant
- permission/auth failure where relevant
- loading/empty states for UI
- offline/degraded behavior where relevant
- concurrency/race conditions where relevant
- rollback/retry where relevant

## Gate 8 — Testability

The SPEC must include:

- exact repo validation commands when discoverable
- unit/integration/e2e/manual coverage as relevant
- regression tests for existing behavior at risk
- expected outcomes, not just command names

## Gate 9 — Implementation boundaries

The SPEC must define:

- files to create
- files to modify
- files/modules explicitly out of scope
- suggested implementation order
- stable interfaces that must not break

## Gate 10 — Fresh-agent review

A fresh implementability reviewer must return PASS or all FAIL issues must be fixed/recorded.

The main agent must not hand-wave reviewer findings. Either:

- fix the SPEC, or
- record the issue as a blocking open question with a reason.

## Final verdict block

At the end of the SPEC, include:

```markdown
## SPEC Quality Verdict

- Self-contained contract: PASS/FAIL
- No placeholders: PASS/FAIL
- Decision coverage: PASS/FAIL
- Evidence coverage: PASS/FAIL
- Requirement traceability: PASS/FAIL
- Interface completeness: PASS/FAIL
- Error/edge-case coverage: PASS/FAIL
- Testability: PASS/FAIL
- Implementation boundaries: PASS/FAIL
- Fresh-agent review: PASS/FAIL

Overall: PASS/FAIL
```
