# Local Release Glossary Design

## Goal

Give the `features-cli` package a concise, package-local definition of
`Local Release` so release requests have a shared operational meaning.

## Location and scope

Create `packages/features-cli/GLOSSARY.md`. It defines only `Local Release`;
it does not duplicate the monorepo's broader release policy or add release
automation.

## Definition

A Local Release of `@jz/ai-arsenal-features-cli` requires all of the
following:

1. Select the appropriate SemVer major, minor, or patch bump.
2. Create a Changeset and run `pnpm version-packages`, producing both the
   package version update and generated `CHANGELOG.md` entry.
3. Run release-scope artifact validation.
4. Ask the user immediately before packing for, installing into, or replacing
   the Windows user's global pnpm `features-cli` package.
5. After confirmation, perform the global local update and its required smoke
   checks.

An ordinary source change is not a Local Release unless the user explicitly
requests a Local Release.

## Constraints

- The glossary must preserve the existing explicit confirmation gate for a
  global package replacement.
- It must not hand-edit versions or changelogs, publish to a registry, or
  introduce a new release mechanism.

## Verification

- Confirm the glossary is located at `packages/features-cli/GLOSSARY.md`.
- Confirm it states every required Local Release operation and the final user
  confirmation gate.
- Run Prettier on the new Markdown file and `git diff --check`.
