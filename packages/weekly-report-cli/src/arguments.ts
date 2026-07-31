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
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export function parseGitCollectionArguments(
  args: readonly string[],
): ArgumentParseResult {
  const values: Partial<GitCollectionArguments> = {};

  for (let index = 0; index < args.length; index += 2) {
    const option = args[index] as keyof typeof OPTION_TO_KEY;
    const key = OPTION_TO_KEY[option];
    const value = args[index + 1];
    if (key === undefined || value === undefined) {
      return { error: `Unknown or incomplete option: ${option}.`, ok: false };
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

  for (const [option, key] of [
    ['--since', 'since'],
    ['--until', 'until'],
  ] as const) {
    const value = values[key] as string;
    if (!ISO_INSTANT.test(value) || !Number.isFinite(Date.parse(value))) {
      return {
        error: `Invalid ISO instant for ${option}: ${value}.`,
        ok: false,
      };
    }
  }

  if (Date.parse(values.until as string) < Date.parse(values.since as string)) {
    return { error: '--until must be at or after --since.', ok: false };
  }

  return { ok: true, value: values as GitCollectionArguments };
}
