Work item: 2026-07-29-release-trello-skills-installer
Artifact: request
Revision: 1
Prerequisites: none
Status: ready

# Request

Complete the bounded versioned local release for the Trello CLI installer, including preflight, required durable work-item artifacts, Changesets versioning, full and exact packed-consumer validation, fresh independent review and repair, commit/push and exact-SHA Quality/Portability CI, exact clean-commit packing, Windows global pnpm replacement, installed help/docs and disposable-repository `skills install` byte verification, checksum/evidence capture, and any post-install reconciliation commit/push/CI needed to keep current truth accurate.

## Desired outcome

A private patch release of `@jz/ai-arsenal-trello-work-cli` containing the already delivered installer is committed, pushed, CI-green, packed from the exact clean CI-green SHA, installed globally from that tarball, and independently proven to expose a working generated `jz-trello-flow` shim whose installed skills exactly match the package-managed payload. Durable evidence and planning truth identify the exact release and final SHAs, CI runs, tarball checksum, installation, and byte checks.

## Constraints

- Do not publish to a registry.
- Do not call or mutate Trello.
- Use Changesets/SemVer; repository evidence currently supports patch `0.3.1` from `0.3.0`.
- Use an exact tarball rather than a mutable global link.
- Replace the Windows global pnpm package only after exact-SHA Quality and Portability CI pass.
- Finish with local `master` equal to `origin/master` and a clean worktree.

## User-provided context

- Baseline `master` and `origin/master` are aligned at `adda9b6e7515d5ada6af173fed20b7f33f055916` and clean.
- Installer source delivery is commit `251d0ff92c7cf46371d139045450726359bae6dc`.
- Current package and global installation report `0.3.0`; the user reported the prior generated shim failed with `Module not found` for `src/bin.ts`.
- Policy commit `adda9b6` mandates the complete local CLI delivery chain.
- The user explicitly authorized this bounded release, global replacement, routine Git delivery, exact-SHA CI, and post-install reconciliation.
