# Implementation SPEC Template

Use this template for `.scratch/features/<NNN>-<feature-slug>/SPEC.md`.

The final SPEC may be very large. Delete sections only when they are truly irrelevant and say why. Never delete a section just because it is hard.

````markdown
---
spec_id: <FEATURE-KEBAB>-SPEC-<NNN>
title: <Human-readable feature title>
status: draft | approved | superseded
created_at: <YYYY-MM-DD>
updated_at: <YYYY-MM-DD>
repo: <repo name or path>
base_branch: <branch>
source_inputs:
  - <user notes / issue / PRD / conversation / file>
output_path: .scratch/features/<NNN>-<feature-slug>/SPEC.md
intended_implementer: fresh AI implementation agent with repo access but no chat history
---

# <Feature Title> Implementation SPEC

## 0. How to Use This SPEC

This SPEC is the complete implementation contract for <feature>. The implementation agent must:

1. Read this file fully before coding.
2. Treat locked decisions as non-negotiable.
3. Use the current-state map to locate relevant code.
4. Implement only the target behavior and non-goals described here.
5. Run the validation commands in the final checklist.
6. Ask for clarification only for items listed as blocking open questions.

## 1. Executive Summary

### Goal

<One paragraph describing what this feature changes for users/system.>

### Outcome

<Concrete final behavior after implementation.>

### Scope Classification

- Feature type: <new feature | behavior change | refactor-supported feature | bugfix | migration>
- Primary surfaces: <UI/API/native/background/job/etc.>
- Risk level: <low | medium | high> with reason

## 2. Decision Ledger

### 2.1 Locked Decisions

| ID         | Source                      | Source ID              | Decision                        | Implementation impact |
| ---------- | --------------------------- | ---------------------- | ------------------------------- | --------------------- |
| DEC-001    | <user/repo/file>            | <original id, or none> | <top-level accepted decision>   | <what this forces>    |
| SUBDEC-001 | <sub-feature/contract file> | <original id, or none> | <subordinate accepted decision> | <what this forces>    |

### 2.2 Assumptions

| ID      | Assumption   | Why this is reasonable     | How to verify       |
| ------- | ------------ | -------------------------- | ------------------- |
| ASM-001 | <assumption> | <repo convention/evidence> | <command/file/test> |

### 2.3 Open Questions

| ID      | Question   | Blocking? | Default if unanswered  |
| ------- | ---------- | --------- | ---------------------- |
| QUE-001 | <question> | yes/no    | <safe default or none> |

### 2.4 Non-Goals

- <Thing explicitly not included.>

## 3. User/Product Behavior Requirements

### 3.1 User Stories / Scenarios

```gherkin
Scenario: <name>
  Given <state>
  When <action>
  Then <observable result>
```
````

### 3.2 Functional Requirements

| ID     | Requirement         | Priority | Acceptance criteria    |
| ------ | ------------------- | -------- | ---------------------- |
| FR-001 | <specific behavior> | must     | <observable pass/fail> |

### 3.3 Non-Functional Requirements

| ID      | Requirement                         | Target                     |
| ------- | ----------------------------------- | -------------------------- |
| NFR-001 | <performance/security/offline/etc.> | <exact threshold/behavior> |

## 4. Current Codebase Map

### 4.1 Repository Snapshot

- Language/runtime:
- Frameworks:
- Package manager:
- Test runner:
- Build/lint commands:
- Relevant platform targets:

### 4.2 Relevant Existing Files

| Path           | Current responsibility | Relevant symbols/components | Why it matters            |
| -------------- | ---------------------- | --------------------------- | ------------------------- |
| `path/to/file` | <what it does now>     | `<symbol>`                  | <relationship to feature> |

### 4.3 Existing Patterns to Preserve

Describe each pattern directly. Do not just say “follow existing pattern.”

#### Pattern: <name>

- Used in: `path/to/file`
- Shape:
- Naming:
- Error handling:
- Testing style:
- Why this feature should follow it:

### 4.4 Constraints Found in Code

- <Version floors, API constraints, platform restrictions, architectural constraints.>

## 5. Target Design

### 5.1 Proposed Architecture

<Describe the chosen approach and why.>

### 5.2 Alternatives Considered

| Option | Pros  | Cons  | Decision        |
| ------ | ----- | ----- | --------------- |
| <A>    | <...> | <...> | chosen/rejected |

### 5.3 Component / Module Boundaries

| Module/File               | Responsibility         | Public interface            | Consumers     |
| ------------------------- | ---------------------- | --------------------------- | ------------- |
| `path/to/new-or-existing` | <single clear purpose> | `<function/type/component>` | <who uses it> |

### 5.4 Data Flow / Control Flow

Step-by-step flow:

1. <trigger>
2. <validation/state change/API call>
3. <result>
4. <error/rollback path>

## 6. Data, Types, and Contracts

### 6.1 Domain Model

```ts
// Use the repo's language. Include exact shapes when known.
interface Example {
  id: string;
}
```

### 6.2 API / Function Contracts

| Contract | Input    | Output   | Errors    | Notes      |
| -------- | -------- | -------- | --------- | ---------- |
| `<name>` | `<type>` | `<type>` | `<error>` | <behavior> |

### 6.3 State Transitions

| From    | Event   | To      | Side effects |
| ------- | ------- | ------- | ------------ |
| <state> | <event> | <state> | <effect>     |

## 7. Surface-Specific Design

Include only relevant subsections, but keep each selected subsection detailed.

### 7.1 Frontend / UI

- Screens/components affected:
- Props/state:
- Loading states:
- Empty states:
- Error states:
- Accessibility:
- Copy/text:
- Navigation:

### 7.2 Backend / API

- Endpoints/services affected:
- Request/response shape:
- Auth/permission model:
- Validation:
- Persistence:
- Error mapping:

### 7.3 Mobile / Native / Platform-Specific

- Android/iOS/platform impact:
- Permissions:
- Lifecycle/background behavior:
- Native modules/build settings:

### 7.4 Jobs / Background Processing

- Trigger:
- Idempotency:
- Retry policy:
- Failure handling:

## 8. Error Handling, Edge Cases, and Recovery

| Case        | Expected behavior | Implementation location | Test idea |
| ----------- | ----------------- | ----------------------- | --------- |
| <edge case> | <behavior>        | `path`                  | <test>    |

## 9. Security, Privacy, and Permissions

- Data exposure:
- PII handling:
- AuthN/AuthZ:
- Secret handling:
- Abuse cases:
- Audit/logging needs:

## 10. Performance, Offline, and Reliability

- Expected performance impact:
- Caching:
- Network behavior:
- Offline/degraded behavior:
- Concurrency/race conditions:
- Resource usage:

## 11. Migration and Backward Compatibility

- Existing users/data affected:
- Database/storage migrations:
- Feature flags/config:
- Rollback plan:
- Backward-compatible behavior:

## 12. Implementation Blueprint

This is not a task list. It is implementation guidance that makes the path unambiguous.

### 12.1 Files to Create

| Path               | Purpose   | Key contents                 |
| ------------------ | --------- | ---------------------------- |
| `path/to/new-file` | <purpose> | <types/functions/components> |

### 12.2 Files to Modify

| Path                    | Required change | Important existing pattern |
| ----------------------- | --------------- | -------------------------- |
| `path/to/existing-file` | <change>        | <pattern to preserve>      |

### 12.3 Suggested Implementation Order

1. <first safe vertical slice>
2. <next dependency>
3. <integration>
4. <tests/validation>

### 12.4 Interfaces That Must Stay Stable

- `<symbol>` because <consumer/reason>.

## 13. Test Strategy

### 13.1 Unit Tests

| Requirement | Test file      | Test case | Expected result |
| ----------- | -------------- | --------- | --------------- |
| FR-001      | `path/to/test` | <name>    | <result>        |

### 13.2 Integration / E2E Tests

| Scenario   | Tool        | Steps   | Expected result |
| ---------- | ----------- | ------- | --------------- |
| <scenario> | <test tool> | <steps> | <result>        |

### 13.3 Manual Validation

1. <step>
2. <step>
3. <expected observation>

### 13.4 Regression Tests

- <existing behavior that must not break.>

## 14. Validation Commands

```bash
# install / typecheck / lint / test / build commands, exact to this repo
<command>
```

Expected result:

```text
<expected output or success criteria>
```

## 15. Observability and Debugging

- Logs to add or preserve:
- Metrics/events:
- Debug switches:
- Common failure symptoms and where to inspect:

## 16. Risks and Mitigations

| Risk   |       Impact |   Likelihood | Mitigation   |
| ------ | -----------: | -----------: | ------------ |
| <risk> | high/med/low | high/med/low | <mitigation> |

## 17. Traceability Matrix

| Requirement/Decision | Implemented by      | Tested by   | Evidence            |
| -------------------- | ------------------- | ----------- | ------------------- |
| FR-001               | `path` / `<symbol>` | `test path` | `source path:lines` |

## 18. Handoff Checklist

Before implementation starts:

- [ ] All locked decisions are represented.
- [ ] All assumptions are explicit.
- [ ] All open questions are listed with blocking status.
- [ ] Relevant current code paths are mapped.
- [ ] Proposed file changes are named.
- [ ] Acceptance criteria are testable.
- [ ] Validation commands are exact.
- [ ] No chat history is required.

## Appendix A — Evidence Index

| Evidence ID | Source         | Relevant lines/symbols | What it proves |
| ----------- | -------------- | ---------------------- | -------------- |
| EVD-001     | `path/to/file` | `<lines/symbol>`       | <finding>      |

## Appendix B — Subagent Findings Summary

| Analyst         | Key findings | Conflicts/unknowns |
| --------------- | ------------ | ------------------ |
| Codebase mapper | <summary>    | <unknowns>         |

## Appendix C — Glossary

| Term   | Meaning in this feature/repo |
| ------ | ---------------------------- |
| <term> | <definition>                 |

```

```
