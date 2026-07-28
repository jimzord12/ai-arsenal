Work item: 2026-07-28-version-trello-work-cli
Artifact: contract
Revision: 1
Prerequisites: request@1,context@1
Status: ready

# Goal

Version the private `@jz/ai-arsenal-trello-work-cli` package as `0.1.0` through the repository's Changesets workflow, generate its changelog, capture the exact artifact through Git and green CI, and then make that exact package eligible for global installation.

## Non-goals

- Publishing to npm or any registry.
- Changing Trello CLI runtime behavior beyond version/changelog metadata.
- Running the live TestingBoard workbook as part of this work item.
- Accessing production boards, deleting source, or changing other package versions.

## Hard walls

- Use version `0.1.0 — first meaningful usable version (recommended)`.
- Use the changelog and package-version bump before global installation.
- Commit and push are implicit prerequisites for required CI.
- Do not globally install until the exact versioned package is committed, pushed, and required CI is green.
- Do not publish the package or mutate Trello.

## Acceptance criteria

- `packages/trello-work-cli/package.json` reports version `0.1.0`.
- `packages/trello-work-cli/CHANGELOG.md` is generated through Changesets and describes the archived canonical-list resolution behavior.
- No unrelated package receives a version bump.
- Package packing/validation identifies the artifact as `@jz/ai-arsenal-trello-work-cli@0.1.0` and passes its existing packed-boundary checks.
- Package and root gates pass; independent review finds no blocking issue.
- The versioned snapshot is committed and pushed, `origin/master` contains the exact commit, and required Quality and Portability CI pass.
- Global installation, performed after work-item completion under the separate operation boundary, installs the exact CI-green `0.1.0` local package and a read-only `work --help` smoke check succeeds.

## Test seams

- Changesets status/version output and generated package metadata/changelog.
- Package format, lint, typecheck, Jest, strict publint, and pack metadata.
- Root aggregate and workflow validators.
- Git remote containment and exact-commit GitHub Actions.
- Global pnpm package listing and read-only `work --help` invocation after CI.

## Verification

- Metadata: inspect package version, generated changelog, Changesets status, lockfile scope, and packed tarball identity.
- Package: run format, lint, typecheck, test, strict publint, and pack checks.
- Repository: run `pnpm check`, workflow tests/validators, and `git diff --check`.
- Review: fresh independent review of the exact worktree snapshot.
- Delivery: verify commit, push, `origin/master`, and required CI for the exact SHA.
- Installation: after repository completion, install the exact local package globally and verify package/version registration plus read-only CLI help without Trello credentials.

## Approval required

Yes. The plan implementation will change package/distribution metadata and requires a digest-bound explicit approval record before implementation. The user has selected version `0.1.0`, but plan implementation approval remains a later gate.
