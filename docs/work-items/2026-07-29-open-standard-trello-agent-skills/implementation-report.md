Work item: 2026-07-29-open-standard-trello-agent-skills
Artifact: implementation
Revision: 1
Prerequisites: contract@1,plan@1,approval@1
Status: ready

# Changed paths

- `.agents/skills/trello-work-orchestrator/SKILL.md`
- `.agents/skills/trello-work-design/SKILL.md`
- `.agents/skills/trello-work-deliver/SKILL.md`
- `.agents/skills/trello-work-recover/SKILL.md`
- `packages/trello-work-cli/assets/agent-skills-adapters.md`

# Implementation summary

- Added exactly four canonical project-level Agent Skills with portable standard frontmatter and distinct catalog triggers.
- Implemented read-only orchestration, bounded Inbox/Draft/In Design work through Ready, normal recovery-aware Ready-through-Done delivery, and exceptional-only recovery.
- Preserved explicit board selection, latest-read/version/operation identity/read-back discipline, non-atomic claim truthfulness, minimal recovery, concise evidence, bounded Done judgment, and human-only archival.
- Kept software design and implementation methodology under Superpowers or equivalent harness practice rather than embedding it in Trello lifecycle skills.
- Added adapter guidance for Claude Code, Codex, Pi, Hermes Agent, and generic Agent Skills clients, including canonical provenance, progressive disclosure, trust/collision behavior, allowed mechanical differences, and prohibited semantic forks.
- Added no scripts or resources because each activation-critical `SKILL.md` remains between 112 and 152 lines and needs no deeper progressive-disclosure layer.

# Validation performed during implementation

- Formatted all five Markdown deliverables with Prettier.
- Pinned official `agentskills/agentskills` to commit `38a2ff82958afee88dadf4831509e6f7e9d8ef4e` in an isolated `C:\Temp` workspace.
- Installed official demonstration `skills-ref@0.1.0` into a disposable Python 3.11 virtual environment outside the repository.
- `skills-ref validate` reported `Valid skill` for all four canonical directories.
- `skills-ref read-properties` returned each exact name and distinct description.
- Independent parsing confirmed required frontmatter, parent/name matching, description bounds, nonempty body, resolved repository-relative protocol references, and fewer than 500 lines per skill.
- Deterministic content checks found all thirteen lifecycle/recovery scenario terms and all five adapter client categories.
- `git diff --check` passed.

# Implementation-environment notes

- Two initial disposable validator environment attempts failed before package installation because Windows-native Python/uv could not use an MSYS `/tmp` path and then inherited an overlong stale temporary path. The successful run used `C:\Temp`, explicitly set `TMP`, `TEMP`, and `TMPDIR`, and did not alter repository dependencies or tracked files.
- No CLI command examples requiring a live board were added. The skills refer to the installed offline guide for exact command syntax and state only stable safety patterns/transition names from the accepted protocol.

# Deviations

- None from the approved contract or plan.
- No generated harness adapters, package-boundary change, offline docs integration, release, installation, live Trello mutation, production board access, credential use, archival automation, Git Bash remediation, commit, or push occurred.

# Fresh-agent review

- Initial independent review found no Critical or High issue, one Medium issue, and one Low observation.
- The Medium issue correctly identified that Draft creation ends in Inbox and the design skill needed an explicit same-card `design start` step. The skill was corrected to read back Inbox, read the created card, apply a new intent-specific design-start operation, preserve identity, and read back In Design.
- The Low observation concerned a deprecated alias remaining in pre-existing offline-guide human-workflow prose; the new skills do not prescribe that alias and use the version-matched guide as command authority.
- A separate fresh re-review of the corrected files reported: **No Critical, High, or Medium findings remain.** It confirmed the draft route, lifecycle authority, recovery authorization, non-atomic claiming, Done/archival boundary, trigger separation, portability, and adapter semantics.

# Verification readiness

- Implementation is ready for independent verification evidence and reconciliation.
