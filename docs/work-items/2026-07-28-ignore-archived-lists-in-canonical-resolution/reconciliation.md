Work item: 2026-07-28-ignore-archived-lists-in-canonical-resolution
Artifact: reconciliation
Revision: 1
Prerequisites: verification@2
Status: passed

# Resulting state

Active canonical Trello workflow resolution and guarded initialization now ignore archived name-based candidates, reject archived configured mappings before active handlers, and preserve explicit archived-list ID reads, close replay, cleanup verification, and audit visibility. Offline package/root/workflow gates and fresh independent review pass.

## Canonical-plan updates

Update Current Verified State, Trello test architecture, Trello lifecycle maintenance state, Current Risks, Current Open Decisions, and Immediate Next Step to record the verified archived-list semantics and remove the obsolete repository-fix blocker. Preserve the separately gated global installation and TestingBoard retry as future operations after Git/CI capture.

## NEXT.md update

Clear the active work item and pipeline step after recording the verified result. Set the exact next action to commit and push this verified repository snapshot and wait for required GitHub Actions; keep global installation and TestingBoard workbook execution blocked until that capture is green.

## Risks

- The revised fix is not yet captured in Git or confirmed by remote CI.
- Live TestingBoard onboarding remains pending and must not run until the exact captured package is installed after green CI.
- Production-board access, publication, source deletion, and any other board remain unapproved.

## Next action

Commit and push the exact verified repository snapshot, then confirm required GitHub Actions pass for that commit; stop before global installation or live TestingBoard retry.
