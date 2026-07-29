Work item: 2026-07-29-fetch-trello-card-attachments
Artifact: contract
Revision: 1
Prerequisites: request@1,context@1
Status: ready

# Goal

Extend `jz-trello-flow get` so every successful result reports all card attachment metadata and an explicit `--attachments-dir <directory>` option safely downloads all uploaded files.

## Non-goals

- No implicit download during ordinary `get`.
- No attachment upload, deletion, mutation, preview, content parsing, or MIME-based execution.
- No Trello mutation, package publication, global installation, schema change, unrelated refactor, or production-board operation.
- No generalized download manager, retry framework, archive extraction, or malware scanning.

## Hard walls

- Preserve existing Work Unit normalization, board-membership checks, output redaction, exit-code conventions, and all commands other than the additive `get` option/result fields.
- Never write outside the explicit destination directory; reject unsafe or unusable filenames.
- Never silently overwrite an existing file or another attachment in the same invocation.
- Never print, persist, or expose Trello credentials or authenticated URLs.
- Default `get` performs no local filesystem writes.
- Download all uploaded attachments in the metadata order returned by Trello; external URL attachments remain metadata-only and are not fetched.
- A download failure exits nonzero and identifies the attachment safely; already completed files may remain and must not be represented as a complete download set.

## Acceptance criteria

- A card with no attachments returns `attachmentCount: 0` and `attachments: []`.
- A card with one or multiple attachments returns `attachmentCount` equal to the complete attachment metadata array length, including ID, name, URL classification, MIME type, byte size, date, and upload status without credentials.
- Text output visibly reports the attachment count and one metadata line per attachment.
- `--attachments-dir` is accepted only by `get`, creates the destination when needed, downloads every uploaded attachment using authenticated binary-safe transport, and reports the absolute downloaded path.
- External-link attachments remain listed but are marked not downloaded.
- Filename traversal and separator input cannot escape the destination; duplicate or existing destinations are handled deterministically without silent overwrite.
- Metadata, file-download authentication, binary integrity, CLI routing/output, filesystem behavior, errors, docs, and packed boundary have regression coverage.
- Package and root gates, workflow validators, independent review, Git/remote capture, and required CI pass.

## Test seams

- Trello response normalization for zero, one, multiple, malformed, uploaded, and external attachments.
- Binary transport request URL/header and exact byte preservation.
- `getWorkUnit` result composition and metadata counts.
- CLI parser acceptance/rejection, JSON output, text output, and injected filesystem/download boundaries.
- Temporary-directory tests for creation, safe names, duplicate/existing paths, exact bytes, external links, and partial failure.
- Built-in help/docs, README, shipped guide, package tests, root checks, packed artifact validation, and CI.

## Verification

- Focused Jest tests for `trello-client`, `read-commands`, `cli`, and docs must pass after observed RED/GREEN cycles.
- `pnpm --filter @jz/ai-arsenal-trello-work-cli format`, `lint`, `typecheck`, `test`, and `validate` must pass.
- `pnpm check`, both workflow validators, and `git diff --check` must pass.
- An independent reviewer must inspect the exact staged snapshot for correctness, security, scope, and missing tests.
- Commit/push the reviewed snapshot, prove `HEAD` equals `origin/master`, and confirm Quality and Portability CI succeed for the exact SHA.
- No live Trello mutation or global installation is part of verification.

## Approval required

Yes. This adds public CLI output fields and an explicit filesystem-writing option; implementation requires digest-bound approval of the exact plan.
