---
name: jz-impl-contract-super-fast
description: Fast implementation of small, well-contracted issues (complexity ≤ 2). Respects the issue Method for TDD/direct. Produces implementation + proper implementation-report.md, then hands off to fresh review subagent. Auto-updates features-cli status. Hard-blocks tdd-ping-pong and warns on complexity > 2.
disable-model-invocation: true
---

# jz-impl-contract-super-fast

Fast-track implementation for small contracted slices. Avoids ceremony while still producing the two artifacts the workflow requires and updating features-cli.

**Intended for:** issues with `complexity <= 2` that have a solid change-contract. Not a replacement for full process on larger or riskier work.

## Preflight

1. Run `features-cli progress --feature <slug> --json` (or use the issue you were given).
2. Read the issue's `complexity`, `method`, and `nextAction`.
3. **Complexity guard**: If complexity > 2, emit a clear warning:
   > "This issue has complexity > 2. The super-fast path is not recommended. Consider using the full jz-implement-contract or manual process instead. Proceed only if you explicitly accept the risk."
   > Do not hard-block, but make the warning prominent.
4. **Method guard**:
   - `tdd-ping-pong`: **Hard block**. Stop and say: "tdd-ping-pong is not supported in super-fast mode. Use the full process."
   - `tdd-solo`: Use TDD (red → green loops).
   - `direct` (or similar non-tdd): Straight implementation (no strict TDD loop).
5. Confirm the issue is at a state where implementation is the next action (`implement-issue` or equivalent). Use `features-cli get-issue --next` or `--resume` as appropriate.
6. Load the three-file context:
   - `.scratch/features/<NNN>-<slug>/SPEC.md`
   - `.scratch/features/<NNN>-<slug>/issues/<NN>-<issue-slug>/issue.md`
   - `.scratch/features/<NNN>-<slug>/issues/<NN>-<issue-slug>/change-contract.md`

**Done when** you have confirmed complexity/method, loaded the three files, and can state the postcondition + hard walls from the contract.

## Implementation

1. Set the issue to `in-progress` via features-cli if needed (use `update-status` or the driving references for the exact transition).

2. Follow the declared Method:
   - **tdd-solo**: Perform proper TDD. Write failing tests first against the seams and acceptance cases in the contract, then implement the minimal passing code. Iterate per acceptance case / tracer bullet.
   - **direct**: Implement the required behavior directly. Add tests only where the contract explicitly calls for them or where the existing test patterns in the module require coverage.

3. Stay strictly inside the contract:
   - Soft scope = edit freely (including small natural neighbours that stay in intent).
   - Hard walls = surface a `ScopeExpansionRequest` and stop. Never widen silently.

4. Run verification as you go and at the end (targeted first):
   - `npx jest <relevant test file> --runInBand`
   - `npm run compile`
   - Any other commands explicitly listed in the change-contract or issue.

5. Produce a proper `implementation-report.md` in the issue folder.
   - Match the size, structure, and tone of existing reports in this feature (e.g. the ones for issues 03 and 04).
   - Include: observable behavior, changed files (production + tests), intentionally skipped items, commands + results, broad gates skipped, review history, final outcome.
   - Base it on actual diffs, test output, and compile results.

6. Update features-cli status to reflect progress (typically move toward `in-review` once implementation + report are done). Use the appropriate `update-status` call.

**Done when** the code implements the contracted behavior, verification passes, and a proper `implementation-report.md` exists.

## Handoff to Review

- Do **not** review your own work.
- Spawn a **fresh subagent** (new context).
- The subagent's sole task is to perform the review using `jz-code-review-super-fast`.
- Give the fresh subagent:
  - The three-file context (SPEC + issue + change-contract)
  - The final diff or changed files
  - The `implementation-report.md`
  - The verification output
  - Instructions to produce `reviews/<NN>-review.md` and update features-cli status as appropriate.
- Pass `--isolation none` or the appropriate mode so the reviewer sees the changes.

After the review subagent completes, surface its verdict and the review file path.

## Hard Constraints

- Never use this skill for `tdd-ping-pong`.
- Always use a fresh subagent for the review step.
- Always produce a proper-sized `implementation-report.md` (matching current feature issues).
- Respect the change-contract hard walls.
- Update features-cli status automatically at the natural points (in-progress, in-review, done, or reopen as needed).
- Do real verification; do not skip tests or compile.

## When Not to Use

- Complexity > 2 (warn)
- `tdd-ping-pong` method (hard block)
- Anything that feels risky or has significant open design questions

Prefer the full `jz-implement-contract` + `code-review` flow for anything non-trivial.

## References (use as needed)

- Existing jz- contract skills and their references/ folder for patterns around contracts, method topologies, and completion artifacts.
- The project's `code-review` skill for review philosophy.
- `features-cli` commands for status and progress.
