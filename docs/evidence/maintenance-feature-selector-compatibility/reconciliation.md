# Maintenance Feature Selector Compatibility Reconciliation

Phase: Maintenance — Flexible Feature Selector Compatibility

Verification: Package formatting, linting, strict typechecking, strict packed-package validation, focused resolver and CLI tests, and the complete 144-test package suite passed.

Resulting system state: All `--feature` commands accept exact slugs, plain or zero-padded IDs, and matching full `ID-slug` directory names. Exact slugs retain precedence and mismatched full selectors fail safely.

Discoveries: The numbered feature directory shown in human output was not a valid selector before this maintenance change. Central resolution in `resolveFeatureForIssueRead` provides consistent compatibility without a schema or filesystem-layout change.

Canonical plan updates: Current verified state, behavioral contract, test coverage, phase map, maintenance state, and immediate next step now reflect the verified selector contract.

NEXT.md update: Points to merge/push and the resulting `master` CI confirmation.

Approval required: The user approved the public behavior change and requested branch merge, push, and deletion. No further approval is required for those actions; persisted schemas, distribution changes, user-state mutation, and source deletion remain gated.
