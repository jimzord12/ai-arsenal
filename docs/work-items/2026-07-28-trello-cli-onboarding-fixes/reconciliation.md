Work item: 2026-07-28-trello-cli-onboarding-fixes
Artifact: reconciliation
Revision: 1
Prerequisites: verification@2
Status: passed

# Resulting state

The Trello Work CLI now supports mixed Inbox intake, explicit Draft creation, same-card promotion into canonical partial In Design, strict completeness gating before Ready, and the seven-list lifecycle. Planned metadata dry-runs, durable operation replay/collision safety, executable command routing, docs, and the gated live harness are independently verified offline. Package/root/workflow gates pass with 230 package tests and 2 live cases intentionally skipped. No global installation or live Trello operation occurred in repository stages.

## Canonical-plan updates

Update current verified state, Trello test architecture, maintenance state, risks, open decisions, and immediate next step. Distinguish the newly verified offline implementation from historical dedicated-board live evidence and retain global installation/TestingBoard execution as the approved post-capture operation.

## NEXT.md update

Close the active work item and replace stale historical live-suite claims with the exact current state. The next action is to capture the exact verified snapshot in Git and verify the remote result; after capture, install that exact package globally and execute the separately authorized TestingBoard onboarding workbook.

## Risks

- The revised seven-list lifecycle and both intake paths are offline verified but have not yet been exercised against TestingBoard.
- Global Windows command resolution must use the captured local package and prove it does not replace an unrelated `work` executable.
- Live access remains allowlisted only to TestingBoard `6a16bbf1fea5389eb39636b7`; production-board use and atomic production Work Unit ID allocation remain unapproved.

## Next action

Commit and push the exact verified repository snapshot, verify the remote commit and CI, then use that captured package for the separately authorized global install and TestingBoard onboarding workbook.
