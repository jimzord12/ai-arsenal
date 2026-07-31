# `@jz/ai-arsenal-weekly-report-cli`

A private Node.js 24 command-line package for collecting deterministic, machine-readable weekly evidence. It currently supports one configured Git working tree and remote. It does not interpret evidence or write stakeholder reports.

## Commands

```text
weekly-report-cli --help
weekly-report-cli --version
weekly-report-cli collect git \
  --repository <path> \
  --remote <name> \
  --default-branch <name> \
  --since <inclusive-ISO-instant> \
  --until <inclusive-ISO-instant>
```

Both interval values must be complete ISO 8601 instants with `Z` or an explicit offset. The collector compares inclusive bounds against Git committer timestamps.

## Git evidence

Before reading evidence, the collector fetches and prunes the configured remote's branch heads non-interactively without tags, `FETCH_HEAD` writes, automatic maintenance, branch checkouts, or working-tree changes.

Successful stdout is one newline-terminated JSON document with:

- `schemaVersion: "1"`, `collector: "git"`, and `status: "verified"`;
- the supplied interval and configured remote/default-branch names;
- `defaultBranchCommits`, limited to commits in the interval;
- every fetched remote branch that still has commits not reachable from the default branch;
- each branch's head, deterministically ordered best merge-base SHAs, ahead/behind counts, branch-only commits, interval commits, and `active` or `inactive` classification.

Commit evidence contains the full SHA, parent SHAs, subject, and committer timestamp. Arrays are deterministic: branches use name order and commits use reverse topological order. A verified empty interval and repository with no unmerged branches returns empty arrays.

The version `"1"` field contract is:

- Common: `schemaVersion`, `collector`, `status`, `interval: { since, until }`, and `source: { remote, defaultBranch }`.
- Verified: `defaultBranchCommits` and `branches`.
- Branch: `name`, `headSha`, `mergeBaseShas`, `aheadBy`, `behindBy`, `commits`, `intervalCommits`, and `activity`.
- Commit: `sha`, `parentShas`, `subject`, and `committedAt`.
- Unverifiable: non-empty `errors` entries containing `code`, `message`, and optional redacted `detail`.

## Process contract

| Result                  | stdout                                  | stderr                      | Exit |
| ----------------------- | --------------------------------------- | --------------------------- | ---- |
| Help, version, evidence | Help/version text or validated JSON     | Empty                       | `0`  |
| Collection failure      | Validated `status: "unverifiable"` JSON | Redacted collection details | `1`  |
| Usage error             | Empty                                   | `USAGE_ERROR` diagnostic    | `2`  |

Repository, remote, revision, fetch, Git, and output-validation failures are explicit rather than successful empty evidence. Git subprocesses use argument arrays and disable interactive credential prompts. Diagnostic URL userinfo and common secret query values are redacted; remote URLs and environment values are not part of successful evidence.

## Package boundary

- Runtime: Node.js 24.
- Distribution: compiled JavaScript in `dist/`.
- Executable: `weekly-report-cli`.
- Import API: none; the process boundary owns stdout, stderr, and exit codes.
- Registry: private package with no publication automation.
- Packed files: this README, `package.json`, and compiled production modules only. Source and tests are excluded.

The package is built, tested, packed, and installed from the pnpm workspace. A clean packed-consumer test installs the tarball and exercises the generated executable against a disposable synthetic repository, including paths containing spaces.

## Deliberate limitations

This package does not inspect deployments, infer productivity or branch intent, evaluate objectives, write reports, store consumer configuration, call orchestration APIs, schedule work, or deliver messages. Additional collectors and private integrations remain separate bounded work.
