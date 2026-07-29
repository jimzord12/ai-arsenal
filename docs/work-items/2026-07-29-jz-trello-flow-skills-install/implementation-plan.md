Work item: 2026-07-29-jz-trello-flow-skills-install
Artifact: plan
Revision: 1
Prerequisites: contract@1
Status: ready

# Preconditions

- `request@1`, `context@1`, and `contract@1` are current, ready, validator-confirmed, and registered at `plan-monorepo-change`.
- Root `AGENTS.md`, `NEXT.md`, the referenced canonical-plan sections, `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`, all four `.agents/skills/trello-work-*/SKILL.md` files, and every routed stage skill remain authoritative.
- The intentional pre-existing `NEXT.md` feature selection and locked product decisions remain byte-preserved except for pipeline-owned active registration fields.
- Implementation remains Tier 2, uses strict vertical-slice TDD with observed focused RED then GREEN, changes no canonical `.agents/skills/trello-work-*` source, and stops after passed verification routes to reconciliation.
- `C:\Temp\asrepo2` is an existing external checkout at `agentskills/agentskills@38a2ff82958afee88dadf4831509e6f7e9d8ef4e`; `C:\Temp\asref\.venv\Scripts\skills-ref.exe` is the already-created isolated `skills-ref@0.1.0` executable. Recheck both identities before using them; recreate only in a disposable external directory from the same immutable source if unavailable.
- Normal and packed tests run only in isolated temporary workspaces, do not load Trello credentials, do not call `test:live`, and may install only into disposable pnpm consumers/repositories.
- The contract authorizes replacement only inside the four explicitly managed disposable target directories during verification. It does not authorize reconciliation, review self-certification, commit, push, publish, release/versioning, global install, Trello access, source deletion, or destructive Git operations.

## Ordered tasks

### 1. Add the first failing public-command vertical slice

- Paths: `packages/trello-work-cli/src/skills-install.test.ts`, `packages/trello-work-cli/src/cli.test.ts`
- Inputs: Acceptance criteria 1, 2, 5, and 9; CLI grammar, repository discovery, installation-state, and network/credential-exclusion seams; current strict parser and injected dependency evidence.
- Output: Focused tests specify `skills install` as an offline command, nested `.git` repository discovery, four fresh managed targets, and installed-action reporting before production support exists.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest src/skills-install.test.ts src/cli.test.ts --runInBand --coverage=false`
- Expected result: Observed nonzero RED caused by missing installer module/route or missing required behavior, recorded verbatim enough to distinguish an expected feature gap from an environment failure.
- Rollback: Not applicable.

### 2. Implement the smallest fresh-install slice and package-owned payload

- Paths: `packages/trello-work-cli/src/skills-install.ts`, `packages/trello-work-cli/src/cli.ts`, `packages/trello-work-cli/src/command-catalog.ts`, `packages/trello-work-cli/assets/agent-skills/agent-workflow-protocol.md`, `packages/trello-work-cli/assets/agent-skills/trello-work-orchestrator/SKILL.md`, `packages/trello-work-cli/assets/agent-skills/trello-work-design/SKILL.md`, `packages/trello-work-cli/assets/agent-skills/trello-work-deliver/SKILL.md`, `packages/trello-work-cli/assets/agent-skills/trello-work-recover/SKILL.md`
- Inputs: Acceptance criteria 1–5 and 9; canonical source/payload, parser, discovery, preparation, official-validator, and install-state seams; immutable skill/protocol sources and adapter-permitted relative reference rewriting.
- Output: The offline CLI route discovers the nearest ancestor containing `.git` (directory or worktree file), stages all four package-owned canonical skill copies, rewrites only the canonical protocol link to a managed local `references/agent-workflow-protocol.md`, adds `.jz-trello-flow-managed.json`, invokes `skills-ref validate` for all four staged directories before target replacement, and installs/reports the fresh four-target slice without entering Trello configuration.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest src/skills-install.test.ts src/cli.test.ts --runInBand --coverage=false`
- Expected result: GREEN for the exact initial tests; output names four `installed` targets, files are managed and complete, nested root selection is stable, and no Trello configuration/client path is used.
- Rollback: Not applicable.

### 3. Drive replacement, repeat, dry-run, preservation, and failure safety test-first

- Paths: `packages/trello-work-cli/src/skills-install.test.ts`, `packages/trello-work-cli/src/skills-install.ts`, `packages/trello-work-cli/src/cli.test.ts`
- Inputs: Acceptance criteria 2, 4–8, and 11; repository discovery, payload preparation, preservation, atomic-preparation, installation-state, CLI grammar, and no-Trello seams.
- Output: Add one focused failing case at a time before its smallest production change for no-root errors, modified-target replacement, repeated replacement, unrelated-skill preservation, dry-run planning/no-write, missing/corrupt payload, missing/failing official validator, and replacement rollback. The final implementation prepares and validates the complete staged set before mutation, uses same-filesystem backup/swap with rollback for later filesystem errors, changes only the four named targets, and cleans only its own staging/backup paths.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest src/skills-install.test.ts src/cli.test.ts --runInBand --coverage=false`
- Expected result: Each newly introduced behavior has a recorded feature-specific RED before the corresponding production edit; final GREEN proves stable clear errors, four installed/replaced action reports, byte-preserved unrelated content, dry-run no-write, preparation failure atomicity, and restored targets after injected replacement failure.
- Rollback: Not applicable.

### 4. Add command help, offline documentation, and catalog regression coverage

- Paths: `packages/trello-work-cli/src/docs.test.ts`, `packages/trello-work-cli/src/docs.ts`, `packages/trello-work-cli/assets/work-guide.md`, `packages/trello-work-cli/README.md`
- Inputs: Acceptance criteria 1, 8, and 11; documentation/catalog seam; current shared command catalog and packaged guide evidence.
- Output: Failing docs/help assertions precede concise documentation of deterministic root selection, managed replacement, official pinned validator prerequisite/failure, staged validation, dry-run/actions, preservation, and no-Trello behavior; docs list/search/JSON and existing topics remain compatible.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest src/docs.test.ts src/cli.test.ts --runInBand --coverage=false`
- Expected result: Observed documentation RED before edits, then GREEN with `skills install` present consistently in catalog-rendered help/docs and manual README/guide surfaces.
- Rollback: Not applicable.

### 5. Add failing packed-consumer coverage, then complete the packed boundary

- Paths: `packages/trello-work-cli/test/skills-install.e2e.test.ts`, `packages/trello-work-cli/package.json`
- Inputs: Acceptance criteria 3, 4, 8, 10, and 11; distribution, packed payload, official validator, Unicode/path, preservation, and no-Trello seams; current explicit 26-file allowlist and real Bun bin evidence.
- Output: A real-process test first fails because the new installer source/payload is absent from the tarball allowlist, then the manifest includes `src/skills-install.ts` and `assets/agent-skills`; the test invokes `pnpm pack` to produce the actual tarball, installs it into a disposable pnpm consumer, places the pinned official validator on the child `PATH`, and invokes the generated `jz-trello-flow` shim from a nested disposable Git repository with spaces/Unicode for dry-run and real/repeat installation.
- Test command: `$env:JZ_TRELLO_FLOW_TEST_SKILLS_REF='C:\Temp\asref\.venv\Scripts\skills-ref.exe'; pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest test/skills-install.e2e.test.ts --runInBand --coverage=false`
- Expected result: Observed packed-boundary RED before the manifest edit, then GREEN proving the actual tarball ships the intended complete payload, installs cleanly, validates through the official pinned executable, preserves an unrelated skill, and works without monorepo-relative paths or Trello access.
- Rollback: Disposable tarballs, consumers, repositories, stages, and backups are removed by test-owned temporary-directory cleanup; no non-disposable installation is performed.

### 6. Prove payload provenance and official conformance

- Paths: `packages/trello-work-cli/src/skills-install.test.ts`, `packages/trello-work-cli/assets/agent-skills/agent-workflow-protocol.md`, `packages/trello-work-cli/assets/agent-skills/trello-work-orchestrator/SKILL.md`, `packages/trello-work-cli/assets/agent-skills/trello-work-design/SKILL.md`, `packages/trello-work-cli/assets/agent-skills/trello-work-deliver/SKILL.md`, `packages/trello-work-cli/assets/agent-skills/trello-work-recover/SKILL.md`
- Inputs: Acceptance criteria 3, 4, 7, and 11; canonical-source, payload-preparation, official-validation, and preservation seams.
- Output: Tests prove each bundled skill is byte-equal to its canonical source before the one permitted link rewrite, the bundled protocol is byte-equal to the package authority source, all staged/installed files carry the generated managed marker, and all canonical/bundled/staged installed skill directories validate with the immutable official tool.
- Test command: `& 'C:\Temp\asref\.venv\Scripts\skills-ref.exe' validate .agents/skills/trello-work-orchestrator; & 'C:\Temp\asref\.venv\Scripts\skills-ref.exe' validate .agents/skills/trello-work-design; & 'C:\Temp\asref\.venv\Scripts\skills-ref.exe' validate .agents/skills/trello-work-deliver; & 'C:\Temp\asref\.venv\Scripts\skills-ref.exe' validate .agents/skills/trello-work-recover; $env:JZ_TRELLO_FLOW_TEST_SKILLS_REF='C:\Temp\asref\.venv\Scripts\skills-ref.exe'; pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest src/skills-install.test.ts test/skills-install.e2e.test.ts --runInBand --coverage=false`
- Expected result: All four canonical validations print `Valid skill`; focused provenance and real installed-payload assertions pass, with no canonical-source byte change.
- Rollback: Not applicable.

### 7. Run package and repository gates and write the implementation report

- Paths: `docs/work-items/2026-07-29-jz-trello-flow-skills-install/implementation-report.md`
- Inputs: Acceptance criteria 9–12; every test seam; exact current contract, approved plan, changed files, RED/GREEN logs, tarball inspection, and safety audit.
- Output: A truthful implementation report records exact changed paths, RED/GREEN commands/results, focused and aggregate gates, actual tarball contents and disposable invocation, pinned validator identity/results, deviations, review explicitly left to the supervisor, forbidden-activity audit, and readiness for independent verification.
- Test command: `pnpm --filter @jz/ai-arsenal-trello-work-cli format; pnpm --filter @jz/ai-arsenal-trello-work-cli lint; pnpm --filter @jz/ai-arsenal-trello-work-cli typecheck; $env:JZ_TRELLO_FLOW_TEST_SKILLS_REF='C:\Temp\asref\.venv\Scripts\skills-ref.exe'; pnpm --filter @jz/ai-arsenal-trello-work-cli test; pnpm --filter @jz/ai-arsenal-trello-work-cli validate; pnpm check; node scripts/validate-living-workflow.mjs; node scripts/validate-monorepo-work-item.mjs --work-item 2026-07-29-jz-trello-flow-skills-install --json; git diff --check`
- Expected result: Every command exits 0; the package suite includes all offline installer and packed-consumer cases, strict publint passes, repository/workflow gates pass, the active route becomes `verify-monorepo-change` after the report is written, and no live/release/delivery action occurs.
- Rollback: Any ignored tarball or disposable workspace is removed only by its owning command/test cleanup; tracked source/report changes require no implementation-time rollback.

## Affected paths

### Create

- `packages/trello-work-cli/src/skills-install.ts`
- `packages/trello-work-cli/src/skills-install.test.ts`
- `packages/trello-work-cli/test/skills-install.e2e.test.ts`
- `packages/trello-work-cli/assets/agent-skills/agent-workflow-protocol.md`
- `packages/trello-work-cli/assets/agent-skills/trello-work-orchestrator/SKILL.md`
- `packages/trello-work-cli/assets/agent-skills/trello-work-design/SKILL.md`
- `packages/trello-work-cli/assets/agent-skills/trello-work-deliver/SKILL.md`
- `packages/trello-work-cli/assets/agent-skills/trello-work-recover/SKILL.md`
- `docs/work-items/2026-07-29-jz-trello-flow-skills-install/implementation-report.md`

### Modify

- `packages/trello-work-cli/src/cli.ts`
- `packages/trello-work-cli/src/cli.test.ts`
- `packages/trello-work-cli/src/command-catalog.ts`
- `packages/trello-work-cli/src/docs.ts`
- `packages/trello-work-cli/src/docs.test.ts`
- `packages/trello-work-cli/assets/work-guide.md`
- `packages/trello-work-cli/README.md`
- `packages/trello-work-cli/package.json`
- `NEXT.md` (pipeline step only)

### Delete

- None.

## Verification commands

- `git -C C:\Temp\asrepo2 rev-parse HEAD` — prints exactly `38a2ff82958afee88dadf4831509e6f7e9d8ef4e`.
- `& 'C:\Temp\asref\.venv\Scripts\skills-ref.exe' --version` — identifies the installed official `skills-ref` executable without changing repository state.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest src/skills-install.test.ts src/cli.test.ts --runInBand --coverage=false` — first records the planned feature RED, later passes all focused installer/parser cases.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest src/docs.test.ts src/cli.test.ts --runInBand --coverage=false` — first records the docs RED, later passes catalog/help/docs behavior.
- `$env:JZ_TRELLO_FLOW_TEST_SKILLS_REF='C:\Temp\asref\.venv\Scripts\skills-ref.exe'; pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest test/skills-install.e2e.test.ts --runInBand --coverage=false` — first records packed-boundary RED, later passes actual pack/install/generated-command acceptance.
- `& 'C:\Temp\asref\.venv\Scripts\skills-ref.exe' validate <each canonical, bundled-preparation, and disposable-installed skill directory>` — each exact directory reports `Valid skill` and exits 0; concrete disposable paths are emitted and retained in the test result rather than guessed in advance.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli format` — package formatting passes.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli lint` — package lint passes.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli typecheck` — strict TypeScript passes.
- `$env:JZ_TRELLO_FLOW_TEST_SKILLS_REF='C:\Temp\asref\.venv\Scripts\skills-ref.exe'; pnpm --filter @jz/ai-arsenal-trello-work-cli test` — all normal package tests and coverage pass without the live suite.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli pack` — creates the actual ignored tarball for explicit content inspection; it is not published or installed globally.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli validate` — strict publint/packed-boundary validation passes.
- `pnpm check` — root formatting, lint, typecheck, tests, workflow tests, and workflow validators pass.
- `node scripts/validate-living-workflow.mjs` — canonical workflow structure passes.
- `node scripts/validate-monorepo-work-item.mjs --work-item 2026-07-29-jz-trello-flow-skills-install --json` — reports the expected current next skill for the artifact frontier.
- `git diff --check` — no whitespace errors.
- `git status --short` and `git diff --name-status` — changed paths remain within the contract plus pipeline artifacts; no canonical Trello skill source, release/version, reconciliation, or Git-delivery mutation appears.

## Rollback

1. Tests and packed acceptance remove only their own disposable temporary consumer/repository/staging/backup directories; ignored tarballs created by explicit verification are left for the supervisor unless their creating test already cleaned them.
2. Runtime installation prepares and validates before mutation; during replacement it retains same-filesystem backups until all four swaps succeed and restores already-swapped targets if a later swap fails, then reports a nonzero stable failure.
3. No production repository, global environment, Trello resource, registry, version, changelog, commit, branch, or remote state is changed, so no external rollback is required.
