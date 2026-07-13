# Contract format

The exact `change-contract.md` shape, a worked example, and the `ScopeExpansionRequest` stub. Markdown throughout — no YAML, no graph files, no per-issue schema zoo.

## Location

Beside the issue it contracts:

```text
.scratch/features/<NNN>-<feature-slug>/issues/<NN>-<issue-slug>/change-contract.md
```

## Template

```markdown
# Change Contract — <issue title>

Issue: `<NN>-<issue-slug>` · Method: `<tdd-pingpong|tdd-solo|direct>` · Milestone: `<slug>`

## Goal / postcondition

One precise paragraph: what is true after this slice that was not before, from the
caller's / user's perspective. The issue's behaviour made concrete — not a file plan.

## Traces

The SPEC ids this contract is grounded in (carried from the issue's `Traces:` line).
Follow these into the SPEC for schemas, invariants, and interfaces — the contract
references them, it does not restate them.

<FR-…, NFR-…, DEC-…, SUBDEC-…>

## Soft scope — edit freely

Primary files + reasonable neighbours. Each: real path, one-line reason, pattern to match.

| Path          | Create / edit | Reason & pattern to match                   |
| ------------- | ------------- | ------------------------------------------- |
| `<real path>` | create        | <why; mirrors the pattern in `<neighbour>`> |
| `<real path>` | edit          | <why; preserve `<what>`>                    |

## Hard walls — STOP if hit

Out-of-scope files, invariants to preserve, public interfaces that must stay stable.
Hitting one forces a ScopeExpansionRequest — never widen silently.

- **<interface/invariant/file>** — <what it protects and why the stop matters>.

## Seams to test

The public boundaries the tests observe at (never internals). Pre-agreed here so
stage 5 does not renegotiate them.

- **<seam>** — <the observable behaviour at this boundary>.

## Triangulating acceptance cases

Per seam, ≥2–3 concrete input → observable outcome pairs with independently-sourced
expected values (SPEC / worked example / known-good literal), so a hardcoded return
cannot pass. In-slice only.

**Seam: <seam>**

- [ ] <input> → <observable outcome> (<source of expected value, e.g. SUBDEC-013>)
- [ ] <input> → <observable outcome>
- [ ] <input> → <observable outcome>

## Method / risk

`<Method>` — <one line on why this issue carries this risk gate>.

## Escalation — what forces a ScopeExpansionRequest

- <e.g. needing to change a hard-walled interface>
- <e.g. a test implying behaviour different from the issue/SPEC>
  Small in-scope neighbour additions do NOT need a request.
```

## Worked example — issue 1, `capture-and-store-one-record`

The walking skeleton (`Method: tdd-pingpong`, privacy-sensitive). Trimmed to show shape and grounding; a real run fills every row.

```markdown
# Change Contract — Capture one validated diagnostic into the encrypted queue and read it back

Issue: `01-capture-and-store-one-record` · Method: `tdd-pingpong` · Milestone: `capture-and-store`

## Goal / postcondition

After this slice, `captureDiagnostic(input)` validates `input` against a strict Zod
schema and, on success, persists exactly one `StoredDiagnosticRecord` (service-generated
UUID id, ISO `createdAt`, validated input, bounded safe exception, app+device context,
`sizeBytes`) into the diagnostics module's OWN private encrypted MMKV instance, writing
the record key before the ledger entry, and returns `{ success: true, diagnosticId }`.
An authoritative read returns that record intact. Capture never throws to the caller.

## Traces

FR-001, FR-005; NFR-005, NFR-007; D-006, D-014, SDK-D-003, SDK-D-005, SDK-D-012,
SDK-D-013, SDK-D-022, SDK-D-023, SDK-D-028, SDK-D-029. (Prefixes are this SPEC's;
the skill is prefix-agnostic.)

## Soft scope — edit freely

| Path                                             | Create / edit   | Reason & pattern to match                                                                              |
| ------------------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------ |
| `src/services/diagnostics/constants.ts`          | create          | ledger/record keys + caps; module-owned string constants (§6.2).                                       |
| `src/services/diagnostics/diagnosticTypes.ts`    | create          | Zod schemas `.strict()` at every level + inferred types (§6.1).                                        |
| `src/services/diagnostics/diagnosticsStorage.ts` | create          | private encrypted instance + enqueue/read; mirrors `secure-storage/encrypted-storage/storage.ts`.      |
| `src/services/diagnostics/diagnosticsService.ts` | create          | `captureDiagnostic` orchestration.                                                                     |
| `src/services/diagnostics/index.ts`              | create          | barrel; re-export the public API.                                                                      |
| `src/services/diagnostics/*.test.ts`             | create          | colocated Jest tests; DeviceInfo mocked to `mocked-*` (see `api/vcr-api/diagnostics/wrapper.test.ts`). |
| `src/utils/crypto-utils/uuid.js`                 | reuse (no edit) | `generateUUIDv4()` for record ids (SDK-D-012).                                                         |

## Hard walls — STOP if hit

- **Public barrel names** (`captureDiagnostic`, `getDiagnosticsQueueSummary`,
  `prepareDiagnosticsSend`, `sendPreparedDiagnostics`, `clearDiagnosticsQueue`) — the
  app's contract with the module (§12.4). This issue adds only `captureDiagnostic`;
  it must not rename or reshape the others' planned signatures.
- **MMKV key names** (`diagnostics.queue.ledger`, `diagnostics.record.<id>`) — changing
  them strands stored data (§12.4).
- **The shared secure-storage MMKV instance** — the module creates its OWN instance;
  reusing `secure-storage`'s is rejected (SDK-D-003). Out of scope to touch.
- **NFR-007** — the core service imports no React context. A hook is a later issue.
- **No raw object spread into the stored record** — only bounded, allow-listed fields;
  `afm` is an explicit ≤20-char field, never merged via spread (SDK-D-013/028/029).

## Seams to test

- **`captureDiagnostic(input)` return + queue side effects** — the public capture API.
- **Authoritative read** — reads back the stored record.
- **Zod validation boundary** — strict schema accept/reject.

## Triangulating acceptance cases

**Seam: `captureDiagnostic` return + side effects**

- [ ] Valid input → `{ success: true, diagnosticId }`; exactly one record key + one ledger item written (§6.5).
- [ ] `businessContext.afm` of 21 chars → rejected as invalid input; nothing written (SDK-D-029).
- [ ] Unknown top-level key → rejected by `.strict()`; nothing written (SDK-D-005).
- [ ] Storage throws → capture swallows it and returns a structured failure, does not throw (FR-004 is issue 2; here: does not throw).

**Seam: authoritative read**

- [ ] After a valid capture, read returns the record with id, validated input, app/device context, fields intact (§6.1).
- [ ] Stored record carries only allow-listed fields — no raw arbitrary object spread (SDK-D-013).

**Seam: private encrypted instance**

- [ ] Record persists via `.withEncryption()` and survives an app restart (NFR-005, SDK-D-003).

## Method / risk

`tdd-pingpong` — the slice authors the sanitization/allow-list and the strict schema;
privacy leakage is the silent-and-costly risk a separate red agent guards against.

## Escalation — what forces a ScopeExpansionRequest

- Needing to touch any file outside soft scope (e.g. a flow call site — those are issues 07–12).
- Needing to change a barrel signature or MMKV key name (hard wall).
- A test implying the stored record should carry a field the SPEC's schema does not define.
  Small in-scope additions (another `constants.ts` value, a nested schema) do NOT need a request.
```

## ScopeExpansionRequest stub

Include this stub at the end of every contract so stage 5 has the shape ready. The implementer fills and surfaces it (does not silently proceed) when a hard wall is hit.

```markdown
## ScopeExpansionRequest (fill only if a hard wall is hit)

- **What was discovered:** <the file/interface/invariant the plan didn't anticipate>
- **Why the current contract is insufficient:** <what can't be done inside it>
- **Proposed change:** <files to add to soft scope, or wall to renegotiate>
- **Risk if ignored:** <low | medium | high>
```

Keep it a stub — plain prose, no schema. The stage-5 orchestrator reads it, then approves the addition inline or triggers a re-scope.
