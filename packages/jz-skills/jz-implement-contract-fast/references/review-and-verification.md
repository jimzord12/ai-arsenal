# Review and verification

Load this before final verification, review, or completion.

## Proportional verification

Assume the repository's tests, compile, and lint were green before the issue began. Verification should answer questions created by this diff.

| Changed surface                  | Default evidence                                         |
| -------------------------------- | -------------------------------------------------------- |
| Formatting, imports, copy        | Readback or focused formatter/lint only when useful      |
| TypeScript types or interfaces   | `npm run compile`; add focused tests only for behavior   |
| Localized behavior               | Changed or new targeted Jest file                        |
| Shared or cross-cutting behavior | Targeted tests plus compile; consider full test and lint |
| Contract-required command        | Run the named command                                    |

Run full `npm test` or `npm run lint` when the contract requires it, the diff is broad or cross-cutting, shared infrastructure changed, focused evidence raises a concern, or regression risk makes the broader signal useful. Use Node 20 for DB-backed or full Jest runs.

After review fixes, rerun only checks affected by those fixes unless they reveal broader risk.

If a run check fails, fix it when the failure plausibly belongs to the issue. Record a clearly unrelated or pre-existing failure without expanding scope to repair it.

## Immutable review attempts

Before each independent review:

1. Ensure `reviews/` exists.
2. Find files matching `<NN>-review.md`.
3. Reserve the next two-digit number, beginning with `01`.
4. Persist the reviewer's report at that path.

Never overwrite or renumber a report after its verdict is used. A failed report stays failed even after its findings are fixed.

## Re-review decision after failure

After fixing every actionable finding, inspect the fixes as one set.

Run another numbered independent review when any fix:

- changes runtime behavior;
- changes tests or acceptance coverage;
- changes a contract seam or public interface;
- changes persistence, payment, or fiscal behavior;
- materially broadens the diff; or
- leaves meaningful uncertainty that focused checks cannot remove.

Skip another review only when every fix is mechanical, non-behavioral, straightforward, and narrowly verified. Typical examples are formatting, imports, naming, an obvious type correction that changes neither runtime nor public contract, or straightforward configuration/wiring correction with no behavioral change.

When skipping re-review, perform a final diff self-review and record:

- each failed finding and its exact resolution;
- why the fix set is non-behavioral;
- the focused verification evidence;
- why another reviewer would add no meaningful assurance; and
- that final self-review found no unresolved finding or scope change.

If another review runs and fails, preserve it, fix its findings, and apply this decision again.

## Completion gate

Complete only through one of these routes:

### Passing-review route

- every in-scope acceptance case is satisfied;
- required proportional verification is recorded;
- every numbered review report is immutable;
- the latest independent review is `PASS`;
- `implementation-report.md` matches the final diff.

### Resolved-without-re-review route

- every in-scope acceptance case is satisfied;
- at least one independent review occurred;
- every review finding is resolved;
- all post-review fixes are mechanical and non-behavioral;
- focused verification passes;
- final diff self-review is recorded;
- `implementation-report.md` matches the final diff and explains the re-review skip.

## Implementation report

Finalize `implementation-report.md` with:

1. Feature, issue, and completion date.
2. Observable behavior implemented.
3. Changed files grouped as production, tests, supporting/configuration, and deleted.
4. Intentionally skipped or out-of-scope work.
5. Every command run and its actual result.
6. Broad gates skipped and the reason each was unnecessary.
7. Every numbered review attempt and verdict.
8. Every failed finding and its resolution.
9. The re-review decision and evidence.
10. Final outcome: `PASS` or `RESOLVED_WITHOUT_RE_REVIEW`.

Use this review-history shape:

```markdown
## Review History

| Attempt                    | Verdict | Resolution               |
| -------------------------- | ------- | ------------------------ |
| [01](reviews/01-review.md) | `FAIL`  | F-01 fixed: <summary>    |
| [02](reviews/02-review.md) | `PASS`  | Final independent review |
```

For completion without another review, use:

```markdown
## Re-review Decision

Decision: `SKIPPED`
Reason: <why every fix was mechanical and non-behavioral>
Focused evidence: <commands and results>
Final self-review: `PASS` — <scope and result>

## Final Outcome

`RESOLVED_WITHOUT_RE_REVIEW`
```
