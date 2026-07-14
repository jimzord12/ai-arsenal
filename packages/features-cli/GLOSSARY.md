# Glossary

## Local Release

A Local Release of `@jz/ai-arsenal-features-cli` means all of the following:

1. Choose the appropriate SemVer bump: major, minor, or patch.
2. Create a Changeset and run `pnpm version-packages` so the package manifest
   version and generated `CHANGELOG.md` advance together.
3. Validate the release artifact required by the release scope.
4. Ask the user immediately before packing for, installing into, or replacing
   the Windows user's global pnpm `features-cli` package.
5. After the user confirms, perform the global local update and run the
   required smoke checks.

A source change is not a Local Release unless the user explicitly requests a
Local Release.
