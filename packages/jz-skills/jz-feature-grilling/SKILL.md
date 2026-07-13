---
name: jz-feature-grilling
description: Pragmatic feature design grilling for local `.scratch/features/NNN-slug/` workspaces. Use when the user wants to grill, design, stress-test, continue, or standardize a feature or sub-feature design session before implementation.
---

# JZ Feature Grilling

Run a practical feature design interview that preserves decisions for later implementation.

## Core Rules

- Read root `CLAUDE.md` first when present.
- Use `.scratch/features/<id>-slug>/` as the feature workspace.
- Use `AGENTS.md` as the feature scoped instructions, rules and context.
- Use `features-cli progress --feature <slug> --json` as the workflow router.
- Use `GRILL_SESSION.md` as the design ledger, active next-question store, feature-specific user-request store, and decision log.
- Use `GLOSSARY.md` as the feature-specific domain language glossary.
- Use `contracts/` for normative code contracts tied to decision ids.
- Use `examples/` for illustrative code snippets tied to decision ids.
- Ask one decision question at a time.
- Offer 2-4 reasonable options as a numbered list.
- Prefix the recommended option exactly with `(recommended):`.
- Stay pragmatic for a small, inexperienced team that values delivery speed.
- Avoid rare edge-case branches unless they protect data correctness, fiscal/tax safety, payment correctness, privacy/security, or unrecoverable operations.
- If a question can be answered by reading local code or docs, inspect those before asking the user.

## Feature Layout

Expected feature shape:

```text
.scratch/features/<id>-slug/
  AGENTS.md
  GRILL_SESSION.md
  GLOSSARY.md
  PRD.md
  DECISIONS.md
  contracts/
  examples/
  SPEC.md
  sub-features/
  experiments/
  issues/
```

Only create optional directories when needed. Use `sub-features/` for child workstreams that need independent design state. Use `experiments/` for spikes and disposable validation. Use `issues/` after the accepted design is split for implementation.

## Progress Preflight

Run from the repository root before reading or mutating feature artifacts:

```powershell
features-cli progress --feature <feature-slug> --json
```

- Stop without mutation for `migration-required` or `archived`.
- If the target is `todo` or `paused`, inspect default `progress --json`. When no feature is current, activate the target with `update-feature <slug> --status in-progress`. When another feature is current, ask for approval and stop; after approval use one `update-feature <slug> --status in-progress --pause-current` call.
- If the feature is already in implementation, proceed only when the user explicitly requested a design revision. Then run `update-feature <slug> --phase design --focus GRILL_SESSION.md` after confirming the grill file exists.
- For a sub-feature revision, keep lifecycle state on the parent feature and set focus to the sub-feature directory or its `GRILL_SESSION.md`.
- If the frontier belongs to a later workflow skill and no revision was requested, stop and name that skill.
- Treat any required CLI failure as a stop; never claim a transition that did not persist.

## Resume Workflow

1. Resolve the feature under `.scratch/features/`.
2. Read root `CLAUDE.md`.
3. Read the feature `AGENTS.md`.
4. Read `GLOSSARY.md` when present.
5. Run the progress preflight.
6. Read `GRILL_SESSION.md` and continue from `## Next Question`.
7. If focus names a sub-feature, read its `AGENTS.md`, `GLOSSARY.md`, and `GRILL_SESSION.md`.

## Grilling Loop

For each decision:

1. Ask the stored next question or create the next highest-value decision question.
2. Include why the decision matters when the tradeoff is not obvious.
3. Provide 2-4 numbered options.
4. Mark one option with `(recommended):`.
5. After the user answers, update `GRILL_SESSION.md` before continuing.
6. Update `GLOSSARY.md` when a feature-specific term is introduced, renamed, disambiguated, or rejected.
7. Store the next question in `GRILL_SESSION.md`.
8. Use `update-feature --phase design --focus <path>` only when the durable phase/focus must change.

Do not chase every branch. Prefer questions that clarify user value, data contracts, persistence, API boundaries, privacy/security, fiscal/tax/payment safety, implementation ownership, or reviewable task breakdown.
Try to avoid questions about rare edge cases unless they provide significant value or protect against unrecoverable loss.

## Glossary

Create or update `GLOSSARY.md` when the feature introduces or sharpens a domain term.

Use it for feature-specific language only:

- Domain entities, roles, states, events, capabilities, provider names, payload names, or user-facing business concepts.
- Canonical terms that replace fuzzy or overloaded wording.
- Terms the team should avoid because they imply the wrong meaning.

Do not add general programming terms, implementation mechanics, or every noun from the conversation.

Keep definitions tight:

```md
**Pre-Authorization**: A payment capability where funds are reserved before a final capture or release decision.
_Avoid_: Deposit, hold payment
```

When a user uses fuzzy language, prefer a short clarification before adding the term. When the term is clear from the answer, update `GLOSSARY.md` immediately instead of batching glossary work.

## Contracts

Create or update a `contracts/D-xxx-short-name.md` file when a decision defines any of these:

- TypeScript interface or type.
- Zod schema or validation rule.
- API/function contract.
- Storage record, ledger, migration, payload, or envelope shape.
- UI wording contract, especially multilingual wording.
- Cross-module boundary or file layout.

Contracts are normative. Implementation should satisfy them.

Link each contract from the related decision in `GRILL_SESSION.md`:

```md
Contract:
See [contracts/D-004-business-context-schema.md](contracts/D-004-business-context-schema.md).
```

## Examples

Create or update an `examples/D-xxx-short-name.md` file when:

- The user asks what a question or option means in code.
- A snippet would reduce ambiguity for a future implementation agent.
- The behavior is easier to understand as pseudo-code, sample calls, or a small flow.

Examples are illustrative, not normative. They must say so clearly and link to any contract they depend on.

Do not create examples for every decision. Use them when they clarify API usage, branching logic, data transformation, validation, queue behavior, or UI flow.

## Templates

When creating a new feature or sub-feature design workspace, copy and fill the relevant files from:

- `templates/feature/`
- `templates/sub-feature/`

Keep placeholders brief. Remove sections that are truly irrelevant, but preserve `GRILL_SESSION.md ## Next Question` as the active design state and `GLOSSARY.md` as the feature-specific language record.

## SPEC Transition

When design is accepted, consolidate accepted decisions into `DECISIONS.md`. Invoke `jz-write-spec`; that skill owns SPEC focus and the transition to implementation after its gates pass.

`SPEC.md` should be sufficient for a separate implementation agent to build the feature without chat history. Treat glossary terms as canonical language, contracts as required behavior, and examples as explanatory support.
