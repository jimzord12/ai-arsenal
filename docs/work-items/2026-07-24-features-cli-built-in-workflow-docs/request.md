Work item: 2026-07-24-features-cli-built-in-workflow-docs
Artifact: request
Revision: 1
Prerequisites: none
Status: ready

# Request

Create an implementation-ready Markdown plan for adding built-in JZ workflow documentation to `features-cli`. Verify the live repository, branch, worktree, package structure, current CLI behavior, tests, skills, templates, workflow implementation, and project instructions before planning. This request is planning-only and must not implement the functionality.

## Desired outcome

Plan a small, maintainable, offline documentation system that helps operators and agents understand the JZ Spec-to-Ship workflow, its execution sequence, the core generated artifacts and their ownership, the lifecycle of features, milestones, issues, and issue contracts, relevant CLI commands, and the selected feature's current workflow position and safe next action.

The plan should evaluate a concise `features-cli docs` overview, a stable topic index through `features-cli docs --index`, focused topic pages through `features-cli docs <topic-or-index>`, and a read-only state-aware explanation through `features-cli docs current [--feature <selector>]`. It should also define useful structured `--json` output, discoverability updates, architecture and anti-drift safeguards, a file-by-file change map, ordered implementation stages, a testing and verification matrix, packaging and portability considerations, compatibility and migration effects, risks and edge cases, acceptance criteria, and open decisions with recommendations.

## Constraints

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

## User-provided context

- The source brief is `C:\Users\jimzord12\Downloads\features-cli-docs-implementation-plan-prompt.md`.
- The proposed workflow sequence to verify is `PRD -> Grilling -> Decisions -> SPEC -> Milestones -> Issues -> Issue Contracts -> Implementation -> Verification/Completion`.
- Candidate topics to validate and refine are `workflow`, `artifacts`, `features`, `design`, `spec`, `milestones`, `issues`, `contracts`, `execution`, `verification`, `commands`, `recovery`, and `examples`; the exact list should not be preserved if live authority suggests a clearer, smaller structure.
- Detailed topics should cover, where applicable, purpose, timing, inputs, generated or consumed artifacts, ownership, relevant commands, owning JZ workflow or skill, transition conditions, common mistakes, prohibited manual mutations, and related or next topics.
- The planner must determine sensible `docs current` behavior when no selector is supplied, no feature is current, multiple features exist, a selector is invalid, a feature is paused, archived, blocked, or migration-required, persisted state is corrupt or unsupported, or the current frontier contains warnings.
- Open decision: confirm whether `features-cli docs current` is cleaner than a separate `features-cli explain` command; prefer `docs current` unless the live architecture provides a strong contrary reason.
- The live investigation must confirm whether `features-cli docs` and `features-cli --docs` are currently unsupported and identify reusable rendering, serialization, fixture, snapshot, and integration-test patterns.
