Work item: 2026-07-29-open-standard-trello-agent-skills
Artifact: contract
Revision: 1
Prerequisites: request@1,context@1
Status: ready

# Problem statement

AI Arsenal now has an accepted Trello-backed development workflow protocol but no reusable Agent Skills implementation. Users who clone the repository need four portable, open-standard skills that coordinate Work Units through `jz-trello-flow` without coupling lifecycle authority to Claude Code, Codex, Pi, Hermes Agent, or one Superpowers installation. Harness-specific adaptations need a clear derivation boundary so they cannot silently fork workflow safety or ownership.

## Intended outcome

Add four canonical Agent Skills under the interoperable project-level `.agents/skills/` convention and one concise adapter guide under the Trello CLI package assets. Each skill must satisfy the official Agent Skills specification, implement only its protocol responsibility, preserve lightweight normal operation and safety-critical invariants, and route engineering methodology to Superpowers or equivalent harness practice. The adapter guide must explain how clients discover, copy, link, bundle, or wrap the canonical directories while preserving their normative core.

## In scope

- `.agents/skills/trello-work-orchestrator/SKILL.md`
- `.agents/skills/trello-work-design/SKILL.md`
- `.agents/skills/trello-work-deliver/SKILL.md`
- `.agents/skills/trello-work-recover/SKILL.md`
- `packages/trello-work-cli/assets/agent-skills-adapters.md`
- Open-standard frontmatter and progressive-disclosure structure.
- Trigger disambiguation, inputs, permitted mutations, outputs, completion criteria, and explicit non-responsibilities for each skill.
- Normative reference to `packages/trello-work-cli/assets/agent-workflow-protocol.md` and version-matched CLI documentation rather than duplicated command catalogs.
- Cross-client adaptation guidance for Claude Code, Codex, Pi, Hermes Agent, and other Agent Skills clients.
- Official `skills-ref` validation in an isolated temporary environment, repository formatting, content/authority matrix checks, command-example audit, and safety/exclusion checks.
- Fresh-agent review of all four skills and the adapter boundary before verification is accepted.

## Out of scope

- Harness-specific duplicate skill trees, plugins, hidden hooks, or generated adapters.
- Reimplementing Superpowers brainstorming, planning, TDD, debugging, code review, or verification practice.
- Changing `jz-trello-flow`, its package manifest, command catalog, packed files, offline docs, version, release, publication, or global installation.
- Mutating, initializing, or migrating any production Trello board.
- Automatic card archival or a fifth archival skill.
- Claiming atomic Trello locking or adding an allocation backend.
- Trello attachment upload.
- Git Bash remediation.
- Changing unrelated repository workflow skills.
- Deleting rollback sources, committing, pushing, or publishing without separate authority.

## Constraints

- The official Agent Skills specification at `agentskills.io` is authoritative for skill directory and `SKILL.md` format.
- `packages/trello-work-cli/assets/agent-workflow-protocol.md` is authoritative for lifecycle, evidence, mutation, completion, recovery, archival, and responsibility semantics.
- Skill names must exactly match parent directories and the accepted four-skill set.
- Canonical frontmatter must remain portable: required `name` and `description`; optional standard fields only when useful. Do not require Hermes-only metadata, Claude-only tool allowlists, or hidden harness capabilities.
- Descriptions must distinctly identify trigger classes so catalog-only routing can select one skill without loading all four.
- Each `SKILL.md` must remain below official recommended size bounds where practical and keep activation-critical rules in the main file.
- Every write-capable operation must require explicit board selection, latest read, latest version, durable operation identity, minimum mutation, and read-back verification where the CLI supports them.
- Normal successful paths remain lightweight; recovery ceremony activates only after uncertain, stale, replayed, partial, or conflicting outcomes.
- `trello-work-orchestrator` is read-only.
- `trello-work-design` does not own engineering design methodology.
- `trello-work-deliver` does not claim atomic locking or own engineering implementation methodology.
- `trello-work-recover` cannot blindly retry, change intent under an operation ID, broaden scope, or archive.
- Done terminates agent lifecycle mutation; humans manually archive cards.
- Existing completed protocol changes and work-item evidence must remain intact and separately attributable.

## Acceptance criteria

1. Exactly four new canonical skill directories exist under `.agents/skills/`, each containing a specification-valid `SKILL.md` whose `name` matches its directory.
2. Official `skills-ref validate` reports no problems for all four skill directories from an isolated environment pinned to the inspected upstream source revision or an equivalent recorded immutable revision.
3. Catalog descriptions distinguish read-only orchestration, design/intake, delivery, and exceptional recovery triggers without harness-specific vocabulary.
4. Every skill states its inputs, output/completion condition, permitted mutations, non-responsibilities, and route to the other skills.
5. The four skills preserve the protocol's authority order, explicit-board discipline, latest-read/version/operation-ID/read-back rules, concise evidence model, minimal recovery rule, bounded completion judgment, and human-only archival.
6. The orchestrator performs no mutation; design mutations stop at Ready; delivery owns normal claim/progress/block/review/done transitions; recovery owns only exceptional replay/reconciliation/repair/blocking behavior.
7. Skills route software-design and code-implementation methodology to installed Superpowers capabilities or equivalent harness practice without prescribing hidden Superpowers artifacts, hooks, or tool names.
8. Command examples, if present, match `jz-trello-flow@0.3.0` help/catalog behavior and never imply attachment upload or atomic allocation.
9. `packages/trello-work-cli/assets/agent-skills-adapters.md` explains canonical-source authority, `.agents/skills/` discovery, deterministic downstream adaptation, allowed adapter differences, prohibited semantic changes, trust/collision considerations, and guidance for Claude Code, Codex, Pi, and Hermes Agent.
10. A content matrix exercises ordinary Inbox intake, draft intake, clarification, Ready claim, In Progress update, Blocked/resume, Review/Done, Review return, ambiguous mutation, stale/conflicting mutation, recovery, and human archival routing across the correct skill boundaries.
11. Fresh-agent review finds no Critical, High, or Medium issue in lifecycle authority, mutation safety, recovery, completion, archival, portability, or trigger overlap; applicable findings are fixed and rechecked.
12. Repository formatting, work-item validation, living-workflow validation where applicable, and `git diff --check` pass without production Trello mutation or secret-bearing output.

## Verification expectations

- Validate each directory with the official `skills-ref` reference implementation in an isolated temporary clone/environment recorded by immutable upstream commit.
- Parse all frontmatter independently and assert standard constraints, exact names, required descriptions, parent-directory match, and bounded file size/line count.
- Build an acceptance matrix from the protocol's four skill definitions and lifecycle transitions; assert every scenario routes to one owning skill and every prohibited responsibility is stated.
- Audit every literal `jz-trello-flow` command/example against installed `0.3.0` help or authoritative command catalog.
- Review adapter guidance against official project/user scope and progressive-disclosure guidance.
- Use fresh-agent review and a fix/re-review loop until only minor or no findings remain.
- Run Prettier on changed Markdown, the monorepo work-item validator, `validate-living-workflow.mjs` if planning records change, and `git diff --check`.
- Do not use a production board. This change should need no Trello credentials or network mutation.

## Approval requirements

- Explicit approval of the exact implementation plan digest is required before creating any of the four skills or adapter guide.
- Any package-boundary change, generated harness adapter, live Trello mutation, release, installation, commit, push, source deletion, or semantic deviation from the accepted protocol requires separate approval.
