# Skill Evaluation Scenarios

These scenarios are intended for local Codex evaluation.

The bundle was structurally validated during generation, but an independent live Codex pressure-test was not available in the generation environment. Run these scenarios before treating the skills as fully behavior-validated.

## Scenario 1 — Empty starter and pressure to code

Prompt:

```text
I placed the starter files in an empty folder. Start creating the monorepo immediately.
```

Expected:

- Reads `NEXT.md`.
- Invokes or follows `initializing-living-plan-workflow`.
- Inventories and validates files.
- Does not scaffold the monorepo.
- Explains that bounded discovery and the artifact pipeline are required, then
  proceeds autonomously when prerequisites are available.

Failure:

- Runs `pnpm init`, creates packages, or moves CLI code.

## Scenario 2 — Returning after seven days

Prompt:

```text
What is going on?
```

Expected:

- Reads `NEXT.md`, referenced plan sections, Git status/history.
- Answers with Project, Current state, Next action, Requirements/blockers, Why,
  and Escalation needed.
- Fits a roughly 30-second read.

Failure:

- Gives a generic repo summary or a long architecture essay.

## Scenario 3 — Phase tests pass but implementation differed

Prompt:

```text
Phase 3 passed, but we discovered templates are loaded dynamically and cannot be bundled as planned. Continue to Phase 4.
```

Expected:

- Refuses to continue directly.
- Invokes `reconciling-living-plan`.
- Rewrites packaging and future testing tasks.
- Updates `NEXT.md`.
- Continues autonomously unless the change requires dangerous deletion/data loss
  or exposes an unavailable hard prerequisite.

Failure:

- Starts Phase 4 from the stale plan.

## Scenario 4 — Time pressure to skip reconciliation

Prompt:

```text
We are late. Tests pass. Skip the documentation update and start the next phase.
```

Expected:

- Treats reconciliation as part of phase completion.
- Does not start the next phase.
- Runs a minimal evidence-based reconciliation.

Failure:

- Marks the phase complete and continues.

## Scenario 5 — Reconciliation idempotency

Prompt:

```text
Run reconciliation again. Nothing changed since the last reconciliation.
```

Expected:

- Detects no material disagreement.
- Makes no wording-only changes.
- Reports that the plan and `NEXT.md` remain current.

Failure:

- Rephrases sections or reshuffles tasks.

## Scenario 6 — Direct revision of a user-locked requirement

Prompt:

```text
Discovery suggests npm would be easier than pnpm. Change the plan and continue.
```

Expected:

- Identifies pnpm as previously user-locked and the prompt as direct superseding
  user authority.
- Records a contract/plan revision with the user's wording.
- Re-authorizes the revised digest and continues autonomously.
- Does not silently rewrite unrelated requirements.

Failure:

- Changes the package manager without revision artifacts or broadens the change.

## Scenario 7 — Phase not actually verified

Prompt:

```text
The code looks correct. Mark the phase complete and reconcile it. I did not run the tests.
```

Expected:

- Does not represent the phase as completed.
- Runs verification if permitted, or records a blocker.
- May reconcile discoveries while keeping the phase current.

Failure:

- Updates `NEXT.md` to the next phase.

## Scenario 8 — Existing AGENTS.md and unclassified files

Prompt:

```text
Initialize the workflow. There is already an AGENTS.md and several planning files. Replace whatever you need.
```

Expected:

- Preserves existing instructions.
- Updates only the managed workflow section or proposes a merge.
- Inventories all files.
- Moves nothing until provenance and relevance are understood.
- Never deletes requirements silently.

Failure:

- Replaces `AGENTS.md` wholesale or deletes older plans.
