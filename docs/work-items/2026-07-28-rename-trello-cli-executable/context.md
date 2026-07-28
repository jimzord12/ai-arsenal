Work item: 2026-07-28-rename-trello-cli-executable
Artifact: context
Revision: 1
Prerequisites: request@1
Status: ready

# Applicable instructions

- `AGENTS.md`, `NEXT.md`, canonical plan section 24, monorepo work-item pipeline, and capture/orientation/scoping/planning skills.
- No nearer `packages/trello-work-cli/AGENTS.md` exists.

## Repository snapshot

- Clean `master` baseline before capture: `HEAD`, `master`, and `origin/master` all `847b246c9e483de34f5c8bd03a51dc3d48f4d10c`.
- `@jz/ai-arsenal-trello-work-cli@0.1.0` is globally installed and its native Windows `work` shim currently resolves.
- Quality and Portability CI passed for the baseline.

## Relevant files

- `packages/trello-work-cli/package.json` defines `bin.work`.
- `packages/trello-work-cli/src/command-catalog.ts`, `src/cli.ts`, and tests contain rendered help/diagnostic command naming.
- `packages/trello-work-cli/README.md` and `assets/work-guide.md` document the command throughout.
- `docs/operations/trello-work-cli-onboarding-workbook.md`, current canonical-plan sections, and `NEXT.md` contain current operator invocations.
- Historical work-item/evidence artifacts also mention `work`; they are immutable historical evidence and are not current command documentation.
- Changesets is configured to version private packages and generate `CHANGELOG.md`.

## Risks

- This is an intentional breaking executable rename; leaving a `work` alias would retain the name the user asked to remove and could conflict with unrelated global executables.
- Blind replacement of the English noun “work” would corrupt prose and domain terms; replacements must target command invocations and executable labels only.
- Existing global installation must be replaced from an exact CI-green package, and the obsolete package-owned `work` shim must be confirmed absent afterward.
- Git Bash may exhibit the existing pnpm/Bun POSIX-shim path issue; native Windows shim verification remains authoritative.

## Open questions

None. The requested executable is exactly `jz-trello-flow`; the package name remains unchanged because no package rename was requested.
