export type GitCollectionArguments = {
  defaultBranch: string;
  remote: string;
  repository: string;
  since: string;
  until: string;
};

export type ArgumentParseResult =
  { ok: true; value: GitCollectionArguments } | { error: string; ok: false };

const OPTION_TO_KEY = {
  '--repository': 'repository',
  '--remote': 'remote',
  '--default-branch': 'defaultBranch',
  '--since': 'since',
  '--until': 'until',
} as const;

const REQUIRED_OPTIONS = Object.entries(OPTION_TO_KEY) as Array<
  [keyof typeof OPTION_TO_KEY, keyof GitCollectionArguments]
>;

const ISO_INSTANT =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|([+-])(\d{2}):(\d{2}))$/;
const SAFE_REF_PATH =
  /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?(?:\/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?)*$/;

function isSafeRefPath(value: string): boolean {
  return (
    SAFE_REF_PATH.test(value) &&
    !value.includes('..') &&
    !value
      .split('/')
      .some((component) => component.toLowerCase().endsWith('.lock'))
  );
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

export function parseGitCollectionArguments(
  args: readonly string[],
): ArgumentParseResult {
  const values: Partial<GitCollectionArguments> = {};

  for (let index = 0; index < args.length; index += 2) {
    const option = args[index] as keyof typeof OPTION_TO_KEY;
    const key = OPTION_TO_KEY[option];
    const value = args[index + 1];
    if (key === undefined || value === undefined) {
      return { error: 'Unknown or incomplete option.', ok: false };
    }
    if (value.length === 0) {
      return { error: `Option value must not be empty: ${option}.`, ok: false };
    }
    if (values[key] !== undefined) {
      return { error: `Duplicate option: ${option}.`, ok: false };
    }
    values[key] = value;
  }

  for (const [option, key] of REQUIRED_OPTIONS) {
    if (values[key] === undefined) {
      return { error: `Missing required option: ${option}.`, ok: false };
    }
  }

  if (!isSafeRefPath(values.remote as string)) {
    return { error: 'Invalid remote name.', ok: false };
  }

  if (!isSafeRefPath(values.defaultBranch as string)) {
    return { error: 'Invalid default branch name.', ok: false };
  }

  for (const [option, key] of [
    ['--since', 'since'],
    ['--until', 'until'],
  ] as const) {
    const value = values[key] as string;
    if (!isStrictIsoInstant(value)) {
      return {
        error: `Invalid ISO instant for ${option}.`,
        ok: false,
      };
    }
  }

  if (Date.parse(values.until as string) < Date.parse(values.since as string)) {
    return { error: '--until must be at or after --since.', ok: false };
  }

  return { ok: true, value: values as GitCollectionArguments };
}
