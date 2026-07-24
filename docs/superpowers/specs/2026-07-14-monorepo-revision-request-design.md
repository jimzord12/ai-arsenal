# Monorepo Revision-Request Design

## Objective

Make contract and plan revisions reachable through a durable, validator-backed
workflow path without manual `NEXT.md` overrides.

## Selected design

Add a `revision-request.md` control artifact and a narrow
`request-monorepo-revision` write-capable stage.

The stage runs only after a user directly requests revision of the active
work item's current contract or plan. It records that intent before changing
the active route, so the router remains the authority for the resulting
scope-or-plan handoff.

## Revision-request artifact

`revision-request.md` uses the standard five-line header with:

- `Artifact: revision-request`
- an incremented `Revision`
- one prerequisite, either `contract@<current>` or `plan@<current>`
- `Status: ready`

Its body records the revision target and the direct user-request wording. The
validator derives the allowed target from the single prerequisite and rejects
missing, duplicate, malformed, stale, or unsupported requests.

Consumed requests are archived under
`revisions/revision-request.md/v<N>.md` with only their header status changed
to `superseded`; no request history is silently discarded.

## Routing and ownership

`request-monorepo-revision` first validates the existing active work item,
creates the request artifact, and changes `NEXT.md` only to the target owner:

- a `contract@N` request routes to `scope-monorepo-change`;
- a `plan@N` request routes to `plan-monorepo-change`.

When a current revision request exists, the validator requires this matching
owner route instead of the normal forward route. The read-only router may
select `request-monorepo-revision` only for a direct user revision request,
just as it selects capture only for a direct new-change request.

Scoping consumes a contract request. It archives downstream current artifacts
in reverse dependency order, archives the replaced contract, archives the
consumed revision request, writes the next contract revision, and routes to
planning.

Planning consumes a plan request. It archives downstream current artifacts in
reverse dependency order, archives the replaced plan, archives the consumed
revision request, writes the next plan revision, and routes to fresh explicit
approval.

## Boundaries

- The mechanism applies only to current `contract` and `plan` artifacts.
- It preserves the existing archive-plus-increment rule and approval digest
  binding.
- It does not change product behavior, persisted product schemas, package
  distribution, consumer `.scratch` state, or Git history.
- User approval remains required for every revised implementation plan before
  implementation resumes.

## Verification

Disposable fixtures cover request creation, target validation, router
selection, contract and plan revision consumption, superseded archives,
downstream invalidation, and fresh approval routing. Workflow validator tests
guard the new skill identity, artifact schema, and root validation command.
