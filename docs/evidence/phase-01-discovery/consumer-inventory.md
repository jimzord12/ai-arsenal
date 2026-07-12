# Consumer and Distribution Inventory

## Current consumers

- `CLAUDE.md:77`: mandates `features-cli progress --feature <slug> --json` for workflow continuity.
- `docs/agents/workflows/spec-to-ship/`: defines progress routing, state transitions, milestone authority, issue selection, and review flow around the CLI.
- Repository-local workflow skills including `new-feature`, `milestone-to-briefs`, `do-issue`, `decompose-issues`, and `jz-feature-grilling` invoke `npx tsx scripts/features-cli/bin.ts` or direct Bun paths.
- Personal workflow skills under `C:\Users\jimzord12\.claude\skills\` include `jz-write-spec`, `jz-spec-to-milestones`, `jz-milestone-to-issues`, `jz-issue-to-contract`, and `jz-implement-contract`.
- Newer personal skills explicitly treat the CLI as a repository-local Bun script; older repository docs and skills still assume `npx tsx`.
- Evaluation reports under `docs/superpowers/evals/` record that bare `features-cli` was unavailable on `PATH`, causing agents to bypass the CLI.

## Current installation model

- `scripts/features-cli` is a junction to a Git-ignored directory in the primary `ics-vcr` checkout.
- `.scratch` is a separate junction shared across worktrees.
- No CLI manifest, lockfile, build, package, install, release, CI job, or stable version identifier exists.
- The surrounding source application uses npm and supplies Jest/Babel/TypeScript tooling incidentally.
- Production code has no third-party runtime dependencies and no runtime assets.
- Bun is installed and on `PATH` on the observed Windows machine.

## Required cutover surface

- Update active source repository instructions and Spec-to-Ship workflow docs.
- Update repository-local workflow skills that hard-code `scripts/features-cli/bin.ts` or `npx tsx`.
- Update the five personal `jz-*` skills that invoke or describe the repository-local path.
- Replace junction setup assumptions for `scripts/features-cli`; preserve the `.scratch` junction and its existing user data.
- Verify every supported worktree can invoke the new executable from its own root so `cwd` semantics remain correct.
- Retain an explicit rollback command/path until all consumers pass.

## Selected initial distribution

- Workspace package: `@jz/ai-arsenal-features-cli` at `packages/features-cli`.
- Package remains private and is not published to npm.
- Executable: `features-cli` with Bun shebang.
- Artifact: npm-compatible source package requiring Bun; no initial bundling or standalone binary.
- Consumption: install the packed tarball locally/globally for clean-consumer and worktree smoke tests, then update skills/docs to use the stable executable.
- Package validation: `publint`; skip Are the Types Wrong because the initial package exposes no TypeScript import API.
- Release tracking: Changesets may version the private package and produce changelog entries; automated publication remains disabled.

## Platforms

- Windows is required and is the only verified platform.
- Add Linux CI for portability because Bun, Node filesystem APIs, path handling, and npm-compatible package shims are expected to support it.
- Do not claim macOS support until a real consumer or CI requirement exists.
