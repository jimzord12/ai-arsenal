Work item: 2026-07-28-version-trello-work-cli
Artifact: context
Revision: 1
Prerequisites: request@1
Status: ready

# Applicable instructions

- `AGENTS.md`
- `NEXT.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md` section 24 and Trello package sections referenced by the operator view
- `docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md`
- `.agents/skills/capture-monorepo-change/SKILL.md`
- `.agents/skills/orient-monorepo-change/SKILL.md`
- `packages/trello-work-cli/AGENTS.md` was requested but does not exist; root instructions govern the package.

## Repository snapshot

- Branch: `master`.
- `HEAD`, `master`, and `origin/master`: `dda2438f4946f72c0e161aa64e39dc972ff4966b` after fetch.
- Working tree was clean before capture; only the task-owned request and `NEXT.md` registration are now modified.
- Required Quality and Portability GitHub Actions passed for `dda2438`.
- Root scripts include `changeset`, `version-packages`, `check`, `pack`, and `validate`; package scripts include format, lint, typecheck, test, pack, and strict publint validation.
- `pnpm changeset status` reports no pending changesets or releases.

## Relevant files

- `packages/trello-work-cli/package.json` — private package at version `0.0.0`; Changesets can version private packages.
- `.changeset/config.json` — generated changelogs enabled, `privatePackages.version: true`, no automatic publish commit.
- `package.json` — repository Changesets and validation commands.
- `pnpm-lock.yaml` — may record the workspace package version after versioning.
- `packages/trello-work-cli/CHANGELOG.md` — currently absent; Changesets can generate it.
- `packages/trello-work-cli/src/version.ts` and its tests — package-version reporting surface.
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md` and `NEXT.md` — exact-package installation and provenance requirements.

## Risks

- Installing before versioning, Git capture, and CI would violate exact-artifact provenance.
- A manually edited changelog could diverge from the repository's configured Changesets workflow.
- Choosing patch versus minor changes the first meaningful package identity; the package currently remains private and unpublished.
- Global installation is outside the work-item pipeline and must consume the exact CI-green artifact produced after this repository change.

## Open questions

- Select patch `0.0.1` or minor `0.1.0`; the repository evidence supports Changesets and the package has not yet had a meaningful version.
