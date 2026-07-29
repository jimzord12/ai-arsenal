Work item: 2026-07-29-jz-trello-flow-skills-install
Artifact: context
Revision: 1
Prerequisites: request@1
Status: ready

# Applicable instructions

- `AGENTS.md`
- `NEXT.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`, especially sections 4.1, 7.9, 8, the Trello workflow/skill maintenance updates, current risks/open decisions, and section 24
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- `.agents/skills/orchestrate-monorepo-work/SKILL.md`
- `.agents/skills/capture-monorepo-change/SKILL.md`
- `.agents/skills/orient-monorepo-change/SKILL.md`
- `.agents/skills/trello-work-orchestrator/SKILL.md`
- `.agents/skills/trello-work-design/SKILL.md`
- `.agents/skills/trello-work-deliver/SKILL.md`
- `.agents/skills/trello-work-recover/SKILL.md`
- No nearer `AGENTS.md` applies to `packages/trello-work-cli` or the current work-item directory.

## Repository snapshot

- Branch: `master`.
- Commit: `2aa8d3052e450b571f0c7de0b215124532889afa`.
- Initial `git status --short`: intentional pre-existing `M NEXT.md`; after capture, `NEXT.md` remains modified and `docs/work-items/2026-07-29-jz-trello-flow-skills-install/` is untracked.
- `node scripts/validate-monorepo-work-item.mjs --work-item none --json` passed before capture; the captured request validates and routes to orientation.
- Root gates are defined by `package.json`: `pnpm check` runs formatting, linting, typechecking, package tests, workflow tests, and both workflow validators. Package gates are `format`, `lint`, `typecheck`, `test`, and strict publint-backed `validate`.
- The package is private `@jz/ai-arsenal-trello-work-cli@0.3.0`, uses Bun `1.3.14`, exposes only `jz-trello-flow`, has no import export surface, and currently allowlists 26 packed files: package metadata, README, two packed assets, and production TypeScript modules. The canonical Trello skills and protocol/adapter assets are currently outside that packed boundary.
- Existing Jest configuration runs `src/**/*.test.ts` and `test/**/*.test.ts` with V8 coverage. The package README states that normal tests use temporary files and injected clients/local Bun processes without live Trello access; live Trello coverage is a separate explicit `test:live` script.
- Official prior skill verification cloned `agentskills/agentskills` outside the repository at immutable commit `38a2ff82958afee88dadf4831509e6f7e9d8ef4e`, installed `skills-ref@0.1.0` from that checkout in a disposable Python 3.11 environment, and ran `skills-ref validate` and `read-properties` successfully for all four canonical directories without repository dependency changes.

## Relevant files

- `packages/trello-work-cli/package.json`: executable, scripts, runtime, and explicit packed-file allowlist.
- `packages/trello-work-cli/src/bin.ts`: real Bun executable entrypoint.
- `packages/trello-work-cli/src/cli.ts`: strict option/positional parsing, offline-command routing before Trello configuration, stable errors, and process output.
- `packages/trello-work-cli/src/command-catalog.ts`: shared short-help and docs command catalog; all commands except docs, local validation, and board listing currently gain board/configuration options.
- `packages/trello-work-cli/src/docs.ts`, `packages/trello-work-cli/assets/work-guide.md`, and `packages/trello-work-cli/README.md`: version-matched help and offline documentation surfaces.
- `packages/trello-work-cli/src/cli.test.ts` and `packages/trello-work-cli/src/docs.test.ts`: current parser/routing/help/docs test seams.
- `packages/trello-work-cli/jest.config.cjs`, `packages/trello-work-cli/tsconfig.json`, `turbo.json`, and root `package.json`: focused and repository gate definitions.
- `.agents/skills/trello-work-{orchestrator,design,deliver,recover}/SKILL.md`: four repository-owned canonical sources; each directory currently contains one tracked `SKILL.md`.
- `packages/trello-work-cli/assets/agent-workflow-protocol.md`: normative lifecycle authority referenced relatively by every canonical skill.
- `packages/trello-work-cli/assets/agent-skills-adapters.md`: canonical-source and downstream-adaptation guidance; currently not packed.
- `docs/work-items/2026-07-29-open-standard-trello-agent-skills/{context,implementation-plan,implementation-report,verification}.md`: immutable official validator provenance and prior validation evidence.

## Risks

- Bundling four skill directories, their normative relative reference target, and installer source changes the explicit packed boundary; missing any payload file would make the packed consumer incomplete.
- The current strict command catalog automatically attaches Trello board/configuration options to most commands. A repository-local offline installer must remain isolated from Trello configuration and credential loading.
- Deterministic repository-root discovery requires an evidenced repository marker and clear behavior for nested invocation, missing roots, and paths with spaces or Unicode; the current CLI has no analogous upward-discovery command.
- Replacing four directories is a multi-target filesystem operation. Validation or preparation failure must occur before target mutation, and a later replacement failure needs a truthful, bounded recovery/rollback strategy to avoid mixed versions.
- Canonical skill Markdown contains relative links to the package-owned protocol. The installed payload must keep those references usable without creating a semantic fork.
- The official validator is a pinned Python reference tool previously used only from an isolated external checkout; installer verification must preserve immutable provenance and avoid silently substituting a different validator.
- Tests must distinguish command `--dry-run` from real disposable-consumer installation and prove unrelated directories and pre-existing managed content remain correct without touching repository canonical sources.
- Normal package tests must not load Trello credentials or invoke Trello; `test:live` is explicitly out of scope.
- The intentional pre-existing `NEXT.md` product decisions must survive every stage; only the active registration and pipeline step are stage-owned mutations before reconciliation.

## Open questions

None. The request and locked `NEXT.md` decisions provide the product behavior; exact filesystem seams, payload layout, validator invocation, and test commands are contract/planning outputs to derive from this evidence.
