# Work Item

Work item: 2026-08-03-add-card-description-emphasis-guidance
Workflow: 2
Stage: deliver
Status: delivered
Started at: 2026-08-03T00:00:00+03:00
Max time: 45 minutes
Last time check: 2026-08-03T00:00:00+03:00
Turns since time check: 1
Review cycles: 1
Review status: passed
Review snapshot: sha256:227b1889b26b9deaf5d24de8d5ac327f719cf0be2cb098d4f22663d5db93eee3
Review batch: 2026-08-03-add-card-description-emphasis-guidance-review-1
Review expected: ["implementation-integrity"]
Review received: [{"reviewer":"implementation-integrity","outcome":"passed","batchId":"2026-08-03-add-card-description-emphasis-guidance-review-1","snapshot":"sha256:227b1889b26b9deaf5d24de8d5ac327f719cf0be2cb098d4f22663d5db93eee3"}]
Dangerous deletion or irreversible data loss: no
Hard prerequisites: resolved
Approval: not-required
Approval source: none

## Goal

Document restrained Markdown emphasis guidance for Trello Work Unit descriptions so agents can use bold text to make important terms easier to scan without changing the canonical Work Unit structure or CLI behavior.

## Non-goals

- Do not change Work Unit parsing, rendering, validation, or Trello lifecycle behavior.
- Do not require bold formatting for every card or prescribe a visual style beyond concise, restrained emphasis.
- Do not create a package release or globally reinstall the CLI.

## Acceptance criteria

- The shared protocol documents when and how to use bold emphasis for scanability, including a warning against overuse.
- The bundled design and delivery skills carry the same guidance, and their repository skill sources remain aligned with the packaged copies.
- Markdown formatting, workflow validation, and relevant documentation checks pass.

## Implementation summary

- Added restrained bold-emphasis guidance to the canonical and packaged protocol copies.
- Added matching description-formatting guidance to the repository and bundled design/delivery skills.
- Kept the protocol copies byte-identical; no CLI behavior, parser, renderer, package version, or global installation changed.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli format` passed; living-workflow validation and `git diff --check` passed.

## Review findings and repairs

- No Critical, High, Medium, or acceptance-related Minor findings.
- Confirmed the guidance is scoped to Markdown presentation, preserves canonical structure, and is synchronized across canonical and packaged protocol/skill surfaces.

## Final verification

Result: passed

- `pnpm --filter @jz/ai-arsenal-trello-work-cli format` — exit 0; all matched files use Prettier style.
- `pnpm check` — exit 0; repository formatting, lint, typecheck, package tests, workflow tests (118 passed, 2 expected skips), and workflow validation passed.
- `node scripts/validate-living-workflow.mjs` — exit 0.
- `node scripts/validate-monorepo-work-item.mjs --work-item 2026-08-03-add-card-description-emphasis-guidance --json` — exit 0; current verify state valid with fresh passed review evidence.
- `git diff --check` — exit 0.
- Canonical and packaged protocol copies have identical SHA-256 `B6197BBE73EF6BE3D9A629CD4C541CDAD3F3565D9A4B6319AAC0C58B3D3C53F2`.
