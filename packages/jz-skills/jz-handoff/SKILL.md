---
name: jz-handoff
description: Write a handoff document summarizing the current conversation so a fresh agent can resume the work seamlessly. Use when the user asks to "handoff", "hand off", "write a handoff doc", "checkpoint", "save progress for next session", or wants the next session/agent to continue without re-explaining context. Optional argument is a description of what the next session will focus on.
disable-model-invocation: true
---

# jz-handoff

## Purpose

Distill the current conversation into one operational document a fresh agent can act from immediately - resume point, artifacts touched, pitfalls hit, constraints to respect, and what to do next. This is a **snapshot**, not a narrative transcript: a fresh reader should be able to skim it once and start working, not reconstruct the session.

This skill is deliberately generic - it is not tied to one repo's pipeline or one project's scratch conventions. Its purpose is to make old session → new session transitions easier.

## Required input

- Optional argument: a short description of what the next session will focus on (e.g. `jz-handoff continue with issue 04`). If given, treat it as authoritative intent for the "Next Session Focus" section - tailor that section to it rather than guessing. If not given, infer the most likely next step from the conversation's own trajectory (the last thing left undone, the next item in a known queue/backlog, an explicit "next" the user already named earlier in the session).
- Optional location: an exact Markdown file path or a directory. A path ending in `.md` is the exact file; any other path is a directory.

## Output location

Use this precedence:

1. An explicitly supplied path ending in `.md` is the exact destination file.
2. Any other explicitly supplied path is the destination directory. It may already exist or may need to be created.
3. With no supplied location, use the OS temporary directory with a `jz-handoffs` subdirectory (create the directory if it does not exist).

For every handoff, locate this installed skill's directory and resolve the appropriate allocator script based on the current OS before writing:

- On Windows: use `scripts/allocate.ps1` (run with pwsh).
- On Unix-like systems (Linux/macOS): use `scripts/allocate.sh` (run with bash or sh).

Quote the absolute helper script path. Pass an optional location as a quoted argument.

Examples:

```powershell
pwsh "C:\Users\me\... \jz-handoff\scripts\allocate.ps1" "C:\Work Notes\handoffs"
pwsh "C:\Users\me\... \jz-handoff\scripts\allocate.ps1"
```

```bash
bash "/home/me/.../jz-handoff/scripts/allocate.sh" "/home/me/work notes/handoffs"
bash "/home/me/.../jz-handoff/scripts/allocate.sh"
```

Consume the single JSON object on stdout. Its absolute `path` is the only permitted write target.

Report `id` as the random ID and `enumeration_text` as the enumeration. Directory/default allocations produce `<random-id>-<enumeration>-handoff.md`; exact-file allocations return `null` selectors.

If allocation exits non-zero, reports an error, returns invalid or ambiguous output, or selects an existing exact file, stop and report the failure. Do not guess another interpretation, fall back to a repository path, or overwrite anything. If a generated path appears after allocation but before the write, run allocate again. If an exact destination appears in that interval, stop rather than replacing it.

## Workflow

1. **Scope the session.** Identify what the conversation covered.
2. **Inventory artifacts, don't restate them.** List every file created, edited, or reviewed this session as paths with a one-line note on what changed - never paste their content. The document must not duplicate content already captured elsewhere; link/reference by path (or URL) instead.
3. **Capture the exact resume point.** What was just finished, what's queued next, and in what order - precise enough that a fresh agent doesn't have to guess or re-derive it from the artifacts.
4. **Capture pitfalls and discoveries.** Anything found this session that cost time or could trip up a fresh agent. Be concrete - name the file, the line, the wrong assumption.
5. **Capture constraints.** Explicit do-not-do rules, process preferences the user stated this session, and anything scoped out on purpose.
6. **Identify suggested skills.** List the skills the next agent should invoke, in the order it would naturally reach for them, with a one-line reason each.
7. **Allocate the destination.** Apply the location precedence above and successfully run the bundled allocator script before writing.
8. **Write the document** using the template below to the allocator's absolute `path`, creating a new file only.
9. **Report.** State the absolute file path; the JSON `id` as random ID; the JSON `enumeration_text` as enumeration (`none - explicit file` for exact-file selectors); a one-line summary of what the handoff captures; and the single most important next action.

## Template

```markdown
# Handoff - <short session title>

Date: <YYYY-MM-DD> • Session focus: <one line>

## Objective

<what this conversation was trying to accomplish, one paragraph>

## Status / Resume Point

<precisely where things stand - what's done, what's in flight, what's queued next, in order>

## Artifacts Touched

- `<path>` - <one line: created/edited/reviewed, what changed>
- ...

(Link to specs/plans/ADRs/issues/commits/diffs instead of restating their content.)

## Pitfalls & Discoveries

- <concrete finding: file/line, what was assumed, what's actually true, why it matters>
- ...

## Do-Not-Do / Constraints

- <explicit constraint or user preference, and why>
- ...

## Next Session Focus

<tailored to the user's passed argument if given; otherwise the inferred next step>

## Suggested Skills

- `<skill-name>` - <when/why the next agent should invoke it>
- ...

## Open Questions

<anything genuinely unresolved that the next session should raise or decide - omit section if none>
```

## Hard constraints

- **No duplication.** Never copy content already captured in a spec, plan, ADR, issue, commit, or diff into this document - reference it by path or URL. The document's job is to orient, not to archive.
- **Operational, not narrative.** Write for a reader who will act immediately, not one who wants the story of how the session unfolded. Cut anything that doesn't change what the next agent does.
- **Honor a passed argument.** If the user gave an argument describing the next session's focus, that argument drives the "Next Session Focus" section - don't override it with your own guess of what's next.
- **New file per handoff.** Never overwrite a prior handoff. Generated destinations use the allocator's collision-free random ID and directory-wide enumeration; an existing exact file is an error.
- **Portable across agents.** Write it so it's equally usable by any agent - don't assume tool availability or harness-specific state.
