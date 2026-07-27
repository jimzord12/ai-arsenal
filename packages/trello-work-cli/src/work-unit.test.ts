import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  applyMetadataMergePatch,
  parseWorkUnit,
  renderWorkUnit,
  WorkUnitError,
} from './work-unit';

const fixtureRoot = resolve(__dirname, '..', 'test', 'fixtures');

async function validDraft(): Promise<string> {
  return readFile(join(fixtureRoot, 'valid-draft.md'), 'utf8');
}

function replaceOnce(text: string, from: string, to: string): string {
  expect(text).toContain(from);
  return text.replace(from, to);
}

describe('canonical Work Unit documents', () => {
  it('parses a valid draft and renders it deterministically without changing meaning', async () => {
    const source = await validDraft();
    const parsed = parseWorkUnit(source);

    expect(parsed.metadata).toMatchObject({
      id: null,
      trello_card_id: null,
      status: 'inbox',
      blocked_by: [],
      labels: ['trello', 'cli'],
    });
    expect(parseWorkUnit(renderWorkUnit(parsed))).toEqual(parsed);
    expect(renderWorkUnit(parseWorkUnit(renderWorkUnit(parsed)))).toBe(
      renderWorkUnit(parsed),
    );
  });

  it('rejects unsafe YAML constructs', async () => {
    const source = await readFile(
      join(fixtureRoot, 'invalid-draft.md'),
      'utf8',
    );
    expect(() => parseWorkUnit(source)).toThrow(/unsafe YAML/i);
  });

  it('allows YAML indicator characters inside JSON-quoted metadata', async () => {
    const source = replaceOnce(
      await validDraft(),
      'title: "Ship a safe Trello Work Unit CLI"',
      'title: "Compare A > B | C"',
    );
    expect(parseWorkUnit(source).metadata.title).toBe('Compare A > B | C');
  });

  it.each([
    [
      'quoted string newline',
      'title: "Ship a safe Trello Work Unit CLI"',
      'title: "unsafe\\nvalue"',
    ],
    [
      'quoted string NUL',
      'title: "Ship a safe Trello Work Unit CLI"',
      'title: "unsafe\\u0000value"',
    ],
    [
      'quoted string control',
      'title: "Ship a safe Trello Work Unit CLI"',
      'title: "unsafe\\u001fvalue"',
    ],
    [
      'array item newline',
      'labels: ["trello", "cli"]',
      'labels: ["unsafe\\nvalue"]',
    ],
  ])('rejects decoded controls in %s', async (_name, from, to) => {
    const source = replaceOnce(await validDraft(), from, to);
    expect(() => parseWorkUnit(source)).toThrow(/control|CR|LF|NUL/i);
  });

  it.each([
    [
      'unknown field',
      'updated_at: null',
      'legacy: null',
      /field order|unknown/i,
    ],
    [
      'duplicate field',
      'title: "Ship a safe Trello Work Unit CLI"',
      'title: "One"\ntitle: "Two"',
      /duplicate/i,
    ],
    [
      'noncanonical order',
      'id: null\ntrello_card_id: null',
      'trello_card_id: null\nid: null',
      /field order/i,
    ],
    ['invalid enum', 'type: task', 'type: epic', /type/i],
    ['invalid Work Unit ID', 'id: null', 'id: "WU-0"', /id/i],
    [
      'invalid Trello card ID',
      'trello_card_id: null',
      'trello_card_id: "abc"',
      /trello_card_id/i,
    ],
    [
      'mismatched ID pairing',
      'id: null',
      'id: "WU-12"',
      /both be null|paired/i,
    ],
    [
      'draft non-inbox status',
      'status: inbox',
      'status: ready',
      /draft.*inbox/i,
    ],
    [
      'draft timestamp',
      'created_at: null',
      'created_at: "2026-07-26T12:00:00.000Z"',
      /draft.*timestamp/i,
    ],
    [
      'duplicate blocker',
      'blocked_by: []',
      'blocked_by: ["WU-2", "WU-2"]',
      /duplicate/i,
    ],
    [
      'legacy relationship field',
      'blocked_by: []',
      'dependencies: []',
      /legacy|unknown|field order/i,
    ],
  ])('rejects %s', async (_name, from, to, expected) => {
    const source = replaceOnce(
      await validDraft(),
      from as string,
      to as string,
    );
    expect(() => parseWorkUnit(source)).toThrow(expected as RegExp);
  });

  it('rejects self-references', async () => {
    let source = await validDraft();
    source = source
      .replace('id: null', 'id: "WU-2"')
      .replace(
        'trello_card_id: null',
        'trello_card_id: "0123456789abcdef01234567"',
      )
      .replace('blocked_by: []', 'blocked_by: ["WU-2"]')
      .replace(
        'created_at: null\nupdated_at: null',
        'created_at: "2026-07-26T12:00:00.000Z"\nupdated_at: "2026-07-26T12:00:00.000Z"',
      );
    expect(() => parseWorkUnit(source)).toThrow(/block itself/i);
  });

  it.each([
    [
      'a missing section',
      '## Verification\n\n- Run the focused Jest suite.\n\n',
      '',
      /Verification/i,
    ],
    [
      'a duplicate section',
      '## Context\n\n',
      '## Context\n\nExtra.\n\n## Context\n\n',
      /duplicate/i,
    ],
    [
      'out-of-order sections',
      '## Scope',
      '## Verification TEMP',
      /unknown|order/i,
    ],
    [
      'an empty section',
      '## Objective\n\nProvide a deterministic command boundary.',
      '## Objective\n\n',
      /Objective.*empty/i,
    ],
  ])('rejects %s', async (_name, from, to, expected) => {
    const source = replaceOnce(await validDraft(), from, to);
    expect(() => parseWorkUnit(source)).toThrow(expected);
  });

  it('allows Open Questions only for inbox documents', async () => {
    let source = await validDraft();
    source = source
      .replace('id: null', 'id: "WU-9"')
      .replace(
        'trello_card_id: null',
        'trello_card_id: "0123456789abcdef01234567"',
      )
      .replace('status: inbox', 'status: ready')
      .replace(
        'created_at: null\nupdated_at: null',
        'created_at: "2026-07-26T12:00:00.000Z"\nupdated_at: "2026-07-26T12:00:00.000Z"',
      );
    expect(() => parseWorkUnit(source)).toThrow(/Open Questions.*inbox/i);
  });

  it('rejects generic patches to status, IDs, timestamps, and unknown fields', async () => {
    const metadata = parseWorkUnit(await validDraft()).metadata;
    for (const patch of [
      { status: 'ready' },
      { id: 'WU-2' },
      { trello_card_id: '0123456789abcdef01234567' },
      { created_at: '2026-07-26T12:00:00.000Z' },
      { updated_at: '2026-07-26T12:00:00.000Z' },
      { unknown: true },
    ]) {
      expect(() => applyMetadataMergePatch(metadata, patch)).toThrow(
        WorkUnitError,
      );
    }
  });
});
