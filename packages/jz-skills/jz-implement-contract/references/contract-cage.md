# Contract cage

Load this before editing beyond an obvious soft-scope file, or when implementation discovers new scope.

The `change-contract.md` is the boundary for Stage 5. It was produced after a repo scan and fresh-eyes review. Treat it as authoritative unless reality proves it wrong.

## Soft scope

Soft scope is editable:

- listed primary files;
- listed test files;
- reasonable neighbours needed to keep the listed change coherent;
- small helper files inside the same module when they preserve the contract's postcondition.

Small neighbour additions do not need approval when they stay within the same module, same seam, same invariant set, and same user-visible behaviour.

Record them in the final response.

## Hard walls

Hard walls stop implementation:

- stable public interfaces named by the contract or SPEC;
- invariants from the SPEC;
- out-of-scope files / call sites;
- feature behaviour deferred to later issues;
- data keys / storage formats that must stay stable;
- tests implying behaviour not described by the SPEC / issue / contract.

When a hard wall is hit, fill the contract's stub:

```markdown
## ScopeExpansionRequest (fill only if a hard wall is hit)

- **What was discovered:** <the file/interface/invariant the plan didn't anticipate>
- **Why the current contract is insufficient:** <what can't be done inside it>
- **Proposed change:** <files to add to soft scope, or wall to renegotiate>
- **Risk if ignored:** <low | medium | high>
```

Surface it to the user and stop. Do not continue by silently widening scope.

## Seams

Stage 4 already locked the seams and triangulating acceptance cases. Stage 5 implements against them.

If a seam appears untestable in practice, stop and classify why:

- test setup problem within soft scope -> fix setup;
- acceptance case needs a small helper in the same module -> add it as a neighbour;
- seam requires a different public boundary -> ScopeExpansionRequest.

Do not invent a more convenient seam and proceed.

## SPEC stays in the loop

When a role agent needs detail, send it back to `SPEC.md`; do not paraphrase the SPEC as the only source. The SPEC carries normative schemas, decision ids, rejected alternatives, non-goals, and validation commands that the contract intentionally references rather than duplicates.
