# Phase 1 Deviation Report

- Source provenance: the CLI is not tracked at the surrounding worktree commit; it is a Git-ignored junction. Migration must establish provenance with hashes rather than Git history.
- Architecture: the CLI has no application imports, runtime dependencies, network access, templates, or runtime assets. A bundled executable and generic shared packages are unnecessary.
- Root behavior: the CLI does not discover the repository root. The invocation `cwd` is the target project root and must remain so.
- Test stack: existing tests use Jest-specific APIs. Preserve Jest instead of adopting `bun:test` during migration.
- Distribution: use a private npm-compatible TypeScript source package requiring Bun. Registry publication and standalone binaries are unnecessary.
- Type validation: skip Are the Types Wrong because the package exposes no TypeScript import API.
- Platforms: Windows is verified and required; Linux is the initial portability target; macOS is not currently required.
- Concurrency: a shared fail-fast writer lock exists, but milestone mutation and several partial-failure paths are weaker than assumed. Add scoped tests/hardening rather than redesigning state globally.
- Consumers: workflow docs and personal/repository skills are the primary consumers; there are no application imports or CI/package consumers.
- Source retirement: deleting the source junction is more operationally sensitive than deleting a tracked copy and remains explicitly gated.
