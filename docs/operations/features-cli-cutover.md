# Features CLI consumer cutover and rollback

## Stable command

Install the packed private source artifact globally, then invoke `features-cli`
from each consumer repository root. Bun `1.3.14` must remain available on
`PATH`; the generated command shim executes the package's Bun entrypoint.

```powershell
$aiArsenal = 'C:\Users\jimzord12\Documents\GitHub\ai-arsenal'
$artifacts = Join-Path ([IO.Path]::GetTempPath()) ('features-cli-release-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $artifacts | Out-Null

pnpm --dir (Join-Path $aiArsenal 'packages\features-cli') pack --pack-destination $artifacts
$tarball = Get-ChildItem -LiteralPath $artifacts -Filter '*.tgz' | Select-Object -Single
pnpm add --global $tarball.FullName

features-cli --help
```

Cut-over `ics-vcr` worktrees and personal workflow skills use the bare
`features-cli` command. Invoke it only from the target repository root so its
strict `cwd` semantics select that worktree's `.scratch` junction.

## Read-only consumer smoke check

Run this before any workflow mutation in each active worktree:

```powershell
features-cli status
```

The command reads the shared `.scratch` state without changing it. The Phase 7
verification record identifies the worktrees checked for this cutover.

## Rollback

The legacy source CLI remains intact and is the rollback path until its
separate deletion gate is approved. From an `ics-vcr` worktree root, use:

```powershell
bun scripts/features-cli/bin.ts status
```

Do not delete `scripts/features-cli`, its junction target, or user `.scratch`
data during rollback. Reinstalling an earlier packed artifact is an additional
recovery option; no registry publication is required.

## Source deletion gate

The source CLI cannot be removed until behavior parity is approved, all
consumers use the stable command, CI has passed, rollback remains documented,
and the user explicitly authorizes deletion.
