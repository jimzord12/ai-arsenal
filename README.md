# AI Arsenal

AI Arsenal is a pnpm/Turborepo monorepo for private AI-driven software-development tools.

The repository contains the migrated private `features-cli` source package. Its packed artifact and Windows Bun shim are verified; the original source remains available for rollback until consumer cutover and explicit deletion approval. GitHub Actions defines quality and Windows/Linux process-distribution smoke coverage.

## Prerequisites

Install the pinned toolchain:

- Node.js 24.5.0 from .nvmrc.
- pnpm 10.33.0, declared by packageManager.
- Bun 1.3.14 from .bun-version.

pnpm owns dependency installation and workspace linking. Turborepo orchestrates package tasks. Bun remains the runtime for features-cli.

## Install

```powershell
corepack enable
pnpm install --frozen-lockfile
```

Do not use npm, Yarn, or Bun to create competing dependency state.

## Workspace layout

- packages/features-cli: private Bun source package for @jz/ai-arsenal-features-cli.
- docs/planning: canonical living implementation plan.
- docs/evidence: phase discovery and verification evidence.
- .agents/skills: repository-scoped workflow skills.

## Commands

- pnpm format: run package formatting checks through Turborepo.
- pnpm format:check: check repository formatting directly.
- pnpm format:write: format supported repository files.
- pnpm lint: run package lint tasks through Turborepo.
- pnpm lint:root: lint repository JavaScript and TypeScript configuration.
- pnpm typecheck: run package type checks.
- pnpm test: run package tests.
- pnpm run pack: create package tarballs through the Turbo task graph (`pnpm pack` is pnpm's built-in command for packing the root package).
- pnpm validate: run package validation through the task graph.
- pnpm check: run the primary local quality checks.
- pnpm changeset: create a Changeset.
- pnpm version-packages: apply pending Changesets to package versions and changelogs.

Pre-commit hooks run only lint-staged checks. Commit-message hooks enforce Conventional Commits. Full tests, package validation, and platform checks remain explicit commands and CI responsibilities.

For consumer installation, read-only smoke checks, rollback, and the source-retirement gate, see [the Features CLI cutover guide](docs/operations/features-cli-cutover.md).

## Living-plan workflow

Resume work from NEXT.md and treat docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md as the implementation source of truth.

Validate the workflow structure with:

```powershell
node scripts/validate-living-workflow.mjs
```

## Release policy

Packages remain private. Changesets manages versions and changelogs, but automated npm publication is intentionally out of scope.
