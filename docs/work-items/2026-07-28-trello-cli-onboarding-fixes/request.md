Work item: 2026-07-28-trello-cli-onboarding-fixes
Artifact: request
Revision: 1
Prerequisites: none
Status: ready

# Request

Investigate the two potential Trello Work CLI bugs discovered during the onboarding workbook run and fix the onboarding workbook.

## Desired outcome

Determine whether the metadata-update dry-run failure and label-filtered listing failure are CLI defects, fix confirmed defects, and correct the onboarding workbook so a clean TestingBoard run can complete.

## Constraints

- Follow the project's guidelines.
- Use TestingBoard only for any live Trello checks.
- The user has deleted all cards and unrelated lists; only the six empty canonical lists remain.

## User-provided context

The prior onboarding run observed `MUTATION_INVALID_OUTCOME` from a priority metadata dry run, `INVALID_REMOTE_WORK_UNIT` from `work list --label` when another malformed board card existed, and a copied fixture containing `Open Questions` that could not transition out of Inbox under the workbook's modification restrictions.
