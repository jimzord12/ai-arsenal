### Task 1: Add the package-local Local Release glossary

**Files:**

- Create: `packages/features-cli/GLOSSARY.md`
- Verify: `packages/features-cli/GLOSSARY.md`

**Interfaces:**

- Consumes: the established `@jz/ai-arsenal-features-cli` package name, Changesets workflow, and global-install confirmation gate.
- Produces: one precise definition of `Local Release` for maintainers and agents.

- [ ] **Step 1: Create the glossary with the approved definition**

  Create `packages/features-cli/GLOSSARY.md` with this complete content:

  ```markdown
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
  ```

- [ ] **Step 2: Verify the required operational language**

  Run:

  ```powershell
  rg -n "SemVer|Changeset|pnpm version-packages|Ask the user immediately|global pnpm|smoke checks|not a Local Release" packages/features-cli/GLOSSARY.md
  ```

  Expected: every required term appears in the one `Local Release` definition.

- [ ] **Step 3: Verify formatting and whitespace**

  Run:

  ```powershell
  pnpm exec prettier --check packages/features-cli/GLOSSARY.md
  git diff --check -- packages/features-cli/GLOSSARY.md
  ```

  Expected: both commands exit `0`.

- [ ] **Step 4: Commit only the glossary file**

  Run:

  ```powershell
  git add packages/features-cli/GLOSSARY.md
  git commit -m "docs(features-cli): define local release"
  git show --stat --oneline HEAD
  ```

  Expected: the commit contains only `packages/features-cli/GLOSSARY.md`.
