Work item: 2026-07-29-autonomous-work-item-pipeline
Artifact: contract
Revision: 1
Prerequisites: request@1,context@1
Status: ready

# Problem statement

Routine plan approval stops turn an effective evidence pipeline into repeated permission ceremony.

# Acceptance criteria

1. The eight-stage work-item pipeline and digest-bound `approval.md` artifact remain.
2. A ready plan routes to `record-monorepo-approval` as an executable autonomous stage, not a blocker.
3. `approval.md` accepts `Approved by: autonomous-agent` as well as legacy/direct `user` approval while retaining exact plan digest validation.
4. Repository instructions and stage skills prohibit routine approval prompts and define the narrow escalation conditions.
5. Plan revisions invalidate downstream authorization but are re-authorized autonomously unless the revised operation meets an escalation condition.
6. Missing hard prerequisites are escalated rather than bypassed with mocks or downgraded verification.
7. Dangerous deletion/data loss requires direct human approval immediately before the operation.
8. The package-owned Trello protocol distinguishes scoped authority from redundant interactive permission.
9. Existing user-approved work items remain valid.
10. Validator tests, workflow validation, formatting, and diff checks pass.

# Scope

Governance, workflow skills/templates, validator/tests, Trello protocol, current planning truth, and work-item evidence. No product CLI behavior, release, installation, live Trello mutation, or source deletion.

## Authority classification

Dangerous deletion or irreversible data loss: `no`
Hard prerequisites: `resolved`
