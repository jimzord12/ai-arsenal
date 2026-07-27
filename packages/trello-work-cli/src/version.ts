import { WorkCliError } from './errors';

export type Versioned = { dateLastActivity: string };

export function cardVersion(card: Versioned): string {
  return card.dateLastActivity;
}

export function assertCurrentVersion(
  expectedVersion: string | undefined,
  currentVersion: string,
): void {
  if (expectedVersion === undefined || expectedVersion === currentVersion)
    return;
  throw new WorkCliError(
    'STALE_VERSION',
    'The supplied version does not match the current Trello card version.',
    {
      exitCode: 4,
      recovery: { expectedVersion, currentVersion },
    },
  );
}
