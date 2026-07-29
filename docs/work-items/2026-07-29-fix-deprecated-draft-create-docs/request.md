Work item: 2026-07-29-fix-deprecated-draft-create-docs
Artifact: request
Revision: 1
Prerequisites: none
Status: ready

# Request

Replace the two deprecated `jz-trello-flow create` examples in the version-matched Trello CLI work guide with the preferred `jz-trello-flow draft create` command.

## Desired outcome

The recommended human workflow and examples consistently teach `draft create`, matching the guide's command catalog and the verified open-standard Trello skills.

## Constraints

- Preserve the deprecated alias documentation and runtime behavior; only recommended examples change.
- Preserve all completed uncommitted protocol and skill work.
- Do not change CLI implementation, tests, package boundary, version, release, installation, Trello state, commits, or pushes.
