# Task 1 review package

Base commit: 58bf918
Head: uncommitted working tree (commits prohibited by user)

## Files

package.json
docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md
docs/workflow/templates/work-item/request.md
docs/workflow/templates/work-item/context.md
docs/workflow/templates/work-item/change-contract.md
docs/workflow/templates/work-item/implementation-plan.md
docs/workflow/templates/work-item/approval.md
docs/workflow/templates/work-item/implementation-report.md
docs/workflow/templates/work-item/verification.md
docs/workflow/templates/work-item/reconciliation.md
scripts/validate-monorepo-work-item.mjs
scripts/validate-monorepo-work-item.test.mjs

## Diff

diff --git a/package.json b/package.json
index b4f73fc..c3a532b 100644
--- a/package.json
+++ b/package.json
@@ -17,9 +17,11 @@
"lint:root": "eslint .",
"typecheck": "turbo run typecheck",
"test": "turbo run test",

- "test:workflow": "node --test scripts/validate-monorepo-work-item.test.mjs",
  "pack": "turbo run pack",
  "validate": "turbo run validate",

* "check": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test",

- "validate:workflow": "node scripts/validate-living-workflow.mjs && node scripts/validate-monorepo-work-item.mjs --work-item none --json",
- "check": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm test:workflow && pnpm validate:workflow",
  "changeset": "changeset",
  "version-packages": "changeset version"
  },
  diff --git a/docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md b/docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md
  new file mode 100644
  index 0000000..b7b3868
  --- /dev/null
  +++ b/docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md
  @@ -0,0 +1,188 @@
  +# Monorepo Work-Item Pipeline
-

+This is the normative contract for repository work items. It governs changes to
+the AI Arsenal monorepo and its packages; it never replaces the consumer +`.scratch/features/` workflow or uses `features-cli` for package self-hosting. +
+## Stage order +
+| Order | Skill | Required current artifacts | Durable output |
+| --- | --- | --- | --- |
+| 0 | `orchestrate-monorepo-work` | Repository and workflow state | Read-only routing brief |
+| 1 | `capture-monorepo-change` | Explicit request; no active work item | `request.md`; active registration |
+| 2 | `orient-monorepo-change` | Ready request | `context.md` |
+| 3 | `scope-monorepo-change` | Ready request and context | `change-contract.md` |
+| 4 | `plan-monorepo-change` | Ready contract | `implementation-plan.md` |
+| 5 | `record-monorepo-approval` | Explicit user approval of current plan | `approval.md` |
+| 6 | `implement-monorepo-change` | Contract and digest-bound approved plan | Product changes; `implementation-report.md` |
+| 7 | `verify-monorepo-change` | Contract, plan, report, and worktree | `verification.md` |
+| 8 | `reconcile-monorepo-change` | Passed verification and all current artifacts | Planning updates; `reconciliation.md` | +
+The router recommends the earliest eligible stage. It reads state and reports;
+it never writes files, mutates Git, advances artifacts, or grants approval. +
+## Work-item location and identity +
+Current artifacts live under: + +`text
+docs/work-items/YYYY-MM-DD-<lowercase-kebab-slug>/
+` +
+The directory name is the work-item ID. A capture operation must stop on a
+directory collision and must never reuse or overwrite another work item. +
+## Artifact header +
+Every current and archived artifact starts with these five lines in this exact
+order: + +`markdown
+Work item: <YYYY-MM-DD-slug>
+Artifact: <request|context|contract|plan|approval|implementation|verification|reconciliation>
+Revision: <positive integer>
+Prerequisites: <none|artifact@revision,...>
+Status: <draft|ready|approved|passed|failed|superseded>
+` +
+Prerequisite names use artifact types, not filenames. Lists contain no spaces.
+Current stage outputs use these identities and states: +
+| File | Artifact | Exact prerequisites | Current status |
+| --- | --- | --- | --- |
+| `request.md` | `request` | `none` | `ready` |
+| `context.md` | `context` | current `request` | `ready` |
+| `change-contract.md` | `contract` | current `request,context` | `ready` |
+| `implementation-plan.md` | `plan` | current `contract` | `ready` |
+| `approval.md` | `approval` | current `plan` | `approved` |
+| `implementation-report.md` | `implementation` | current `contract,plan,approval` | `ready` |
+| `verification.md` | `verification` | current `contract,plan,implementation` | `passed` or `failed` |
+| `reconciliation.md` | `reconciliation` | passed current `verification` | `passed` | + +`draft` is available while composing a replacement outside the current
+artifact path. `superseded` is historical. Neither is an eligible current
+pipeline state. +
+## Revisions and invalidation +
+Before replacing a current artifact at revision `N`, copy it to: + +`text
+revisions/<artifact-filename>/v<N>.md
+` +
+Then write current revision `N+1`. Historical files are retained. A current
+revision above `1` is structurally invalid when any prior archive is absent or
+has inconsistent work-item, artifact, or revision identity. +
+Every downstream current artifact names the exact current prerequisite
+revisions. Replacing a request, context, contract, or plan therefore makes any
+downstream artifact with an older prerequisite structurally stale. Archive and
+replace or remove invalidated downstream current artifacts before routing can
+continue. A contract or plan revision invalidates approval, implementation,
+verification, and reconciliation. The revised plan requires fresh explicit
+approval. +
+A failed verification permits re-entry only within the current contract and
+approved plan. The repair stage archives and replaces the implementation report
+and invalidates the failed verification before recording fresh verification. +
+## Approval binding + +`approval.md` contains these fields exactly once below its header: + +``markdown
+Approved plan SHA-256: `<64 lowercase hexadecimal characters>`
+Approved by: `user`
+Approval source: `<verbatim user approval summary>`
+`` +
+Calculate SHA-256 over the exact UTF-8 bytes of the current +`implementation-plan.md`. Any byte change changes the digest and invalidates
+approval. Conversation silence, a summary request, or an unanswered approval
+request never creates approval. +
+## Active registration in `NEXT.md` + +`NEXT.md` contains exactly one block: + +``markdown
+**Active work item:** `<YYYY-MM-DD-slug>`
+**Pipeline step:** `<skill-name|none>`
+`` +
+With no active item, both values are `none`. Capture registers the new ID and
+next stage. Each writing stage updates `Pipeline step` to the next eligible
+stage after successful artifact validation; a plan awaiting approval uses +`record-monorepo-approval`. Reconciliation clears both fields only after passed
+verification and passed reconciliation evidence exist. +
+## Validator +
+Run from the repository root: + +`text
+node scripts/validate-monorepo-work-item.mjs --work-item <YYYY-MM-DD-slug>
+node scripts/validate-monorepo-work-item.mjs --work-item <YYYY-MM-DD-slug> --json
+` +
+The JSON result is: +
+```json
+{

- "workItem": "2026-07-13-example",
- "valid": true,
- "nextSkill": "orient-monorepo-change",
- "blocker": null,
- "artifacts": {
- "request": { "revision": 1, "status": "ready" }
- }
  +}
  +```
-

+Invalid state returns the same shape with `valid: false`, `nextSkill: null`, a
+nonempty blocker, and exit code `1`. The validator reads only current artifacts,
+required archives, and active registration. It never writes files. + +`--work-item none` is the valid no-active-item check. It returns exit code `0`, +`nextSkill: null`, and blocker `No active work item.` when `NEXT.md` has no
+conflicting active registration. +
+## Routing decisions +
+| Valid state | Route |
+| --- | --- |
+| No request | `capture-monorepo-change` |
+| Request only | `orient-monorepo-change` |
+| Request and context | `scope-monorepo-change` |
+| Contract added | `plan-monorepo-change` |
+| Plan without approval | Stop for explicit approval; then `record-monorepo-approval` |
+| Valid approval, no report | `implement-monorepo-change` |
+| Report, no verification | `verify-monorepo-change` |
+| Failed verification | `implement-monorepo-change` |
+| Passed verification | `reconcile-monorepo-change` |
+| Passed reconciliation | Complete; no next skill | +
+## Structural stop conditions +
+Stop and route to `initializing-living-plan-workflow` when validation reports: +
+- malformed or inconsistent headers;
+- illegal current statuses or pipeline-order gaps;
+- missing or mismatched prerequisite revisions;
+- missing or inconsistent revision archives;
+- missing, malformed, or stale approval data;
+- multiple or malformed active registrations;
+- active registration that disagrees with the selected work item; or
+- reconciliation without passed verification. +
+The repair path may restore workflow metadata. It must not guess intent, grant
+approval, alter product scope, or silently discard historical artifacts. +
+## Mutation boundary +
+Stages 1–5 write planning artifacts only. Implementation is the only stage that
+may change product, test, or product documentation files. Verification records
+evidence and may create only isolated disposable test output. Reconciliation
+updates planning records only. Release, packing, publication, global
+installation, and source deletion are outside this pipeline.
diff --git a/docs/workflow/templates/work-item/request.md b/docs/workflow/templates/work-item/request.md
new file mode 100644
index 0000000..584953d
--- /dev/null
+++ b/docs/workflow/templates/work-item/request.md
@@ -0,0 +1,21 @@
+Work item: <YYYY-MM-DD-slug>
+Artifact: request
+Revision: <positive integer>
+Prerequisites: none
+Status: ready +
+# Request + +<Explicit user request> +
+## Desired outcome + +<User-described outcome> +
+## Constraints +
+<User-supplied constraints or `None supplied.`> +
+## User-provided context + +<Relevant supplied facts and unanswered questions>
diff --git a/docs/workflow/templates/work-item/context.md b/docs/workflow/templates/work-item/context.md
new file mode 100644
index 0000000..748f50d
--- /dev/null
+++ b/docs/workflow/templates/work-item/context.md
@@ -0,0 +1,25 @@
+Work item: <YYYY-MM-DD-slug>
+Artifact: context
+Revision: <positive integer>
+Prerequisites: request@<revision>
+Status: ready +
+# Applicable instructions + +<Root and scoped instruction sources> +
+## Repository snapshot +
+<Branch, commit, status, and relevant commands> +
+## Relevant files + +<Evidence-bearing paths> +
+## Risks + +<Known risks> +
+## Open questions +
+<Unresolved questions or `None.`>
diff --git a/docs/workflow/templates/work-item/change-contract.md b/docs/workflow/templates/work-item/change-contract.md
new file mode 100644
index 0000000..958d81d
--- /dev/null
+++ b/docs/workflow/templates/work-item/change-contract.md
@@ -0,0 +1,33 @@
+Work item: <YYYY-MM-DD-slug>
+Artifact: contract
+Revision: <positive integer>
+Prerequisites: request@<revision>,context@<revision>
+Status: ready +
+# Goal + +<One bounded goal> +
+## Non-goals + +<Explicit exclusions> +
+## Hard walls + +<Requirements that implementation must not cross> +
+## Acceptance criteria + +<Observable completion conditions> +
+## Test seams + +<Behaviors and boundaries that can be exercised> +
+## Verification + +<Required verification categories> +
+## Approval required +
+<Yes, with reason, or No>
diff --git a/docs/workflow/templates/work-item/implementation-plan.md b/docs/workflow/templates/work-item/implementation-plan.md
new file mode 100644
index 0000000..02a29c5
--- /dev/null
+++ b/docs/workflow/templates/work-item/implementation-plan.md
@@ -0,0 +1,25 @@
+Work item: <YYYY-MM-DD-slug>
+Artifact: plan
+Revision: <positive integer>
+Prerequisites: contract@<revision>
+Status: ready +
+# Preconditions + +<Required state before implementation> +
+## Ordered tasks +
+<Paths, inputs, outputs, tests, and expected results for each task> +
+## Affected paths + +<Exact planned paths> +
+## Verification commands + +<Exact commands and expected results> +
+## Rollback +
+<Rollback for stateful changes or `Not applicable.`>
diff --git a/docs/workflow/templates/work-item/approval.md b/docs/workflow/templates/work-item/approval.md
new file mode 100644
index 0000000..33f0ee7
--- /dev/null
+++ b/docs/workflow/templates/work-item/approval.md
@@ -0,0 +1,9 @@
+Work item: <YYYY-MM-DD-slug>
+Artifact: approval
+Revision: <positive integer>
+Prerequisites: plan@<revision>
+Status: approved +
+Approved plan SHA-256: `<64 lowercase hexadecimal characters>`
+Approved by: `user`
+Approval source: `<verbatim user approval summary>`
diff --git a/docs/workflow/templates/work-item/implementation-report.md b/docs/workflow/templates/work-item/implementation-report.md
new file mode 100644
index 0000000..dd376e1
--- /dev/null
+++ b/docs/workflow/templates/work-item/implementation-report.md
@@ -0,0 +1,21 @@
+Work item: <YYYY-MM-DD-slug>
+Artifact: implementation
+Revision: <positive integer>
+Prerequisites: contract@<revision>,plan@<revision>,approval@<revision>
+Status: ready +
+# Changed paths + +<Every changed path> +
+## Decisions + +<Implementation decisions within the contract> +
+## Tests + +<Tests added or changed and focused evidence> +
+## Deviations +
+<Contract deviations or `None.`>
diff --git a/docs/workflow/templates/work-item/verification.md b/docs/workflow/templates/work-item/verification.md
new file mode 100644
index 0000000..f6eaa89
--- /dev/null
+++ b/docs/workflow/templates/work-item/verification.md
@@ -0,0 +1,25 @@
+Work item: <YYYY-MM-DD-slug>
+Artifact: verification
+Revision: <positive integer>
+Prerequisites: contract@<revision>,plan@<revision>,implementation@<revision>
+Status: <passed|failed> +
+# Commands + +<Exact commands mapped to acceptance criteria> +
+## Exit codes + +<Observed exit code for every command> +
+## Observed result + +<Concise observed output and manual checks> +
+## Status + +<Passed or failed> +
+## Remaining failures +
+<Failures or `None.`>
diff --git a/docs/workflow/templates/work-item/reconciliation.md b/docs/workflow/templates/work-item/reconciliation.md
new file mode 100644
index 0000000..18ffee1
--- /dev/null
+++ b/docs/workflow/templates/work-item/reconciliation.md
@@ -0,0 +1,25 @@
+Work item: <YYYY-MM-DD-slug>
+Artifact: reconciliation
+Revision: <positive integer>
+Prerequisites: verification@<revision>
+Status: passed +
+# Resulting state + +<Verified current system state> +
+## Canonical-plan updates + +<Affected current-truth sections> +
+## NEXT.md update + +<Active-item closure and exact next action> +
+## Risks + +<Remaining risks> +
+## Next action + +<One exact operator action>
diff --git a/scripts/validate-monorepo-work-item.mjs b/scripts/validate-monorepo-work-item.mjs
new file mode 100644
index 0000000..9843fd4
--- /dev/null
+++ b/scripts/validate-monorepo-work-item.mjs
@@ -0,0 +1,407 @@
+import { createHash } from 'node:crypto';
+import fs from 'node:fs';
+import path from 'node:path'; +
+const root = process.cwd();
+const artifactDefinitions = [

- {
- key: 'request',
- file: 'request.md',
- statuses: ['ready'],
- prerequisites: [],
- },
- {
- key: 'context',
- file: 'context.md',
- statuses: ['ready'],
- prerequisites: ['request'],
- },
- {
- key: 'contract',
- file: 'change-contract.md',
- statuses: ['ready'],
- prerequisites: ['request', 'context'],
- },
- {
- key: 'plan',
- file: 'implementation-plan.md',
- statuses: ['ready'],
- prerequisites: ['contract'],
- },
- {
- key: 'approval',
- file: 'approval.md',
- statuses: ['approved'],
- prerequisites: ['plan'],
- },
- {
- key: 'implementation',
- file: 'implementation-report.md',
- statuses: ['ready'],
- prerequisites: ['contract', 'plan', 'approval'],
- },
- {
- key: 'verification',
- file: 'verification.md',
- statuses: ['passed', 'failed'],
- prerequisites: ['contract', 'plan', 'implementation'],
- },
- {
- key: 'reconciliation',
- file: 'reconciliation.md',
- statuses: ['passed'],
- prerequisites: ['verification'],
- },
  +];
  +const artifactByKey = new Map(
- artifactDefinitions.map((definition) => [definition.key, definition]),
  +);
  +const workItemPattern = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
-

+function parseArguments(argv) {

- let workItem = null;
- let json = false;
-
- for (let index = 0; index < argv.length; index += 1) {
- const argument = argv[index];
- if (argument === '--json') {
-      if (json) throw new Error('Duplicate argument: --json');
-      json = true;
-      continue;
- }
- if (argument === '--work-item') {
-      if (workItem !== null) throw new Error('Duplicate argument: --work-item');
-      const value = argv[index + 1];
-      if (!value || value.startsWith('--')) {
-        throw new Error('--work-item requires a value');
-      }
-      workItem = value;
-      index += 1;
-      continue;
- }
- throw new Error(`Unknown argument: ${argument}`);
- }
-
- if (workItem === null) throw new Error('Missing required argument: --work-item');
- if (workItem !== 'none' && !workItemPattern.test(workItem)) {
- throw new Error(
-      'Work-item ID must match YYYY-MM-DD-lowercase-kebab-slug or be none',
- );
- }
- return { workItem, json };
  +}
-

+function result(workItem, valid, nextSkill, blocker, artifacts = {}) {

- return { workItem, valid, nextSkill, blocker, artifacts };
  +}
-

+function parseActiveState() {

- const nextPath = path.join(root, 'NEXT.md');
- if (!fs.existsSync(nextPath)) return null;
-
- const contents = fs.readFileSync(nextPath, 'utf8');
- const activeMatches = [
- ...contents.matchAll(/^\*\*Active work item:\*\* `([^`]+)`\r?$/gm),
- ];
- const stepMatches = [
- ...contents.matchAll(/^\*\*Pipeline step:\*\* `([^`]+)`\r?$/gm),
- ];
-
- if (activeMatches.length === 0 && stepMatches.length === 0) return null;
- if (activeMatches.length !== 1 || stepMatches.length !== 1) {
- throw new Error(
-      'NEXT.md must contain exactly one active work-item field and one pipeline-step field',
- );
- }
-
- const activeWorkItem = activeMatches[0][1];
- const pipelineStep = stepMatches[0][1];
- if (
- activeWorkItem !== 'none' &&
- !workItemPattern.test(activeWorkItem)
- ) {
- throw new Error('NEXT.md contains a malformed active work-item ID');
- }
- if (
- pipelineStep !== 'none' &&
- !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pipelineStep)
- ) {
- throw new Error('NEXT.md contains a malformed pipeline step');
- }
- if ((activeWorkItem === 'none') !== (pipelineStep === 'none')) {
- throw new Error(
-      'NEXT.md active work item and pipeline step must both be none or both be set',
- );
- }
- return { activeWorkItem, pipelineStep };
  +}
-

+function parseArtifact(contents, definition, workItem) {

- const lines = contents.split(/\r?\n/);
- const expectedPrefixes = [
- 'Work item: ',
- 'Artifact: ',
- 'Revision: ',
- 'Prerequisites: ',
- 'Status: ',
- ];
- for (let index = 0; index < expectedPrefixes.length; index += 1) {
- if (!lines[index]?.startsWith(expectedPrefixes[index])) {
-      throw new Error(
-        `${definition.file} has a malformed header at line ${index + 1}`,
-      );
- }
- }
-
- const parsed = {
- workItem: lines[0].slice(expectedPrefixes[0].length),
- type: lines[1].slice(expectedPrefixes[1].length),
- revisionText: lines[2].slice(expectedPrefixes[2].length),
- prerequisitesText: lines[3].slice(expectedPrefixes[3].length),
- status: lines[4].slice(expectedPrefixes[4].length),
- };
-
- if (parsed.workItem !== workItem) {
- throw new Error(`${definition.file} has a mismatched work-item ID`);
- }
- if (parsed.type !== definition.key) {
- throw new Error(`${definition.file} has artifact type ${parsed.type}`);
- }
- if (!/^[1-9]\d*$/.test(parsed.revisionText)) {
- throw new Error(`${definition.file} revision must be a positive integer`);
- }
- if (!definition.statuses.includes(parsed.status)) {
- throw new Error(
-      `${definition.file} has illegal current status ${parsed.status}`,
- );
- }
-
- return {
- revision: Number(parsed.revisionText),
- status: parsed.status,
- prerequisitesText: parsed.prerequisitesText,
- };
  +}
-

+function validateArchivedRevisions(workItemDirectory, definition, artifact) {

- if (artifact.revision === 1) return;
-
- for (let revision = 1; revision < artifact.revision; revision += 1) {
- const archivePath = path.join(
-      workItemDirectory,
-      'revisions',
-      definition.file,
-      `v${revision}.md`,
- );
- if (!fs.existsSync(archivePath)) {
-      throw new Error(
-        `${definition.file} revision ${artifact.revision} is missing archived v${revision}`,
-      );
- }
- const archiveLines = fs.readFileSync(archivePath, 'utf8').split(/\r?\n/);
- if (
-      archiveLines[0] !== `Work item: ${path.basename(workItemDirectory)}` ||
-      archiveLines[1] !== `Artifact: ${definition.key}` ||
-      archiveLines[2] !== `Revision: ${revision}`
- ) {
-      throw new Error(
-        `${definition.file} archived v${revision} has inconsistent identity`,
-      );
- }
- }
  +}
-

+function validateApproval(workItemDirectory, planContents) {

- const approvalPath = path.join(workItemDirectory, 'approval.md');
- const approval = fs.readFileSync(approvalPath, 'utf8');
- const digestMatches = [
- ...approval.matchAll(
-      /^Approved plan SHA-256: `([0-9a-f]{64})`\r?$/gm,
- ),
- ];
- const approvedByMatches = [
- ...approval.matchAll(/^Approved by: `([^`]+)`\r?$/gm),
- ];
- const sourceMatches = [
- ...approval.matchAll(/^Approval source: `([^`]+)`\r?$/gm),
- ];
- if (
- digestMatches.length !== 1 ||
- approvedByMatches.length !== 1 ||
- sourceMatches.length !== 1
- ) {
- throw new Error('approval.md must contain each approval field exactly once');
- }
- if (approvedByMatches[0][1] !== 'user') {
- throw new Error('approval.md Approved by field must be user');
- }
- if (sourceMatches[0][1].trim().length === 0) {
- throw new Error('approval.md Approval source must not be empty');
- }
-
- const expectedDigest = createHash('sha256')
- .update(Buffer.from(planContents, 'utf8'))
- .digest('hex');
- if (digestMatches[0][1] !== expectedDigest) {
- throw new Error('approval.md plan digest is stale or incorrect');
- }
  +}
-

+function validateWorkItem(workItem, activeState) {

- const artifacts = {};
- if (activeState && activeState.activeWorkItem !== workItem) {
- throw new Error(
-      `NEXT.md active work item ${activeState.activeWorkItem} does not match ${workItem}`,
- );
- }
-
- const workItemsRoot = path.resolve(root, 'docs', 'work-items');
- const workItemDirectory = path.resolve(workItemsRoot, workItem);
- if (!workItemDirectory.startsWith(`${workItemsRoot}${path.sep}`)) {
- throw new Error('Work-item path escapes docs/work-items');
- }
-
- const existing = artifactDefinitions.map((definition) =>
- fs.existsSync(path.join(workItemDirectory, definition.file)),
- );
- const firstMissing = existing.indexOf(false);
- if (
- firstMissing !== -1 &&
- existing.slice(firstMissing + 1).some(Boolean)
- ) {
- throw new Error('Work-item artifacts contain a pipeline-order gap');
- }
-
- for (let index = 0; index < artifactDefinitions.length; index += 1) {
- if (!existing[index]) break;
- const definition = artifactDefinitions[index];
- const artifactPath = path.join(workItemDirectory, definition.file);
- const contents = fs.readFileSync(artifactPath, 'utf8');
- const artifact = parseArtifact(contents, definition, workItem);
- validateArchivedRevisions(workItemDirectory, definition, artifact);
-
- const expectedPrerequisites = definition.prerequisites
-      .map((key) => {
-        const prerequisite = artifacts[key];
-        if (!prerequisite) {
-          throw new Error(
-            `${definition.file} is missing prerequisite artifact ${key}`,
-          );
-        }
-        return `${key}@${prerequisite.revision}`;
-      })
-      .join(',');
- const expectedText = expectedPrerequisites || 'none';
- if (artifact.prerequisitesText !== expectedText) {
-      throw new Error(
-        `${definition.file} prerequisites must be ${expectedText}`,
-      );
- }
-
- artifacts[definition.key] = {
-      revision: artifact.revision,
-      status: artifact.status,
- };
- }
-
- if (artifacts.approval) {
- const planPath = path.join(workItemDirectory, artifactByKey.get('plan').file);
- validateApproval(workItemDirectory, fs.readFileSync(planPath, 'utf8'));
- }
- if (artifacts.reconciliation && artifacts.verification.status !== 'passed') {
- throw new Error('reconciliation requires passed verification');
- }
-
- if (!artifacts.request) {
- return result(workItem, true, 'capture-monorepo-change', null, artifacts);
- }
- if (!artifacts.context) {
- return result(workItem, true, 'orient-monorepo-change', null, artifacts);
- }
- if (!artifacts.contract) {
- return result(workItem, true, 'scope-monorepo-change', null, artifacts);
- }
- if (!artifacts.plan) {
- return result(workItem, true, 'plan-monorepo-change', null, artifacts);
- }
- if (!artifacts.approval) {
- return result(
-      workItem,
-      true,
-      null,
-      'Explicit user approval of the current implementation plan is required.',
-      artifacts,
- );
- }
- if (!artifacts.implementation) {
- return result(workItem, true, 'implement-monorepo-change', null, artifacts);
- }
- if (!artifacts.verification) {
- return result(workItem, true, 'verify-monorepo-change', null, artifacts);
- }
- if (artifacts.verification.status === 'failed') {
- return result(
-      workItem,
-      true,
-      'implement-monorepo-change',
-      'Required verification failed; repair within the approved contract.',
-      artifacts,
- );
- }
- if (!artifacts.reconciliation) {
- return result(workItem, true, 'reconcile-monorepo-change', null, artifacts);
- }
- return result(
- workItem,
- true,
- null,
- 'Work item is complete.',
- artifacts,
- );
  +}
-

+function print(output, asJson) {

- if (asJson) {
- process.stdout.write(`${JSON.stringify(output)}\n`);
- return;
- }
- console.log(`Work item: ${output.workItem}`);
- console.log(`Valid: ${output.valid}`);
- console.log(`Next skill: ${output.nextSkill ?? 'none'}`);
- console.log(`Blocker: ${output.blocker ?? 'none'}`);
  +}
-

+let parsedArguments = { workItem: null, json: process.argv.includes('--json') };
+try {

- parsedArguments = parseArguments(process.argv.slice(2));
- const activeState = parseActiveState();
- let output;
- if (parsedArguments.workItem === 'none') {
- if (activeState && activeState.activeWorkItem !== 'none') {
-      throw new Error(
-        `NEXT.md declares active work item ${activeState.activeWorkItem}`,
-      );
- }
- output = result(
-      'none',
-      true,
-      null,
-      'No active work item.',
-      {},
- );
- } else {
- output = validateWorkItem(parsedArguments.workItem, activeState);
- }
- print(output, parsedArguments.json);
  +} catch (error) {
- const blocker = error instanceof Error ? error.message : String(error);
- const output = result(
- parsedArguments.workItem,
- false,
- null,
- blocker,
- {},
- );
- print(output, parsedArguments.json);
- process.exitCode = 1;
  +}
  diff --git a/scripts/validate-monorepo-work-item.test.mjs b/scripts/validate-monorepo-work-item.test.mjs
  new file mode 100644
  index 0000000..f40f255
  --- /dev/null
  +++ b/scripts/validate-monorepo-work-item.test.mjs
  @@ -0,0 +1,204 @@
  +import assert from 'node:assert/strict';
  +import { createHash } from 'node:crypto';
  +import fs from 'node:fs';
  +import os from 'node:os';
  +import path from 'node:path';
  +import { spawnSync } from 'node:child_process';
  +import test from 'node:test';
  +import { fileURLToPath } from 'node:url';
-

+const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
+const validatorPath = path.join(

- scriptsDirectory,
- 'validate-monorepo-work-item.mjs',
  +);
  +const workItemId = '2026-07-13-example';
-

+function createFixture(t) {

- const root = fs.mkdtempSync(
- path.join(os.tmpdir(), 'ai-arsenal-work-item-'),
- );
- const workItemDirectory = path.join(root, 'docs', 'work-items', workItemId);
- fs.mkdirSync(workItemDirectory, { recursive: true });
- t.after(() => fs.rmSync(root, { force: true, recursive: true }));
- return { root, workItemDirectory };
  +}
-

+function artifact(type, prerequisites, status, body = '') {

- return `Work item: ${workItemId}\nArtifact: ${type}\nRevision: 1\nPrerequisites: ${prerequisites}\nStatus: ${status}\n${body}`;
  +}
-

+function writeArtifact(workItemDirectory, name, contents) {

- fs.writeFileSync(path.join(workItemDirectory, name), contents, 'utf8');
  +}
-

+function addRequest(workItemDirectory) {

- writeArtifact(
- workItemDirectory,
- 'request.md',
- artifact('request', 'none', 'ready'),
- );
  +}
-

+function addContext(workItemDirectory) {

- writeArtifact(
- workItemDirectory,
- 'context.md',
- artifact('context', 'request@1', 'ready'),
- );
  +}
-

+function addContract(workItemDirectory) {

- writeArtifact(
- workItemDirectory,
- 'change-contract.md',
- artifact('contract', 'request@1,context@1', 'ready'),
- );
  +}
-

+function addPlan(workItemDirectory) {

- const contents = artifact('plan', 'contract@1', 'ready', '\n# Plan\n');
- writeArtifact(workItemDirectory, 'implementation-plan.md', contents);
- return contents;
  +}
-

+function addApproval(workItemDirectory, planContents, digestOverride) {

- const digest =
- digestOverride ??
- createHash('sha256').update(Buffer.from(planContents, 'utf8')).digest('hex');
- writeArtifact(
- workItemDirectory,
- 'approval.md',
- artifact(
-      'approval',
-      'plan@1',
-      'approved',
-      `\nApproved plan SHA-256: \`${digest}\`\nApproved by: \`user\`\nApproval source: \`User approved the implementation plan.\`\n`,
- ),
- );
  +}
-

+function runValidator(root) {

- const result = spawnSync(
- process.execPath,
- [validatorPath, '--work-item', workItemId, '--json'],
- { cwd: root, encoding: 'utf8' },
- );
- let json;
- try {
- json = JSON.parse(result.stdout);
- } catch {
- assert.fail(
-      `validator did not emit JSON\nstdout: ${result.stdout}\nstderr: ${result.stderr}`,
- );
- }
- return { ...result, json };
  +}
-

+test('a ready request routes to orientation', (t) => {

- const fixture = createFixture(t);
- addRequest(fixture.workItemDirectory);
-
- const result = runValidator(fixture.root);
-
- assert.equal(result.status, 0);
- assert.equal(result.json.valid, true);
- assert.equal(result.json.nextSkill, 'orient-monorepo-change');
- assert.deepEqual(result.json.artifacts.request, {
- revision: 1,
- status: 'ready',
- });
  +});
-

+test('ready request and context route to scoping', (t) => {

- const fixture = createFixture(t);
- addRequest(fixture.workItemDirectory);
- addContext(fixture.workItemDirectory);
-
- const result = runValidator(fixture.root);
-
- assert.equal(result.status, 0);
- assert.equal(result.json.valid, true);
- assert.equal(result.json.nextSkill, 'scope-monorepo-change');
  +});
-

+test('a ready plan without approval blocks for explicit user approval', (t) => {

- const fixture = createFixture(t);
- addRequest(fixture.workItemDirectory);
- addContext(fixture.workItemDirectory);
- addContract(fixture.workItemDirectory);
- addPlan(fixture.workItemDirectory);
-
- const result = runValidator(fixture.root);
-
- assert.equal(result.status, 0);
- assert.equal(result.json.valid, true);
- assert.equal(result.json.nextSkill, null);
- assert.match(result.json.blocker, /explicit user approval/i);
  +});
-

+test('an approval with a stale plan digest is invalid', (t) => {

- const fixture = createFixture(t);
- addRequest(fixture.workItemDirectory);
- addContext(fixture.workItemDirectory);
- addContract(fixture.workItemDirectory);
- const planContents = addPlan(fixture.workItemDirectory);
- addApproval(fixture.workItemDirectory, planContents, '0'.repeat(64));
-
- const result = runValidator(fixture.root);
-
- assert.equal(result.status, 1);
- assert.equal(result.json.valid, false);
- assert.equal(result.json.nextSkill, null);
- assert.match(result.json.blocker, /digest/i);
  +});
-

+test('failed verification routes back to implementation', (t) => {

- const fixture = createFixture(t);
- addRequest(fixture.workItemDirectory);
- addContext(fixture.workItemDirectory);
- addContract(fixture.workItemDirectory);
- const planContents = addPlan(fixture.workItemDirectory);
- addApproval(fixture.workItemDirectory, planContents);
- writeArtifact(
- fixture.workItemDirectory,
- 'implementation-report.md',
- artifact(
-      'implementation',
-      'contract@1,plan@1,approval@1',
-      'ready',
- ),
- );
- writeArtifact(
- fixture.workItemDirectory,
- 'verification.md',
- artifact(
-      'verification',
-      'contract@1,plan@1,implementation@1',
-      'failed',
- ),
- );
-
- const result = runValidator(fixture.root);
-
- assert.equal(result.status, 0);
- assert.equal(result.json.valid, true);
- assert.equal(result.json.nextSkill, 'implement-monorepo-change');
  +});
-

+test('conflicting active work-item references are invalid', (t) => {

- const fixture = createFixture(t);
- addRequest(fixture.workItemDirectory);
- fs.writeFileSync(
- path.join(fixture.root, 'NEXT.md'),
- `# NEXT\n\n**Active work item:** \`${workItemId}\`\n**Pipeline step:** \`orient-monorepo-change\`\n**Active work item:** \`2026-07-13-other\`\n**Pipeline step:** \`orient-monorepo-change\`\n`,
- 'utf8',
- );
-
- const result = runValidator(fixture.root);
-
- assert.equal(result.status, 1);
- assert.equal(result.json.valid, false);
- assert.equal(result.json.nextSkill, null);
- assert.ok(result.json.blocker);
  +});
