import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  type FeatureRecord,
  FeatureStateError,
  type FeaturesState,
  getFeaturesStatusPath,
  readFeaturesState,
  resolveCurrentFeature,
  withFeatureStateLock,
} from './features-state';

export type IssuePhase = 'red' | 'green' | 'review';

export type IssueRecord = {
  id: number;
  title: string;
  status: string;
  method: string;
  complexity: number;
  blockedBy: number[];
  filePath: string;
  decomposed?: string;
  milestone?: string;
  phase?: IssuePhase;
  reopens?: number;
  reviewed?: string;
};

export type IssuesState = {
  featureId: number;
  featureSlug: string;
  featureStatus?: string;
  issues: IssueRecord[];
  lastUpdated?: string;
};

export class IssueStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IssueStateError';
  }
}

function formatFeatureDir(feature: { id: number; slug: string }): string {
  return `${String(feature.id).padStart(3, '0')}-${feature.slug}`;
}

export function getIssuesStatusPath(
  cwd: string,
  feature: { id: number; slug: string },
) {
  return join(
    cwd,
    '.scratch',
    'features',
    formatFeatureDir(feature),
    'issues-status.json',
  );
}

export function getIssueFilesDir(
  cwd: string,
  feature: { id: number; slug: string },
) {
  return join(cwd, '.scratch', 'features', formatFeatureDir(feature), 'issues');
}

type IssueSource = {
  id: number;
  fileName: string;
  filePath: string;
  relativePath: string;
};

async function resolveIssueSources(issuesDir: string): Promise<IssueSource[]> {
  const entries = await readdir(issuesDir, { withFileTypes: true });
  const byId = new Map<number, IssueSource>();
  const register = (source: IssueSource) => {
    const existing = byId.get(source.id);

    if (existing) {
      throw new IssueStateError(
        `Duplicate canonical issue id ${source.id} in ${issuesDir}: ${existing.relativePath} and ${source.relativePath}. Each issue id must identify exactly one source.`,
      );
    }

    byId.set(source.id, source);
  };

  for (const entry of entries) {
    const id = parseIssueIdFromFileName(entry.name);

    if (!id) {
      continue;
    }

    if (entry.isDirectory()) {
      const issueFilePath = join(issuesDir, entry.name, 'issue.md');
      try {
        await readFile(issueFilePath, 'utf8');
      } catch {
        throw new IssueStateError(
          `Invalid canonical issue directory at ${join(issuesDir, entry.name)}. Expected a readable issue.md at ${issueFilePath}.`,
        );
      }

      register({
        id,
        fileName: entry.name,
        filePath: issueFilePath,
        relativePath: `issues/${entry.name}/issue.md`,
      });
      continue;
    }

    if (
      entry.isFile() &&
      (/^(\d+).+\.md$/i.test(entry.name) || /^(\d+)\.md$/i.test(entry.name))
    ) {
      register({
        id,
        fileName: entry.name,
        filePath: join(issuesDir, entry.name),
        relativePath: `issues/${entry.name}`,
      });
    }
  }

  return [...byId.values()].sort((a, b) => a.id - b.id);
}

export function resolveFeatureForIssueRead(
  state: FeaturesState,
  explicitFeatureSelector?: string,
): FeatureRecord {
  if (explicitFeatureSelector) {
    const slugMatch = state.features.find(
      (entry) => entry.slug === explicitFeatureSelector,
    );

    if (slugMatch) {
      return slugMatch;
    }

    const fullNameMatch = explicitFeatureSelector.match(/^(\d+)-(.+)$/);
    const id = Number(fullNameMatch?.[1] ?? explicitFeatureSelector);
    const idMatch =
      Number.isSafeInteger(id) && id > 0
        ? state.features.find((entry) => entry.id === id)
        : undefined;

    if (fullNameMatch && idMatch && idMatch.slug !== fullNameMatch[2]) {
      throw new FeatureStateError(
        `Feature selector "${explicitFeatureSelector}" does not match its registered slug. Expected "${formatFeatureDir(idMatch)}".`,
      );
    }

    if (idMatch && (fullNameMatch || /^\d+$/.test(explicitFeatureSelector))) {
      return idMatch;
    }

    throw new FeatureStateError(
      `Unknown feature "${explicitFeatureSelector}". Choose an existing feature selector from .scratch/features-status.json.`,
    );
  }

  return resolveCurrentFeature(state);
}

async function resolveFeatureForMutation(
  cwd: string,
  requestedFeature: FeatureRecord,
): Promise<FeatureRecord> {
  const state = await readFeaturesState(cwd);
  return resolveFeatureForIssueRead(state, requestedFeature.slug);
}

export async function readIssuesState(
  cwd: string,
  feature: { id: number; slug: string },
): Promise<IssuesState> {
  const filePath = getIssuesStatusPath(cwd, feature);
  let raw: string;

  try {
    raw = await readFile(filePath, 'utf8');
  } catch {
    throw new IssueStateError(
      `Missing derived issue state at ${filePath}. Regenerate it before listing issues.`,
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new IssueStateError(
      `Malformed derived issue state at ${filePath}. Expected valid JSON.`,
    );
  }

  return validateIssuesState(parsed, filePath);
}

export function validateIssuesState(
  value: unknown,
  sourceLabel = 'issues-status.json',
): IssuesState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new IssueStateError(
      `Invalid derived issue state in ${sourceLabel}. Expected a JSON object with feature metadata and an issues array.`,
    );
  }

  const candidate = value as Record<string, unknown>;

  if (
    !Number.isInteger(candidate.featureId) ||
    Number(candidate.featureId) <= 0
  ) {
    throw new IssueStateError(
      `Invalid derived issue state in ${sourceLabel}. Expected a positive integer featureId.`,
    );
  }

  if (
    typeof candidate.featureSlug !== 'string' ||
    candidate.featureSlug.trim().length === 0
  ) {
    throw new IssueStateError(
      `Invalid derived issue state in ${sourceLabel}. Expected a non-empty featureSlug.`,
    );
  }

  if (!Array.isArray(candidate.issues)) {
    throw new IssueStateError(
      `Invalid derived issue state in ${sourceLabel}. Expected "issues" to be an array.`,
    );
  }

  const issues = candidate.issues.map((issue, index) =>
    validateIssueRecord(issue, index, sourceLabel),
  );

  validateIssueBlockerGraph(issues, sourceLabel);

  return {
    featureId: Number(candidate.featureId),
    featureSlug: candidate.featureSlug.trim(),
    featureStatus:
      typeof candidate.featureStatus === 'string'
        ? candidate.featureStatus
        : undefined,
    lastUpdated:
      typeof candidate.lastUpdated === 'string'
        ? candidate.lastUpdated
        : undefined,
    issues,
  };
}

export function getActionableIssues(state: IssuesState): IssueRecord[] {
  const issuesById = new Map(state.issues.map((issue) => [issue.id, issue]));

  return state.issues.filter(
    (issue) =>
      issue.status === 'ready-for-agent' && !isIssueBlocked(issue, issuesById),
  );
}
const TERMINAL_STATUSES = ['done', 'wontfix'] as const;
export type NoWinnerReason = 'empty' | 'complete' | 'no-actionable';
export type NextIssueResult =
  | { kind: 'winner'; issue: IssueRecord }
  | { kind: 'no-winner'; reason: NoWinnerReason };

function compareIssuePriority(a: IssueRecord, b: IssueRecord): number {
  const aReopened = (a.reopens ?? 0) > 0 ? 0 : 1;
  const bReopened = (b.reopens ?? 0) > 0 ? 0 : 1;

  return aReopened - bReopened || a.complexity - b.complexity || a.id - b.id;
}

export function selectNextIssue(state: IssuesState): NextIssueResult {
  if (state.issues.length === 0) {
    return { kind: 'no-winner', reason: 'empty' };
  }
  const allTerminal = state.issues.every((issue) =>
    TERMINAL_STATUSES.includes(
      issue.status as (typeof TERMINAL_STATUSES)[number],
    ),
  );
  if (allTerminal) {
    return { kind: 'no-winner', reason: 'complete' };
  }
  const actionable = getActionableIssues(state);
  if (actionable.length === 0) {
    return { kind: 'no-winner', reason: 'no-actionable' };
  }
  const sorted = [...actionable].sort(compareIssuePriority);
  return { kind: 'winner', issue: sorted[0] };
}

export function selectNextContractIssue(
  state: IssuesState,
  contractedIssueIds: ReadonlySet<number>,
): NextIssueResult {
  if (state.issues.length === 0) {
    return { kind: 'no-winner', reason: 'empty' };
  }
  const allTerminal = state.issues.every((issue) =>
    TERMINAL_STATUSES.includes(
      issue.status as (typeof TERMINAL_STATUSES)[number],
    ),
  );
  if (allTerminal) {
    return { kind: 'no-winner', reason: 'complete' };
  }

  const issuesById = new Map(state.issues.map((issue) => [issue.id, issue]));
  const candidates = state.issues.filter((issue) => {
    if (
      issue.status !== 'ready-for-agent' ||
      contractedIssueIds.has(issue.id)
    ) {
      return false;
    }

    return issue.blockedBy.every((blockerId) => {
      const blocker = issuesById.get(blockerId);
      return (
        blocker !== undefined &&
        (TERMINAL_STATUSES.includes(
          blocker.status as (typeof TERMINAL_STATUSES)[number],
        ) ||
          contractedIssueIds.has(blockerId))
      );
    });
  });

  if (candidates.length === 0) {
    return { kind: 'no-winner', reason: 'no-actionable' };
  }

  return {
    kind: 'winner',
    issue: [...candidates].sort(compareIssuePriority)[0],
  };
}

const RESUMABLE_STATUSES = ['in-progress', 'in-review'] as const;

/**
 * Find a mid-flight issue whose `do-issue` run died before it reached `done`.
 * Such issues are neither `ready-for-agent` (so `selectNextIssue` skips them) nor
 * terminal, so without this they would be orphaned. The `Phase` field tells the
 * orchestrator which agent to re-enter at.
 */
export function selectResumableIssue(state: IssuesState): NextIssueResult {
  const resumable = state.issues.filter((issue) =>
    RESUMABLE_STATUSES.includes(
      issue.status as (typeof RESUMABLE_STATUSES)[number],
    ),
  );
  if (resumable.length === 0) {
    return { kind: 'no-winner', reason: 'no-actionable' };
  }
  const sorted = [...resumable].sort((a, b) => {
    const statusOrder = (issue: IssueRecord) =>
      issue.status === 'in-review' ? 0 : 1;
    return statusOrder(a) - statusOrder(b) || a.id - b.id;
  });
  return { kind: 'winner', issue: sorted[0] };
}

export const VALID_STATUSES = [
  'needs-triage',
  'needs-info',
  'ready-for-agent',
  'ready-for-human',
  'in-progress',
  'in-review',
  'done',
  'wontfix',
] as const;

export const ISSUE_PHASES = ['red', 'green', 'review'] as const;

// `in-progress → done` is intentionally absent: review is a mandatory gate, so an
// issue reaches `done` only through `in-review`. `--force` remains the human override.
const STATUS_TRANSITIONS: Record<string, ReadonlySet<string>> = {
  'needs-triage': new Set(['needs-info', 'ready-for-agent', 'wontfix']),
  'needs-info': new Set([
    'needs-triage',
    'ready-for-agent',
    'ready-for-human',
    'wontfix',
  ]),
  'ready-for-agent': new Set([
    'in-progress',
    'ready-for-human',
    'needs-triage',
    'wontfix',
  ]),
  'in-progress': new Set([
    'in-review',
    'ready-for-agent',
    'ready-for-human',
    'wontfix',
  ]),
  'in-review': new Set([
    'done',
    'ready-for-agent',
    'ready-for-human',
    'wontfix',
  ]),
  'ready-for-human': new Set([
    'ready-for-agent',
    'needs-triage',
    'needs-info',
    'wontfix',
  ]),
  done: new Set(),
  wontfix: new Set(),
};

export function validateStatusTransition(
  from: string,
  to: string,
  options?: { force?: boolean },
): void {
  if (from === to) {
    throw new IssueStateError(`No-op transition: issue is already "${from}".`);
  }

  if (!VALID_STATUSES.includes(to as (typeof VALID_STATUSES)[number])) {
    throw new IssueStateError(
      `Invalid status "${to}". Expected one of: ${VALID_STATUSES.join(', ')}.`,
    );
  }

  if (!options?.force) {
    if (!VALID_STATUSES.includes(from as (typeof VALID_STATUSES)[number])) {
      throw new IssueStateError(
        `Invalid source status "${from}". Expected one of: ${VALID_STATUSES.join(', ')}.`,
      );
    }

    const allowed = STATUS_TRANSITIONS[from];
    if (!allowed?.has(to)) {
      throw new IssueStateError(`Invalid transition: "${from}" → "${to}".`);
    }
  }
}

export function deriveIssuesState(options: {
  feature: FeatureRecord;
  issues: IssueRecord[];
  lastUpdated: string;
}): IssuesState {
  const issues = [...options.issues].sort((a, b) => a.id - b.id);
  const state: IssuesState = {
    featureId: options.feature.id,
    featureSlug: options.feature.slug,
    featureStatus: options.feature.status,
    lastUpdated: options.lastUpdated,
    issues,
  };

  return validateIssuesState(
    state,
    `derived issue state for ${options.feature.slug}`,
  );
}

/**
 * Parse and validate canonical issue Markdown without rewriting derived JSON.
 * Progress aggregation and feature-state transactions use this read-only seam
 * so invalid issue state is discovered before any registry mutation.
 */
export async function deriveIssuesStateFromIssueFiles(options: {
  cwd: string;
  feature: FeatureRecord;
  lastUpdated?: string;
}): Promise<IssuesState> {
  const issuesDir = getIssueFilesDir(options.cwd, options.feature);
  let issueSources: IssueSource[];

  try {
    issueSources = await resolveIssueSources(issuesDir);
  } catch (error) {
    if (error instanceof IssueStateError) {
      throw error;
    }

    throw new IssueStateError(
      `Missing issues directory at ${issuesDir}. Create issues directory before regenerating issue state.`,
    );
  }

  const issues = await Promise.all(
    issueSources.map(async (issueSource) => {
      const content = await readFile(issueSource.filePath, 'utf8');

      return parseIssueMarkdown({
        content,
        sourceLabel: issueSource.filePath,
        featureId: options.feature.id,
        featureSlug: options.feature.slug,
        fileName: issueSource.fileName,
        relativePath: issueSource.relativePath,
      });
    }),
  );

  return deriveIssuesState({
    feature: options.feature,
    issues,
    lastUpdated: options.lastUpdated ?? new Date().toISOString(),
  });
}

export async function regenerateIssuesStateFromIssueFiles(options: {
  cwd: string;
  feature: FeatureRecord;
}): Promise<IssuesState> {
  return withFeatureStateLock(options.cwd, async () => {
    const feature = await resolveFeatureForMutation(
      options.cwd,
      options.feature,
    );
    return regenerateIssuesStateFromIssueFilesWhileLocked({
      cwd: options.cwd,
      feature,
    });
  });
}

async function regenerateIssuesStateFromIssueFilesWhileLocked(options: {
  cwd: string;
  feature: FeatureRecord;
}): Promise<IssuesState> {
  const validated = await deriveIssuesStateFromIssueFiles(options);

  await writeFile(
    getIssuesStatusPath(options.cwd, options.feature),
    `${JSON.stringify(validated, null, 2)}\n`,
    'utf8',
  );

  return validated;
}

export async function updateIssueBlockers(options: {
  cwd: string;
  feature: FeatureRecord;
  issueId: number;
  blockedBy: number[];
}) {
  return withFeatureStateLock(options.cwd, async () => {
    const feature = await resolveFeatureForMutation(
      options.cwd,
      options.feature,
    );
    return updateIssueBlockersWhileLocked({ ...options, feature });
  });
}

async function updateIssueBlockersWhileLocked(options: {
  cwd: string;
  feature: FeatureRecord;
  issueId: number;
  blockedBy: number[];
}) {
  const issuesDir = getIssueFilesDir(options.cwd, options.feature);
  let issueSources: IssueSource[];

  try {
    issueSources = await resolveIssueSources(issuesDir);
  } catch (error) {
    if (error instanceof IssueStateError) {
      throw error;
    }

    throw new IssueStateError(
      `Missing issues directory at ${issuesDir}. Create issues directory before updating blockers.`,
    );
  }

  const targetIssue = issueSources.find(
    (issue) => issue.id === options.issueId,
  );

  if (!targetIssue) {
    throw new IssueStateError(
      `Unknown issue ${options.issueId} in feature "${options.feature.slug}". Choose an existing issue file.`,
    );
  }

  const current = await readFile(targetIssue.filePath, 'utf8');
  const canonicalLine = `BlockedBy: ${formatBlockedBy(options.blockedBy)}`;
  const next = upsertBlockedByHeader(current, canonicalLine);

  await writeFile(targetIssue.filePath, next, 'utf8');

  const state = await regenerateIssuesStateFromIssueFilesWhileLocked({
    cwd: options.cwd,
    feature: options.feature,
  });

  return {
    issueId: options.issueId,
    featureSlug: options.feature.slug,
    blockedBy: [...options.blockedBy],
    issuesState: state,
    issuePath: targetIssue.relativePath,
  };
}

/**
 * Upsert a single `Name: value` frontmatter line (the metadata block before the
 * first `#` heading). Replaces an existing line in place; otherwise inserts it
 * right after the last existing header so new keys cluster with the frontmatter
 * rather than landing after the blank line before the H1.
 */
function upsertHeaderLine(
  content: string,
  headerName: string,
  value: string,
): string {
  const lines = content.split(/\r?\n/);
  const firstHeadingIndex = lines.findIndex((line) => /^#\s+/.test(line));
  const metadataEnd = firstHeadingIndex >= 0 ? firstHeadingIndex : lines.length;
  const headerRegex = new RegExp(`^${headerName}:\\s*`, 'i');
  const newLine = `${headerName}: ${value}`;

  const existingIndex = lines.findIndex(
    (line, index) => index < metadataEnd && headerRegex.test(line),
  );

  if (existingIndex >= 0) {
    lines[existingIndex] = newLine;
    return `${lines.join('\n')}\n`;
  }

  let insertAt = metadataEnd;

  for (let i = metadataEnd - 1; i >= 0; i -= 1) {
    if (/^[A-Za-z][A-Za-z0-9-]*:\s*/.test(lines[i])) {
      insertAt = i + 1;
      break;
    }
  }

  lines.splice(insertAt, 0, newLine);
  return `${lines.join('\n')}\n`;
}

/**
 * Append a dated entry to the issue's `## Reopen History` section, creating the
 * section once if absent. Append-only: stacked entries give the next implementer
 * the full record of what earlier rounds tried and got rejected for.
 */
function appendReopenHistory(content: string, entry: string): string {
  const trimmed = content.replace(/\s+$/, '');
  const hasSection = /^##\s+Reopen History\s*$/im.test(content);

  if (hasSection) {
    return `${trimmed}\n\n${entry}\n`;
  }

  return `${trimmed}\n\n## Reopen History\n\n${entry}\n`;
}

function upsertStatusHeader(content: string, statusLine: string): string {
  const lines = content.split(/\r?\n/);
  const firstHeadingIndex = lines.findIndex((line) => /^#\s+/.test(line));
  const metadataEnd = firstHeadingIndex >= 0 ? firstHeadingIndex : lines.length;

  const existingIndex = lines.findIndex(
    (line, index) => index < metadataEnd && /^Status:\s*/i.test(line),
  );

  if (existingIndex >= 0) {
    lines[existingIndex] = statusLine;
    return `${lines.join('\n')}\n`;
  }

  lines.splice(metadataEnd, 0, statusLine);
  return `${lines.join('\n')}\n`;
}

export async function updateIssueStatus(options: {
  cwd: string;
  feature: FeatureRecord;
  issueId: number;
  status: string;
  force?: boolean;
}): Promise<{
  issueId: number;
  featureSlug: string;
  status: string;
  issuePath: string;
  issuesState: IssuesState;
}> {
  return withFeatureStateLock(options.cwd, async () => {
    const feature = await resolveFeatureForMutation(
      options.cwd,
      options.feature,
    );
    return updateIssueStatusWhileLocked({ ...options, feature });
  });
}

async function updateIssueStatusWhileLocked(options: {
  cwd: string;
  feature: FeatureRecord;
  issueId: number;
  status: string;
  force?: boolean;
}): Promise<{
  issueId: number;
  featureSlug: string;
  status: string;
  issuePath: string;
  issuesState: IssuesState;
}> {
  const issuesDir = getIssueFilesDir(options.cwd, options.feature);
  let issueSources: IssueSource[];

  try {
    issueSources = await resolveIssueSources(issuesDir);
  } catch (error) {
    if (error instanceof IssueStateError) {
      throw error;
    }

    throw new IssueStateError(
      `Missing issues directory at ${issuesDir}. Create issues directory before updating status.`,
    );
  }

  const targetIssue = issueSources.find(
    (issue) => issue.id === options.issueId,
  );

  if (!targetIssue) {
    throw new IssueStateError(
      `Unknown issue ${options.issueId} in feature "${options.feature.slug}". Choose an existing issue file.`,
    );
  }

  const current = await readFile(targetIssue.filePath, 'utf8');

  const statusMatch = current.match(/^Status:\s*(.+)$/m);
  const currentStatus = statusMatch ? statusMatch[1].trim() : '';

  validateStatusTransition(currentStatus, options.status, {
    force: options.force,
  });

  const next = upsertStatusHeader(current, `Status: ${options.status}`);
  await writeFile(targetIssue.filePath, next, 'utf8');

  const state = await regenerateIssuesStateFromIssueFilesWhileLocked({
    cwd: options.cwd,
    feature: options.feature,
  });
  // Refresh feature-level timestamp
  const featuresState = await readFeaturesState(options.cwd);
  const timestamp = new Date().toISOString();
  const updatedFeaturesState: FeaturesState = {
    ...featuresState,
    lastUpdated: timestamp,
    features: featuresState.features.map((f) =>
      f.slug === options.feature.slug ? { ...f, lastUpdated: timestamp } : f,
    ),
  };
  await writeFile(
    getFeaturesStatusPath(options.cwd),
    `${JSON.stringify(updatedFeaturesState, null, 2)}\n`,
    'utf8',
  );

  return {
    issueId: options.issueId,
    featureSlug: options.feature.slug,
    status: options.status,
    issuePath: targetIssue.relativePath,
    issuesState: state,
  };
}

/**
 * Send a reviewed issue back to the implementer with a recorded reason.
 *
 * This is the sanctioned review-rejection path — the only legal source status is
 * `in-review`. It flips the issue to `ready-for-agent`, resets `Phase` to where
 * the fix belongs (`red` = rewrite tests, `green` = re-implement), bumps the
 * `Reopens` counter, and appends a dated entry to the issue's `## Reopen History`
 * so the next implementer reads the finding inline. Markdown stays canonical;
 * `issues-status.json` is regenerated from it.
 */
export async function reopenIssue(options: {
  cwd: string;
  feature: FeatureRecord;
  issueId: number;
  phase: 'red' | 'green';
  reason: string;
  force?: boolean;
}): Promise<{
  issueId: number;
  featureSlug: string;
  phase: 'red' | 'green';
  reopens: number;
  issuePath: string;
  issuesState: IssuesState;
}> {
  return withFeatureStateLock(options.cwd, async () => {
    const feature = await resolveFeatureForMutation(
      options.cwd,
      options.feature,
    );
    return reopenIssueWhileLocked({ ...options, feature });
  });
}

async function reopenIssueWhileLocked(options: {
  cwd: string;
  feature: FeatureRecord;
  issueId: number;
  phase: 'red' | 'green';
  reason: string;
  force?: boolean;
}): Promise<{
  issueId: number;
  featureSlug: string;
  phase: 'red' | 'green';
  reopens: number;
  issuePath: string;
  issuesState: IssuesState;
}> {
  const issuesDir = getIssueFilesDir(options.cwd, options.feature);
  let issueSources: IssueSource[];

  try {
    issueSources = await resolveIssueSources(issuesDir);
  } catch (error) {
    if (error instanceof IssueStateError) {
      throw error;
    }

    throw new IssueStateError(
      `Missing issues directory at ${issuesDir}. Create issues directory before reopening issues.`,
    );
  }

  const targetIssue = issueSources.find(
    (issue) => issue.id === options.issueId,
  );

  if (!targetIssue) {
    throw new IssueStateError(
      `Unknown issue ${options.issueId} in feature "${options.feature.slug}". Choose an existing issue file.`,
    );
  }

  const trimmedReason = options.reason.trim();

  if (trimmedReason.length === 0) {
    throw new IssueStateError(
      `Cannot reopen issue ${options.issueId} without a reason. Pass --reason "<finding>" or --reason-file <path>.`,
    );
  }

  const current = await readFile(targetIssue.filePath, 'utf8');

  const statusMatch = current.match(/^Status:\s*(.+)$/m);
  const currentStatus = statusMatch ? statusMatch[1].trim() : '';

  if (!options.force && currentStatus !== 'in-review') {
    throw new IssueStateError(
      `Cannot reopen issue ${options.issueId}: status is "${currentStatus}", expected "in-review". reopen-issue sends a reviewed issue back; use update-status for other transitions, or pass --force.`,
    );
  }

  const reopensMatch = current.match(/^Reopens:\s*(\d+)\s*$/m);
  const nextReopens = (reopensMatch ? Number(reopensMatch[1]) : 0) + 1;

  const date = new Date().toISOString().slice(0, 10);
  const phaseLabel = options.phase === 'red' ? 'tests' : 'code';
  const entry = `### ${date} — review failed → restart at ${options.phase} (${phaseLabel})\n${trimmedReason}`;

  let next = upsertHeaderLine(current, 'Status', 'ready-for-agent');
  next = upsertHeaderLine(next, 'Phase', options.phase);
  next = upsertHeaderLine(next, 'Reopens', String(nextReopens));
  next = appendReopenHistory(next, entry);

  await writeFile(targetIssue.filePath, next, 'utf8');

  const state = await regenerateIssuesStateFromIssueFilesWhileLocked({
    cwd: options.cwd,
    feature: options.feature,
  });

  // Refresh feature-level timestamp (mirrors updateIssueStatus).
  const featuresState = await readFeaturesState(options.cwd);
  const timestamp = new Date().toISOString();
  const updatedFeaturesState: FeaturesState = {
    ...featuresState,
    lastUpdated: timestamp,
    features: featuresState.features.map((f) =>
      f.slug === options.feature.slug ? { ...f, lastUpdated: timestamp } : f,
    ),
  };
  await writeFile(
    getFeaturesStatusPath(options.cwd),
    `${JSON.stringify(updatedFeaturesState, null, 2)}\n`,
    'utf8',
  );

  return {
    issueId: options.issueId,
    featureSlug: options.feature.slug,
    phase: options.phase,
    reopens: nextReopens,
    issuePath: targetIssue.relativePath,
    issuesState: state,
  };
}

export function isIssueBlocked(
  issue: IssueRecord,
  issuesById: Map<number, IssueRecord>,
): boolean {
  return issue.blockedBy.some((blockerId) => {
    const blocker = issuesById.get(blockerId);

    if (!blocker) {
      return true;
    }

    return blocker.status !== 'done';
  });
}

function validateIssueRecord(
  value: unknown,
  index: number,
  sourceLabel: string,
): IssueRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new IssueStateError(
      `Invalid issue at index ${index} in ${sourceLabel}. Expected an object with id, title, status, method, complexity, and filePath.`,
    );
  }

  const candidate = value as Record<string, unknown>;

  if (!Number.isInteger(candidate.id) || Number(candidate.id) <= 0) {
    throw new IssueStateError(
      `Invalid issue at index ${index} in ${sourceLabel}. Expected a positive integer id.`,
    );
  }

  if (
    typeof candidate.title !== 'string' ||
    candidate.title.trim().length === 0
  ) {
    throw new IssueStateError(
      `Invalid issue ${candidate.id} in ${sourceLabel}. Expected a non-empty title.`,
    );
  }

  if (
    typeof candidate.status !== 'string' ||
    candidate.status.trim().length === 0
  ) {
    throw new IssueStateError(
      `Invalid issue ${candidate.id} in ${sourceLabel}. Expected a non-empty status.`,
    );
  }

  if (
    typeof candidate.method !== 'string' ||
    candidate.method.trim().length === 0
  ) {
    throw new IssueStateError(
      `Invalid issue ${candidate.id} in ${sourceLabel}. Expected a non-empty method.`,
    );
  }

  if (
    !Number.isInteger(candidate.complexity) ||
    Number(candidate.complexity) <= 0
  ) {
    throw new IssueStateError(
      `Invalid issue ${candidate.id} in ${sourceLabel}. Expected a positive integer complexity.`,
    );
  }

  if (!('blockedBy' in candidate)) {
    throw new IssueStateError(
      `Invalid issue ${candidate.id} in ${sourceLabel}. Missing canonical BlockedBy field; blocker-aware commands do not support legacy prose-only blockers.`,
    );
  }

  if (!Array.isArray(candidate.blockedBy)) {
    throw new IssueStateError(
      `Invalid issue ${candidate.id} in ${sourceLabel}. Expected blockedBy to be an array of issue IDs, or an empty array for BlockedBy: none.`,
    );
  }

  const blockedBy = candidate.blockedBy.map((blockerId) => {
    if (!Number.isInteger(blockerId) || Number(blockerId) <= 0) {
      throw new IssueStateError(
        `Invalid issue ${candidate.id} in ${sourceLabel}. Blocker IDs must be positive integers.`,
      );
    }

    return Number(blockerId);
  });

  if (blockedBy.includes(Number(candidate.id))) {
    throw new IssueStateError(
      `Invalid issue ${candidate.id} in ${sourceLabel}. An issue cannot block itself.`,
    );
  }

  if (new Set(blockedBy).size !== blockedBy.length) {
    throw new IssueStateError(
      `Invalid issue ${candidate.id} in ${sourceLabel}. Duplicate blocker IDs are not allowed.`,
    );
  }

  if (
    typeof candidate.filePath !== 'string' ||
    candidate.filePath.trim().length === 0
  ) {
    throw new IssueStateError(
      `Invalid issue ${candidate.id} in ${sourceLabel}. Expected a non-empty filePath.`,
    );
  }

  let phase: IssuePhase | undefined;

  if (candidate.phase !== undefined) {
    if (
      typeof candidate.phase !== 'string' ||
      !ISSUE_PHASES.includes(candidate.phase as IssuePhase)
    ) {
      throw new IssueStateError(
        `Invalid issue ${candidate.id} in ${sourceLabel}. Phase must be one of: ${ISSUE_PHASES.join(', ')}.`,
      );
    }

    phase = candidate.phase as IssuePhase;
  }

  let reopens: number | undefined;

  if (candidate.reopens !== undefined) {
    if (!Number.isInteger(candidate.reopens) || Number(candidate.reopens) < 0) {
      throw new IssueStateError(
        `Invalid issue ${candidate.id} in ${sourceLabel}. Reopens must be a non-negative integer.`,
      );
    }

    reopens = Number(candidate.reopens);
  }

  return {
    id: Number(candidate.id),
    title: candidate.title.trim(),
    status: candidate.status.trim(),
    method: candidate.method.trim(),
    complexity: Number(candidate.complexity),
    blockedBy,
    filePath: candidate.filePath.trim(),
    decomposed:
      typeof candidate.decomposed === 'string' &&
      candidate.decomposed.trim().length > 0
        ? candidate.decomposed.trim()
        : undefined,
    milestone:
      typeof candidate.milestone === 'string' &&
      candidate.milestone.trim().length > 0
        ? candidate.milestone.trim()
        : undefined,
    phase,
    reopens,
    reviewed:
      typeof candidate.reviewed === 'string' &&
      candidate.reviewed.trim().length > 0
        ? candidate.reviewed.trim()
        : undefined,
  };
}

function validateIssueBlockerGraph(issues: IssueRecord[], sourceLabel: string) {
  const issueIds = new Set(issues.map((issue) => issue.id));

  for (const issue of issues) {
    for (const blockerId of issue.blockedBy) {
      if (!issueIds.has(blockerId)) {
        throw new IssueStateError(
          `Invalid issue ${issue.id} in ${sourceLabel}. Unknown blocker ID ${blockerId}; blocker references must point to issues in the same feature.`,
        );
      }
    }
  }
}

function parseIssueMarkdown(options: {
  content: string;
  sourceLabel: string;
  featureId: number;
  featureSlug: string;
  fileName: string;
  relativePath?: string;
}): IssueRecord {
  const issueId = parseIssueIdFromFileName(options.fileName);

  if (!issueId) {
    throw new IssueStateError(
      `Invalid issue filename ${options.fileName} in ${options.sourceLabel}. Expected a numbered issue file such as 03-some-issue.md.`,
    );
  }

  const lines = options.content.split(/\r?\n/);
  const headingLine = lines.find((line) => /^#\s+/.test(line));

  if (!headingLine) {
    throw new IssueStateError(
      `Invalid issue ${issueId} in ${options.sourceLabel}. Expected a Markdown H1 title.`,
    );
  }

  const title = headingLine.replace(/^#\s+/, '').trim();

  if (!title) {
    throw new IssueStateError(
      `Invalid issue ${issueId} in ${options.sourceLabel}. Expected a non-empty title.`,
    );
  }

  const metadata = new Map<string, string>();

  for (const line of lines) {
    if (/^#\s+/.test(line)) {
      break;
    }

    const match = line.match(/^([A-Za-z][A-Za-z0-9-]*):\s*(.+)$/);

    if (match) {
      metadata.set(match[1].toLowerCase(), match[2].trim());
    }
  }

  const status = metadata.get('status');
  const method = metadata.get('method');
  const complexityRaw = metadata.get('complexity');
  const blockedByRaw = metadata.get('blockedby');
  const decomposedRaw = metadata.get('decomposed');
  const milestoneRaw = metadata.get('milestone');
  const phaseRaw = metadata.get('phase');
  const reopensRaw = metadata.get('reopens');
  const reviewedRaw = metadata.get('reviewed');

  if (!status) {
    throw new IssueStateError(
      `Invalid issue ${issueId} in ${options.sourceLabel}. Expected a Status header.`,
    );
  }

  if (!method) {
    throw new IssueStateError(
      `Invalid issue ${issueId} in ${options.sourceLabel}. Expected a Method header.`,
    );
  }

  if (
    !complexityRaw ||
    !/^\d+$/.test(complexityRaw) ||
    Number(complexityRaw) <= 0
  ) {
    throw new IssueStateError(
      `Invalid issue ${issueId} in ${options.sourceLabel}. Expected a positive integer Complexity header.`,
    );
  }

  if (!blockedByRaw) {
    if (/^##\s+Blocked by\s*$/im.test(options.content)) {
      throw new IssueStateError(
        `Invalid issue ${issueId} in ${options.sourceLabel}. Detected legacy prose-only blocker section; run update-blockers ${issueId} --blockers <none|id list> to normalize.`,
      );
    }

    throw new IssueStateError(
      `Invalid issue ${issueId} in ${options.sourceLabel}. Missing canonical BlockedBy header. Use BlockedBy: none or BlockedBy: <id list>.`,
    );
  }

  const blockedBy = parseBlockedByHeaderValue(
    blockedByRaw,
    issueId,
    options.sourceLabel,
  );

  const featureDir = `${String(options.featureId).padStart(3, '0')}-${options.featureSlug}`;
  const filePath = `.scratch/features/${featureDir}/${options.relativePath ?? `issues/${options.fileName}`}`;

  return validateIssueRecord(
    {
      id: issueId,
      title,
      status,
      method,
      complexity: Number(complexityRaw),
      blockedBy,
      filePath,
      decomposed: decomposedRaw,
      milestone: milestoneRaw,
      phase: phaseRaw,
      reopens: reopensRaw !== undefined ? Number(reopensRaw) : undefined,
      reviewed: reviewedRaw,
    },
    0,
    options.sourceLabel,
  );
}

function parseIssueIdFromFileName(fileName: string): number | null {
  const match = fileName.match(/^(\d+)/);

  if (!match) {
    return null;
  }

  const id = Number(match[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseBlockedByHeaderValue(
  value: string,
  issueId: number,
  sourceLabel: string,
): number[] {
  if (value.trim().toLowerCase() === 'none') {
    return [];
  }

  const parts = value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (parts.length === 0) {
    throw new IssueStateError(
      `Invalid issue ${issueId} in ${sourceLabel}. BlockedBy must be "none" or a comma-separated list of issue IDs.`,
    );
  }

  const blockers = parts.map((part) => {
    if (!/^\d+$/.test(part)) {
      throw new IssueStateError(
        `Invalid issue ${issueId} in ${sourceLabel}. BlockedBy entries must be positive integer issue IDs.`,
      );
    }

    return Number(part);
  });

  return blockers;
}

function formatBlockedBy(blockedBy: number[]): string {
  if (blockedBy.length === 0) {
    return 'none';
  }

  return blockedBy.join(', ');
}

function upsertBlockedByHeader(content: string, blockedByLine: string): string {
  const lines = content.split(/\r?\n/);
  const withoutLegacySection = removeLegacyBlockedBySection(lines);
  const working = [...withoutLegacySection];
  const firstHeadingIndex = working.findIndex((line) => /^#\s+/.test(line));
  const metadataEnd =
    firstHeadingIndex >= 0 ? firstHeadingIndex : working.length;

  const existingIndex = working.findIndex(
    (line, index) => index < metadataEnd && /^BlockedBy:\s*/i.test(line),
  );

  if (existingIndex >= 0) {
    working[existingIndex] = blockedByLine;
    return `${working.join('\n')}\n`;
  }

  const complexityIndex = working.findIndex(
    (line, index) => index < metadataEnd && /^Complexity:\s*/i.test(line),
  );

  if (complexityIndex >= 0) {
    working.splice(complexityIndex + 1, 0, blockedByLine);
    return `${working.join('\n')}\n`;
  }

  working.splice(metadataEnd, 0, blockedByLine);
  return `${working.join('\n')}\n`;
}

function removeLegacyBlockedBySection(lines: string[]): string[] {
  const start = lines.findIndex((line) => /^##\s+Blocked by\s*$/i.test(line));

  if (start < 0) {
    return lines;
  }

  let end = start + 1;

  while (end < lines.length) {
    if (/^##\s+/.test(lines[end])) {
      break;
    }

    end += 1;
  }

  const next = [...lines];
  next.splice(start, end - start);

  return next;
}
