# @jz/ai-arsenal-jz-skills

Single source of truth for the `jz-*` family of agent skills.

## Purpose

These skills are designed to be:

- **Generic**: Work across any agent (Claude, Codex, Grok, etc.) and any project.
- **Decoupled**: No hard ties to specific harnesses, feature pipelines, or repo structures unless explicitly chosen by the user.
- **Portable**: Use native shell scripts (bash / pwsh) chosen by the agent at runtime.

## Usage

Skills are consumed by symlinking / junctioning from your agent's skills directory (e.g. `~/.claude/skills/`, `~/.agents/skills/`, etc.) into this package.

Example:

```powershell
# From your skills root
New-Item -ItemType Junction -Path "jz-resume-feature" -Target "C:\Users\you\Documents\GitHub\ai-arsenal\packages\jz-skills\jz-resume-feature"
```

## Skills included

See the subdirectories for individual `SKILL.md` files.

## Development

This is a content package. Run monorepo commands from root:

- `pnpm --filter @jz/ai-arsenal-jz-skills pack`

No build step required.
