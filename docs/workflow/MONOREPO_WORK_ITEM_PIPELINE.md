# Monorepo Work-Item Pipeline

This is the normative contract for repository work items. It governs changes to
the AI Arsenal monorepo and its packages; it never replaces the consumer
`.scratch/features/` workflow or uses `features-cli` for package self-hosting.

## Stage order

| Order | Skill                       | Required current artifacts                     | Durable output                              |
| ----- | --------------------------- | ---------------------------------------------- | ------------------------------------------- |
| 0     | `orchestrate-monorepo-work` | Repository and workflow state                  | Read-only routing brief                     |
| R     | `request-monorepo-revision` | Direct user request; active current target     | `revision-request.md`; owner route          |
| 1     | `capture-monorepo-change`   | Explicit request; no active work item          | `request.md`; active registration           |
| 2     | `orient-monorepo-change`    | Ready request                                  | `context.md`                                |
| 3     | `scope-monorepo-change`     | Ready request and context                      | `change-contract.md`                        |
| 4     | `plan-monorepo-change`      | Ready contract                                 | `implementation-plan.md`                    |
| 5     | `record-monorepo-approval`  | Ready plan; resolved escalation classification | Digest-bound `approval.md`                  |
| 6     | `implement-monorepo-change` | Contract and digest-bound approved plan        | Product changes; `implementation-report.md` |
| 7     | `verify-monorepo-change`    | Contract, plan, report, and worktree           | `verification.md`                           |
| 8     | `reconcile-monorepo-change` | Passed verification and all current artifacts  | Planning updates; `reconciliation.md`       |

The router recommends the earliest eligible stage. It reads state and reports;
it never writes files, mutates Git, advances artifacts, or grants approval.

## Work-item location and identity

Current artifacts live under:

```text
docs/work-items/YYYY-MM-DD-<lowercase-kebab-slug>/
```

The directory name is the work-item ID. A capture operation must stop on a
directory collision and must never reuse or overwrite another work item.

## Artifact header

Every current and archived artifact starts with these five lines in this exact
order:

```markdown
Work item: <YYYY-MM-DD-slug>
Artifact: <request|context|contract|plan|approval|implementation|verification|reconciliation|revision-request>
Revision: <positive integer>
Prerequisites: <none|artifact@revision,...>
Status: <draft|ready|approved|passed|failed|superseded>
```

Prerequisite names use artifact types, not filenames. Lists contain no spaces.
Current stage outputs use these identities and states:

| File                       | Artifact         | Exact prerequisites                    | Current status       |
| -------------------------- | ---------------- | -------------------------------------- | -------------------- |
| `request.md`               | `request`        | `none`                                 | `ready`              |
| `context.md`               | `context`        | current `request`                      | `ready`              |
| `change-contract.md`       | `contract`       | current `request,context`              | `ready`              |
| `implementation-plan.md`   | `plan`           | current `contract`                     | `ready`              |
| `approval.md`              | `approval`       | current `plan`                         | `approved`           |
| `implementation-report.md` | `implementation` | current `contract,plan,approval`       | `ready`              |
| `verification.md`          | `verification`   | current `contract,plan,implementation` | `passed` or `failed` |
| `reconciliation.md`        | `reconciliation` | passed current `verification`          | `passed`             |

`draft` is available while composing a replacement outside the current
artifact path. `superseded` is historical. Neither is an eligible current
pipeline state.

## Direct contract and plan revision

An explicit user request or an agent-detected in-contract contract/plan defect may
enter `request-monorepo-revision`. The stage
writes `revision-request.md` with exactly one current `contract@N` or
`plan@N` prerequisite, one `Revision target:` field, and the initiating user or
agent rationale in one `Revision source:` field. It changes only the pipeline step: contract
requests route to scope and plan requests route to planning.

Scope consumes a contract request by archiving downstream current artifacts in
reverse dependency order, then the contract and request, before writing
`contract@N+1` and routing to planning. Planning similarly archives downstream
artifacts, then the plan and request, before writing `plan@N+1` and requiring
fresh digest authorization. Routine revisions are re-authorized autonomously;
only the narrow escalation conditions below require user interaction. Every
archive preserves bytes except `Status:
superseded`.

## Revisions and invalidation

Before replacing a current artifact at revision `N`, copy it to the historical
path and change only its header status to `superseded`:

```text
revisions/<artifact-filename>/v<N>.md
```

Then write current revision `N+1`. Historical files are retained. A current
revision above `1` is structurally invalid when any prior archive is absent,
lacks the complete five-line header, does not have `superseded` status, has
inconsistent identity, or references a prerequisite revision that does not
exist.

Every downstream current artifact names the exact current prerequisite
revisions. Replacing a request, context, contract, or plan therefore makes any
downstream artifact with an older prerequisite structurally stale. Archive and
replace or remove invalidated downstream current artifacts before routing can
continue. A contract or plan revision invalidates approval, implementation,
verification, and reconciliation. The revised plan requires fresh digest authorization.

A failed verification permits re-entry only within the current contract and
approved plan. While `NEXT.md` routes to implementation, archive the failed
current `verification.md` at its existing revision with `Status: superseded`,
then archive the current `implementation-report.md` the same way. Write the
next implementation-report revision against the unchanged current
contract, plan, and approval. After it is complete, set `NEXT.md` to
`verify-monorepo-change`; fresh verification writes the next verification
revision against that new implementation revision. This preserves both failed
attempt records and never overwrites or restores a verification result in
place.

Every current `change-contract.md` intended for autonomous authorization must
classify authority with exactly one of each:

```markdown
Dangerous deletion or irreversible data loss: `<yes|no>`
Hard prerequisites: `<resolved|blocked>`
```

The validator accepts `autonomous-agent` only for `no` and `resolved`.

## Digest authorization binding

`approval.md` contains these fields exactly once below its header:

```markdown
Approved plan SHA-256: `<64 lowercase hexadecimal characters>`
Approved by: `<user|autonomous-agent>`
Approval source: `<verbatim user approval|policy:ai-arsenal-autonomy-v1>`
```

Calculate SHA-256 over the exact UTF-8 bytes of the current
`implementation-plan.md`. Any byte change changes the digest and invalidates
authorization. `autonomous-agent` requires the exact machine-checkable source
`policy:ai-arsenal-autonomy-v1` and is valid when the current contract and plan do
not require dangerous deletion or similarly irreversible data loss and no hard
prerequisite is missing. `user` is used when the user directly approves a
dangerous operation. Silence never authorizes a dangerous operation.

For a dangerous operation, Stage 5 plan approval is necessary but not sufficient.
Implementation must re-read current target state and obtain direct confirmation
immediately before the exact irreversible command/action, then record that
execution-time confirmation and result. Changed state or target coverage requires
fresh confirmation.

The approval artifact name and stage name are retained for compatibility. For
routine work this stage records an authorization decision; it does not ask the
user for permission.

## Active registration in `NEXT.md`

`NEXT.md` contains exactly one block:

```markdown
**Active work item:** `<YYYY-MM-DD-slug>`
**Pipeline step:** `<skill-name|none>`
```

With no active item, both values are `none`. Capture registers the new ID and
next stage. Each writing stage updates `Pipeline step` to the next eligible
stage after successful artifact validation; a plan awaiting digest authorization uses
`record-monorepo-approval`. Reconciliation clears both fields only after passed
verification and passed reconciliation evidence exist.

## Validator

Run from the repository root:

```text
node scripts/validate-monorepo-work-item.mjs --work-item <YYYY-MM-DD-slug>
node scripts/validate-monorepo-work-item.mjs --work-item <YYYY-MM-DD-slug> --json
node scripts/validate-monorepo-work-item.mjs --current --json
```

The JSON result is:

```json
{
  "workItem": "2026-07-13-example",
  "valid": true,
  "nextSkill": "orient-monorepo-change",
  "blocker": null,
  "artifacts": {
    "request": { "revision": 1, "status": "ready" }
  }
}
```

Invalid state returns the same shape with `valid: false`, `nextSkill: null`, a
nonempty blocker, and exit code `1`. The validator reads only current artifacts,
required archives, and active registration. It never writes files.

`--work-item none` is the valid no-active-item check. It returns exit code `0`,
`nextSkill: null`, and blocker `No active work item.` when `NEXT.md` has no
conflicting active registration.

## Routing decisions

| Valid state               | Route                       |
| ------------------------- | --------------------------- |
| No request                | `capture-monorepo-change`   |
| Request only              | `orient-monorepo-change`    |
| Request and context       | `scope-monorepo-change`     |
| Contract added            | `plan-monorepo-change`      |
| Plan without approval     | `record-monorepo-approval`  |
| Valid approval, no report | `implement-monorepo-change` |
| Report, no verification   | `verify-monorepo-change`    |
| Failed verification       | `implement-monorepo-change` |
| Passed verification       | `reconcile-monorepo-change` |
| Passed reconciliation     | Complete; no next skill     |

## Executable lifecycle coverage

`scripts/validate-monorepo-work-item.test.mjs` creates only disposable
temporary work-item roots. Its complete-lifecycle test validates every normal
route from request through passed reconciliation, including autonomous digest authorization. It records failed verification, routes through the active
implementation registration, archives the failed verification and first
implementation report, and writes incremented implementation and verification
revisions before confirming reconciliation routing resumes. The fixture never
creates or mutates a real `docs/work-items/` artifact or consumer `.scratch`
state.

## Structural stop conditions

Stop and route to `initializing-living-plan-workflow` when validation reports:

- malformed or inconsistent headers;
- illegal current statuses or pipeline-order gaps;
- missing or mismatched prerequisite revisions;
- missing or inconsistent revision archives;
- missing, malformed, or stale authorization data;
- multiple or malformed active registrations;
- active registration that disagrees with the selected work item; or
- reconciliation without passed verification.

The repair path may restore workflow metadata. It must not guess intent, invent
authorization, alter product scope, or silently discard historical artifacts.

## Autonomy and escalation

The pipeline is an audit and correctness mechanism, not a routine human
permission gate. Agents continue autonomously through all eight stages,
including plan revisions, implementation, verification repairs, routine commit,
and routine push, when work remains within the recorded contract.

For a plan containing dangerous deletion or similarly irreversible data loss,
obtain direct user digest authorization at Stage 5 and fresh direct confirmation
again immediately before executing the exact destructive operation. Escalate
when a hard requirement cannot be satisfied honestly, including missing
credentials/access required by E2E tests, contradictory authority, or an
impossible requirement. Do not mock, skip, or downgrade required evidence merely
to avoid escalation. Failed tests, review findings, routine ambiguity, and
recoverable in-contract operations are repair-loop inputs rather than permission
stops.

## Mutation boundary

Stages 1–5 write planning artifacts only. Implementation is the only stage that
may change product, test, or product documentation files. Verification records
evidence and may create only isolated disposable test output. Reconciliation
updates planning records and may commit and push the exact verified, attributable
snapshot when the contract does not forbid Git delivery. Release, packing,
publication, global installation, destructive history rewriting, and source
deletion are outside this pipeline.
