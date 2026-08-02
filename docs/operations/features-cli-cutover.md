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

The legacy `scripts/features-cli` junction has been retired and is not a
rollback path. Roll back by installing a previously verified packed private
artifact into the global pnpm environment:

```powershell
pnpm add --global <previously-verified-features-cli-tarball.tgz>
```

No registry publication is required. Invoke `features-cli --help` and a
read-only `features-cli status` check from the consumer root after rollback.

## Source deletion gate

Completed: the user-authorized dangling legacy junction was removed after
behavior parity, consumer cutover, CI, and packaged-artifact rollback were
verified. The global private package remains the stable command and the packed
artifact route remains the only rollback route.
