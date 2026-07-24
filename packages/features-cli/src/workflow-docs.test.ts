import {
  DOCS_TOPICS,
  renderDocsIndex,
  renderDocsOverview,
  renderDocsTopic,
  resolveDocsTopic,
} from './workflow-docs';

describe('offline workflow documentation model', () => {
  it('keeps the nine canonical topics in stable order with numeric aliases', () => {
    expect(
      DOCS_TOPICS.map((topic) => [topic.index, topic.name, topic.aliases]),
    ).toEqual([
      [1, 'workflow', ['1']],
      [2, 'artifacts', ['2']],
      [3, 'features', ['3']],
      [4, 'design', ['4']],
      [5, 'planning', ['5']],
      [6, 'issues', ['6']],
      [7, 'execution', ['7']],
      [8, 'commands', ['8']],
      [9, 'recovery', ['9']],
    ]);
  });

  it('renders a concise overview and a versioned index from the same registry', () => {
    expect(renderDocsOverview()).toContain('JZ Spec-to-Ship');
    expect(renderDocsOverview()).toContain('features-cli docs --index');

    const index = JSON.parse(renderDocsIndex({ json: true }));
    expect(index).toMatchObject({
      schemaVersion: '1',
      kind: 'docs-index',
      topics: expect.arrayContaining([
        expect.objectContaining({
          index: 1,
          name: 'workflow',
          command: 'features-cli docs workflow',
        }),
      ]),
      actions: [expect.objectContaining({ name: 'current' })],
    });
    expect(index.topics).toHaveLength(9);
  });

  it('resolves only exact canonical names and numeric aliases', () => {
    expect(resolveDocsTopic('workflow')?.name).toBe('workflow');
    expect(resolveDocsTopic('1')?.name).toBe('workflow');
    expect(resolveDocsTopic('work')).toBeUndefined();
    expect(resolveDocsTopic('01')).toBeUndefined();
  });

  it('renders curated topic guidance in human and JSON modes', () => {
    const topic = resolveDocsTopic('workflow');
    expect(topic).toBeDefined();
    expect(renderDocsTopic(topic!, { json: false })).toContain(
      'Topic: workflow',
    );
    const rendered = JSON.parse(renderDocsTopic(topic!, { json: true }));
    expect(rendered).toMatchObject({
      schemaVersion: '1',
      kind: 'docs-topic',
      topic: expect.objectContaining({
        name: 'workflow',
        relatedTopics: expect.arrayContaining(['artifacts', 'execution']),
      }),
    });
  });
});
