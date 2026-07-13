# Issue file format

The exact `features-cli` issue-file contract, verified through the stable CLI. Get this right — the CLI parses these files and refuses malformed ones.

## Directory form

Write each issue as its own directory so stage 4's `change-contract.md` can sit beside `issue.md`:

```text
.scratch/features/<NNN>-<feature-slug>/issues/<NN>-<issue-slug>/issue.md
```

- The CLI derives the **issue id from the leading digits of the directory name** (`^\d+`). `07-capture-hook/` → id `7`. There is **no id line in the file body** — the directory name is the id.
- Zero-pad the prefix to two digits (`01`, `02`, …, `12`) for stable sort and readability. Leading zeros are fine (`07` → `7`).
- `<issue-slug>` is kebab-case, short, descriptive.

## Metadata block (before the first `#` heading)

Metadata is `Name: value` lines **above the H1** — NOT YAML `---` frontmatter. Keys are case-insensitive to the parser; write them CamelCase. Blank line, then the H1 title.

```markdown
Status: ready-for-agent
Method: tdd-solo
Complexity: 2
BlockedBy: none
Milestone: capture-and-store

# Capture a sanitized diagnostic record and read it back

What to build, from the user's / caller's perspective — not a file-by-file plan.

## Acceptance criteria

- [ ] Criterion 1, tracing a SPEC id (e.g. FR-001, SUBDEC-003).
- [ ] Criterion 2.

Traces: FR-001, FR-002, SUBDEC-003.
```

**Required headers** (the CLI rejects the file without them):

- `Status` — one of: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `in-progress`, `in-review`, `done`, `wontfix`. New issues are usually `ready-for-agent` (agent-grabbable by construction), or `needs-triage` if they still need a human decision.
- `Method` — the CLI accepts any non-empty string, but **this skill allows only** `tdd-pingpong` / `tdd-solo` / `direct` (see `breakdown-heuristics.md`).
- `Complexity` — a positive integer (`^\d+`, > 0).
- `BlockedBy` — `none`, or a comma-separated list of issue ids (`1, 2`). Must reference existing sibling issue ids; cannot include self; no duplicates.

**Optional headers:** `Milestone` (our grouping tag — set it to the milestone slug so the board groups the issue under `▸ <slug>`), `Decomposed`, `Phase` (`red|green|review`), `Reopens` (int), `Reviewed`. You set `Milestone`; leave `Phase`/`Reopens`/`Reviewed` to the stage-5 loop.

**Title:** the first `# ` H1 line, non-empty. **Body:** what to build + acceptance criteria that trace back to SPEC ids. No stale file paths.

## Id allocation

Before writing, list existing `issues/` directories and take the highest numeric prefix; continue from there. The first milestone's issues start at `01`. Ids are unique across the **whole feature** (all milestones share one id space, because `BlockedBy` references are numeric and feature-wide). Number in **dependency order** so every `BlockedBy` points to a lower id — the DAG is then acyclic by construction (the CLI checks unknown-id references but not cycles).

## The write → update-blockers → verify mechanic

There is **no `create-issue` command** — issues are hand-written markdown; the CLI _derives_ `issues-status.json` from the files. Regeneration is triggered by `update-blockers` (and `update-status`). So:

1. **Write every `issue.md`** first (all of them, with `BlockedBy` already correct in the metadata). Writing all files first means every blocker id exists before any validation runs.
2. **Run `update-blockers` on each issue.** It rewrites the canonical `BlockedBy:` line and regenerates + validates the whole `issues-status.json`.
3. **Show the board and confirm the frontier.**

Commands — PowerShell, **cwd = repo root**:

```powershell
# One per issue. --feature avoids needing the feature to be the single in-progress one.
features-cli update-blockers 1 --blockers none --feature <feature-slug>
features-cli update-blockers 2 --blockers 1 --feature <feature-slug>
features-cli update-blockers 3 --blockers 1,2 --feature <feature-slug>

# Verify:
features-cli status                                  # board; issues grouped under ▸ <milestone>
features-cli get-issue --next --feature <feature-slug>   # actionable winner + contracted / nextAction
features-cli get-issue --next-contract --feature <feature-slug>   # contract-ready uncontracted winner
```

- Pass `--feature <slug>` on `update-blockers` / `get-issue` for determinism; without it the CLI uses the single `in-progress` feature (`resolveCurrentFeature`), which errors if zero or more than one feature is in-progress.
- `update-blockers` throws `Unknown blocker ID` if a `BlockedBy` references an id with no issue file — a sign of a typo or a not-yet-written issue. Fix the file, rerun.
- A blocked issue is **not** returned by `get-issue --next` until all its blockers are `done`. So immediately after creation, `--next` returns an entry-point (`BlockedBy: none`) issue — that is correct.
- `get-issue --next` reports derived `contracted: true|false` and `nextAction: contract|implement`; contract state comes from the sibling `change-contract.md`, not issue status.
- `get-issue --next-contract` may look ahead to one uncontracted `ready-for-agent` issue when every blocker is terminal or already contracted.

## Worked example

Milestone `capture-and-store` (the walking skeleton) sliced into three issues:

```text
issues/01-capture-and-store-one-record/issue.md
issues/02-cap-and-evict-oldest/issue.md
issues/03-corrupt-queue-repair/issue.md
```

`issues/01-capture-and-store-one-record/issue.md`:

```markdown
Status: ready-for-agent
Method: tdd-pingpong
Complexity: 3
BlockedBy: none
Milestone: capture-and-store

# Capture a sanitized record into the encrypted queue and read it back

Given a flow failure, `captureDiagnostic` writes one sanitized, allow-listed
record into the encrypted MMKV records queue, and a summary read returns it.
Capture never throws to the caller.

## Acceptance criteria

- [ ] A captured record contains only allow-listed fields (no raw PII).
- [ ] The record persists encrypted at rest and survives an app restart.
- [ ] A capture failure is swallowed — the calling flow is unaffected.
- [ ] Reading the summary returns the stored record's metadata.

Traces: FR-001, FR-002, FR-016; NFR-002, NFR-003; SUBDEC-003, SUBDEC-004.
```

`02` (`BlockedBy: 1`, the cap/evict behaviour) and `03` (`BlockedBy: 1`, corrupt→repair) are peers that both build on `01`'s queue. `Method: tdd-pingpong` on `01` because sanitization/privacy is exactly the silent-and-costly risk that warrants a separate red agent; a pure flag-wiring issue in a later milestone would be `Method: direct`.

After writing all three, run `update-blockers 1 --blockers none`, `update-blockers 2 --blockers 1`, `update-blockers 3 --blockers 1` (each `--feature <slug>`), then `status` and `get-issue --next` (which returns issue `1` with `nextAction: contract`).
