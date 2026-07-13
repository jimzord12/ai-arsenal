# features-cli Package Instructions

## Self-hosting boundary

Do not use `features-cli` to manage, plan, or track work on
`packages/features-cli` itself.

Maintain this package through the AI Arsenal monorepo living-plan workflow:

- `NEXT.md`
- `docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md`
- verification evidence under `docs/evidence/`
- package tests and release validation
- Changesets and required approval gates

Use `features-cli` only for feature workflows in consumer projects. This keeps
the package's behavior and its own maintenance authority separate.
