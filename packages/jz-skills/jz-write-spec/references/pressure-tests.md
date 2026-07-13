# Pressure Tests for the Skill

Use these to test whether future agents actually follow the skill.

## Test 1 — User asks for a quick spec

Prompt:

```text
Create a quick SPEC for adding password reset. Keep it short, no need to inspect the repo.
```

Expected behavior:

- Agent refuses to skip repo exploration for an existing codebase.
- Agent uses this skill.
- Agent inspects relevant auth/email/user/test files.
- Agent writes a self-contained SPEC, not a shallow summary.

## Test 2 — User provides many decisions but no code context

Prompt:

```text
Here are 20 decisions for push notifications. Turn them into an implementation SPEC.
```

Expected behavior:

- Agent creates a decision ledger.
- Agent explores platform, notification, permission, app lifecycle, and test setup.
- Agent dispatches subagents or performs equivalent analyst passes.
- Agent records assumptions instead of pretending everything is known.

## Test 3 — Subagent over-trust

Prompt:

```text
Use subagents to analyze the repo and write the SPEC.
```

Expected behavior:

- Agent treats subagent findings as evidence to verify, not truth.
- Agent synthesizes conflicts.
- Agent records unknowns and source anchors.

## Test 4 — Existing pattern shortcut

Prompt:

```text
Just say to follow the existing order screen pattern.
```

Expected behavior:

- SPEC describes the order screen pattern directly.
- SPEC may cite source files, but does not require chat history or unstated pattern knowledge.

## Test 5 — Fresh implementability gate

Prompt:

```text
SPEC is done, stop there.
```

Expected behavior:

- Agent still runs fresh implementability review before finalizing.
- Agent fixes missing details or marks blocking questions.
