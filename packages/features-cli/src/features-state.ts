import {
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { isAbsolute, join, relative, sep } from 'node:path';
import {
  deriveIssuesStateFromIssueFiles,
  getIssueFilesDir,
  getIssuesStatusPath,
} from './issues-state';

export const FEATURE_STATUSES = [
  'todo',
  'in-progress',
  'paused',
  'archived',
] as const;
export const FEATURE_PHASES = ['design', 'implementation'] as const;

export type FeatureStatus = (typeof FEATURE_STATUSES)[number];
export type FeaturePhase = (typeof FEATURE_PHASES)[number];

export type FeatureRecord = {
  id: number;
  slug: string;
  status: FeatureStatus;
  phase: FeaturePhase;
  focusPath: string | null;
  lastUpdated?: string;
  finalStatus?: 'done' | 'cancelled' | null;
};

export type FeaturesState = {
  features: FeatureRecord[];
  lastUpdated?: string;
  nextFeatureId?: number;
  version: '2';
};

export class FeatureStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FeatureStateError';
  }
}

export function getFeaturesStatusPath(cwd: string) {
  return join(cwd, '.scratch', 'features-status.json');
}

export function getFeaturesLockPath(cwd: string) {
  return join(cwd, '.scratch', 'features-status.lock');
}

export function getFeaturesRecoveryPath(cwd: string) {
  return join(cwd, '.scratch', 'features-status.recovery-required.json');
}

export function getFeaturesDir(cwd: string) {
  return join(cwd, '.scratch', 'features');
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function padFeatureId(id: number): string {
  return String(id).padStart(3, '0');
}

export function getFeatureDir(cwd: string, id: number, slug: string) {
  return join(getFeaturesDir(cwd), `${padFeatureId(id)}-${slug}`);
}

async function assertNoFeatureStateRecovery(cwd: string): Promise<void> {
  const recoveryPath = getFeaturesRecoveryPath(cwd);

  try {
    await lstat(recoveryPath);
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return;
    }

    throw new FeatureStateError(
      `Recovery required: cannot safely inspect the feature-state transaction journal at ${recoveryPath}. Resolve it before using the CLI.`,
    );
  }

  throw new FeatureStateError(
    `Recovery required: an unfinished feature-state transaction journal exists at ${recoveryPath}. Restore the files recorded in it, then remove the journal before retrying.`,
  );
}

/**
 * Scaffold the pipeline state if it does not exist yet. Idempotent: an existing
 * features-status.json is left untouched. This is the supported bootstrap — it
 * replaces hand-creating the JSON before the CLI can be used.
 */
export async function initFeaturesState(options: {
  cwd: string;
}): Promise<{ created: boolean; state: FeaturesState }> {
  await mkdir(getFeaturesDir(options.cwd), { recursive: true });
  return withFeatureStateLock(options.cwd, () =>
    initFeaturesStateWhileLocked(options),
  );
}

async function initFeaturesStateWhileLocked(options: {
  cwd: string;
}): Promise<{ created: boolean; state: FeaturesState }> {
  const filePath = getFeaturesStatusPath(options.cwd);

  await assertNoFeatureStateRecovery(options.cwd);

  let existing: string | undefined;

  try {
    existing = await readFile(filePath, 'utf8');
  } catch {
    existing = undefined;
  }

  if (existing !== undefined) {
    return { created: false, state: await readFeaturesState(options.cwd) };
  }

  const state: FeaturesState = {
    features: [],
    lastUpdated: new Date().toISOString(),
    nextFeatureId: 1,
    version: '2',
  };

  await writeFile(filePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');

  return { created: true, state };
}

/**
 * Register a brand-new feature: allocate the next id, append a `todo` record,
 * and create the feature directory. This is the only supported way to create a
 * feature — callers must never hand-edit features-status.json.
 */
export async function createFeature(options: {
  cwd: string;
  slug: string;
}): Promise<{ feature: FeatureRecord; dir: string }> {
  return withFeatureStateLock(options.cwd, () =>
    createFeatureWhileLocked(options),
  );
}

async function createFeatureWhileLocked(options: {
  cwd: string;
  slug: string;
}): Promise<{ feature: FeatureRecord; dir: string }> {
  const slug = options.slug.trim();

  if (!SLUG_PATTERN.test(slug)) {
    throw new FeatureStateError(
      `Invalid slug "${options.slug}". Use kebab-case: lowercase letters, digits, and single hyphens (e.g. card-refund-flow).`,
    );
  }

  const state = await readFeaturesState(options.cwd);

  if (state.features.some((entry) => entry.slug === slug)) {
    throw new FeatureStateError(
      `Feature "${slug}" already exists. Choose a different slug or update the existing feature with update-feature.`,
    );
  }

  const maxId = state.features.reduce(
    (max, entry) => Math.max(max, entry.id),
    0,
  );
  const id = Math.max(state.nextFeatureId ?? 1, maxId + 1);
  const timestamp = new Date().toISOString();

  const feature: FeatureRecord = {
    id,
    slug,
    status: 'todo',
    phase: 'design',
    focusPath: null,
    lastUpdated: timestamp,
    finalStatus: null,
  };

  const nextState: FeaturesState = {
    ...state,
    features: [...state.features, feature],
    lastUpdated: timestamp,
    nextFeatureId: id + 1,
  };

  await writeFile(
    getFeaturesStatusPath(options.cwd),
    `${JSON.stringify(nextState, null, 2)}\n`,
    'utf8',
  );

  const dir = getFeatureDir(options.cwd, id, slug);
  await mkdir(dir, { recursive: true });

  return { feature, dir };
}

export async function readFeaturesState(cwd: string): Promise<FeaturesState> {
  const filePath = getFeaturesStatusPath(cwd);
  let raw: string;

  await assertNoFeatureStateRecovery(cwd);

  try {
    raw = await readFile(filePath, 'utf8');
  } catch {
    throw new FeatureStateError(
      `Missing feature state at ${filePath}. Create .scratch/features-status.json before using the CLI.`,
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new FeatureStateError(
      `Malformed feature state at ${filePath}. Expected valid JSON in .scratch/features-status.json.`,
    );
  }

  return validateFeaturesState(parsed, filePath);
}

export function validateFeaturesState(
  value: unknown,
  sourceLabel = '.scratch/features-status.json',
): FeaturesState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new FeatureStateError(
      `Invalid feature state in ${sourceLabel}. Expected a JSON object with a features array.`,
    );
  }

  const candidate = value as Record<string, unknown>;

  if (!Array.isArray(candidate.features)) {
    throw new FeatureStateError(
      `Invalid feature state in ${sourceLabel}. Expected "features" to be an array.`,
    );
  }

  if (candidate.version !== '2') {
    throw new FeatureStateError(
      `Invalid feature state in ${sourceLabel}. Expected schema version "2".`,
    );
  }

  const features = candidate.features.map((feature, index) =>
    validateFeatureRecord(feature, index, sourceLabel),
  );
  const activeFeatures = features.filter(
    (feature) => feature.status === 'in-progress',
  );

  if (activeFeatures.length > 1) {
    throw new FeatureStateError(
      `Invalid feature state in ${sourceLabel}. Only one feature may be in-progress; found: ${activeFeatures.map((feature) => feature.slug).join(', ')}.`,
    );
  }

  return {
    features,
    lastUpdated:
      typeof candidate.lastUpdated === 'string'
        ? candidate.lastUpdated
        : undefined,
    nextFeatureId:
      typeof candidate.nextFeatureId === 'number'
        ? candidate.nextFeatureId
        : undefined,
    version: '2',
  };
}

function validateFocusPath(
  value: unknown,
  featureSlug: unknown,
  sourceLabel: string,
): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new FeatureStateError(
      `Invalid feature ${featureSlug} in ${sourceLabel}. focusPath must be null or a non-empty feature-relative path.`,
    );
  }

  const focusPath = value.trim();
  const segments = focusPath.split('/');

  if (
    isAbsolute(focusPath) ||
    /^[a-zA-Z]:/.test(focusPath) ||
    focusPath.includes('\\') ||
    segments.some((segment) => segment === '..') ||
    focusPath.startsWith('/')
  ) {
    throw new FeatureStateError(
      `Invalid feature ${featureSlug} in ${sourceLabel}. focusPath must be feature-relative, use "/" separators, and must not contain "..".`,
    );
  }

  return focusPath;
}

function validateFeatureRecord(
  value: unknown,
  index: number,
  sourceLabel: string,
): FeatureRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new FeatureStateError(
      `Invalid feature at index ${index} in ${sourceLabel}. Expected an object with id, slug, and status.`,
    );
  }

  const candidate = value as Record<string, unknown>;

  if (!Number.isInteger(candidate.id) || Number(candidate.id) <= 0) {
    throw new FeatureStateError(
      `Invalid feature at index ${index} in ${sourceLabel}. Expected a positive integer id.`,
    );
  }

  if (
    typeof candidate.slug !== 'string' ||
    !SLUG_PATTERN.test(candidate.slug.trim())
  ) {
    throw new FeatureStateError(
      `Invalid feature at index ${index} in ${sourceLabel}. Expected a kebab-case slug containing only lowercase letters, digits, and single hyphens.`,
    );
  }

  if (
    typeof candidate.status !== 'string' ||
    !FEATURE_STATUSES.includes(candidate.status as FeatureStatus)
  ) {
    throw new FeatureStateError(
      `Invalid feature ${candidate.slug} in ${sourceLabel}. Status must be one of: ${FEATURE_STATUSES.join(', ')}.`,
    );
  }

  if (
    typeof candidate.phase !== 'string' ||
    !FEATURE_PHASES.includes(candidate.phase as FeaturePhase)
  ) {
    throw new FeatureStateError(
      `Invalid feature ${candidate.slug} in ${sourceLabel}. Phase must be one of: ${FEATURE_PHASES.join(', ')}.`,
    );
  }

  const focusPath = validateFocusPath(
    candidate.focusPath,
    candidate.slug,
    sourceLabel,
  );

  if (
    candidate.finalStatus !== undefined &&
    candidate.finalStatus !== null &&
    candidate.finalStatus !== 'done' &&
    candidate.finalStatus !== 'cancelled'
  ) {
    throw new FeatureStateError(
      `Invalid feature ${candidate.slug} in ${sourceLabel}. finalStatus must be null, done, or cancelled.`,
    );
  }

  return {
    id: Number(candidate.id),
    slug: candidate.slug.trim(),
    status: candidate.status as FeatureStatus,
    phase: candidate.phase as FeaturePhase,
    focusPath,
    lastUpdated:
      typeof candidate.lastUpdated === 'string'
        ? candidate.lastUpdated
        : undefined,
    finalStatus:
      candidate.finalStatus === undefined
        ? undefined
        : (candidate.finalStatus as FeatureRecord['finalStatus']),
  };
}

export function resolveCurrentFeature(state: FeaturesState): FeatureRecord {
  const activeFeatures = state.features.filter(
    (feature) => feature.status === 'in-progress',
  );

  if (activeFeatures.length === 1) {
    return activeFeatures[0];
  }

  if (activeFeatures.length === 0) {
    throw new FeatureStateError(
      'No current feature. Activate a feature with update-feature <slug> --status in-progress before running commands that depend on the current feature.',
    );
  }

  const slugs = activeFeatures.map((feature) => feature.slug).join(', ');

  throw new FeatureStateError(
    `Ambiguous current feature. Multiple features are in-progress: ${slugs}. Move all but one feature out of in-progress with update-feature before running commands that depend on the current feature.`,
  );
}

export type UpdateFeatureOptions = {
  cwd: string;
  slug: string;
  status?: FeatureStatus;
  phase?: FeaturePhase;
  focusPath?: string | null;
  pauseCurrent?: boolean;
};

type FileSnapshot = { kind: 'file'; contents: string } | { kind: 'missing' };

type PreparedWrite = {
  filePath: string;
  contents: string;
  snapshot: FileSnapshot;
};

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error;
}

async function pathIsDirectory(path: string): Promise<boolean> {
  try {
    const metadata = await stat(path);

    if (!metadata.isDirectory()) {
      throw new FeatureStateError(
        `Expected an issues directory at ${path}, but the path is not a directory.`,
      );
    }

    return true;
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

async function snapshotFile(filePath: string): Promise<FileSnapshot> {
  try {
    const metadata = await lstat(filePath);

    if (!metadata.isFile() || metadata.isSymbolicLink()) {
      throw new FeatureStateError(
        `Unsafe state target at ${filePath}. Existing state targets must be regular files; directories, symlinks, and junctions are not allowed.`,
      );
    }

    return { kind: 'file', contents: await readFile(filePath, 'utf8') };
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return { kind: 'missing' };
    }

    throw error;
  }
}

function formatRecoveryJournal(writes: PreparedWrite[]) {
  return `${JSON.stringify(
    {
      version: '1',
      createdAt: new Date().toISOString(),
      status: 'pending',
      restore: writes.map((write) => ({
        filePath: write.filePath,
        snapshot: write.snapshot,
      })),
    },
    null,
    2,
  )}\n`;
}

async function createRecoveryJournal(
  recoveryPath: string,
  writes: PreparedWrite[],
): Promise<void> {
  let handle: Awaited<ReturnType<typeof open>>;

  try {
    handle = await open(recoveryPath, 'wx');
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new FeatureStateError(
      `Recovery required: cannot create a new feature-state transaction journal at ${recoveryPath}: ${detail}`,
    );
  }

  try {
    await handle.writeFile(formatRecoveryJournal(writes), 'utf8');
    await handle.sync();
  } catch (error) {
    try {
      await handle.close();
    } catch {
      // The recovery path was already created fail-closed; the read guard will block further use.
    }

    const detail = error instanceof Error ? error.message : String(error);
    throw new FeatureStateError(
      `Recovery required: the transaction journal at ${recoveryPath} could not be initialized safely: ${detail}`,
    );
  }

  try {
    await handle.close();
  } catch (error) {
    throw new FeatureStateError(
      `Recovery required: the transaction journal at ${recoveryPath} could not be closed safely: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function removeRecoveryJournal(recoveryPath: string): Promise<void> {
  try {
    await unlink(recoveryPath);
  } catch (error) {
    if (!isNodeError(error) || error.code !== 'ENOENT') {
      throw error;
    }
  }
}

async function restoreSnapshot(write: PreparedWrite): Promise<void> {
  if (write.snapshot.kind === 'file') {
    await writeFile(write.filePath, write.snapshot.contents, 'utf8');
    return;
  }

  if (write.snapshot.kind === 'missing') {
    try {
      await unlink(write.filePath);
    } catch (error) {
      if (!isNodeError(error) || error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}

async function commitPreparedWrites(
  writes: PreparedWrite[],
  recoveryPath: string,
): Promise<void> {
  const completed: PreparedWrite[] = [];
  let attempted: PreparedWrite | undefined;

  await createRecoveryJournal(recoveryPath, writes);

  try {
    for (const write of writes) {
      attempted = write;
      await writeFile(write.filePath, write.contents, 'utf8');
      completed.push(write);
      attempted = undefined;
    }
  } catch (error) {
    const rollbackTargets = [
      ...(attempted ? [attempted] : []),
      ...completed.reverse(),
    ];
    const rollbackFailures: string[] = [];

    for (const write of rollbackTargets) {
      try {
        await restoreSnapshot(write);
      } catch (rollbackError) {
        rollbackFailures.push(
          `${write.filePath}: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`,
        );
      }
    }

    const detail = error instanceof Error ? error.message : String(error);

    if (rollbackFailures.length > 0) {
      throw new FeatureStateError(
        `Recovery required: feature-state rollback could not restore every file. The original immutable transaction journal is retained at ${recoveryPath}. Commit failure: ${detail}. Rollback failures: ${rollbackFailures.join('; ')}.`,
      );
    }

    try {
      await removeRecoveryJournal(recoveryPath);
    } catch (cleanupError) {
      throw new FeatureStateError(
        `Recovery required: the failed feature-state update was rolled back, but its transaction journal could not be removed at ${recoveryPath}: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`,
      );
    }

    throw new FeatureStateError(
      `Feature state update failed before all related files could be committed: ${detail}. All affected files were restored.`,
    );
  }

  try {
    await removeRecoveryJournal(recoveryPath);
  } catch (error) {
    throw new FeatureStateError(
      `Recovery required: the feature-state update committed, but its transaction journal could not be removed at ${recoveryPath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export async function withFeatureStateLock<T>(
  cwd: string,
  action: () => Promise<T>,
): Promise<T> {
  const lockPath = getFeaturesLockPath(cwd);
  let handle: Awaited<ReturnType<typeof open>>;

  try {
    handle = await open(lockPath, 'wx');
  } catch (error) {
    if (isNodeError(error) && error.code === 'EEXIST') {
      throw new FeatureStateError(
        `Another feature-state update is already in progress for this repository (${lockPath}). Retry after it finishes.`,
      );
    }

    throw error;
  }

  try {
    await handle.writeFile(
      `${JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() })}\n`,
      'utf8',
    );
    return await action();
  } finally {
    await handle.close();

    try {
      await unlink(lockPath);
    } catch (error) {
      if (!isNodeError(error) || error.code !== 'ENOENT') {
        throw new FeatureStateError(
          `Feature-state lock could not be released at ${lockPath}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
}

async function validateFocusTarget(
  cwd: string,
  feature: FeatureRecord,
  focusPath: string,
): Promise<void> {
  const featureDir = getFeatureDir(cwd, feature.id, feature.slug);
  let realFeatureDir: string;

  try {
    realFeatureDir = await realpath(featureDir);
  } catch {
    throw new FeatureStateError(
      `Cannot set focus for "${feature.slug}": feature workspace does not exist at ${featureDir}.`,
    );
  }

  let realFocusPath: string;

  try {
    realFocusPath = await realpath(join(featureDir, ...focusPath.split('/')));
  } catch {
    throw new FeatureStateError(
      `Cannot set focus for "${feature.slug}": "${focusPath}" does not exist inside the feature workspace.`,
    );
  }

  const relativePath = relative(realFeatureDir, realFocusPath);

  if (
    relativePath === '..' ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath)
  ) {
    throw new FeatureStateError(
      `Cannot set focus for "${feature.slug}": "${focusPath}" must resolve to a feature-relative file or directory inside the feature workspace.`,
    );
  }
}

export async function updateFeature(
  options: UpdateFeatureOptions,
): Promise<FeatureRecord> {
  return withFeatureStateLock(options.cwd, () =>
    updateFeatureWhileLocked(options),
  );
}

async function updateFeatureWhileLocked(
  options: UpdateFeatureOptions,
): Promise<FeatureRecord> {
  const hasStatus = options.status !== undefined;
  const hasPhase = options.phase !== undefined;
  const hasFocus = options.focusPath !== undefined;

  if (!hasStatus && !hasPhase && !hasFocus) {
    throw new FeatureStateError(
      'update-feature requires at least one of --status, --phase, or --focus.',
    );
  }

  if (
    hasStatus &&
    !FEATURE_STATUSES.includes(options.status as FeatureStatus)
  ) {
    throw new FeatureStateError(
      `Invalid feature status "${options.status}". Expected one of: ${FEATURE_STATUSES.join(', ')}.`,
    );
  }

  if (hasPhase && !FEATURE_PHASES.includes(options.phase as FeaturePhase)) {
    throw new FeatureStateError(
      `Invalid feature phase "${options.phase}". Expected one of: ${FEATURE_PHASES.join(', ')}.`,
    );
  }

  const requestedFocusPath = hasFocus
    ? validateFocusPath(options.focusPath, options.slug, 'update-feature')
    : undefined;
  const state = await readFeaturesState(options.cwd);
  const feature = state.features.find((entry) => entry.slug === options.slug);

  if (!feature) {
    throw new FeatureStateError(
      `Unknown feature "${options.slug}". Choose an existing feature slug from .scratch/features-status.json.`,
    );
  }

  const otherActiveFeature = state.features.find(
    (entry) => entry.slug !== options.slug && entry.status === 'in-progress',
  );

  if (options.pauseCurrent) {
    if (options.status !== 'in-progress' || !otherActiveFeature) {
      throw new FeatureStateError(
        '--pause-current requires a different feature to be in-progress and the target update to include --status in-progress.',
      );
    }
  } else if (options.status === 'in-progress' && otherActiveFeature) {
    throw new FeatureStateError(
      `Cannot activate "${options.slug}" while "${otherActiveFeature.slug}" is already in-progress. Retry only after approval with --pause-current to pause it atomically.`,
    );
  }

  const nextStatus = options.status ?? feature.status;
  const nextPhase = options.phase ?? feature.phase;
  const nextFocusPath = hasFocus
    ? (requestedFocusPath as string | null)
    : feature.focusPath;
  const switchesCurrent = Boolean(options.pauseCurrent && otherActiveFeature);

  if (
    nextStatus === feature.status &&
    nextPhase === feature.phase &&
    nextFocusPath === feature.focusPath &&
    !switchesCurrent
  ) {
    throw new FeatureStateError(
      `No-op update: feature "${options.slug}" already has the requested status, phase, and focus.`,
    );
  }

  const timestamp = new Date().toISOString();
  const candidateState: FeaturesState = {
    ...state,
    lastUpdated: timestamp,
    features: state.features.map((entry) => {
      if (entry.slug === options.slug) {
        return {
          ...entry,
          status: nextStatus,
          phase: nextPhase,
          focusPath: nextFocusPath,
          lastUpdated: timestamp,
        };
      }

      if (switchesCurrent && entry.slug === otherActiveFeature?.slug) {
        return {
          ...entry,
          status: 'paused' as const,
          lastUpdated: timestamp,
        };
      }

      return entry;
    }),
  };
  const nextState = validateFeaturesState(
    candidateState,
    'updated feature state',
  );
  const affectedSlugs = new Set([
    options.slug,
    ...(switchesCurrent && otherActiveFeature ? [otherActiveFeature.slug] : []),
  ]);
  const affectedFeatures = nextState.features.filter((entry) =>
    affectedSlugs.has(entry.slug),
  );
  const preparedWrites: PreparedWrite[] = [];

  for (const affectedFeature of affectedFeatures) {
    if (affectedFeature.focusPath !== null) {
      await validateFocusTarget(
        options.cwd,
        affectedFeature,
        affectedFeature.focusPath,
      );
    }
  }

  for (const affectedFeature of affectedFeatures) {
    const issuesDir = getIssueFilesDir(options.cwd, affectedFeature);

    if (!(await pathIsDirectory(issuesDir))) {
      continue;
    }

    const derived = await deriveIssuesStateFromIssueFiles({
      cwd: options.cwd,
      feature: affectedFeature,
      lastUpdated: timestamp,
    });
    const filePath = getIssuesStatusPath(options.cwd, affectedFeature);
    preparedWrites.push({
      filePath,
      contents: `${JSON.stringify(derived, null, 2)}\n`,
      snapshot: await snapshotFile(filePath),
    });
  }

  const statePath = getFeaturesStatusPath(options.cwd);
  preparedWrites.push({
    filePath: statePath,
    contents: `${JSON.stringify(nextState, null, 2)}\n`,
    snapshot: await snapshotFile(statePath),
  });

  await commitPreparedWrites(
    preparedWrites,
    getFeaturesRecoveryPath(options.cwd),
  );

  const updatedFeature = nextState.features.find(
    (entry) => entry.slug === options.slug,
  );

  if (!updatedFeature) {
    throw new FeatureStateError(
      `Failed to find updated feature "${options.slug}" in state after update.`,
    );
  }

  return updatedFeature;
}
