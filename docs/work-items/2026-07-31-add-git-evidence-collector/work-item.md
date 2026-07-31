# Work Item

Work item: 2026-07-31-add-git-evidence-collector
Workflow: 2
Stage: deliver
Status: delivered
Started at: 2026-07-31T00:32:01+03:00
Max time: 8 hours
Last time check: 2026-07-31T10:14:03+03:00
Turns since time check: 1
Review cycles: 1
Required findings remaining: no
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none

## Goal

Deliver a versioned private `weekly-report-cli collect git` command that fetches one configured Git remote and emits runtime-validated JSON evidence separating interval commits on the configured remote default branch from active and inactive remote branches with unmerged work.

## Non-goals

- Do not write stakeholder prose, infer productivity or branch intent, inspect deployments, or implement report evaluation.
- Do not store consumer configuration, call orchestration or delivery APIs, or add scheduling and messaging behavior.
- Do not include consumer names, private repository history, credentials, tokens, or production records in public source, fixtures, documentation, workflow records, diagnostics, or committed evidence.
- Do not add generic plugin, provider, transport, or shared-package abstractions.
- Do not publish to a registry or mutate the tested repositories' checked-out branches and working-tree files.

## Acceptance criteria

- `weekly-report-cli collect git --repository <path> --remote <name> --default-branch <name> --since <inclusive-ISO-instant> --until <inclusive-ISO-instant>` validates arguments, fetches and prunes the named remote without a shell, and leaves checked-out branches and working-tree files unchanged.
- Successful stdout is one runtime-validated, versioned JSON document containing the interval, configured remote/default ref, default-branch commit evidence, and every remote branch with branch-only commits; successful diagnostics are absent and exit code is `0`.
- Commit evidence contains full SHA, parent SHAs, subject, and committed timestamp. Inclusion and active/inactive classification use the supplied inclusive interval and commit timestamps.
- Default-branch commits are never repeated as branch-only work. Each unmerged remote branch is emitted once with name, head SHA, all best merge-base SHAs in deterministic order, ahead/behind counts, branch-only commits, interval activity, and classification `active` or `inactive`; an unrelated branch with no merge base is explicit unverifiable evidence rather than a fabricated relationship.
- A verified empty week and no unmerged branches produce successful empty arrays. Invalid repository, missing remote/default ref, fetch failure, Git failure, and output-validation failure produce versioned `unverifiable` JSON on stdout, redacted diagnostics on stderr, and exit code `1`; CLI usage errors remain stderr-only with exit code `2`.
- Git subprocesses use argument arrays rather than shell command construction. Diagnostics redact credential-bearing URL userinfo and do not expose environment values or remote URLs.
- Focused unit and real-process tests use synthetic temporary repositories and cover merges, rebases, active/inactive/stale branches, pruning, empty results, invalid targets, missing revisions, fetch/Git failures, credential redaction, paths containing spaces, and deterministic ordering.
- The compiled and packed Node.js 24 executable passes process and clean-consumer distribution tests on Windows and Linux. The exact packed boundary remains `README.md`, `package.json`, `dist/bin.js`, and compiled production modules under `dist/`; no source/tests enter the tarball.
- The CLI behavior change is versioned through Changesets, not manual manifest editing. The exact reviewed artifact-bearing commit is packed after its CI passes, its checksum is recorded, and that artifact is installed in the Windows global pnpm environment after preflight; version/help plus a disposable synthetic-repository collection prove the generated global shim. Rollback is the recorded prior global state or package removal when no prior install existed. An evidence-only closure records the artifact-bearing commit without pretending to contain its own SHA.
- Package gates, root repository gates, strict publint, workflow validators, `git diff --check`, privacy scans, independent review, and required GitHub Quality/Windows/Linux Portability checks pass before delivery.

## Implementation summary

- Changed paths: `.agents/skills/deliver-monorepo-change/SKILL.md`, `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`, `README.md`, `NEXT.md`, this work item, and `packages/weekly-report-cli/{README.md,CHANGELOG.md,package.json,src/{arguments,evidence-schema,git-collector,redaction}.{ts,test.ts},src/{cli.ts,cli.test.ts},test/{process.e2e.test.ts,distribution.e2e.test.ts}}`.
- Added the strict `collect git` argument contract, versioned verified/unverifiable JSON schema, redacted diagnostics, shell-free Git collection, deterministic default/branch evidence, all-best-merge-base support, and compiled plus packed-consumer execution.
- Fetch uses an explicit remote-head refspec with prune, no tags, no `FETCH_HEAD` write, and no automatic maintenance; synthetic tests prove checked-out HEAD, worktree, and `FETCH_HEAD` remain unchanged.
- Changesets generated private package version `0.1.0` and `CHANGELOG.md`; no registry publication or global installation occurred during implementation.
- Repaired Workflow v2 delivery sequencing so an item remains active through required post-CI pack/install/smoke work and closes with evidence for the artifact-bearing commit rather than an impossible self-referential commit record.
- Focused implementation checks passed: package format, lint, typecheck, build/test with 7 suites and 28 tests, strict `publint`, clean-consumer distribution execution, both workflow validators, and `git diff --check`.
- Review repair added explicit unrelated-history classification and a fifth synthetic collector test; the invalidated focused suite, formatting, lint, and typecheck pass.

## Review findings and repairs

- Cycle 1 found one acceptance-related Minor: an unrelated remote branch surfaced as a generic merge-base command failure without identifying the no-shared-history condition.
- Repaired `collectBranch` to emit `GIT_BRANCH_UNRELATED` with the affected remote branch and added synthetic unrelated-history coverage. Focused re-review found no remaining Critical, High, Medium, or acceptance-related Minor findings.
- The elapsed-time proportionality check was recorded at 2026-07-31T10:14:03+03:00. The item remains within its bounded collector, schema, distribution, and workflow-delivery scope despite exceeding the original eight-hour wall-clock estimate.

## Final verification

Result: passed

- `pnpm check` — exit `0`; root formatting, lint, typecheck, package tests, 55 passing workflow tests with one documented Windows privilege-dependent skip, and both workflow validators passed. Package totals were 154 Features CLI tests, 277 passing/2 opt-in-live-skipped Trello CLI tests, and 30 weekly-report CLI tests across seven suites.
- `pnpm --filter @jz/ai-arsenal-weekly-report-cli validate` — exit `0`; strict publint passed against the actual packed artifact.
- `pnpm --filter @jz/ai-arsenal-weekly-report-cli test:distribution` — exit `0`; the eight-file tarball installed into a clean temporary consumer and its generated Node.js shim passed help, version, and synthetic Git collection.
- `git diff --check; node scripts/validate-living-workflow.mjs; node scripts/validate-monorepo-work-item.mjs --current --json` — exit `0`; no whitespace errors, living workflow valid, and the compact item routed to verification on the checked snapshot.
- Focused post-review checks — exit `0`: five synthetic collector tests, targeted Prettier, ESLint, and TypeScript validation passed, including explicit `GIT_BRANCH_UNRELATED` evidence.
- Privacy observations — exit `0`: no consumer identity matches for `ics-vcr`, `Greek Essence`, `TestingBoard`, or `jimzord12`; credential-like literals are limited to `example.invalid` synthetic redaction and Git-author fixtures. No real credential, consumer history, remote URL, or environment value is committed.
- Manual diff review confirmed all changed paths match the implementation summary; the packed boundary is exactly `README.md`, `package.json`, `dist/arguments.js`, `dist/bin.js`, `dist/cli.js`, `dist/evidence-schema.js`, `dist/git-collector.js`, and `dist/redaction.js`.

## Delivery evidence

- Artifact-bearing commit: `d7971f27f37d27e226c102f1a30e2af86dee3bdc`; local `HEAD`, `origin/master`, and both CI `headSha` values matched before packing.
- Required CI passed on the exact artifact commit: Quality run `30612443170` (`https://github.com/jimzord12/ai-arsenal/actions/runs/30612443170`) and Portability run `30612443130` (`https://github.com/jimzord12/ai-arsenal/actions/runs/30612443130`), including Ubuntu and Windows weekly-report packed-artifact smoke.
- Exact tarball: `jz-ai-arsenal-weekly-report-cli-0.1.0.tgz`; SHA-256 `e61086ea4da72a40125cc8860970bce64fa9f9c3ea2055fd506faf032e6b5da8`; eight-file packed inventory exactly matched final verification.
- Preflight found no prior global `@jz/ai-arsenal-weekly-report-cli` installation or `weekly-report-cli` shim. Rollback is `pnpm remove -g @jz/ai-arsenal-weekly-report-cli`.
- Global install command: `pnpm add -g <exact-0.1.0-tarball>`; `pnpm list -g --depth 0 --json` reported `@jz/ai-arsenal-weekly-report-cli 0.1.0`, and `Get-Command` resolved the generated global PowerShell shim under the pnpm global bin directory.
- Independent installed verification passed: global `--version` returned `0.1.0`, help exposed `collect git`, all eight installed package files byte-matched the tarball, and the generated global shim returned schema `1` verified evidence with one expected commit and no branches from a disposable synthetic repository whose path contained spaces.
- Registry publication, consumer repository access, private-history collection, and destructive cleanup did not occur. Disposable artifact, comparison, and smoke directories remain under the user temp directory rather than being deleted without direct approval.

## Corrective recovery notice

- This delivered record preserves the evidence observed at premature closure: 28 focused implementation tests before the unrelated-history review repair and 30 tests at the recorded final verification snapshot.
- Later independent review found credential-disclosure and evidence-integrity defects in installed version `0.1.0`; its Delivered status is historical workflow evidence, not current acceptance for credential-bearing input.
- Corrective work item `2026-07-31-recover-git-evidence-collector` delivered private patch `0.1.1` through merged PR `#20`; this record remains immutable evidence of the defective historical `0.1.0` closure rather than being rewritten to make that closure appear valid.
