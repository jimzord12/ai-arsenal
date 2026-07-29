Work item: 2026-07-29-open-standard-trello-agent-skills
Artifact: context
Revision: 1
Prerequisites: request@1
Status: ready

# Applicable instructions

- `AGENTS.md`
- `NEXT.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- `.agents/skills/orient-monorepo-change/SKILL.md`
- `packages/trello-work-cli/assets/agent-workflow-protocol.md`
- `packages/trello-work-cli/README.md`
- `packages/trello-work-cli/assets/work-guide.md`
- Official Agent Skills specification and client-implementation guidance at `https://agentskills.io`
- Direct user request and approval to proceed with orientation and planning

## Repository snapshot

- Repository root: `C:\Users\jimzord12\Documents\GitHub\ai-arsenal`.
- Branch: `master`; the prior protocol work remains completed, validated, and intentionally uncommitted.
- Existing dirty paths are `NEXT.md`, `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`, `docs/work-items/2026-07-29-trello-agent-workflow-protocol/`, and `packages/trello-work-cli/assets/agent-workflow-protocol.md`; they are prerequisite context and must not be attributed to skill implementation.
- The new work item validates and routes to `orient-monorepo-change`.
- Existing repository workflow skills already use the interoperable `.agents/skills/<name>/SKILL.md` project-level convention.
- The Trello CLI remains `0.3.0`; this work item does not change its package manifest, packed boundary, command catalog, release, or installation.
- Official Agent Skills source inspected at `agentskills/agentskills` main commit `38a2ff82958afee88dadf4831509e6f7e9d8ef4e`.

## Relevant files

- `packages/trello-work-cli/assets/agent-workflow-protocol.md`: normative lifecycle, authority, skill responsibility, and verification contract.
- `packages/trello-work-cli/assets/work-guide.md`: exact CLI lifecycle, mutation, safety, and recovery behavior.
- `packages/trello-work-cli/README.md`: package responsibility and supported command boundary.
- `.agents/skills/*/SKILL.md`: existing project-level Agent Skills convention and repository workflow examples.
- `packages/trello-work-cli/src/command-catalog.ts`: versioned command and option vocabulary for example accuracy.
- `packages/trello-work-cli/src/*.test.ts` and `test/*.test.ts`: existing offline/disposable behavior seams; no new live mutation is needed.
- `scripts/validate-monorepo-work-item.mjs`: active repository pipeline validator.
- Official Agent Skills specification: skill directory with required `SKILL.md`; optional `scripts/`, `references/`, and `assets/`; YAML frontmatter followed by Markdown.
- Official required frontmatter constraints: `name` and `description`; name is 1–64 lowercase alphanumeric/hyphen characters, has no leading/trailing/consecutive hyphen, and matches the parent directory; description is nonempty, at most 1024 characters, and describes what/when.
- Official optional frontmatter includes `license`, `compatibility`, `metadata`, and experimental `allowed-tools`.
- Official progressive disclosure guidance: catalog loads name/description, activation loads `SKILL.md`, and referenced resources load only when needed; keep `SKILL.md` under roughly 500 lines/5,000 tokens where practical and references one level deep.
- Official client guidance identifies project-level `.agents/skills/` as the cross-client interoperability convention while allowing client-specific adapters and deterministic collision rules.
- Official `skills-ref` reference implementation exposes `skills-ref validate <skill-directory>` for specification validation.

## Risks

- Adding harness-specific frontmatter, tool names, hooks, or bootstrap assumptions to canonical skills would violate portability.
- Four independent skills may duplicate shared lifecycle/safety rules and drift. A one-level shared reference can preserve one source of truth while each `SKILL.md` retains the minimum activation-critical instructions.
- The official specification defines skill contents but does not mandate installation paths. `.agents/skills/` is interoperable convention, not a guarantee that every harness discovers it automatically.
- The repository's existing `.agents/skills` are monorepo-maintenance skills. New Trello consumer skills require sharply distinct triggers so agents do not use Trello Work Units to self-host monorepo pipeline work accidentally.
- Canonical source versus harness adapter precedence must be explicit to avoid divergent lifecycle authority.
- Skill descriptions are always-loaded catalog content; vague or overlapping descriptions could route tasks incorrectly.
- CLI examples can become stale if they duplicate the command catalog excessively. Skills should defer detailed command syntax to the version-matched offline guide while retaining safety-critical invocation patterns.
- The previous completed protocol and current new work item share one uncommitted worktree; changed-path accounting must separate their artifacts.
- Installing `skills-ref` as a repository dependency could broaden dependency state. Validation should use an isolated official reference environment or a repository-local dependency only if separately justified by the approved plan.

## Open questions

None. The user selected the Agent Skills open standard and canonical-source/downstream-adapter model. The official project-level `.agents/skills/` convention and existing repository structure provide a non-harness-specific canonical location; exact file decomposition and verification commands are planning outputs.
