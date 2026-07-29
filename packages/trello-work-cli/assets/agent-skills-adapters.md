# Adapting the Trello Agent Skills

## Canonical sources

AI Arsenal's canonical portable skills are:

- `.agents/skills/trello-work-orchestrator/`
- `.agents/skills/trello-work-design/`
- `.agents/skills/trello-work-deliver/`
- `.agents/skills/trello-work-recover/`

Each directory follows the open [Agent Skills specification](https://agentskills.io/specification) and contains `SKILL.md` as its instruction source. The lifecycle and responsibility authority is [`agent-workflow-protocol.md`](./agent-workflow-protocol.md).

A harness-specific copy, link, bundle, plugin, installer, or generated representation is an **adapter**. It is downstream from these sources and must not become a competing workflow authority.

## Progressive disclosure

Compatible clients should follow the standard three tiers:

1. **Catalog:** load each skill's `name` and `description` for discovery.
2. **Instructions:** load the selected `SKILL.md` when its trigger applies.
3. **Resources:** load referenced files only when required.

Do not inject all four full skills into every session. Catalog descriptions are intentionally distinct so a client can select one primary skill before loading its body.

The Agent Skills specification defines skill contents, not one mandatory installation root. Project-level `.agents/skills/` is the cross-client interoperability convention used by this repository.

## Adapter provenance

A derived adapter should record:

- Canonical repository URL and immutable commit or release identifier.
- Canonical skill name and source path.
- Adapter/client name and supported version.
- Mechanical transformations applied.
- Any omitted optional resource.
- Validation date and Agent Skills specification/reference-tool revision.

When canonical sources change, regenerate or re-review the adapter. Do not hand-maintain semantic forks.

## Allowed adapter differences

Adapters may change only client integration mechanics:

- Installation or discovery location.
- Symlink, copy, package, plugin, registry, or bundle representation.
- Bootstrap and catalog registration.
- Environment-variable loading without embedding secrets.
- Mapping generic file, shell, web, or prompt capabilities to client tool names.
- Rewriting repository-relative authority links to the same immutable bundled or installed sources when an adapter changes directory layout.
- Optional hooks that improve discovery or ergonomics.
- Optional integration with installed Superpowers capabilities.
- Presentation formatting of status and evidence.

Optional hooks must not be required for lifecycle correctness. Every mutation still uses explicit state reads and postcondition verification.

## Prohibited semantic changes

An adapter must not:

- Change Trello/`jz-trello-flow` lifecycle authority or the effective configured transition policy.
- Weaken explicit board selection, latest-read, latest-version, durable operation-ID, minimum-mutation, or read-back requirements.
- Treat `--if-version` or multi-step claiming as an atomic lock.
- Start engineering work before both expected owner and In Progress are confirmed.
- Broaden design beyond Ready, normal delivery beyond Done, or recovery beyond exceptional outcomes.
- Replace acceptance criteria, applicable verification, blocker absence, and concise evidence as the Done gate.
- Archive cards automatically or close Done as an archival substitute.
- Reimplement or silently weaken Superpowers/equivalent engineering methodology.
- Depend on hidden hooks for correctness.
- Claim native Superpowers support when the client does not provide it.
- Embed credentials, production board IDs, or destructive defaults.

If a client requires one of these changes, it is a protocol revision—not an adapter.

## Discovery, trust, and collisions

- Scan project-level `.agents/skills/` when the client supports the interoperability convention.
- Treat newly cloned repositories as potentially untrusted. Follow the client's project-trust policy before loading project instructions or executing referenced scripts.
- Prefer project-level skills over user-level skills for the same name, consistent with common Agent Skills client behavior.
- Apply deterministic precedence within one scope and warn when a skill is shadowed.
- Verify that frontmatter `name` matches the parent directory.
- Do not recursively load unrelated files or follow deep reference chains.

## Client guidance

### Claude Code

Use project Agent Skills discovery when available, or map/copy the canonical directories into the supported project skill location. Native Superpowers skills may provide engineering practice. Claude-specific hooks may improve activation but cannot replace explicit Trello reads, guards, and read-back.

### Codex

Expose each canonical directory through Codex's supported skill discovery or adapter mechanism. Map tool invocations mechanically and retain generic capability wording. Do not depend on Claude hook behavior. Use available Superpowers integration only when actually installed and verified.

### Pi

Package, link, or register the same skill directories through Pi's skill/package mechanism. The Superpowers bootstrap extension and optional task/subagent packages may improve engineering execution, but they do not alter the four Trello responsibilities.

### Hermes Agent

Install or link each canonical Agent Skill through Hermes-compatible skill discovery. Hermes may use equivalent engineering-practice skills when Superpowers is unavailable. Current protocol evidence does not establish native Superpowers support for Hermes, so adapters must not claim it.

### Other Agent Skills clients

A client that implements the Agent Skills catalog/instruction/resource model may consume these directories directly. A client without filesystem access may store the same frontmatter and Markdown through an API or registry, provided source provenance and semantics remain intact.

## Validation

Validate canonical sources and every derived adapter:

1. Run the official `skills-ref validate <skill-directory>` against an immutable recorded reference-tool revision.
2. Run `skills-ref read-properties <skill-directory>` and verify catalog name and description.
3. Confirm all repository-relative references resolve.
4. Exercise trigger routing for orchestration, design, delivery, and exceptional recovery.
5. Audit lifecycle ownership and prohibited semantic changes above.
6. Verify literal CLI examples against the installed `jz-trello-flow` version.
7. Use offline or disposable state by default. Live testing requires separate authorization and an allowlisted non-production board.

## Distribution boundary

These repository sources do not by themselves:

- Add skills to the CLI package's packed-file boundary.
- Expose skills through `jz-trello-flow docs`.
- Install adapters into a user's harness.
- Publish or release a package.
- Authorize production Trello mutation.

Each distribution or installation path requires its own bounded decision and verification.
