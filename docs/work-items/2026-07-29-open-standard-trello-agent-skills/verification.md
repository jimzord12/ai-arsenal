Work item: 2026-07-29-open-standard-trello-agent-skills
Artifact: verification
Revision: 1
Prerequisites: contract@1,plan@1,implementation@1
Status: passed

# Commands and results

1. Official standard reference:
   - Cloned `agentskills/agentskills` outside the repository.
   - Checked out immutable commit `38a2ff82958afee88dadf4831509e6f7e9d8ef4e`.
   - Created disposable Python 3.11 environment at `C:\Temp\asref\.venv`.
   - Installed `skills-ref@0.1.0` from `C:\Temp\asrepo2\skills-ref` with no repository manifest or lockfile change.
2. `skills-ref validate .agents/skills/<name>`:
   - `Valid skill: .agents\skills\trello-work-orchestrator`
   - `Valid skill: .agents\skills\trello-work-design`
   - `Valid skill: .agents\skills\trello-work-deliver`
   - `Valid skill: .agents\skills\trello-work-recover`
3. `skills-ref read-properties .agents/skills/<name>`:
   - Returned each exact canonical name and distinct trigger description; all commands exited `0`.
4. Independent frontmatter/reference/size parser:
   - Exact parent/name match: passed for all four.
   - Description length 1–1024: passed.
   - Nonempty Markdown body: passed.
   - Under 500 lines: passed at 112, 121, 152, and 132 lines.
   - Repository-relative protocol reference exists: passed for all four.
5. Lifecycle/authority matrix:
   - Read-only orchestration: passed.
   - Ordinary Inbox and Draft intake through same-card In Design: passed.
   - In Design readiness and design stop at Ready: passed.
   - Multi-step owner plus In Progress claim with no atomic-lock claim: passed.
   - Progress, Blocked/release/resume, Review submission/return, and Done: passed.
   - Already-satisfied, unchanged same-ID single retry, stale/conflicting state, and reconciliation: passed.
   - Human-only final archival: passed.
6. Adapter matrix:
   - Claude Code, Codex, Pi, Hermes Agent, and generic Agent Skills clients: present.
   - Canonical provenance, progressive disclosure, trust, collision, allowed mechanical differences, prohibited semantic changes, and distribution boundary: passed.
   - Relative authority-link rewriting is allowed only to the same immutable bundled/installed sources when an adapter changes layout.
7. Command/safety audit:
   - New skills contain no live board command sequence or production board identifier.
   - Stable CLI concepts match installed `jz-trello-flow@0.3.0` and `assets/work-guide.md`.
   - No attachment-upload, atomic-lock, automatic-archive, hidden-hook correctness, or false native-Hermes-Superpowers behavior is prescribed.
8. `pnpm exec prettier --check` on all four skills, adapter guide, and work-item artifacts: passed.
9. `node scripts/validate-monorepo-work-item.mjs --current --json`: valid and routed to verification before this artifact.
10. `git diff --check`: passed.

# Fresh-agent review

- Initial fresh review: no Critical or High findings; one Medium draft lifecycle finding and one Low observation.
- Medium finding: the first draft workflow wording did not explicitly require `draft create` Inbox read-back followed by same-card `design start` to In Design.
- Fix: `.agents/skills/trello-work-design/SKILL.md` now requires Inbox read-back, a new intent-specific design-start operation using latest version, unchanged identity, and In Design read-back.
- The Low observation concerned a deprecated alias in pre-existing offline-guide human-workflow prose; no new skill prescribes it.
- Fresh re-review of current files: **No Critical, High, or Medium findings remain.** The reviewer explicitly confirmed corrected draft routing, lifecycle authority, recovery authorization, non-atomic claim handling, Done/archival boundaries, trigger separation, portability, and adapter semantics.

# Acceptance criteria

1. Exactly four canonical `.agents/skills/trello-work-*` directories: passed.
2. Official pinned `skills-ref` validation: passed.
3. Distinct portable catalog descriptions: passed.
4. Inputs, outputs/completion, permitted mutations, non-responsibilities, and routes: passed.
5. Protocol authority and safety invariants: passed.
6. Responsibility partition among orchestrator/design/deliver/recover: passed.
7. Superpowers/equivalent methodology boundary: passed.
8. Installed CLI command accuracy and no false capabilities: passed.
9. Adapter guide and all named clients: passed.
10. Full lifecycle/recovery content matrix: passed.
11. Fresh-agent review with no unresolved Critical/High/Medium issue: passed.
12. Formatting, work-item validation, whitespace, and zero production mutation: passed.

# Notes

- Two failed disposable validator setup attempts were path/environment issues only: MSYS `/tmp` was not usable by Windows-native Python, and a long stale temp path blocked uv build isolation. Setting `TMP`, `TEMP`, and `TMPDIR` to `C:\Temp` produced the successful isolated run.
- No credentials were loaded or printed. No Trello request or mutation occurred.
- No generated adapter, package manifest/packed-boundary change, release, installation, Git Bash remediation, archival automation, commit, or push occurred.

# Result

Passed. The four canonical open-standard Agent Skills and adapter guidance satisfy the approved contract and are ready for reconciliation.
