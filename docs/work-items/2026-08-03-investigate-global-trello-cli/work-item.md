# Work Item

Work item: 2026-08-03-investigate-global-trello-cli
Workflow: 2
Stage: deliver
Status: delivered
Started at: 2026-08-03T12:59:01+03:00
Max time: 2 hours
Last time check: 2026-08-03T14:03:38+03:00
Turns since time check: 2
Review cycles: 4
Review status: passed
Review snapshot: sha256:51e62570dca5aff2b6f3022af253146d25d0a6a30fa74c2c50c04f616e6924e3
Review batch: review-20260803-global-shim-reset-04
Review expected: ["contract","quality"]
Review received: [{"reviewer":"contract","outcome":"passed","batchId":"review-20260803-global-shim-reset-04","snapshot":"sha256:51e62570dca5aff2b6f3022af253146d25d0a6a30fa74c2c50c04f616e6924e3"},{"reviewer":"quality","outcome":"passed","batchId":"review-20260803-global-shim-reset-04","snapshot":"sha256:51e62570dca5aff2b6f3022af253146d25d0a6a30fa74c2c50c04f616e6924e3"}]
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none

## Goal

Reproduce and diagnose the reported breakage of the globally installed `jz-trello-flow` command, repair the current installation, and add a tested durable repair command and operating guidance for future pnpm reinstalls.

## Non-goals

- Do not mutate any Trello board or require live Trello credentials for diagnosis.
- Do not replace, remove, or downgrade the installed package; limit the current-installation mutation to the defective generated shell shim.
- Do not change Trello CLI package behavior or version; the durable correction belongs to repository installation tooling and operating guidance.
- Do not publish any package or perform unrelated refactoring.

## Acceptance criteria

- Invoke the generated global shim from outside the repository and capture exit status, stdout, and stderr for credential-free version, help, and docs probes.
- Inspect the global package registration, installed package metadata, generated shim, runtime resolution, and installed file boundary without exposing credentials.
- Compare installed bytes and package identity against the documented exact `0.6.0` artifact and repository source, and identify any drift or missing dependency/runtime assumption.
- Produce a deterministic minimal reproduction of the complaint when possible, or clearly state which supported probes pass and what additional complaint detail remains necessary.
- State a root cause supported by evidence, or explicitly report that the generic complaint is not reproducible and bound the next diagnostic input needed.
- Repair the current extensionless global shim and verify Git Bash, PowerShell, and CMD invocation.
- Add a fail-closed, idempotent repository command that locates the pnpm global bin directory, repairs a generated Bun shim only when necessary, and rejects malformed or unrelated shims.
- Add automated regression coverage that first demonstrates the missing repair command, then covers broken-shim repair, already-correct identity, and malformed-shim rejection.
- Document the durable post-install/rollback repair step and Git Bash smoke check.
- Leave Trello state unchanged.

## Implementation summary

- Reproduced the Git Bash failure across version, help, and docs commands while PowerShell and CMD shims remained healthy. The installed `0.6.0` package entrypoint bytes matched repository source; the extensionless pnpm shim alone passed an MSYS `/c/...` path to Windows Bun instead of its computed native `$basedir_win` path.
- Repaired the current global extensionless shim in place. Git Bash `--version`, `-v`, `--help`, and `docs --list`, plus PowerShell and CMD version probes, all exited 0 without stderr; no Trello state was accessed.
- Added `scripts/repair-pnpm-bun-shim.mjs`, a fail-closed idempotent repair command scoped to the expected `jz-trello-flow` pnpm/Bun shim, and exposed it as `pnpm run repair:global-trello-shim`.
- Added `scripts/repair-pnpm-bun-shim.test.mjs` to the root workflow suite. The initial focused run failed because the repair module did not exist; the repaired focused suite passes twelve repair, identity, unrelated-target, mixed-target, truncated-shim, non-Bun branch, newline-separation, injected-executable, arbitrary-command, traversal, prefix-traversal, and idempotency tests.
- Added `docs/operations/trello-work-cli-global-install.md` with mandatory post-install/rollback repair and Git Bash, PowerShell, and CMD smoke guidance.
- Focused checks passed: the twelve-test Node suite, Prettier and ESLint over touched files, live idempotent repair reporting `unchanged`, and credential-free Git Bash version/help/docs probes.

## Review findings and repairs

- Review batch `review-20260803-global-shim-01` failed with one shared required finding: target validation trusted the generated marker but did not prove every rewritten execution branch targeted the expected package. The quality reviewer rated this High and the contract reviewer rated it Medium. A focused adversarial test first reproduced the unsafe mixed-target acceptance, then implementation validation was tightened to reject any execution line not targeting the expected package; all five focused tests now pass.
- Both reviewers also identified machine-specific operating guidance (Medium/acceptance-related Minor). The hard-coded checkout was replaced with an explicit repository-root placeholder and quoting guidance.
- Candidate-changing repairs reset the complete review evidence for a fresh batch.
- Review batch `review-20260803-global-shim-02` failed because validation could ignore an `exec` branch lacking `"$@"` and still accept a truncated generated shim. A new truncated-shim regression test first reproduced the flaw. The repair now requires exactly the five expected Bun execution branches, requires every branch to forward `"$@"`, and verifies every target. The six-test focused suite and live idempotent repair pass.
- Review batch `review-20260803-global-shim-03` found that counting branches still accepted non-Bun or structurally malformed dispatchers. A new non-Bun execution regression first reproduced that flaw. Validation now derives the generated shim target from the marker and requires the canonical five-branch Bun dispatcher, its guards, executables, target path, and argument forwarding. The seven-test focused suite and live idempotent repair pass.
- Review batch `review-20260803-global-shim-04` failed with a shared High finding: the canonical dispatcher regular expression was not anchored to the complete generated shim, so extra executable statements before or after the recognized substring could remain accepted.
- On 2026-08-03, the user directly authorized resetting the review budget for this bounded item after the four-cycle limit. The prior four-cycle review history remains recorded above; the new review budget starts pending at zero cycles and permits up to four additional repair/re-review cycles.
- Under the user-authorized fresh review budget, a new injected-executable regression first reproduced that the canonical dispatcher matcher accepted extra executable statements outside its substring. Validation now requires exactly one terminal marker, matches the complete canonical dispatcher against that marker-derived target, and rejects every executable statement outside it. The eight-test focused suite and live idempotent repair pass.
- Reset-budget review batch `review-20260803-global-shim-reset-01` failed because the prior complete-dispatcher matcher still accepted arbitrary preamble commands and traversal-capable marker targets. New arbitrary-command and traversal regressions first reproduced both flaws. Validation now accepts only the exact current pnpm-generated preamble and complete dispatcher with one terminal marker, and requires a traversal-free pnpm global `v<major>/<instance>/node_modules/@jz/.../src/bin.ts` target layout. The ten-test focused suite and live idempotent repair pass.
- Reset-budget review batch `review-20260803-global-shim-reset-02` found marker validation still accepted traversal before the matched pnpm-global suffix. A prefix-traversal regression first reproduced the flaw. Validation now rejects any normalized marker path with a `..` segment before checking the canonical pnpm global layout. The eleven-test focused suite and live idempotent repair pass.
- Reset-budget review batch `review-20260803-global-shim-reset-03` found the canonical dispatcher matcher permitted newline whitespace between a Bun executable and target. A newline-separation regression first reproduced the flaw. Dispatcher validation now allows horizontal spaces or tabs only between each executor and target. The twelve-test focused suite and live idempotent repair pass.

## Final verification

Result: passed

- `pnpm run check` passed: formatting, lint, typecheck, all package tests, all workflow tests (118 passed, 2 expected skips), and both workflow validators.
- `node --test scripts/repair-pnpm-bun-shim.test.mjs` passed 12/12 focused repair and adversarial regression tests.
- `pnpm run repair:global-trello-shim` reported `unchanged (0 replacements)` for the live global shim.
- From `/tmp`, Git Bash `--version`, `--help`, and `docs --list` exited 0 with empty stderr; Git Bash version returned `0.6.0`.
- CMD and PowerShell `--version` probes exited 0 with empty stderr and returned `0.6.0`.
- `git diff --check` and `node scripts/validate-monorepo-work-item.mjs --work-item 2026-08-03-investigate-global-trello-cli --json` passed after the final evidence update.

## Delivery evidence

- Artifact commit and matching remote SHA: `421753c2ccbf0d1022c2b85aca7a9f983e236f76`.
- CI passed: [Quality 30809301278](https://github.com/jimzord12/ai-arsenal/actions/runs/30809301278) and [Portability 30809301224](https://github.com/jimzord12/ai-arsenal/actions/runs/30809301224).
- The exact global `@jz/ai-arsenal-trello-work-cli@0.6.0` installation remains in place; the generated `jz-trello-flow` shim is repaired through the durable command and returns `0.6.0` through Git Bash, CMD, and PowerShell.
