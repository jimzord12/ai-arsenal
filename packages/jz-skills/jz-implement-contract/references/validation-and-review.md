# Validation and review

Load this and `completion-artifacts.md` before moving an issue to review.

Stage 5 writes source code, tests, and sometimes config. Markdown-only verification rules do not apply.

## Local verification

Run targeted checks during the loop:

```powershell
npx jest <new-or-changed-test-file>
npm run compile
```

Before review, run the full expected set unless the user explicitly narrows validation:

```powershell
npm run compile
npx jest <new-or-changed-test-file>
npm test
npm run lint
```

Use Node 20 for DB-backed Jest / full-suite runs. This repo's `better-sqlite3` native module is built for Node 20; a Node ABI error is an environment mismatch, not a code failure.

Report any command you could not run and why.

## Fresh review

Choose the next numbered `reviews/<NN>-review.md`, then use a fresh `code-review` pass after implementation. The reviewer gets:

- `SPEC.md`;
- `issue.md`;
- `change-contract.md`;
- the diff / fixed point;
- verification command output;
- any small soft-scope neighbour additions;
- any intentional scope cuts.

The review checks both:

- **Standards**: repo conventions, documented rules, and structural consistency;
- **Spec**: SPEC / issue / contract compliance, missing acceptance cases, scope creep, hard-wall breaches.

The implementer does not mark its own work done without this review.

Persist every review attempt at the reserved path. The fresh reviewer owns the verdict and findings; the orchestrator ensures the returned report is written without changing them.

## Review verdicts

### Pass

Finalize `implementation-report.md`, apply every condition in the completion-artifact done gate, then run:

```powershell
& $bun $cli update-status <id> --status done --feature <feature-slug>
```

Report changed files, checks, the final review pass, and the implementation/review report paths.

### Fail at red

Use when tests are missing, weak, wrong, at the wrong seam, or do not cover a contract acceptance case.

```powershell
& $bun $cli reopen-issue <id> --phase red --reason-file <reviews/NN-review.md> --feature <feature-slug>
```

The next run starts by fixing / adding the failing test before implementation.

### Fail at green

Use when tests are valid but implementation is wrong, incomplete, too broad, inconsistent with patterns, or needs refactor.

```powershell
& $bun $cli reopen-issue <id> --phase green --reason-file <reviews/NN-review.md> --feature <feature-slug>
```

The next run keeps the test seam and fixes implementation.

### Contract boundary failure

Use when the review proves the issue cannot be correctly implemented inside the current contract.

Preserve the numbered review report, fill and surface `ScopeExpansionRequest`, and do not finalize `implementation-report.md`. Do not reopen as red / green until the user approves the new boundary or sends the issue back to Stage 4.

## Commit

Commit only when the user asks for it or the current workflow explicitly requires it. If committing, include only the Stage 5 source/test changes and related issue metadata/completion artifacts; leave unrelated worktree changes alone.
