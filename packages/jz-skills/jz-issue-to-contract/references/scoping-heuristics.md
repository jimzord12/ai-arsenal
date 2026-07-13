# Scoping heuristics

How to turn one thin issue into a repo-grounded **bendable cage**. Read this before drawing scope.

## The bendable cage

The issue says _what work is wanted_. The contract says _what work is safe_. The SPEC says _why the work exists and what must stay true_. The contract sits between the issue and the implementer, and its whole job is to let a stage-5 agent move fast inside a boundary without going off the rails.

Two kinds of boundary, and the distinction is the point:

- **Soft scope** — the primary files this slice creates or edits, plus the reasonable neighbours a correct change touches (a barrel to re-export from, a types file to extend, the test file beside the unit). Editable freely. The implementer does not ask permission to add a small in-scope neighbour.
- **Hard wall** — a boundary that, if hit, means the plan was wrong: an out-of-scope file, an invariant that must be preserved, a public interface that must stay stable. Hitting a wall is a **STOP**, not a widen — the implementer emits a `ScopeExpansionRequest` and hands the decision back.

The cage is **bendable** on purpose. If every scope surprise required a formal request, you get scope-request thrashing and the loop stalls. So: soft scope flexes silently, walls stop hard, and only an architectural need forces a full re-scope. Err toward fewer, realer walls — a wall you invented for an edge case the SPEC deferred just blocks legitimate work.

## Grounding soft scope

Start from the SPEC's implementation blueprint — its _Files to Create_, _Files to Modify_, and _Relevant Existing Files_ tables — but treat them as leads, not proof. **Open or grep-confirm each path.** A SPEC written weeks ago can name a file that moved; a contract that sends the implementer at a stale path wastes the whole cycle.

For each soft-scope entry, record a one-line reason and the **existing pattern it must match** — the sibling the new code should look like. "Create `X` — the module's storage layer, mirrors the encrypted-instance pattern in `<real neighbour>`" beats a bare path. Consistency with neighbours is a merge blocker in this repo (root `CLAUDE.md`), so the contract names the neighbour to copy.

Reasonable neighbours belong in soft scope; distant files do not. The test: would a competent implementer touch this file to finish the slice correctly? If yes, it is soft scope. If touching it means the slice grew a second concern, it is probably a wall or a separate issue.

## Grounding hard walls

A wall must be a constraint the SPEC actually states — not a guess. Three sources:

1. **Stable public interfaces** — the SPEC's _Interfaces That Must Stay Stable_ section. A barrel's exported surface, persisted key names, an on-the-wire format validated against a live system. Changing one strands data or breaks callers, so it is a wall even when the file is technically in reach.
2. **Invariants** — the SPEC's invariants and state-transition rules. "Write the record key before the ledger entry so a crash never orphans a ledger row" is an ordering invariant; the contract names it so the implementer preserves it rather than rediscovering it.
3. **Out-of-scope files** — code the SPEC assigns to a _different_ issue or explicitly preserves unchanged. The neighbouring flow, the preserved legacy path, the file another blocker owns.

A wall names the specific thing it protects and why the stop matters. "Do not change `<barrel>`'s exported names (stable interface — the app imports them)" is a wall; "be careful with the barrel" is not.

Watch for a wall that blocks the issue's own required work — if the slice cannot be delivered without crossing it, the wall is wrong, or the issue is mis-scoped and needs escalation _now_, before stage 5.

## Seams and triangulation

A **seam** is the public boundary a test observes behaviour at — the interface where you see what the code does without reaching inside it. Tests live at seams, never against internals (mocking a private collaborator, asserting on a private field, or reading the datastore directly instead of through the interface are the implementation-coupled anti-patterns from `tdd`). Pre-agreeing the seams _here_ is what stops stage 5 from testing the wrong boundary or inventing seams mid-loop.

For each seam, write **triangulating acceptance cases**: ≥2–3 concrete `input → observable outcome` pairs. Triangulation is what makes a fake pass impossible — one case, a green agent satisfies with `return <constant>`; three cases pulling in different directions force the real behaviour. Two rules:

- **Independent expected values.** The expected value comes from the SPEC, a worked example, or a known-good literal — never recomputed the way the code computes it. `expect(f(a,b)).toBe(a+b)` is tautological: it passes by construction and can never disagree with the code.
- **In-slice only.** A case may assert only behaviour this issue's own slice — or a transitive blocker — delivers. If a case needs a guarantee another issue establishes, either that issue is a blocker (so the guarantee is available) or the case belongs to that issue, not this one.

Aim the seams at the critical paths and the complex logic, not every edge case — you cannot test everything, and agreeing the seams up front is how the effort lands where it matters.

## Carrying Method

The issue already carries a `Method` — the risk gate stage 3 set. The contract carries it verbatim into stage 5; it does not re-decide risk.

| `Method`       | Stage-5 topology                                              | Why it was chosen                                                                                                                                      |
| -------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tdd-pingpong` | fresh **red** agent + fresh **green** agent per tracer bullet | high-risk / subtle logic — sanitization, privacy, money, auth. A separate red agent can't rationalize a weak test to fit the code it's about to write. |
| `tdd-solo`     | one implementer runs the red→green loop                       | routine logic with a clear seam.                                                                                                                       |
| `direct`       | green-only, still reviewed                                    | trivial config / flag / wiring with no logic to get wrong.                                                                                             |

Add one line on _why_ this issue carries its Method — usually the same risk that set it (a privacy allow-list → `tdd-pingpong`; a pure flag gate → `direct`). This tells the stage-5 orchestrator what the seams are guarding.

## Escalation — when the cage bends vs breaks

The contract states the conditions that force a `ScopeExpansionRequest`. The implementer stops and emits one when:

- the correct solution needs editing a **file outside soft scope**;
- it would **cross a hard wall** (change a stable interface, break an invariant);
- it needs an **architectural change** the contract didn't anticipate;
- the **tests imply different behaviour** than the issue or SPEC (a sign the issue is wrong, not the code).

It does **not** stop to add a small in-scope neighbour — that is what soft scope is for. The request names what was discovered, why the current contract is insufficient, and the proposed scope change; the stage-5 orchestrator then approves inline or re-scopes. Format is in `contract-format.md`.
