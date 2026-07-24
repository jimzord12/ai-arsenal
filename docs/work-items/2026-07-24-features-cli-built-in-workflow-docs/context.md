Work item: 2026-07-24-features-cli-built-in-workflow-docs
Artifact: context
Revision: 1
Prerequisites: request@1
Status: ready

# Applicable instructions

- `AGENTS.md` requires the monorepo work-item pipeline, preserves the pnpm/Turborepo/Bun/package direction, gates public CLI behavior and release actions, and requires isolated temporary test workspaces.
- `packages/features-cli/AGENTS.md` prohibits using `features-cli` to manage, plan, or track maintenance of its own package and routes package maintenance through the monorepo workflow.
- `.agents/skills/orient-monorepo-change/SKILL.md` limits this stage to evidence gathering and permits only this context artifact plus the pipeline-step update.
- `packages/jz-skills/jz-feature-grilling/templates/feature/AGENTS.md` was inspected as a generated consumer-workspace instruction template, not as an instruction governing this monorepo path.

## Repository snapshot

- Repository root: `C:\Users\jimzord12\Documents\GitHub\ai-arsenal`.
- Branch and commit: `master` at `7ac39b4` (`feat(workflow): complete monorepo work-item pipeline`), aligned with `origin/master` at orientation start.
- Initial `git status --short`: clean. Current changes are limited to `NEXT.md` and this work item's planning artifacts.
- Package: `@jz/ai-arsenal-features-cli` version `0.2.0`, private, source-distributed, Bun `1.3.14`, with no TypeScript import surface.
- Existing top-level commands are dispatched directly in `src/cli.ts`. The exact help contract is one hand-written `FEATURES_CLI_HELP` string; there is no command registry abstraction.
- `docs` is absent from the help text and command dispatch. Static parser behavior routes `docs` and `--docs` to the existing unknown-command result. Exact help and unknown-command behavior are covered by in-process, characterization, and real-process tests.
- Direct invocation of `features-cli` was not used during its own maintenance orientation because the package-scoped self-hosting instruction forbids it. Existing source, fixtures, tests, and the passing real-process suite provide the behavior evidence instead.
- Focused verification: `pnpm --filter @jz/ai-arsenal-features-cli test` passed outside the subprocess-restricted sandbox with 7 suites and 144 tests. The first sandboxed attempt produced `spawn EPERM` in the real-process suite; the six non-process suites passed there, and the approved unsandboxed rerun passed all 144 tests.
- Current tests include exact help fixtures, semantic JSON progress assertions, selector variants, invalid-input no-mutation behavior, frontier derivation, warnings, recovery guards, Windows-oriented paths with spaces and Unicode, real Bun processes, concurrent writers, packing, clean-consumer installation, and packed executable invocation.
- The package manifest currently includes `README.md` and eight production TypeScript modules in `files`; package metadata makes the verified packed boundary exactly 10 files. Any new production module or bundled content changes that boundary.

## Relevant files

- `packages/features-cli/src/cli.ts`: `CliResult`, exact help string, argument parsing, direct command dispatch, human progress formatter, JSON serialization, error handling, and process-main adapter.
- `packages/features-cli/src/bin.ts`: Bun shebang and executable entry point.
- `packages/features-cli/src/progress-state.ts`: authoritative `FrontierKind`, `FeatureProgress` JSON model, artifact detection, warnings, milestone and issue summaries, and read-only frontier derivation.
- `packages/features-cli/src/features-state.ts`: feature schema version 2, statuses (`todo`, `in-progress`, `paused`, `archived`), phases (`design`, `implementation`), current-feature resolution, corrupt/unsupported state errors, and recovery-required read guard.
- `packages/features-cli/src/issues-state.ts`: flexible feature-selector resolution; issue statuses and parsing; actionable, resumable, and contract-ready selection; derived contract detection.
- `packages/features-cli/src/milestone-state.ts`: canonical milestone-plan parsing, reconciliation, dependency handling, and decomposition timestamp mutation.
- `packages/features-cli/package.json`: runtime, scripts, executable, and explicit packed-file allowlist.
- `packages/features-cli/README.md`: current user-facing purpose, commands, selectors, issue selection, state rules, recovery, verification, and packaging contract.
- `packages/features-cli/GLOSSARY.md`: currently owns only the package's Local Release term, not Spec-to-Ship terminology.
- `packages/features-cli/src/cli.test.ts`, `src/progress-state.test.ts`, and the other colocated state suites: temporary-workspace semantic coverage for command and domain behavior.
- `packages/features-cli/test/characterization.test.ts` and `test/fixtures/help.txt`: exact compatibility fixtures, JSON routing assertions, and invalid-input no-mutation checks.
- `packages/features-cli/test/e2e.test.ts`: real-process Bun coverage, portability-sensitive workspaces, concurrency, packing, clean-consumer installation, and installed-command invocation.
- `packages/jz-skills/jz-resume-feature/SKILL.md`: current read-only human explanation and explicit mapping from every `FrontierKind` to a recommended next skill or a no-owner explanation.
- `packages/jz-skills/jz-feature-grilling/SKILL.md` and `templates/feature/{AGENTS.md,GLOSSARY.md,GRILL_SESSION.md}`: feature workspace shape, design ledger and language ownership, progress preflight, design transition, and artifact conventions.
- `packages/jz-skills/jz-write-spec/SKILL.md` and `references/spec-template.md`: SPEC ownership, design-to-implementation transition, normative SPEC structure, evidence, traceability, and validation expectations.
- `packages/jz-skills/jz-spec-to-milestones/SKILL.md` and `references/milestone-format.md`: milestone planning ownership and the fenced milestone block inside `SPEC.md`.
- `packages/jz-skills/jz-milestone-to-issues/SKILL.md` and `references/issue-file-format.md`: one-milestone decomposition, issue artifact format, blocker DAG, issue synchronization, and decomposition marker transition.
- `packages/jz-skills/jz-issue-to-contract/SKILL.md` and `references/contract-format.md`: one-issue contract ownership, code-read-only scoping boundary, soft scope, hard walls, test seams, and triangulating acceptance cases.
- `packages/jz-skills/jz-implement-contract/SKILL.md` and its `cli-phase-driving.md` and `completion-artifacts.md` references: issue implementation/review lifecycle, RED/GREEN/review caveat, reopen behavior, immutable review reports, implementation report, and done gate.
- `packages/jz-skills/jz-code-review-super-fast/SKILL.md`: review-stage evidence and routing context.
- `packages/jz-skills/README.md`: identifies the JZ skills package as the single source of truth for the `jz-*` skill family.
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`: verified package, test, portability, and distribution invariants.

## Risks

- The request prefers deriving command signatures from a command registry, but no registry exists. Introducing one would be a CLI refactor whose compatibility and proportionality must be scoped; manually duplicating signatures would create drift.
- `progress-state.ts` is authoritative for frontier facts, but next-skill ownership and plain-language reporting currently live in `jz-resume-feature`. Copying that map into CLI docs would create a second maintenance point unless the contract defines a shared authority or an explicit synchronization test.
- JZ workflow truth is distributed across several independently shipped skill Markdown files and references. The offline CLI package currently has no runtime dependency on `@jz/ai-arsenal-jz-skills`; directly reading linked skill files at runtime would violate the standalone packed-package requirement.
- The current `FeatureProgress` JSON shape exposes identity, status, phase, focus, artifacts, milestones, issues, frontier, and warnings, but it does not expose an expected next artifact, recommended skill, prohibited next action, or related documentation topics.
- Successful `progress --json` output is structured, but CLI errors are plain stderr with exit code 1. Corrupt JSON, unsupported schema, recovery-required state, missing state, no current feature, and invalid selectors therefore do not currently produce structured JSON error envelopes.
- Without `--feature`, current resolution requires exactly one `in-progress` feature. A paused or todo feature can be explained only with an explicit selector. The current no-feature error recommends a mutating activation command, which is not itself an appropriate state-aware docs recommendation.
- Paused features are accepted by explicit selector and retain their phase/frontier; the progress router does not replace the frontier merely because status is paused. Documentation must distinguish lifecycle status from derived frontier without changing routing semantics.
- `migration-required`, `blocked`, `feature-review`, and `archived` are real terminal/stop frontiers. The installed resume skill explicitly reports no next skill for them; no installed workflow currently owns feature review.
- The current repository contains no dedicated PRD-authoring skill or PRD template. `write-prd` maps to `jz-feature-grilling`, whose expected layout names `PRD.md`, but its detailed loop primarily owns `GRILL_SESSION.md`, `GLOSSARY.md`, contracts, examples, and final `DECISIONS.md`.
- The proposed 13-topic list may be too broad for a proportional first version and overlaps across workflow stages, artifacts, commands, recovery, and examples.
- Bundled Markdown or a new TypeScript documentation module changes the explicit package allowlist and verified 10-file packed boundary; clean-consumer and portability coverage must be updated deliberately.
- Exact help output is compatibility-fixtured. Adding `docs` intentionally changes that public text contract and its fixtures even if existing command semantics and persisted schemas remain unchanged.
- Current progress tests cover representative frontiers but do not form a table-driven assertion over every frontier and every state-aware explanation. A docs-current layer will need comprehensive semantic cases without relying on large snapshots.

## Open questions

- Which artifact or skill is intended to be the durable authority for initial `PRD.md` creation? The inspected repository routes `write-prd` to `jz-feature-grilling` but does not provide a dedicated PRD template or explicit authoring procedure.
- Is a future feature-review workflow expected to be added before this documentation ships, or should the documentation faithfully report that `feature-review` currently has no owning installed skill?
