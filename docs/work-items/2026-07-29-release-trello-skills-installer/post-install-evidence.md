# Trello Skills Installer 0.4.0 Post-Install Evidence

- Release SHA: `9818bf6a359d53d95705f0b9685416cf06837d5b`
- Quality: https://github.com/jimzord12/ai-arsenal/actions/runs/30467891276 (`success`)
- Portability: https://github.com/jimzord12/ai-arsenal/actions/runs/30467891911 (`success`, Windows and Ubuntu)
- Tarball: `C:\Users\jimzord12\Documents\GitHub\ai-arsenal\.tmp\releases\9818bf6a359d53d95705f0b9685416cf06837d5b\jz-ai-arsenal-trello-work-cli-0.4.0.tgz`
- SHA-256: `86ad985318fd3fef537bdf544dc4f53fdc4046e07e765d92f81d041c0d8d3635`

## Exact package and installation

The tarball was packed from a clean checkout whose `HEAD` equaled `origin/master` at the release SHA. Its manifest reports `@jz/ai-arsenal-trello-work-cli@0.4.0`, exactly `jz-trello-flow -> src/bin.ts`, the four managed skill payloads and protocol, and no tests, configuration, credentials, or retired executable alias.

Native command:

```text
cmd.exe /d /c pnpm add -g <exact-tarball>
```

Observed global registration:

```text
@jz/ai-arsenal-trello-work-cli 0.4.0
```

Generated native paths:

```text
C:\Users\jimzord12\AppData\Local\pnpm\bin\jz-trello-flow
C:\Users\jimzord12\AppData\Local\pnpm\bin\jz-trello-flow.CMD
```

The generated native shim completed `jz-trello-flow --help` and `jz-trello-flow docs`; help listed `skills install`, and packaged docs described credential-free managed installation and pinned validator provenance.

## Disposable first/repeat byte proof

Repository: `.tmp\releases\9818bf6a359d53d95705f0b9685416cf06837d5b\disposable-consumer`

- First installed-shim run reported four `installed` actions.
- Byte proof reported `verified 12 managed files across 4 skills`.
- Repeat installed-shim run reported four `replaced` actions.
- Repeat proof reported `verified 12 managed files across 4 skills; ...; repeat manifest identical`.
- Unrelated sentinel SHA-256 remained `b072885a36ba742a882e9a6db2be87feca22e4ea463bc6cb5f3adf9f685d978c` before and after both runs.

No registry publication, Trello access, manual shim edit, source deletion, or non-disposable skill installation occurred.
