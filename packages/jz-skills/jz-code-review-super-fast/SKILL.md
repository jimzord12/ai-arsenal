---
name: jz-code-review-super-fast
description: Fast contract-focused review for small slices. Always runs in a fresh subagent. Produces a proper reviews/NN-review.md. Evaluates contract compliance + natural fitness/practicality/architecture fit. Also does a light natural-fitness pass on the implementation-report.md. Auto-updates features-cli status.
disable-model-invocation: true
---

# jz-code-review-super-fast

Lightweight but proper review skill intended for the super-fast contract path.

**Always invoked via a fresh subagent.** This skill is the payload the fresh reviewer runs.

## Invocation Context (when called as a subagent)

You will be given:

- The three-file context: `SPEC.md`, `issue.md`, `change-contract.md`
- The diff / changed files from the implementation
- The `implementation-report.md` (if it exists)
- Verification output (tests, compile, etc.)
- The issue number and feature slug

Your job is to produce a numbered review report and update features-cli status.

## Review Process

1. **Load context**
   - Read the full change-contract (this is the primary source of truth).
   - Read the issue.md and relevant sections of SPEC.md that the contract points to.
   - Read the implementation-report.md.
   - Examine the actual code changes.

2. **Two-axis review (Standards + Spec)**
   - **Spec / Contract axis**: Does the change implement what the change-contract and issue asked for?
     - Check all acceptance criteria.
     - Check hard walls were respected.
     - Check soft-scope boundaries were not exceeded without justification.
     - Flag scope creep or missing required behavior.
   - **Standards axis**: Does the code follow the project's documented standards and good practices?
     - Use the repo's normal standards sources (CLAUDE.md, CONVENTIONS.md, existing patterns in the module, etc.).
     - Apply the usual smell baseline where the repo does not override it.

3. **Natural fitness & practicality check** (explicitly required)
   - Does the code _feel natural_ in this codebase?
   - Does it follow the project's architecture and style in a healthy way?
   - Does it avoid blindly copying bad or outdated patterns just to "match" existing code?
   - Is it practical and maintainable, or overly clever / fragile for what the contract asked?
   - Call out both good natural fit and any awkwardness.

4. **Light natural-fitness pass on the implementation-report.md**
   - Is the report accurate to what was actually changed?
   - Does it honestly reflect verification results?
   - Is it written at the same quality/size as other reports in this feature?
   - Flag any material omissions or overly rosy language.

5. **Verdict**
   - Produce a clear `PASS` / `FAIL` (or `PASS with notes`).
   - Use the same overall structure and tone as existing reviews in the feature (see reviews/ folders under other issues).
   - Keep the report proper size — match the length and depth of recent reviews for this feature, not a one-paragraph summary.

6. **Write the report**
   - Create `reviews/<NN>-review.md` (use the next available number).
   - The report must be immutable once written (do not overwrite previous reviews).

7. **Update features-cli status**
   - On clear PASS: move the issue toward `done` (or the next appropriate state per the current workflow).
   - On FAIL or significant findings: leave in `in-review` or trigger the appropriate reopen path.
   - Always run a `features-cli progress --feature <slug> --json` after the status change and include the result in your final output.

## Hard Constraints

- You are always a **fresh subagent**. Do not rely on any prior chat context from the implementer.
- Never self-review. This skill is only for the review step.
- Always evaluate both contract compliance **and** natural fitness/practicality.
- Always perform the light pass on the implementation-report.md.
- Produce a proper report (same weight as other issues in the feature).
- Update features-cli status.
- If the change is from a `tdd-ping-pong` method or complexity > 2, note that the super-fast path was used despite recommendations.

## Output Format

End with a short summary the parent can use:

- Verdict (PASS / FAIL + brief reason)
- Key findings (Standards, Spec/Contract, Natural Fitness)
- Notes on the implementation-report.md
- Path to the written review file
- features-cli status after update

Do not paste the entire diff unless it is material to a finding.

## When This Skill Is Not Appropriate

- Large or high-complexity changes (the super-fast path was probably misused).
- Anything that needed tdd-ping-pong (should have been blocked earlier).

In those cases, recommend the full `code-review` skill + normal process.
