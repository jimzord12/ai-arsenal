Work item: 2026-07-28-version-trello-work-cli
Artifact: request
Revision: 1
Prerequisites: none
Status: ready

# Request

Bump the `@jz/ai-arsenal-trello-work-cli` package version and add a changelog entry before globally installing the package.

## Desired outcome

The Trello Work CLI has a meaningful package version and changelog for the archived-list canonical-resolution fix, is captured and CI-green, and the exact resulting package can then be installed globally.

## Constraints

- Use the changelog and package-version bump before global installation.
- Commit and push are implicit prerequisites for required CI.

## User-provided context

- The package is currently version `0.0.0`.
- No changelog file currently exists in the repository.
- Open question: select the appropriate first version and changelog mechanism during orientation and planning.
- Global installation is requested after the repository change is captured and CI-green; installation itself is outside the monorepo work-item pipeline.
