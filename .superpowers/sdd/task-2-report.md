# Task 2 report — `orchestrate-monorepo-work`

## Result

Created the read-only router skill and its implicit-invocation metadata. The
skill consumes the Task 1 contract, repository instructions and state, and
validator JSON; its sole user-facing result is the required eight-field routing
brief.

## RED: no-skill control

Control prompt:

> Where are we in the monorepo work-item pipeline? I have not described a new
> change. Give me the next step and command. Keep it short; don't overthink it.

The fresh no-skill control returned exactly:

```text
Current state: No new work item is in play; the pipeline itself is being implemented.

Next step: Validate the intentional no-work-item state:

`pnpm validate:workflow`
```

It omitted six required routing-brief fields: Project, Current work item,
Current pipeline step, Next skill, Required input, and Approval/blockers. Its
routing basis was that no described change should use the no-item validation
path. This demonstrated an output-shape failure, so the skill uses a positive
eight-label output recipe rather than a prohibition list.

## GREEN: forward-use scenario

The same user prompt was run by a fresh agent after it read the completed
skill. It returned only the required labels, once each and in order:

```text
Project: AI Arsenal monorepo
Current work item: none
Current pipeline step: none
Next skill: None — continue the approved pipeline implementation
Required input: None
Why this is next: No new change was described; the no-item validator passes.
Approval/blockers: Implementation is approved; do not commit or push without direction.
Recommended command: `pnpm check`
```

The forward result correctly did not recommend `capture-monorepo-change`
without a new described change, reported the current `NEXT.md` action, and
preserved the eight-field-only contract. No new rationalization appeared, so no
refactor was necessary.

## Commands and results

1. `node scripts/validate-monorepo-work-item.mjs --work-item none --json`
   - Exit 0; returned `valid: true`, `nextSkill: null`, and
     `blocker: "No active work item."`.
2. `pnpm format:check` (initial run)
   - Exit 1; identified only
     `.agents/skills/orchestrate-monorepo-work/SKILL.md` as needing Prettier
     formatting.
3. `pnpm exec prettier --write '.agents/skills/orchestrate-monorepo-work/SKILL.md'`
   - Exit 0; formatted the new skill file.
4. `node scripts/validate-monorepo-work-item.mjs --work-item none --json`
   - Exit 0; same valid no-active JSON result.
5. `pnpm format:check`
   - Exit 0; `All matched files use Prettier code style!`.
6. `git diff --check`
   - Exit 0; no whitespace errors.

## Changed paths

- `.agents/skills/orchestrate-monorepo-work/SKILL.md`
- `.agents/skills/orchestrate-monorepo-work/agents/openai.yaml`
- `.superpowers/sdd/task-2-report.md` (this required task report)

## Decisions

- The router is explicitly read-only and names the write-capable stage rather
  than performing it.
- Validator JSON is the authority for a valid active work item; valid plan
  approval waits remain a human stop.
- Invalid validator output, stale approval, multiple active work items, and
  malformed metadata route only to `initializing-living-plan-workflow`.
- The frontmatter uses a trigger-only `Use when` description and the metadata
  follows the repository's existing `agents/openai.yaml` schema with implicit
  invocation enabled.

## Self-review

- Verified all Task 2 required reads, including Task 1's resulting guide and
  report, `NEXT.md`, relevant canonical-plan section, scoped instructions,
  Git state, and existing metadata schema.
- Confirmed the skill requires root/scoped instructions, `NEXT.md`, canonical
  plan, Git status/recent commits, and validator JSON.
- Confirmed the output contract contains exactly the eight mandated labels and
  states the no-active and structural-stop routing rules.
- No commit or push was made. No production, workflow-contract, validator, or
  user-data file was modified.

## Concerns

The current `NEXT.md` predates Task 11's explicit active-work-item fields, so
the forward scenario inferred `none` from the valid no-active validator result.
Task 11 will add the canonical fields; the router already handles the intended
post-integration metadata contract.

## Independent-review repair — 2026-07-13

### Result

Repaired the two review findings in
`.agents/skills/orchestrate-monorepo-work/SKILL.md` only:

- Lines 22–35 now require exactly one readable, valid active-work-item and
  pipeline-step pair before choosing a validator command. Missing, unreadable,
  duplicate, malformed, or inconsistent metadata stops at
  `initializing-living-plan-workflow`; it must not infer no active item or use
  the `none` validation path.
- Lines 44–52 now limit capture to a new change inside the normal pipeline and
  explicitly exclude release, packing, publishing, global installation, and
  source deletion. The reference table (line 85) and mistake guard (lines
  93–97) reinforce that these requests never route to
  `capture-monorepo-change`.

These repairs implement the plan's Global Constraints: the normal pipeline
ends after reconciliation, while releases, packing, publishing, global
installation, and source deletion remain outside it.

### Focused test-first documentation checks

**RED (pre-repair):** Ran the following transient read-only documentation
check before editing the skill:

```powershell
@'
const fs = require('node:fs');
const skill = fs.readFileSync('.agents/skills/orchestrate-monorepo-work/SKILL.md', 'utf8');
const failures = [];
if (!/missing or unreadable[\s\S]{0,500}must not[\s\S]{0,180}`none`/i.test(skill)) failures.push('missing explicit guard that missing/unreadable active metadata must not select the none path');
if (!/release[\s\S]{0,140}packing[\s\S]{0,140}publish(?:ing|ation)?[\s\S]{0,140}global installation[\s\S]{0,140}source deletion[\s\S]{0,500}capture-monorepo-change/i.test(skill)) failures.push('missing explicit exclusion of release/distribution/source-deletion requests from capture routing');
if (failures.length) throw new Error(failures.join('; '));
console.log('router repair documentation checks pass');
'@ | node -
```

Exit 1, as expected, with both failures:

```text
missing explicit guard that missing/unreadable active metadata must not select the none path;
missing explicit exclusion of release/distribution/source-deletion requests from capture routing
```

**GREEN (post-repair):** Ran the corresponding transient read-only check:

```powershell
@'
const fs = require('node:fs');
const skill = fs.readFileSync('.agents/skills/orchestrate-monorepo-work/SKILL.md', 'utf8');
const failures = [];
if (!/either value being missing, unreadable, duplicated, malformed, or[\s\S]{0,350}do not infer a no-active-item state[\s\S]{0,120}run the `none` validation path/i.test(skill)) failures.push('missing explicit guard that missing/unreadable active metadata must not select the none path');
if (!/Release, packing, publishing, global installation, and source deletion are[\s\S]{0,550}do\s+not route it to `capture-monorepo-change`/i.test(skill)) failures.push('missing explicit exclusion of release/distribution/source-deletion requests from capture routing');
if (failures.length) throw new Error(failures.join('; '));
console.log('router repair documentation checks pass');
'@ | node -
```

Exit 0:

```text
router repair documentation checks pass
```

### Required command results

1. `node scripts/validate-monorepo-work-item.mjs --work-item none --json`
   - Exit 0:
     `{"workItem":"none","valid":true,"nextSkill":null,"blocker":"No active work item.","artifacts":{}}`
2. `pnpm format:check`
   - Exit 0: `All matched files use Prettier code style!`
3. `git diff --check`
   - Exit 0; no output.

No metadata, reports other than this required task report, ledger, Git history,
or other workflow/product files were changed by this repair. No commit or push
was performed.
