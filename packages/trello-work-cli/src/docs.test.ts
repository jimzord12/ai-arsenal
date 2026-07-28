import { COMMAND_CATALOG } from './command-catalog';
import { renderDocs, renderShortHelp } from './docs';

describe('offline Work CLI documentation', () => {
  it('uses one complete command catalog for short help and the full guide', () => {
    const help = renderShortHelp();
    const guide = renderDocs({ mode: 'default', output: 'text' });

    expect(new Set(COMMAND_CATALOG.map((command) => command.id)).size).toBe(
      COMMAND_CATALOG.length,
    );
    for (const command of COMMAND_CATALOG) {
      expect(help).toContain(command.syntax);
      expect(guide).toContain(command.syntax);
      if (command.mutating) {
        expect(command.options).toEqual(
          expect.arrayContaining([
            '--dry-run',
            '--if-version',
            '--operation-id',
          ]),
        );
      }
    }
  });

  it('ships complete workflows, configuration, safety, failure, and recovery guidance', () => {
    const guide = renderDocs({ mode: 'default', output: 'text' });
    for (const phrase of [
      'Recommended human workflow',
      'Recommended agent workflow',
      'TRELLO_API_KEY',
      'TRELLO_API_TOKEN',
      '--board',
      'exact board name',
      'work boards list',
      'work lists create',
      'work workflow init',
      'Inbox',
      'In Progress',
      'reconciliation defaults to description',
      'close/archive',
      'TRELLO_LIVE_E2E',
      'cards to Done',
      'empty run-created lists',
      'dry-run',
      'optimistic concurrency',
      'operation ID',
      'partial or ambiguous',
      'work reconcile',
      'Exit codes',
      'stdout',
      'stderr',
    ]) {
      expect(guide).toContain(phrase);
    }
  });

  it('lists topics and selects an exact topic deterministically', () => {
    const first = renderDocs({ mode: 'list', output: 'text' });
    const second = renderDocs({ mode: 'list', output: 'text' });
    expect(first).toBe(second);
    expect(first).toContain('configuration');
    expect(
      renderDocs({ mode: 'topic', value: 'recovery', output: 'text' }),
    ).toContain('Recovery');
    expect(() =>
      renderDocs({ mode: 'topic', value: 'missing', output: 'text' }),
    ).toThrow(/topic/i);
  });

  it('searches deterministically without reflecting the query', () => {
    const result = renderDocs({
      mode: 'search',
      value: 'optimistic concurrency',
      output: 'text',
    });
    expect(result).toMatch(/safety/i);
    expect(
      renderDocs({
        mode: 'search',
        value: 'api-token-value',
        output: 'text',
      }),
    ).not.toContain('api-token-value');
  });

  it('renders structured JSON instead of one guide blob', () => {
    const result = JSON.parse(
      renderDocs({ mode: 'default', output: 'json' }),
    ) as Record<string, unknown>;
    expect(result).toMatchObject({
      version: 1,
      mode: 'default',
      topics: expect.any(Array),
      commands: expect.any(Array),
    });
    expect(result).not.toHaveProperty('guide');
  });

  it('documents global Hermes env support and single-label filtering consistently', () => {
    for (const command of COMMAND_CATALOG.filter(
      (command) =>
        command.id !== 'validate-file' &&
        command.id !== 'docs' &&
        command.id !== 'boards-list',
    )) {
      expect(command.options).toContain('--hermes-env');
      expect(command.options).toContain('--board');
    }
    const guide = renderDocs({ mode: 'default', output: 'text' });
    expect(guide).toContain('--hermes-env');
    expect(guide).toContain('one --label');
    expect(guide).not.toContain('repeatable --label');
    expect(guide).not.toContain(
      'Remote board operations require TRELLO_BOARD_ID',
    );
  });
});
