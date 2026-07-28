Work item: 2026-07-28-rename-trello-cli-executable
Artifact: contract
Revision: 1
Prerequisites: request@1,context@1
Status: ready

# Goal

Replace the Trello CLI's public executable name `work` with exactly `jz-trello-flow` across package metadata, generated help, shipped/current documentation, tests, and global installation.

## Non-goals

- Renaming npm package `@jz/ai-arsenal-trello-work-cli`.
- Changing Trello Work Unit behavior, schemas, API calls, or command subcommands.
- Rewriting immutable historical work-item/evidence artifacts.
- Publishing, running the live workbook, or accessing Trello.

## Hard walls

- The new executable name is exactly `jz-trello-flow`.
- Do not retain a package-owned `work` executable alias.
- Preserve all subcommand names and behavior.
- Operate autonomously; escalate only genuine ambiguity, missing capability/credential, destructive/irreversible action, objective change, or hard blocker.
- Commit/push and CI are implicit delivery prerequisites; global reinstall occurs only from the exact CI-green artifact.

## Acceptance criteria

- Packed package metadata exposes only `jz-trello-flow` mapped to `src/bin.ts`; it exposes no `work` binary.
- Short help starts with `jz-trello-flow commands:` and all command examples/recovery text in shipped docs use `jz-trello-flow`.
- Package README, onboarding workbook, current canonical-plan instructions, and `NEXT.md` use the new executable.
- Historical evidence/work-item files remain unchanged except this new work item's artifacts.
- Existing behavioral tests pass with renamed expectations; focused tests prove the old binary is absent from the packed package.
- A Changesets minor release advances the private package to `0.2.0` with a generated breaking-rename changelog entry.
- Package/root/workflow gates and independent review pass; the exact commit is pushed and Quality/Portability CI are green.
- Global reinstall reports package `0.2.0`; native Windows `jz-trello-flow --help` passes, while the package-owned global `work` shim is absent.

## Test seams

- Package manifest and packed tarball `bin` map.
- CLI short help, command catalog, docs rendering/search tests, README/docs current-string scans.
- Global pnpm shim and package registration after exact-tarball reinstall.

## Verification

- Focused RED/GREEN tests for manifest/help/docs/package boundary.
- Package format, lint, typecheck, Jest, strict publint, and packed-artifact inspection.
- Root `pnpm check`, workflow tests/validators, current-string audit, and `git diff --check`.
- Fresh independent final-snapshot review.
- Exact commit remote containment and Quality/Portability CI.
- Post-CI global uninstall/reinstall and native Windows help/old-shim absence checks.

## Approval required

No additional routine approval stop is required under the user's master-orchestrator authorization; this explicit public rename request and exact target name fully determine the bounded contract.
