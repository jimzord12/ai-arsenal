# @jz/ai-arsenal-trello-work-cli

## 0.5.1

### Patch Changes

- Return ordinary cards as well as Work Units from member-filtered visible board listings while keeping archived cards excluded and metadata filters Work Unit-specific.

## 0.5.0

### Minor Changes

- Expose native Trello card members in read output and add exact member filtering while preserving the distinct Work Unit owner filter.

## 0.4.2

### Patch Changes

- Make bundled Trello Agent Skill installation self-contained and move official `skills-ref` validation to release verification.

## 0.4.1

### Patch Changes

- Preflight exact Trello descriptions, compact operation records without breaking legacy replay, repair transition dry-runs, and align resolved-question recovery guidance.

## 0.4.0

### Minor Changes

- Release the additive offline managed Trello Agent Skills installer and its packed payload for exact local distribution.

## 0.3.0

### Minor Changes

- Report Trello card attachment metadata from `get` and support explicit, authenticated, binary-safe attachment downloads with safe no-overwrite behavior.

## 0.2.0

### Minor Changes

- Replace the generic `work` executable with the unambiguous `jz-trello-flow` command across package metadata, help, shipped documentation, and operator workflows. The old executable alias is intentionally removed.

## 0.1.0

### Minor Changes

- Ignore archived Trello lists during active canonical workflow resolution and initialization while preserving explicit archived-list recovery and audit operations.
