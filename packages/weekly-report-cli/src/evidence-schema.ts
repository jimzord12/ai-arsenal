export type GitCommitEvidence = {
  committedAt: string;
  parentShas: string[];
  sha: string;
  subject: string;
};

export type GitBranchEvidence = {
  activity: 'active' | 'inactive';
  aheadBy: number;
  behindBy: number;
  commits: GitCommitEvidence[];
  headSha: string;
  intervalCommits: GitCommitEvidence[];
  mergeBaseShas: string[];
  name: string;
};

type GitEvidenceBase = {
  collector: 'git';
  interval: { since: string; until: string };
  schemaVersion: '1';
  source: { defaultBranch: string; remote: string };
};

export type VerifiedGitEvidence = GitEvidenceBase & {
  branches: GitBranchEvidence[];
  defaultBranchCommits: GitCommitEvidence[];
  status: 'verified';
};

export type UnverifiableGitEvidence = GitEvidenceBase & {
  errors: Array<{ code: string; detail?: string; message: string }>;
  status: 'unverifiable';
};

export type GitEvidence = VerifiedGitEvidence | UnverifiableGitEvidence;

const FULL_OBJECT_ID = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i;
const ISO_INSTANT =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|([+-])(\d{2}):(\d{2}))$/;

function fail(message: string): never {
  throw new Error(`Invalid Git evidence: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(
  record: Record<string, unknown>,
  key: string,
  context = key,
): string {
  const value = record[key];
  if (typeof value !== 'string') {
    fail(`${context} must be a string.`);
  }
  return value;
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function isStrictIsoInstant(value: string): boolean {
  const match = ISO_INSTANT.exec(value);
  if (match === null) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const offsetHour = match[8] === undefined ? 0 : Number(match[8]);
  const offsetMinute = match[9] === undefined ? 0 : Number(match[9]);
  const monthLengths = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return (
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= monthLengths[month - 1] &&
    hour <= 23 &&
    minute <= 59 &&
    second <= 59 &&
    offsetHour <= 14 &&
    offsetMinute <= 59 &&
    (offsetHour < 14 || offsetMinute === 0) &&
    Number.isFinite(Date.parse(value))
  );
}

function requireObjectId(
  record: Record<string, unknown>,
  key: string,
  context: string,
): string {
  const value = requireString(record, key, context);
  if (!FULL_OBJECT_ID.test(value)) fail(`${context} must be a full object ID.`);
  return value;
}

function requireInstant(
  record: Record<string, unknown>,
  key: string,
  context: string,
): string {
  const value = requireString(record, key, context);
  if (!isStrictIsoInstant(value)) fail(`${context} must be an ISO instant.`);
  return value;
}

function validateCommit(value: unknown, context: string): void {
  if (!isRecord(value)) fail(`${context} must be an object.`);
  requireObjectId(value, 'sha', `${context}.sha`);
  requireString(value, 'subject', `${context}.subject`);
  requireInstant(value, 'committedAt', `${context}.committedAt`);
  if (!Array.isArray(value.parentShas)) {
    fail(`${context}.parentShas must be an array.`);
  }
  for (const parent of value.parentShas) {
    if (typeof parent !== 'string' || !FULL_OBJECT_ID.test(parent)) {
      fail(`${context}.parentShas must contain full object IDs.`);
    }
  }
}

function validateBase(record: Record<string, unknown>): void {
  if (record.schemaVersion !== '1') fail('schemaVersion must be "1".');
  if (record.collector !== 'git') fail('collector must be "git".');
  if (!isRecord(record.interval)) fail('interval must be an object.');
  requireInstant(record.interval, 'since', 'interval.since');
  requireInstant(record.interval, 'until', 'interval.until');
  if (!isRecord(record.source)) fail('source must be an object.');
  requireString(record.source, 'remote', 'source.remote');
  requireString(record.source, 'defaultBranch', 'source.defaultBranch');
}

function validateVerified(record: Record<string, unknown>): void {
  if (!Array.isArray(record.branches)) fail('branches must be an array.');
  if (!Array.isArray(record.defaultBranchCommits)) {
    fail('defaultBranchCommits must be an array.');
  }
  record.defaultBranchCommits.forEach((commit, index) =>
    validateCommit(commit, `defaultBranchCommits[${index}]`),
  );
  record.branches.forEach((branch, index) => {
    const context = `branches[${index}]`;
    if (!isRecord(branch)) fail(`${context} must be an object.`);
    requireString(branch, 'name', `${context}.name`);
    requireObjectId(branch, 'headSha', `${context}.headSha`);
    if (
      !Array.isArray(branch.mergeBaseShas) ||
      branch.mergeBaseShas.length === 0
    ) {
      fail(`${context}.mergeBaseShas must be a non-empty array.`);
    }
    for (const mergeBase of branch.mergeBaseShas) {
      if (typeof mergeBase !== 'string' || !FULL_OBJECT_ID.test(mergeBase)) {
        fail(`${context}.mergeBaseShas must contain full object IDs.`);
      }
    }
    if (!Number.isSafeInteger(branch.aheadBy) || Number(branch.aheadBy) < 0) {
      fail(`${context}.aheadBy must be a non-negative integer.`);
    }
    if (!Number.isSafeInteger(branch.behindBy) || Number(branch.behindBy) < 0) {
      fail(`${context}.behindBy must be a non-negative integer.`);
    }
    if (branch.activity !== 'active' && branch.activity !== 'inactive') {
      fail(`${context}.activity must be active or inactive.`);
    }
    for (const key of ['commits', 'intervalCommits'] as const) {
      if (!Array.isArray(branch[key]))
        fail(`${context}.${key} must be an array.`);
      branch[key].forEach((commit, commitIndex) =>
        validateCommit(commit, `${context}.${key}[${commitIndex}]`),
      );
    }
  });
}

function validateUnverifiable(record: Record<string, unknown>): void {
  if (!Array.isArray(record.errors) || record.errors.length === 0) {
    fail('errors must be a non-empty array.');
  }
  record.errors.forEach((error, index) => {
    const context = `errors[${index}]`;
    if (!isRecord(error)) fail(`${context} must be an object.`);
    requireString(error, 'code', `${context}.code`);
    requireString(error, 'message', `${context}.message`);
    if (error.detail !== undefined && typeof error.detail !== 'string') {
      fail(`${context}.detail must be a string when present.`);
    }
  });
}

export function assertGitEvidence(
  value: unknown,
): asserts value is GitEvidence {
  if (!isRecord(value)) fail('document must be an object.');
  validateBase(value);
  if (value.status === 'verified') {
    validateVerified(value);
    return;
  }
  if (value.status === 'unverifiable') {
    validateUnverifiable(value);
    return;
  }
  fail('status must be verified or unverifiable.');
}

export function serializeGitEvidence(value: unknown): string {
  assertGitEvidence(value);
  return `${JSON.stringify(value)}\n`;
}
