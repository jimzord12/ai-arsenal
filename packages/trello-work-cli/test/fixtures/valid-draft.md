# Work Unit

```yaml
id: null
trello_card_id: null
# prettier-ignore
title: "Ship a safe Trello Work Unit CLI"
type: task
status: inbox
priority: normal
complexity: medium
engineering_depth: production-pragmatic
risk: low
owner: null
parent: null
blocked_by: []
# prettier-ignore
labels: ["trello", "cli"]
created_at: null
updated_at: null
```

## Objective

Provide a deterministic command boundary.

## Scope

- Parse and validate canonical Work Units.

## Out of Scope

- Live mutation without configuration.

## Acceptance Criteria

- [ ] The canonical document validates.

## Verification

- Run the focused Jest suite.

## Context

The Work Unit is a draft until Trello assigns its identifiers.

## Open Questions

- Which Trello board and lists should be configured?
