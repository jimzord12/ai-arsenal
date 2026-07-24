Work item: 2026-07-24-features-cli-built-in-workflow-docs
Artifact: contract
Revision: 1
Prerequisites: request@1,context@1
Status: ready

# Goal

Produce one implementation-ready Markdown plan, grounded in the live AI Arsenal repository, for a small built-in, offline, read-only JZ workflow documentation capability in `features-cli`, including a state-aware explanation of the selected feature's current position and safe next action.

## Non-goals

- Implementing `features-cli docs`, `docs current`, `explain`, a command registry, renderers, documentation content, or tests.
- Changing existing CLI commands, output, exit codes, persisted schemas, workflow semantics, feature state, issue state, or milestone state.
- Editing package source, tests, fixtures, manifests, product documentation, JZ skills, templates, the canonical plan, or unrelated files.
- Creating a network-hosted documentation site, browser integration, or a general documentation framework.
- Adding dependencies, packing artifacts, publishing, releasing, globally installing, deleting the rollback source CLI, or mutating consumer `.scratch` data.
- Resolving absent PRD-authoring or feature-review ownership by inventing a new workflow or skill.
- Committing or pushing this planning work.

## Hard walls

- Verify all proposed terminology, commands, behavior, artifact ownership, and workflow sequencing against live repository authority rather than assuming the prompt is current.
- Documentation must ship with the CLI, work offline, and require no browser, external documentation site, or network access.
- All documentation commands must be read-only and must not initialize, activate, pause, focus, repair, migrate, or otherwise mutate feature state.
- Keep the default `docs` output short and place detailed guidance in topic pages.
- Stable canonical topic names must be the durable interface; numeric indexes may only be convenience aliases.
- Reuse the same domain model and routing logic as `features-cli progress` for state-aware explanations rather than creating an independent workflow-state interpretation.
- Derive command signatures from the CLI command registry where practical and avoid duplicate manually maintained signatures.
- Human-readable and JSON modes should derive from shared documentation and domain data where practical; JSON must use stable structured shapes rather than terminal prose as its only value.
- Establish one clear source of truth for topic metadata, aliases, ordering, cross-links, and rendered content, while identifying which material is generated and which requires curated prose.
- Preserve current CLI conventions, Bun runtime requirements, package boundaries, packed-artifact behavior, and Windows/Linux portability.
- Keep the design proportional to bounded CLI guidance rather than creating a general documentation framework.
- Plan semantic tests for parser/help integration, overview/index/topic rendering, aliases and lookup failures, JSON schemas, representative `docs current` states, selectors, warnings and invalid state, read-only behavior, portability, packed-package invocation, and existing-command regressions; avoid relying on a large snapshot-only suite.
- Plan discoverability updates for CLI help, the package README, and applicable monorepo-owned CLI usage documentation.
- Do not implement code, modify unrelated files, change workflow semantics or persisted feature state, invent unverified commands or ownership, manually edit generated state, commit, push, publish, or release.
- If the proposed interface conflicts with the current architecture, explain the conflict and recommend the smallest compatible alternative.
- Respect `packages/features-cli/AGENTS.md`: do not use `features-cli` to manage, plan, or track work on its own package.
- Preserve the root pnpm/Turborepo direction, Bun CLI runtime, private `@jz/ai-arsenal-features-cli` package boundary, isolated temporary test workspaces, user data, and source rollback copy.

## Acceptance criteria

- The plan begins with a verified current-state summary naming the live branch/commit, package/runtime/toolchain facts, existing command/parser/help architecture, progress model, test baseline, and packed-package boundary.
- The plan identifies authoritative sources and verified terminology for the Spec-to-Ship sequence, feature workspace, design artifacts, SPEC, milestones, issues, issue contracts, implementation, review/completion evidence, recovery, statuses, phases, focus, blockers, selectors, and every current frontier.
- The plan explicitly records that no command registry currently exists, `docs` and `--docs` are unsupported, next-skill mapping currently lives in `jz-resume-feature`, PRD authoring lacks a dedicated in-repository owner/template, and feature review has no installed owning skill.
- The plan recommends a bounded command/API design for the overview, index, canonical topic lookup, optional numeric aliases, state-aware current explanation, human output, structured JSON success shapes, and structured or deliberately compatible error behavior.
- The plan decides, with evidence and rationale, whether `docs current` or a separate `explain` command is the smallest architecture-compatible interface.
- The plan proposes a smaller or otherwise justified topic information architecture rather than copying the candidate 13-topic list automatically.
- The plan includes concise human-readable examples and explicit JSON schemas for the index, topic, and current-feature surfaces.
- The plan defines one maintainable source-of-truth strategy for topic metadata/content and a concrete anti-drift strategy tying command help, `progress-state`, and JZ skill ownership together without runtime network access or a dependency on consumer files.
- The plan provides a file-by-file change map and ordered implementation stages with dependencies, identifying generated versus curated content and any minimal refactor needed because the current CLI has direct dispatch and a hand-written help string.
- The plan includes a semantic testing and verification matrix covering parser/help behavior, every docs mode, canonical and numeric lookup, unknown/ambiguous topics, JSON schemas, selector/current-feature cases, representative and stop frontiers, warnings, corrupt/unsupported/recovery-required state, read-only proof, portability, packing, clean-consumer invocation, and existing-command regression.
- The plan accounts for the explicit package `files` allowlist, the current 10-file packed baseline, Bun source distribution, Windows/Linux portability, exact-help fixtures, and clean-consumer validation.
- The plan identifies required package README/help and applicable monorepo/JZ documentation updates without copying the full manual into `--help`.
- The plan contains compatibility/migration assessment, risks, edge cases, safeguards, explicit feature-level acceptance criteria, and open operator decisions with recommendations.
- The plan does not claim ownership or behavior unsupported by live evidence and clearly marks current no-owner workflow frontiers.
- The worktree contains no product implementation or unrelated mutation from this planning request.

## Test seams

- Request-to-plan traceability: every requested deliverable and hard wall is represented in the plan and can be checked by section and acceptance-criteria mapping.
- CLI surface seam: command parsing, exact help, unknown commands/flags, exit codes, and stdout/stderr conventions visible through `runIssuesManagerCli` and the Bun executable.
- Documentation model seam: canonical topic names, numeric aliases, ordering, cross-links, curated content, command references, and structured representations.
- Progress seam: `FeatureProgress` and `FrontierKind` remain the single source for state facts while explanation adds no second workflow-state derivation.
- Routing seam: every frontier maps to the current owning JZ skill or an explicit no-owner stop, with synchronization against `jz-resume-feature`.
- Selection/error seam: explicit selectors, implicit current selection, no current feature, invalid selector, corrupt/unsupported state, and recovery-required state.
- Read-only seam: before/after filesystem state for every docs invocation, including error paths and warning-bearing frontiers.
- Distribution seam: package allowlist, packed contents, Bun invocation, paths with spaces/Unicode, and clean unrelated consumer installation.
- Compatibility seam: existing help fixture, existing commands, progress JSON, persisted schema, and all 144 current package tests.

## Verification

- Workflow structure: `node scripts/validate-monorepo-work-item.mjs --work-item 2026-07-24-features-cli-built-in-workflow-docs --json` must report valid current artifacts and the expected next stage.
- Planning-only boundary: inspect `git status --short` and `git diff -- NEXT.md docs/work-items/2026-07-24-features-cli-built-in-workflow-docs` to prove this request changed only its permitted workflow artifacts.
- Baseline package evidence: `pnpm --filter @jz/ai-arsenal-features-cli test` must pass all seven suites and 144 current tests; real-process cases require an environment permitted to spawn Bun and pnpm subprocesses.
- Planned focused verification: the implementation plan must require package tests, typecheck, lint, format, strict publint validation, packing, packed-content inspection, and clean-consumer installed-command checks using the existing package scripts.
- Planned repository regression: the implementation plan must require the applicable root `pnpm check` and workflow validators after any future product implementation.
- Content authority: cross-check every recommended topic, transition, artifact owner, command signature, status, phase, issue lifecycle, and no-owner frontier against the cited live source or skill file.
- Acceptance traceability: the plan must contain a matrix or explicit mapping showing how its stages and verification cover every acceptance criterion above.

## Approval required

Yes. Producing this planning artifact is authorized by the user's 2026-07-24 direction to proceed, but any later implementation would intentionally add public CLI behavior, change the exact help contract, and change the verified packed-package boundary. The completed implementation plan therefore requires a fresh explicit, digest-bound approval record before product implementation, and this planning-only request does not authorize implementation, packing, publication, release, global installation, or source deletion.
