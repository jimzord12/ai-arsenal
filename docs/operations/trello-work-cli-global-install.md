# Trello Flow CLI global installation

## Install or replace an exact artifact

Install only a verified private tarball, then repair pnpm's extensionless Bun
shim before invoking the command from Git Bash or another MSYS shell:

```powershell
pnpm add --global <verified-jz-trello-flow-tarball.tgz>
pnpm --dir <ai-arsenal-repository-root> run repair:global-trello-shim
```

Replace `<ai-arsenal-repository-root>` with the current checkout path. When the
shell requires it, quote the complete path.

The repair command is fail-closed and idempotent. It resolves the active pnpm
global bin directory, verifies that `jz-trello-flow` is a generated POSIX Bun
shim targeting `@jz/ai-arsenal-trello-work-cli`, and converts only MSYS-unsafe
`$basedir/../global` target paths to `$basedir_win/../global`. It rejects an
unsupported, malformed, or unrelated shim instead of rewriting it.

## Required smoke checks

Run these from Git Bash outside the AI Arsenal repository:

```bash
jz-trello-flow --version
jz-trello-flow --help
jz-trello-flow docs --list
```

Each command must exit successfully without a Bun `Module not found` error.
Also verify the generated PowerShell and CMD shims when replacing a release.

## Why the repair is required

The pnpm-generated `.CMD` and PowerShell shims use native Windows paths, but an
observed extensionless shell shim passed `/c/...` directly to the Windows Bun
executable. Bun `1.3.14` rejected that MSYS path even though the installed
package and entrypoint bytes were intact. A future `pnpm add --global` can
regenerate the defective extensionless shim, so the repair and Git Bash smoke
are mandatory after installation and rollback.

## Rollback

Install the previously verified tarball, run the same repair command, and repeat
all three smoke checks. Do not use a mutable source link as a rollback route.
