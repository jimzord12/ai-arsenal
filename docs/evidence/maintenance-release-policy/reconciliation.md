# Maintenance Release Policy Reconciliation

Phase: Maintenance — Release and local-distribution operating policy

Verification: Inspected the root Changesets configuration, root versioning scripts, package documentation, and global-install cutover guide.

Resulting system state: A user-declared release, including a private local tarball release, requires a SemVer Changeset and `pnpm version-packages` so the private package manifest and generated changelog advance together. Global pnpm installation remains an explicit user decision.

Discoveries: `.changeset/config.json` already enables versioning for private packages and uses the Changesets changelog generator. The flexible selector update remains source-only at package version `0.0.0`; `0.1.0` is the recommended first feature-release version when authorized.

Canonical plan updates: The user-locked release direction now requires Changesets-based versioning/changelog generation and user confirmation before a global package replacement.

NEXT.md update: Retains master-CI confirmation as the immediate action and names the release workflow as the action after user authorization.

Approval required: A package release and global package installation still require explicit user authorization. This policy update itself is directly authorized by the user.
