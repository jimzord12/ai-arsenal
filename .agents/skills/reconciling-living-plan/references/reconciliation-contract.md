# Reconciliation Contract

## Canonical Plan

Update every affected section:

- Current verified state
- User-locked requirements
- Architecture
- Phase map
- Completed/current/future phase details
- Testing and verification
- Risks
- Open decisions
- Definition of done

The plan must not narrate its own diff.

## NEXT.md

Keep it compact and use:

```text
Project
State
Current phase

Next Action
Why This Is Next
Requirements
Blockers / Approval
Done When
After This
Source of Truth
```

Rules:

- Exactly one next action.
- Name the skill or command when known.
- Requirements are concrete checkboxes.
- State blockers explicitly.
- Keep it suitable for a 30-second human read.
- Never claim a phase complete without verification.
- If approval is required, approval itself is the next action.

## Reconciliation Evidence

Store:

```text
Phase:
Verification:
Resulting system state:
Discoveries:
Canonical plan updates:
NEXT.md update:
Approval required:
```

This report may mention changes. The canonical plan may not.
