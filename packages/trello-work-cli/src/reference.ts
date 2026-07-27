import { WorkCliError } from './errors';

export type WorkReference =
  | { kind: 'workUnitId'; value: string }
  | { kind: 'cardId'; value: string }
  | { kind: 'cardUrl'; value: string; shortLink: string };

const WORK_UNIT_ID = /^WU-[1-9][0-9]*$/;
const CARD_ID = /^[0-9a-fA-F]{24}$/;
const SHORT_LINK = /^[A-Za-z0-9]{8,32}$/;

export function parseReference(input: string): WorkReference {
  if (!input || input.trim() !== input) {
    throw new WorkCliError(
      'INVALID_REFERENCE',
      'Reference is empty or has whitespace.',
    );
  }
  if (WORK_UNIT_ID.test(input)) {
    return { kind: 'workUnitId', value: input };
  }
  if (CARD_ID.test(input)) {
    return { kind: 'cardId', value: input.toLowerCase() };
  }
  try {
    const url = new URL(input);
    if (
      !['trello.com', 'www.trello.com'].includes(url.hostname.toLowerCase()) ||
      url.protocol !== 'https:' ||
      url.search ||
      url.hash
    ) {
      throw new Error('not an accepted Trello URL');
    }
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] !== 'c' || !parts[1] || !SHORT_LINK.test(parts[1])) {
      throw new Error('not a Trello card URL');
    }
    return { kind: 'cardUrl', value: input, shortLink: parts[1] };
  } catch {
    throw new WorkCliError(
      'INVALID_REFERENCE',
      'Reference must be a WU-N ID, 24-character Trello card ID, or Trello card URL.',
    );
  }
}
