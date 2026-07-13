# Method topologies

Load this when Stage 5 reaches the implementation loop.

The issue's `Method` is authoritative. It was chosen by Stage 3 and carried through Stage 4. Do not downgrade risk to save time.

Every role prompt includes:

```text
SPEC.md
issue.md
change-contract.md
```

Also include the current diff / test output when a later role needs it.

## `tdd-pingpong`

Use for high-risk logic such as privacy, sanitization, money, auth, state transitions, or subtle data correctness.

Loop one tracer bullet at a time:

1. Pick the next contract acceptance case or smallest coherent group of cases at one seam.
2. Dispatch a fresh **red** agent.
3. Red writes only the failing test and reports the command/output proving the expected failure.
4. The orchestrator verifies the red failure is correct: failing for missing behaviour, not typo/setup.
5. Dispatch a fresh **green** agent with the failing test, red output, and the three-file context.
6. Green writes the smallest implementation that passes.
7. The orchestrator runs the targeted test and relevant checks.
8. Repeat until contract acceptance is covered.

### Red agent prompt shape

```text
You are the RED agent for issue <NN>. Read these three files fully:
- <SPEC.md>
- <issue.md>
- <change-contract.md>

Write one failing test for this contract seam / acceptance case: <case>.
Use the contract's pre-agreed seam. Do not edit production code.
Stay inside the contract cage. If the test requires crossing a hard wall, stop and report the ScopeExpansionRequest reason.
Return changed test files and the failing command/output.
```

### Green agent prompt shape

```text
You are the GREEN agent for issue <NN>. Read these three files fully:
- <SPEC.md>
- <issue.md>
- <change-contract.md>

Use this failing test and output: <red result>.
Write the smallest implementation that makes it pass while staying inside soft scope.
Do not weaken the test. Do not add behaviour beyond the contract acceptance case.
If a hard wall is hit, stop and fill the ScopeExpansionRequest stub.
Return changed files and passing command/output.
```

Completion criterion: every in-scope acceptance case has gone red then green, targeted tests pass, and no hard-wall breach remains unresolved.

## `tdd-solo`

Use for routine logic where one implementer can safely run red -> green without the extra separation of ping-pong.

The orchestrator is the solo implementer. Invoke / follow the installed `tdd` skill yourself; do not dispatch another agent for a clear, bounded solo loop. Load all three files and prove each test failed before code made it pass.

Completion criterion: tests were written before production code for each behaviour, red failures were observed, green passes are recorded, and contract acceptance is covered.

## `direct`

Use for trivial config, wiring, copy, or no-logic work. Direct does not mean unreviewed, unverified, or unconstrained.

The orchestrator is the direct implementer. For an obvious deterministic correction with an established local pattern, make the edit immediately rather than spawning an implementation agent. Load all three files, edit only inside the contract cage, and add tests when the contract names them or the repo pattern requires them.

Completion criterion: the direct change satisfies the contract, verification passes, and a fresh review still runs.

## Role boundaries

- The orchestrator owns direct and solo implementation, status transitions, verification decisions, review routing, and ScopeExpansionRequest surfacing.
- Red owns failing tests only.
- Green owns implementation for the current failing test only.
- Review owns findings only. It does not patch.
