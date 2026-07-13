# Breakdown heuristics

How to slice one milestone into issues. An issue is a **tracer bullet** — one narrow, complete path through every layer it touches, sized to a single fresh context window (~1 PR). A milestone is several of these.

## The tracer-bullet rules

For every candidate issue:

- It cuts a **narrow but complete** path — schema + logic + UI + test for one thin behaviour, not a horizontal slice of one layer.
- It is **verifiable on its own** — a test passes, a seam behaves as specified. It need not be independently demoable (that is the milestone's job), but "the code exists" is not verification.
- It **fits one fresh context window** — a green agent with no chat history can finish it. If it can't, split it.
- **Prefactoring goes first.** If a mechanical cleanup makes the real change easy, that cleanup is its own issue and the issues that need it are blocked by it. "Make the change easy, then make the easy change."

## The horizontal-slice smell (issue level)

Layer names as issue titles are the tell: _"add the queue storage", "define the schemas", "wire the send API", "build the settings UI"_. Each demos and verifies nothing whole on its own. Fold the layer into the first vertical issue that needs it — the storage code ships **inside** the issue that first captures and reads back a record, behind the same test.

An issue almost always cuts through several layers to light one narrow path. If a candidate touches exactly one tier, suspect a horizontal slice and re-cut it vertically.

## Wide refactors — the exception

A **wide refactor** is one mechanical change — rename a shared column, retype a shared symbol — whose **blast radius** fans across the codebase so a single edit breaks thousands of call sites at once and no vertical slice can land green. Do not force it into a tracer bullet. Sequence it **expand → migrate → contract**:

1. **Expand** (one issue): add the new form beside the old so nothing breaks yet.
2. **Migrate** (one issue per batch, each blocked by expand): move call sites over in batches sized by blast radius — per package, per directory — each batch staying green because the old form still exists.
3. **Contract** (one issue, blocked by every migrate batch): delete the old form once no caller remains.

When even a batch can't stay green alone, keep the sequence but have the batches share an integration branch that all block a final integrate-and-verify issue — green is promised only there. Wide refactors are rare; reach for this only when the blast radius genuinely forbids a single slice.

## The `Method` risk gate

`Method` is our convention (the CLI is permissive and does not enforce it — this skill does). It tells stage 5 which agent topology to run. Pick by **risk**, not size (`Complexity` carries size):

| `Method`       | Stage-5 topology                                                                                   | Use for                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `tdd-pingpong` | fresh **red** agent writes failing tests, fresh **green** agent makes them pass, per tracer bullet | high-risk / subtle logic — auth, money, **sanitization / privacy / allow-listing**, envelope/DSN correctness |
| `tdd-solo`     | one implementer runs the red→green loop                                                            | routine logic with real behaviour to test                                                                    |
| `direct`       | green-only, still reviewed                                                                         | trivial / config / pure wiring / i18n / flag plumbing — no logic to get subtly wrong                         |

Default to `tdd-solo`. Escalate to `tdd-pingpong` when a bug would be silent and costly (a leaked field, a double charge, a mis-signed envelope). Drop to `direct` only when there is genuinely no logic a test would protect.

**Risk lives in what the slice decides, not its size.** A `Complexity: 2` issue can be your highest-risk one. The tell is a _new sanitization boundary being authored_: defining a strict allow-list schema for a flow that touches taxpayer ids, payment identifiers, or personal data is `tdd-pingpong` — a red agent that first proves "unknown/forbidden key rejected, no raw value stored" is exactly the guard that catches a silent privacy leak — even though the diff is small. Contrast: _wiring a call site to an allow-list another issue already authored and tested_ is `tdd-solo`, and pure flag/i18n/config plumbing with no stored-data decision is `direct`. If a run lands most issues on one Method, re-check — a gate that never discriminates isn't gating.

## Complexity

A positive integer, size only (risk lives in `Method`). Rough scale: **1** trivial, **2** small, **3** medium, **5** large-but-still-one-PR. If an issue wants a Complexity above ~5, it is two issues — split it. Complexity also orders the CLI frontier: among unblocked issues, `get-issue --next` picks the lowest Complexity, then the lowest id.

## Blocker edges and the DAG

- `BlockedBy` lists the issues that must be `done` before this one can start. `none` = startable immediately.
- **Number in dependency order and reference only lower ids.** The CLI validates that blocker ids exist but does **not** detect cycles — an all-blocked cycle would simply never become actionable. Numbering blockers-before-dependents makes a cycle structurally impossible.
- Keep the DAG **shallow**. Add an edge only where an issue truly cannot start until another delivers a capability (e.g. "send queued records" needs "capture and store a record" first). Do not chain issues just because they touch the same file — that serializes work that could be parallel.
- A milestone usually has one or two entry-point issues (`BlockedBy: none`) — the walking skeleton — that later issues widen.

## Honoring the milestone's `Carries:` open questions

The milestone plan carries the SPEC's `Q-NNN` defaults on a `Carries:` line. Two cases:

- **A deferred enumeration** ("exact call sites — stage 3", "the four per-flow schemas not yet spelled out"): this is precisely your work. Turn each deferred item into a concrete issue (e.g. one issue per instrumented flow). The enumeration is the deliverable, so **be as concrete as the SPEC lets you**: name a _candidate_ allow-list — the specific fields you expect (identifiers, status/error codes) modelled on the SPEC's worked examples — not a hand-wave like "fields drawn from the failure surface." But do not invent field names by guessing at code you have not read (the no-stale-paths rule cuts both ways). The honest middle is a named starting set plus an explicit "confirm exact field names against the flow's error surface in stage 4" — concrete enough to review, honest about what the repo scan (stage 4) still has to pin down.
- **A settled default** ("ship the closed set of N flows; defer the global escape hatch to a fast-follow"): keep it. Slice only what the default includes; do not add issues for the deferred scope, and do not reopen the question. If you believe the default is wrong, stop and raise it with the user — do not silently widen scope.

## Granularity smells

- **Too fine:** an issue that only adds a helper with no behaviour of its own, or whose verification is a sub-step of another issue's test. Merge it up into the issue that gives it meaning.
- **Too coarse:** an issue whose acceptance criteria need several unrelated sentences, or that won't fit one context window. Split it on the seam between the behaviours.
- **No stale paths.** Describe _what to build_ and _how it's verified_, not _which file to edit_ — files drift, and scoping them is stage 4 (`jz-issue-to-contract`). The one exception is a decision-encoding snippet from a proven spike (a state machine, a schema shape), trimmed to the decision, noted as spike-derived.
