Work item: 2026-07-29-fetch-trello-card-attachments
Artifact: request
Revision: 1
Prerequisites: none
Status: ready

# Request

Implement production-pragmatic attachment support for `jz-trello-flow get`.

## Desired outcome

Every `get` response informs the caller whether a card has zero, one, or multiple attachments and returns attachment metadata. An explicit attachment-directory option downloads all attached files safely.

## Constraints

- Normal `get` remains read-only with respect to the local filesystem and always reports attachment presence/metadata.
- Downloads require an explicit `--attachments-dir <directory>` option.
- Implement at production-pragmatic depth with focused tests, documentation, package/root gates, independent review, commit, push, and CI verification.
- Preserve existing card normalization, board validation, credential redaction, executable identity, schemas, and unrelated behavior.
- Do not publish, change the global installation, mutate Trello, access another board, expose credentials, or delete rollback sources.

## User-provided context

Card `6a691ff583597d8cfdd0c780` has an uploaded Markdown attachment named `sanity-nextjs-ai-setup-guide.md`. Current `get` omits attachment information. Trello attachment metadata is available through the card attachments endpoint; authenticated file download requires binary transport and OAuth authorization rather than the current JSON-only request path.
