Work item: 2026-07-29-release-trello-skills-installer
Artifact: context
Revision: 1
Prerequisites: request@1
Status: ready

# Applicable instructions

- `AGENTS.md`, especially the source precedence, autonomous workflow, verification discipline, and mandatory CLI local-delivery chain at lines 267-279.
- `NEXT.md` and `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md` current Trello installer truth.
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md` and repository-scoped stage skills.
- Changesets configuration and package-local scripts in the root and Trello CLI package manifests.

## Repository snapshot

- Branch: `master`.
- Baseline commit and remote: `adda9b6e7515d5ada6af173fed20b7f33f055916`; `HEAD == origin/master` after `git fetch origin`.
- Baseline status: clean before capture.
- Installer source delivery: `251d0ff92c7cf46371d139045450726359bae6dc`.
- Package: `@jz/ai-arsenal-trello-work-cli@0.3.0`, private, Bun `1.3.14`, sole bin map `jz-trello-flow -> src/bin.ts`.
- Toolchain observed: Node `v24.18.0`, pnpm `11.7.0`, Bun `1.3.14`, authenticated GitHub CLI.
- Global pnpm currently lists `@jz/ai-arsenal-trello-work-cli@0.3.0`; native `cmd.exe /d /c jz-trello-flow --help` succeeds in this preflight and shows package commands. The generated shims point to the global package's `src/bin.ts` and use Bun.
- Workflow preflight passes: `pnpm validate:workflow` reports no active item before capture.

## Relevant files

- `packages/trello-work-cli/package.json`, `CHANGELOG.md`, `README.md`.
- `packages/trello-work-cli/src/bin.ts`, `src/skills-install.ts`, `src/skills-install.test.ts`, and `test/skills-install.e2e.test.ts`.
- `packages/trello-work-cli/assets/agent-skills/**` and canonical `.agents/skills/trello-work-{orchestrator,design,deliver,recover}/SKILL.md`.
- Root `package.json`, `pnpm-lock.yaml`, `.changeset/config.json`, `.github/workflows/**`.
- `NEXT.md`, `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`, and this work-item directory.

## Risks

- A globally registered version alone does not prove the tarball contains a usable executable or that generated Windows shims target existing package bytes.
- Packed-consumer validation can accidentally invoke workspace source; it must use an unrelated disposable repository and the actual tarball.
- Installed skill payloads include a managed-marker/protocol-link transformation, so byte comparison must account for the installer's documented deterministic transformation rather than compare blindly to canonical repository sources.
- Changesets consumes the pending file during `version-packages`; post-version proof must inspect version, changelog, package scope, and packed artifact directly.
- Packing/global installation are post-capture operational actions; evidence must distinguish offline repository verification from exact-SHA post-CI installation.
- Post-install evidence changes planning truth and therefore may require a second documentation-only commit and exact-SHA CI pass.

## Open questions

None.
