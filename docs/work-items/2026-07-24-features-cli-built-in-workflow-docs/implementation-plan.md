Work item: 2026-07-24-features-cli-built-in-workflow-docs
Artifact: plan
Revision: 1
Prerequisites: contract@1
Status: ready

# Preconditions

- The active contract is `contract@1`, status `ready`, with the planning-only boundary and all hard walls intact.
- Applicable instructions are `AGENTS.md` and `packages/features-cli/AGENTS.md`. Implementation must use the monorepo work-item pipeline and must not use `features-cli` to manage, plan, or track its own package work.
- Implementation may begin only after the user explicitly approves this exact plan and `record-monorepo-approval` writes a SHA-256-bound `approval.md`.
- Approval will authorize the additive public `docs` command and intentional help/package-boundary changes described here. It will not authorize a release, Changeset, global packing or installation, publication, source deletion, consumer-state mutation, or persisted-schema change.
- The implementation environment must provide Node 24, pnpm 11.7.0, Turborepo 2.10.4, and Bun 1.3.14. Real-process tests require permission to spawn Bun and pnpm subprocesses.
- All tests must use isolated temporary workspaces. No real consumer `.scratch` directory or user data may be inspected or mutated.

### Verified current-state summary

- Repository: `master` at `7ac39b4`, aligned with `origin/master` at orientation start.
- Package: private `@jz/ai-arsenal-features-cli@0.2.0`, source-distributed, executable-only, Bun-based, with no import API or runtime dependency on `@jz/ai-arsenal-jz-skills`.
- Parser/help: `src/cli.ts` uses direct command dispatch and one hand-written `FEATURES_CLI_HELP` string. There is no command registry.
- Current behavior: `docs` and `--docs` are absent from help/dispatch and follow the unknown-command path. `--docs` will remain unsupported.
- State authority: `src/progress-state.ts` owns `FrontierKind`, `FeatureProgress`, artifact readiness, milestone/issue summaries, warnings, and frontier derivation.
- Selection authority: `resolveFeatureForIssueRead` accepts exact slugs, numeric IDs, padded IDs, and exact `ID-slug` names; without a selector it requires exactly one `in-progress` feature.
- Guidance today: `packages/jz-skills/jz-resume-feature/SKILL.md` separately maps every frontier to a next skill or no-owner state.
- Tests: the package suite passes 7 suites and 144 tests, including real-process and clean-consumer coverage.
- Packaging: package metadata, `README.md`, and eight production TypeScript modules form the exact 10-file packed boundary.

### Sources of authority and verified terminology

- `progress-state.ts` owns the frontier sequence: `write-prd`, `grill-and-consolidate-decisions`, `design-ready`, `write-spec`, `plan-milestones`, `decompose-milestone`, `contract-issue`, `implement-issue`, `review-issue`, `blocked`, `feature-review`, `migration-required`, and `archived`.
- `features-state.ts` owns statuses (`todo`, `in-progress`, `paused`, `archived`), phases (`design`, `implementation`), focus, schema version 2, current selection, and recovery guards.
- `issues-state.ts` plus `jz-milestone-to-issues/references/issue-file-format.md` own issue metadata, statuses, blockers, selection, contract detection, synchronization, and accepted issue paths.
- `milestone-state.ts`, `jz-spec-to-milestones`, and its format reference own the fenced milestone plan, dependency DAG, and decomposition timestamps in `SPEC.md`.
- `jz-feature-grilling` owns the design ledger, glossary, optional design contracts/examples, and `DECISIONS.md`. It routes `write-prd` but has no dedicated PRD template/procedure; docs must state that limitation.
- `jz-write-spec` owns `SPEC.md` and the design-to-implementation transition.
- `jz-milestone-to-issues` owns one-milestone issue decomposition; `jz-issue-to-contract` owns one issue's `change-contract.md`; `jz-implement-contract` owns implementation, RED/GREEN/direct execution, review/reopen, reports, and the done gate.
- No installed skill owns `feature-review`; docs must report that rather than inventing a workflow.
- Verified sequence: `PRD -> grilling/decisions -> SPEC -> milestone plan -> milestone issue decomposition -> per-issue contract -> per-issue implementation/review/completion -> feature review (no current owner)`.

### Recommended command/API design

- `features-cli docs`: concise human overview.
- `features-cli docs --index [--json]`: canonical topic index.
- `features-cli docs <topic-or-index> [--json]`: exact topic lookup.
- `features-cli docs current [--feature <selector>] [--json]`: read-only state explanation.
- Reserve `current` as an action. Keep `features-cli --docs` unsupported.
- Use exact names/aliases only; no fuzzy/prefix lookup. Illegal combinations, duplicates, partial names, and `--feature` outside `current` are usage errors.
- Prefer `docs current` over a separate `explain`: it avoids another top-level command and groups static/state-aware guidance.
- Keep `progress --json` unchanged. `docs current --json` wraps the unchanged `FeatureProgress` with guidance.
- Add a minimal typed command catalog for help/docs, while retaining direct dispatch in `cli.ts`.
- Keep existing command errors unchanged. Only docs `--json` errors use a structured docs envelope on stderr with exit code 1.

### Proposed topic information architecture

Use nine canonical topics; embed examples in relevant topics rather than creating a standalone maintenance surface.

1. `workflow` — sequence, routing, ownership, and no-owner stops.
2. `artifacts` — workspace layout and ownership of feature instructions, glossary, design files, SPEC, milestones, issues, contracts, reports, and reviews.
3. `features` — identity, selectors, status, phase, focus, current selection, pause/archive, and lifecycle safety.
4. `design` — PRD limitation, grilling, glossary, decisions, design contracts/examples, and SPEC handoff.
5. `planning` — SPEC, milestone plan, dependencies/decomposition, and transition to issues.
6. `issues` — issue format, statuses, blockers, selection, issue contracts, and derived-state safety.
7. `execution` — implementation methods, phase caveat, review/reopen, reports, done gate, and feature-review gap.
8. `commands` — catalog-derived signatures, selectors, modes, and safe read/mutation categories.
9. `recovery` — corrupt/unsupported state, recovery journal, migration, blocked work, and prohibited shortcuts.

Each topic record contains canonical name, numeric alias, order, description, purpose, timing, inputs, artifact ownership/authority, command keys, owners, transition condition, mistakes, prohibited mutations, and cross-links. Command signatures resolve from the shared catalog rather than copied strings. Authority paths are maintainer provenance, never runtime reads.

### Human-readable output examples

Default:

```text
JZ Spec-to-Ship

PRD -> grilling and decisions -> SPEC -> milestones -> issues ->
issue contracts -> implementation and review -> feature review

The CLI stores durable lifecycle facts and derives the safe workflow frontier.
Documentation is offline and read-only.

Browse:  features-cli docs --index
Learn:   features-cli docs workflow
Current: features-cli docs current --feature <selector>
```

Index:

```text
JZ workflow documentation

#  Topic       Description                                      Command
1  workflow    Sequence, routing, and transition ownership      features-cli docs workflow
2  artifacts   Generated artifacts and what each one owns       features-cli docs artifacts
3  features    Feature selectors, status, phase, and focus      features-cli docs features
4  design      PRD, grilling, decisions, and SPEC handoff       features-cli docs design
5  planning    SPEC milestones and decomposition                features-cli docs planning
6  issues      Issues, blockers, contracts, and selection       features-cli docs issues
7  execution   Implementation, review, reopen, and completion   features-cli docs execution
8  commands    CLI signatures and safe usage                    features-cli docs commands
9  recovery    Stops, corrupt state, migration, and recovery    features-cli docs recovery
```

Focused topic:

```text
Topic: workflow
Purpose: Understand the supported sequence and who owns each transition.
Current router: features-cli progress --feature <selector> --json
Current explanation: features-cli docs current --feature <selector>
Important:
  - Feature review currently has no installed owning skill.
  - Never infer state by manually editing generated JSON.
Related: artifacts, features, execution
```

State-aware result:

```text
Feature: 003-remote-logging-mvp-v2
Status: paused
Phase: implementation
Position: contract-issue (#07)
Meaning: Issue 07 is actionable but has no sibling change-contract.md.
Next artifact: issues/07-.../change-contract.md
Recommended skill: jz-issue-to-contract
Safety: Let the owning skill perform activation preflight; do not mutate state manually.
Warnings: none
Learn more: issues, execution
```

No current feature:

```text
No current feature is selected.
No state was changed. Use "features-cli status", then rerun
"features-cli docs current --feature <selector>".
Recommended skill: none
```

### Proposed JSON schemas

All docs JSON uses `schemaVersion: "1"`. Success goes to stdout/exit 0. JSON errors go to stderr with stdout empty/exit 1.

Index:

```json
{
  "schemaVersion": "1",
  "kind": "docs-index",
  "topics": [
    {
      "index": 1,
      "name": "workflow",
      "description": "Sequence, routing, and transition ownership.",
      "aliases": ["1"],
      "command": "features-cli docs workflow"
    }
  ],
  "actions": [
    {
      "name": "current",
      "description": "Explain the selected feature's current position.",
      "command": "features-cli docs current [--feature <selector>] [--json]"
    }
  ]
}
```

Topic:

```json
{
  "schemaVersion": "1",
  "kind": "docs-topic",
  "topic": {
    "index": 6,
    "name": "issues",
    "description": "Issues, blockers, contracts, and selection.",
    "purpose": "...",
    "when": ["..."],
    "inputs": ["SPEC.md milestone plan"],
    "artifacts": [
      {
        "path": "issues/<NN>-<slug>/issue.md",
        "role": "Canonical issue metadata and acceptance slice.",
        "owner": "jz-milestone-to-issues",
        "authority": "packages/jz-skills/jz-milestone-to-issues/references/issue-file-format.md"
      }
    ],
    "commands": [
      {
        "name": "get-issue",
        "signature": "get-issue <--next|--next-contract|--resume> [--feature <selector>]"
      }
    ],
    "owners": ["jz-milestone-to-issues", "jz-issue-to-contract"],
    "completion": ["..."],
    "commonMistakes": ["..."],
    "prohibitedMutations": ["Do not hand-edit issues-status.json."],
    "relatedTopics": ["planning", "execution", "commands"]
  }
}
```

Current success:

```json
{
  "schemaVersion": "1",
  "kind": "docs-current",
  "selection": { "selector": "3", "mode": "explicit" },
  "progress": {
    "feature": {},
    "frontier": {},
    "artifacts": {},
    "milestones": null,
    "issues": null,
    "warnings": []
  },
  "guidance": {
    "state": "selected",
    "meaning": "...",
    "nextArtifact": "issues/07-.../change-contract.md",
    "recommendedSkill": "jz-issue-to-contract",
    "recommendedAction": "Scope the selected issue against the repository.",
    "doNotStart": ["Do not implement before the contract exists."],
    "relatedTopics": ["issues", "execution"]
  }
}
```

No-current success:

```json
{
  "schemaVersion": "1",
  "kind": "docs-current",
  "selection": {
    "selector": null,
    "mode": "implicit",
    "registeredFeatures": 3
  },
  "progress": null,
  "guidance": {
    "state": "no-current-feature",
    "meaning": "No feature is in-progress.",
    "nextArtifact": null,
    "recommendedSkill": null,
    "recommendedAction": "Choose a selector and rerun docs current.",
    "doNotStart": ["Do not activate or mutate a feature from docs."],
    "relatedTopics": ["features", "commands"]
  }
}
```

Error:

```json
{
  "schemaVersion": "1",
  "kind": "docs-error",
  "error": {
    "code": "FEATURE_STATE_ERROR",
    "message": "Invalid feature state: expected schema version 2."
  }
}
```

Use four stable codes: `DOCS_USAGE_ERROR`, `DOCS_TOPIC_NOT_FOUND`, `FEATURE_SELECTION_ERROR`, and `FEATURE_STATE_ERROR`. Preserve detailed existing messages; do not change non-docs errors.

### Architecture and source-of-truth strategy

- Create `packages/features-cli/src/workflow-docs.ts` as the single typed, code-native offline documentation model. This avoids runtime filesystem lookup, Markdown asset paths, bundling, and network dependencies.
- Store the overview, command catalog, nine-topic registry, JSON types, resolver, renderers, and exhaustive `Record<FrontierKind, FrontierGuidance>` there.
- Render `FEATURES_CLI_HELP`, the commands topic, and topic command references from the catalog; retain direct dispatch.
- Keep state derivation in `getFeatureProgress`. `docs current` resolves through existing functions, calls it once, embeds the unchanged object, and derives only explanation from existing fields.
- Make frontier guidance exhaustive at compile time.
- Change `jz-resume-feature` to consume `docs current --json` and remove its duplicate frontier/skill table. `progress-state.ts` remains state/router authority.
- Keep authority paths as non-runtime metadata; tests verify paths and named skill directories exist.
- Represent missing ownership explicitly: `write-prd` points to grilling with a limitation note; `feature-review` has no recommended skill.

### State-aware behavior

- No selector with one current feature: explain it.
- No selector with none current: exit 0 with `progress: null`; do not auto-select or mutate.
- Multiple registered with one current: explain current.
- Explicit selector: reuse exact slug/ID/full-name resolution, including paused/todo/archived.
- Invalid selector: exit 1; JSON uses `FEATURE_SELECTION_ERROR`.
- Multiple-current invalid state, unsupported/malformed/missing state, or recovery journal: exit 1; JSON uses `FEATURE_STATE_ERROR`.
- Paused/todo: retain the frontier and add activation-preflight safety.
- Archived: no skill/artifact and no reopen advice.
- Migration-required: no installed stage; point to the migration note and prohibit bypass.
- Blocked: no installed next skill; include blockers/warnings and prohibit non-actionable work.
- Feature-review: report issue completion and the missing workflow owner; do not invent archival.
- Preserve every warning code/message/path.

### Testing and verification matrix

- Parser/help: default, index, topic, current, flag order, duplicates, illegal combinations, `--docs` unknown, and exact help.
- Topic model: nine unique names/aliases, stable order, exact/numeric lookup, no fuzzy lookup, valid cross-links/command keys/authority paths.
- Human rendering: semantic assertions for required headings, sequence, owners, safety, links, and signatures; no large snapshots.
- JSON: version/kind and semantic fields for index, topic, current, no-current, and errors.
- Current state: table-driven coverage for every frontier's artifact, skill/null, prohibited action, and related topics.
- Selection: slug, plain/padded ID, full name, implicit/no current, invalid selector, paused/todo/archived, invalid multiple-current, multiple registered with one current.
- Error/warning: missing, malformed, unsupported, recovery-required, migration, blocked, and warnings.
- Read-only: hash disposable workspaces before/after all docs modes and representative errors.
- Portability: real Bun, spaces/Unicode, LF fixture, no width/color dependence, deterministic newlines.
- Distribution: pack, exact 11 files, clean install, installed overview/index/topic/current.
- Regression: all 144 baseline tests plus new cases; unchanged progress JSON/schema/commands.

### Compatibility and migration assessment

- `docs` is additive; existing commands, selectors, output/error contracts, schema version 2, and `progress --json` remain unchanged.
- `--help` intentionally gains one docs line; update the exact fixture.
- `--docs` remains unknown.
- The allowlist gains `src/workflow-docs.ts`; packed boundary changes from 10 to 11 files.
- No data migration, runtime dependency, browser/network dependency, build step, import surface, Changeset, release, or consumer action.
- `jz-resume-feature` changes from raw progress plus a local route table to `docs current --json`, whose `progress` member remains canonical.

### Risks and anti-drift safeguards

- Command drift: one typed catalog feeds help/docs; topic metadata uses command keys.
- Frontier drift: exhaustive `Record<FrontierKind, FrontierGuidance>`.
- Skill drift: resume delegates to docs current; tests confirm named skills/authorities exist.
- Prose drift: concise summaries cite authority paths and avoid copying detailed procedures.
- Error drift: four broad docs codes preserve existing detailed messages.
- Package drift: allowlist and E2E assert exactly 11 files and installed invocation.
- Scope growth: no Markdown loader, framework, fuzzy search, styling library, web/browser, dependency, dispatch rewrite, or feature-review workflow.
- Authority gaps: state PRD/feature-review limitations and leave fixes to separate requests.

### Explicit feature acceptance criteria

- `features-cli docs` returns a concise offline overview without reading state.
- Index/topic modes resolve deterministic canonical data in human/JSON forms.
- `docs current` explains unchanged `FeatureProgress` and never mutates state.
- Every frontier has exhaustive guidance or an explicit no-owner stop.
- Help/docs command signatures come from one catalog.
- JSON is versioned and docs JSON errors are structured.
- The packed package works in a clean Bun consumer with exactly 11 files.
- Existing behavior, schema, and progress JSON remain compatible.

### Open decisions requiring operator approval

- Command surface — recommend `docs current`, not `explain`; keep `--docs` unsupported.
- Topics — recommend the nine names above with aliases `1`–`9`.
- No-current — recommend exit 0 with `progress: null`; missing/corrupt state remains error.
- JSON errors — recommend docs-specific stderr envelopes without global error refactor.
- Catalog — recommend a minimal help/docs catalog, leaving dispatch intact.
- Content form — recommend one typed TypeScript module, not bundled Markdown.
- Authority gaps — recommend documenting current limitations, not adding workflows.
- Packed boundary — recommend approving 10 to 11 files; release/global install remains separately gated.

## Ordered tasks

### 1. Lock static docs parser, help, registry, and rendering contracts with failing tests

- Paths: `packages/features-cli/src/workflow-docs.test.ts`, `packages/features-cli/src/cli.test.ts`, `packages/features-cli/test/characterization.test.ts`, `packages/features-cli/test/fixtures/help.txt`
- Inputs: Static acceptance criteria; exact topics/aliases; catalog; JSON shapes; help compatibility; CLI seam.
- Output: Semantic tests and updated help fixture that fail because docs does not exist.
- Test command: `pnpm --filter @jz/ai-arsenal-features-cli exec jest src/workflow-docs.test.ts src/cli.test.ts test/characterization.test.ts --runInBand`
- Expected result: Nonzero only for missing docs exports/dispatch or old help; unrelated assertions pass.
- Rollback: Not applicable.

### 2. Implement the typed offline model, command catalog, static commands, and renderers

- Paths: `packages/features-cli/src/workflow-docs.ts`, `packages/features-cli/src/cli.ts`
- Inputs: Static criteria; topic/command/render seams; information architecture; examples; schemas; exact fixture.
- Output: One typed source for overview, catalog, topics, lookup, static JSON/human renderers, plus docs dispatch; help derives from catalog while direct dispatch stays intact.
- Test command: `pnpm --filter @jz/ai-arsenal-features-cli exec jest src/workflow-docs.test.ts src/cli.test.ts test/characterization.test.ts --runInBand`
- Expected result: Focused suites pass; exact/numeric lookup works; illegal/partial forms fail; `--docs` stays unsupported; help matches.
- Rollback: Not applicable.

### 3. Lock state-aware guidance and read-only error behavior with failing tests

- Paths: `packages/features-cli/src/workflow-docs.test.ts`, `packages/features-cli/src/cli.test.ts`
- Inputs: Every-frontier criteria; progress, selection/error, routing, and read-only seams; current/no-current/stop/recovery behavior; current/error schemas.
- Output: Table-driven tests for all frontiers, selectors, no-current, corrupt/unsupported/recovery, warnings, envelopes, and filesystem equality.
- Test command: `pnpm --filter @jz/ai-arsenal-features-cli exec jest src/workflow-docs.test.ts src/cli.test.ts --runInBand`
- Expected result: Nonzero only for missing current guidance/dispatch; static docs remain passing.
- Rollback: Not applicable.

### 4. Implement docs current by wrapping canonical progress and exhaustive guidance

- Paths: `packages/features-cli/src/workflow-docs.ts`, `packages/features-cli/src/cli.ts`
- Inputs: Current criteria; unchanged `FeatureProgress`; existing state/selector/progress functions; guidance map; human/JSON schemas.
- Output: Existing selection and `getFeatureProgress` feed unchanged progress plus typed guidance; no-current is read-only; docs JSON errors/warnings/safety cover all frontiers.
- Test command: `pnpm --filter @jz/ai-arsenal-features-cli exec jest src/workflow-docs.test.ts src/cli.test.ts --runInBand`
- Expected result: State-aware cases pass; frontier map is exhaustive; workspaces remain unchanged; progress assertions are unchanged.
- Rollback: Not applicable.

### 5. Add failing real-process, portability, and packed-consumer coverage

- Paths: `packages/features-cli/test/e2e.test.ts`
- Inputs: Distribution, portability, read-only, compatibility seams; examples; planned 11-file boundary.
- Output: Real Bun and clean-consumer cases for overview/index/topic/current, spaces/Unicode, read-only comparison, and exact contents.
- Test command: `pnpm --filter @jz/ai-arsenal-features-cli exec jest test/e2e.test.ts --runInBand`
- Expected result: Nonzero at the packed-consumer seam because the new module is not allowlisted; non-packed docs cases pass.
- Rollback: Not applicable.

### 6. Include the production docs module in the package boundary

- Paths: `packages/features-cli/package.json`
- Inputs: Offline shipping; explicit allowlist; 10-file baseline; planned 11-file seam.
- Output: `src/workflow-docs.ts` is in `files`; tests, fixtures, skills, and unrelated content remain excluded.
- Test command: `pnpm --filter @jz/ai-arsenal-features-cli exec jest test/e2e.test.ts --runInBand`
- Expected result: E2E passes; tarball has metadata, README, and nine production modules (11 total); installed docs run through Bun.
- Rollback: Not applicable.

### 7. Update discoverability and remove duplicate resume routing prose

- Paths: `packages/features-cli/README.md`, `packages/jz-skills/jz-resume-feature/SKILL.md`
- Inputs: Discoverability; examples; anti-drift strategy; duplicate resume mapping; authority gaps.
- Output: README shows docs/index/workflow/current; resume consumes `docs current --json`, preserves compact read-only reporting, and removes its independent route table.
- Test command: `pnpm exec prettier --check packages/features-cli/README.md packages/jz-skills/jz-resume-feature/SKILL.md`
- Expected result: Formatting passes; both expose the new interface; resume retains canonical embedded progress and no duplicate frontier map.
- Rollback: Not applicable.

### 8. Run package, distribution, repository, workflow, and diff verification

- Paths: Not applicable.
- Inputs: All criteria/seams; 144-test baseline; package/root scripts; release exclusions.
- Output: Implementation evidence for focused/full checks, exact pack, clean consumer, workflow validity, and approved diff.
- Test command: `pnpm --filter @jz/ai-arsenal-features-cli format && pnpm --filter @jz/ai-arsenal-features-cli lint && pnpm --filter @jz/ai-arsenal-features-cli typecheck && pnpm --filter @jz/ai-arsenal-features-cli test && pnpm --filter @jz/ai-arsenal-features-cli validate && pnpm check && pnpm validate:workflow && git diff --check`
- Expected result: All exit 0; baseline plus new tests pass; strict publint/root/workflow pass; no release/global/source-deletion/user-state action.
- Rollback: Not applicable.

## Affected paths

- Create: `packages/features-cli/src/workflow-docs.ts`
- Create: `packages/features-cli/src/workflow-docs.test.ts`
- Modify: `packages/features-cli/src/cli.ts`
- Modify: `packages/features-cli/src/cli.test.ts`
- Modify: `packages/features-cli/test/characterization.test.ts`
- Modify: `packages/features-cli/test/fixtures/help.txt`
- Modify: `packages/features-cli/test/e2e.test.ts`
- Modify: `packages/features-cli/package.json`
- Modify: `packages/features-cli/README.md`
- Modify: `packages/jz-skills/jz-resume-feature/SKILL.md`
- Delete: none.

## Verification commands

- `pnpm --filter @jz/ai-arsenal-features-cli exec jest src/workflow-docs.test.ts src/cli.test.ts test/characterization.test.ts --runInBand`
  - Expected: focused documentation, CLI, and compatibility tests pass.
- `pnpm --filter @jz/ai-arsenal-features-cli exec jest test/e2e.test.ts --runInBand`
  - Expected: real-process, Unicode/path, read-only, exact-pack, clean-consumer, and installed-command cases pass.
- `pnpm --filter @jz/ai-arsenal-features-cli format`
  - Expected: package formatting passes.
- `pnpm --filter @jz/ai-arsenal-features-cli lint`
  - Expected: ESLint exits 0.
- `pnpm --filter @jz/ai-arsenal-features-cli typecheck`
  - Expected: TypeScript exits 0, including exhaustive guidance.
- `pnpm --filter @jz/ai-arsenal-features-cli test`
  - Expected: all baseline and new suites pass without regression.
- `pnpm --filter @jz/ai-arsenal-features-cli pack --dry-run --json`
  - Expected: exactly 11 files including `src/workflow-docs.ts`, excluding tests/fixtures/skills/config/coverage.
- `pnpm --filter @jz/ai-arsenal-features-cli validate`
  - Expected: strict publint passes.
- `pnpm exec prettier --check packages/features-cli/README.md packages/jz-skills/jz-resume-feature/SKILL.md`
  - Expected: documentation formatting passes.
- `rg -n "features-cli docs|docs current|progress" packages/features-cli/README.md packages/jz-skills/jz-resume-feature/SKILL.md`
  - Expected: discoverability exists and resume acknowledges canonical progress.
- `pnpm check`
  - Expected: root format, lint, typecheck, tests, workflow tests, and validators pass.
- `pnpm validate:workflow`
  - Expected: living-workflow and active-work-item validation pass.
- `git diff --check`
  - Expected: no whitespace errors.
- `git status --short`
  - Expected: only approved implementation/work-item paths; no tarball, consumer state, release artifact, or unrelated file.

## Rollback

Not applicable. The plan changes source, tests, a fixture, manifest allowlist, and documentation only. It changes no persisted schema/user data and performs no release, publication, global installation, or source deletion. Any later reversal is a separately authorized source change, not a stateful rollback.
