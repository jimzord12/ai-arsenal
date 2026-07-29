Work item: 2026-07-29-jz-trello-flow-skills-install
Artifact: implementation
Revision: 3
Prerequisites: contract@1,plan@1,approval@1
Status: ready

# Changed paths

- `NEXT.md` (pipeline step only)
- `packages/trello-work-cli/package.json`
- `packages/trello-work-cli/README.md`
- `packages/trello-work-cli/assets/work-guide.md`
- `packages/trello-work-cli/assets/agent-skills/agent-workflow-protocol.md`
- `packages/trello-work-cli/assets/agent-skills/trello-work-orchestrator/SKILL.md`
- `packages/trello-work-cli/assets/agent-skills/trello-work-design/SKILL.md`
- `packages/trello-work-cli/assets/agent-skills/trello-work-deliver/SKILL.md`
- `packages/trello-work-cli/assets/agent-skills/trello-work-recover/SKILL.md`
- `packages/trello-work-cli/src/skills-install.ts`
- `packages/trello-work-cli/src/skills-install.test.ts`
- `packages/trello-work-cli/src/cli.ts`
- `packages/trello-work-cli/src/cli.test.ts`
- `packages/trello-work-cli/src/command-catalog.ts`
- `packages/trello-work-cli/src/docs.ts`
- `packages/trello-work-cli/src/docs.test.ts`
- `packages/trello-work-cli/test/skills-install.e2e.test.ts`
- `docs/work-items/2026-07-29-jz-trello-flow-skills-install/revisions/verification.md/v1.md`
- `docs/work-items/2026-07-29-jz-trello-flow-skills-install/revisions/verification.md/v2.md`
- `docs/work-items/2026-07-29-jz-trello-flow-skills-install/revisions/implementation-report.md/v1.md`
- `docs/work-items/2026-07-29-jz-trello-flow-skills-install/revisions/implementation-report.md/v2.md`
- `docs/work-items/2026-07-29-jz-trello-flow-skills-install/implementation-report.md`

The revision-2 verification and implementation report are preserved with only their header status changed to `superseded`. Canonical `.agents/skills/trello-work-*` sources remain unchanged.

## Decisions

- Every Git subprocess now receives an environment with all inherited `GIT_*` variables removed. Repository discovery canonicalizes both `cwd` and Git's reported top level and accepts the result only when canonical `cwd` is that top level or below it.
- Official validation invokes the configured Python with isolated mode and explicit UTF-8 mode, clears import-affecting Python environment keys, and inserts the already provenance-verified `skills-ref/src` path at index zero before importing `skills_ref.cli`.
- No public command, schema, package boundary, canonical skill, or documentation behavior changed in this correction.

## Tests

### Strict correction RED → GREEN

- Git RED: `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest src/skills-install.test.ts --runInBand --coverage=false -t "ignores inherited Git repository selectors"` exited `1`; a Bun subprocess started with `GIT_DIR`/`GIT_WORK_TREE` discovered the adversarial repository instead of the repository containing canonical `cwd`.
- Git GREEN: the same command exited `0`; 1 test passed and 10 were skipped by the focused filter.
- Python RED: with the pinned checkout/Python variables set, `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest test/skills-install.e2e.test.ts --runInBand --coverage=false -t "installs the actual tarball"` exited `1`; consumer `sitecustomize.py` inserted a consumer `skills_ref` shadow and validation loaded it.
- Python GREEN: after isolated invocation, clean import environment, forced verified source, and explicit UTF-8 mode, the same command exited `0`; both mandatory and pinned official packed tests passed, and the shadow marker remained absent.

### Focused, package, official, root, and workflow gates

- `pnpm --filter @jz/ai-arsenal-trello-work-cli format` exited `0` after Prettier formatted the new focused test. The initial check exited `1` only for that formatting delta.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli exec jest src/skills-install.test.ts src/cli.test.ts src/docs.test.ts --runInBand --coverage=false` exited `0`: 3 suites and 76 tests passed.
- Package lint and typecheck both exited `0`.
- With the pinned checkout/Python variables, the full package test exited `0`: 22 suites and 266 tests passed; 2 credential-gated live cases skipped.
- Strict package validation exited `0`; publint reported `All good!`.
- The pinned identity check proved canonical top level, clean `skills-ref` source, and HEAD `38a2ff82958afee88dadf4831509e6f7e9d8ef4e`; all four canonical and four bundled skills returned `Valid skill` from the pinned official validator.
- Forced fresh `pnpm check` exited `0`: formatting, all package lint/typecheck/test tasks, 36 workflow tests, and both workflow validators passed. The Trello package aggregate passed 265 tests with 3 skips because Turbo did not propagate the two custom pinned-validator variables; the direct pinned packed gate above passed on the same source.
- `git diff --check` exited `0`.
- Pre-report work-item validation exited `0` with `valid: true` and `nextSkill: "implement-monorepo-change"`.
- Safety audit found no Trello call, canonical-skill-source edit, release, publish, global install, reconciliation, commit, or push.

## Deviations

None.
