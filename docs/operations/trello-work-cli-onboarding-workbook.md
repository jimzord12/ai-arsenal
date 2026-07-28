# Trello Work CLI onboarding workbook

This workbook uses only the dedicated `TestingBoard`. Keep credentials in the process environment and use unique run tags and operation IDs.

## Preflight

1. Confirm `--board TestingBoard` resolves to `6a16bbf1fea5389eb39636b7`.
2. Confirm the board contains the six empty legacy canonical lists and no cards.
3. Run `jz-trello-flow workflow init --board TestingBoard --dry-run`; it must propose only `In Design`.
4. Run the authorized initialization once, then `jz-trello-flow doctor --board TestingBoard` and confirm seven unique open canonical lists.

## Path A: ordinary Inbox intake

1. Create one run-tagged ordinary Trello card in Inbox through the authorized test harness.
2. Confirm it appears in `jz-trello-flow inbox list --board TestingBoard` and is omitted from `jz-trello-flow list`.
3. Prepare a canonical **Inbox draft input** with `id: null`, `trello_card_id: null`, `status: inbox`, null timestamps, every standard section, explicit `Pending:` entries, and any material `Open Questions`. The file is design content for `jz-trello-flow design start`; do not use `test/fixtures/valid-in-design.md`, which represents the persisted post-conversion state.
4. Run `jz-trello-flow design start <card-id> --file <inbox-partial-draft.md> --if-version <version> --operation-id <id> --board TestingBoard`.
5. Confirm the same Trello card ID is now in In Design.

## Path B: agent-prepared Draft Work Unit

1. Copy `test/fixtures/valid-draft.md` and edit its content as needed; do not retain contradictory restrictions that prevent resolving Open Questions.
2. Run `jz-trello-flow draft create --file <draft.md> --operation-id <id> --board TestingBoard`.
3. Run `jz-trello-flow design start <card-id> --file <inbox-partial-draft.md> --if-version <version> --operation-id <id> --board TestingBoard`; this must be the same null-ID, `status: inbox` design-input shape described in Path A, not `valid-in-design.md`. Confirm same-card promotion.
4. `jz-trello-flow create` may be checked once as a deprecated alias; expect its warning and do not use it for new automation.

## Ready and completion

Resolve all `Pending:` entries and material Open Questions before transitioning In Design to Ready. Then exercise the configured supported transitions through Done with fresh versions and operation IDs.

## Cleanup

Move only run-tagged cards through supported transitions to Done. Close only empty disposable lists created by this run. Never archive/delete cards, checklists, comments, attachments, canonical lists, or unrelated resources. If an outcome is ambiguous, stop retries and preserve the credential-free recovery evidence.
