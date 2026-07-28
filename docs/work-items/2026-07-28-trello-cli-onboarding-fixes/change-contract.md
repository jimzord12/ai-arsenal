Work item: 2026-07-28-trello-cli-onboarding-fixes
Artifact: contract
Revision: 2
Prerequisites: request@1,context@1
Status: ready

# Goal

Correct the confirmed Trello Work CLI defects and establish one coherent intake-to-design lifecycle in which ordinary Inbox cards or agent-created Draft Work Units are converted in place into canonical partial Work Units in a new In Design state, then completed before entering Ready; provide a corrected onboarding workbook for that lifecycle.

## Non-goals

- Publishing, releasing, globally reinstalling, or contacting a package registry.
- Treating global installation or live Trello mutation as repository acceptance evidence; those are a separately authorized post-capture operational validation.
- Mutating any Trello board other than TestingBoard during that later operational validation.
- Archiving or deleting user cards, checklists, comments, attachments, or unrelated lists.
- Designing automatic agent conversation content or replacing the separate `trello-design` skill responsibility.
- Changing Work Unit identity away from Trello's server-assigned board-scoped `idShort`.
- Adding production infrastructure, major dependencies, or generalized workflow engines.

## Hard walls

- Follow the project's guidelines.
- Use TestingBoard only for the separately authorized post-capture live Trello workbook.
- The user has deleted all cards and unrelated lists; only the six empty canonical lists remain.
- Ordinary Inbox cards are valid intake and must not be rejected merely because they are not Work Units.
- Selecting an Inbox card for design immediately claims and converts that same card in place; preserve its Trello ID, comments, attachments, and history.
- Add a canonical `In Design` state/list between Inbox and Ready.
- In Design cards use the canonical Work Unit structure with every standard section present; incomplete content is represented explicitly with pending entries and `Open Questions`, not arbitrary or structurally broken Markdown.
- `work draft create` creates an agent-prepared Draft Work Unit in Inbox.
- Keep `work create` temporarily as a backward-compatible deprecated alias for `work draft create` and emit a clear deprecation warning.
- `work design start` accepts either an ordinary Inbox card or a valid Draft Work Unit, preserves the same card, and moves it to In Design.
- Credentials remain process-environment-only and secret values must never be printed or persisted.
- Every mutation retains dry-run, version-check, durable operation-ID replay/collision, read-back verification, and credential-free recovery behavior.

## Acceptance criteria

- Metadata and description dry runs that return a valid planned proposal are emitted successfully instead of `MUTATION_INVALID_OUTCOME`.
- `work inbox list --board <selector>` returns ordinary Inbox cards and Draft Work Units without requiring ordinary cards to parse as Work Units.
- `work list --board <selector>` returns valid Work Units, includes In Design Work Units, ignores clearly ordinary Inbox cards, and identifies rather than silently hiding a card that claims Work Unit identity but is malformed.
- `work draft create` creates exactly one canonical Draft Work Unit in Inbox, derives verified Trello/Work Unit identity, supports dry-run/replay/recovery, and never predicts IDs during dry-run.
- Deprecated `work create` preserves the same behavior while issuing a non-secret deprecation warning directing callers to `work draft create`.
- `work design start <card-reference>` converts an ordinary Inbox card in place or promotes an existing valid Draft Work Unit in place, preserves the Trello card ID, writes canonical partial Work Unit content, moves it to In Design, and verifies description/status/list synchronization.
- Replaying an identical design-start operation recovers the same card; changed intent with the same operation ID fails with recovery evidence and creates no duplicate card.
- In Design permits explicit pending content and Open Questions while preserving canonical section order and parseability.
- In Design to Ready succeeds only when pending content and material Open Questions are resolved and all Ready requirements validate.
- Workflow initialization and diagnostics recognize seven unique canonical lists, creating only a missing In Design list while preserving existing lists.
- The corrected onboarding workbook begins from the now-clean TestingBoard, exercises both ordinary-card and Draft Work Unit intake paths proportionately, does not contain contradictory fixture-edit restrictions, and cleans up only run-owned disposable resources.
- Focused, package, repository, and workflow verification pass without credential or repository artifacts leaking.
- Strict package-boundary validation passes during implementation, generated tarballs are removed, and zero tarballs remain before repository verification.
- After repository reconciliation, review, commit, and capture, globally install that exact committed local package and execute the corrected workbook as a separate authorized TestingBoard operational validation.

## Test seams

- CLI result rendering for planned metadata/description mutations containing `proposed`.
- Classification of ordinary Inbox cards, valid Draft/partial/persisted Work Units, and malformed cards that claim Work Unit identity.
- Inbox listing and Work Unit listing with mixed card populations and filters.
- Draft creation command routing, deprecated alias warning, dry-run, verified creation, replay, collision, and ambiguous recovery.
- Design-start conversion of an ordinary card and promotion of an existing Draft Work Unit through injected Trello clients and real CLI parsing.
- Same-card identity, status/list synchronization, version guards, operation markers, and wrong-list rejection.
- In Design parser/validator rules and the stricter Ready transition boundary.
- Seven-list default/override resolution, guarded initialization, doctor output, and transition graph.
- Offline workbook validation in the repository test matrix.
- A separate post-capture operational seam globally installs the exact committed local package and runs one allowlisted clean-board TestingBoard lifecycle that records and cleans only run-owned resources; it is not repository verification evidence.

## Verification

- Demonstrate RED then GREEN focused regressions for each confirmed defect and each new public behavior slice.
- Run package formatting, linting, strict typechecking, and the complete Trello CLI test suite.
- Run root formatting, linting, typechecking, testing, monorepo workflow tests, and work-item validation.
- Record strict publint/package validation as implementation evidence, immediately remove generated tarballs, and prove none remain; repository verification must not repeat the prohibited packing action.
- Keep repository verification offline and stage-permitted.
- Obtain independent review of the exact stable snapshot with no unresolved Critical or High correctness/safety findings.
- After the repository workflow is reconciled, reviewed, committed, and captured, resolve exact TestingBoard ID `6a16bbf1fea5389eb39636b7`, globally install the exact committed local package, verify seven-list preconditions, execute the corrected run-tagged workbook, and independently inspect cleanup postconditions as the separate operational follow-up.

## Approval required

Yes. This contract changes public CLI commands, status/list workflow, validation behavior, and the transition graph. The approved command-model discussion resolves the contract decisions, but implementation still requires a separate digest-bound approval of the implementation plan.
