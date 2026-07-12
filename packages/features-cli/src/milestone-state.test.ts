import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  type FeatureRecord,
  getFeatureDir,
  getFeaturesStatusPath,
  withFeatureStateLock,
} from './features-state';
import { type IssueRecord } from './issues-state';
import {
  getMilestoneState,
  markMilestoneDecomposed,
  MilestoneStateError,
  parseMilestones,
  reconcileMilestonesWithIssues,
} from './milestone-state';
import { runMilestoneProgress } from './milestone-progress';

const fsPromises =
  jest.requireActual<typeof import('node:fs/promises')>('node:fs/promises');

const START = '<!-- milestone-plan:start -->';
const END = '<!-- milestone-plan:end -->';

function milestone(options: {
  number: number;
  title: string;
  slug: string;
  dependsOn?: string[];
  decomposed?: string | null;
  newline?: string;
}): string {
  const newline = options.newline ?? '\n';
  const dependencies = options.dependsOn?.length
    ? options.dependsOn.map((slug) => `\`${slug}\``).join(', ')
    : 'none';
  const lines = [
    `### ${options.number}. ${options.title} — \`${options.slug}\``,
    '',
    `- **DependsOn:** ${dependencies}`,
  ];

  if (options.decomposed !== null) {
    lines.push(`- **Decomposed:** ${options.decomposed ?? 'pending'}`);
  }

  lines.push('- **Demo:** retained verbatim');
  return lines.join(newline);
}

function makeSpec(options?: {
  milestones?: string[];
  newline?: string;
  prefix?: string;
  suffix?: string;
}): string {
  const newline = options?.newline ?? '\n';
  const milestones = options?.milestones ?? [
    milestone({
      number: 1,
      title: 'First slice',
      slug: 'first-slice',
      newline,
    }),
    milestone({
      number: 2,
      title: 'Second slice',
      slug: 'second-slice',
      dependsOn: ['first-slice'],
      newline,
    }),
  ];

  return [
    options?.prefix ?? '# Specification',
    '### 99. Lookalike outside — `outside-before`',
    START,
    '## Milestones',
    ...milestones,
    '### Coverage',
    '| Requirement | Milestone |',
    '|---|---|',
    '| FR-001 | `first-slice` |',
    END,
    '### 100. Lookalike outside — `outside-after`',
    options?.suffix ?? 'Tail content',
  ].join(newline);
}

function makeIssue(overrides: Partial<IssueRecord> = {}): IssueRecord {
  return {
    id: 1,
    title: 'Issue one',
    status: 'ready-for-agent',
    method: 'tdd',
    complexity: 1,
    blockedBy: [],
    filePath: 'issues/01-one/issue.md',
    milestone: 'first-slice',
    ...overrides,
  };
}

describe('parseMilestones', () => {
  it('parses only numbered milestone headings inside the exact fence', () => {
    const parsed = parseMilestones(
      makeSpec({
        milestones: [
          milestone({
            number: 1,
            title: 'First slice',
            slug: 'first-slice',
            decomposed: '2026-07-10T12:00:00.000Z',
          }),
          milestone({
            number: 2,
            title: 'Second slice',
            slug: 'second-slice',
            dependsOn: ['first-slice'],
          }),
        ],
      }),
    );

    expect(parsed).toEqual([
      {
        number: 1,
        title: 'First slice',
        slug: 'first-slice',
        dependsOn: [],
        decomposedAt: '2026-07-10T12:00:00.000Z',
      },
      {
        number: 2,
        title: 'Second slice',
        slug: 'second-slice',
        dependsOn: ['first-slice'],
        decomposedAt: null,
      },
    ]);
  });

  it('returns an empty plan for one valid empty fence', () => {
    expect(
      parseMilestones(`# Spec\n${START}\n## Milestones\n${END}\n`),
    ).toEqual([]);
  });

  it('treats an omitted legacy Decomposed row as pending', () => {
    const spec = makeSpec({
      milestones: [
        milestone({
          number: 1,
          title: 'Legacy',
          slug: 'legacy',
          decomposed: null,
        }),
      ],
    });

    expect(parseMilestones(spec)).toEqual([
      {
        number: 1,
        title: 'Legacy',
        slug: 'legacy',
        dependsOn: [],
        decomposedAt: null,
      },
    ]);
  });

  it.each([
    ['missing fences', '# Spec\n'],
    ['missing end fence', `${START}\n`],
    ['missing start fence', `${END}\n`],
    ['duplicate start fence', `${START}\n${START}\n${END}\n`],
    ['duplicate end fence', `${START}\n${END}\n${END}\n`],
    ['reversed fences', `${END}\n${START}\n`],
  ])('rejects %s', (_label, spec) => {
    expect(() => parseMilestones(spec)).toThrow(MilestoneStateError);
  });

  it('ignores fence lookalikes without accepting them as the required exact fence', () => {
    const lookalikes = [
      '<!-- milestone-plan:start-extra -->',
      '<!-- milestone-plan:end-extra -->',
    ].join('\n');

    expect(() => parseMilestones(lookalikes)).toThrow('exactly one');
    expect(parseMilestones(`${lookalikes}\n${makeSpec()}`)).toHaveLength(2);
  });

  it.each([
    [
      'malformed numeric heading',
      '### 1. Missing em dash `bad-slug`\n\n- **DependsOn:** none',
    ],
    ['invalid slug', '### 1. Bad slug — `Bad_Slug`\n\n- **DependsOn:** none'],
    [
      'duplicate slug',
      [
        milestone({ number: 1, title: 'First', slug: 'same-slug' }),
        milestone({ number: 2, title: 'Second', slug: 'same-slug' }),
      ].join('\n'),
    ],
    [
      'duplicate number',
      [
        milestone({ number: 1, title: 'First', slug: 'first' }),
        milestone({ number: 1, title: 'Second', slug: 'second' }),
      ].join('\n'),
    ],
  ])('rejects %s', (_label, body) => {
    expect(() => parseMilestones(`${START}\n${body}\n${END}`)).toThrow(
      MilestoneStateError,
    );
  });

  it.each([
    [
      'missing DependsOn',
      '### 1. First — `first`\n\n- **Decomposed:** pending',
    ],
    [
      'duplicate DependsOn',
      '### 1. First — `first`\n\n- **DependsOn:** none\n- **DependsOn:** none',
    ],
    [
      'duplicate Decomposed',
      '### 1. First — `first`\n\n- **DependsOn:** none\n- **Decomposed:** pending\n- **Decomposed:** pending',
    ],
  ])('rejects milestone metadata with %s', (_label, body) => {
    expect(() => parseMilestones(`${START}\n${body}\n${END}`)).toThrow(
      MilestoneStateError,
    );
  });

  it.each([
    ['unquoted dependency', '- **DependsOn:** first'],
    ['empty dependency', '- **DependsOn:** `first`, '],
    ['duplicate dependency', '- **DependsOn:** `first`, `first`'],
    ['unknown dependency', '- **DependsOn:** `unknown`'],
    ['self dependency', '- **DependsOn:** `second`'],
  ])('rejects a %s', (_label, dependencyRow) => {
    const body = [
      milestone({ number: 1, title: 'First', slug: 'first' }),
      `### 2. Second — \`second\`\n\n${dependencyRow}\n- **Decomposed:** pending`,
    ].join('\n');

    expect(() => parseMilestones(`${START}\n${body}\n${END}`)).toThrow(
      MilestoneStateError,
    );
  });

  it('rejects dependency cycles', () => {
    const body = [
      milestone({
        number: 1,
        title: 'First',
        slug: 'first',
        dependsOn: ['second'],
      }),
      milestone({
        number: 2,
        title: 'Second',
        slug: 'second',
        dependsOn: ['first'],
      }),
    ].join('\n');

    expect(() => parseMilestones(`${START}\n${body}\n${END}`)).toThrow('cycle');
  });

  it('accepts only canonical UTC ISO timestamps that round-trip through toISOString', () => {
    const canonical = makeSpec({
      milestones: [
        milestone({
          number: 1,
          title: 'First',
          slug: 'first',
          decomposed: '2026-01-02T03:04:05.006Z',
        }),
      ],
    });

    expect(parseMilestones(canonical)[0].decomposedAt).toBe(
      '2026-01-02T03:04:05.006Z',
    );
  });

  it.each([
    '2026-07-10',
    '2026-07-10T12:00:00Z',
    '2026-07-10T14:00:00.000+02:00',
    '2026-02-30T12:00:00.000Z',
    '2026-07-10T12:00:00.000Z trailing',
    'Pending',
  ])('rejects noncanonical timestamp %s', (value) => {
    const spec = makeSpec({
      milestones: [
        milestone({
          number: 1,
          title: 'First',
          slug: 'first',
          decomposed: value,
        }),
      ],
    });

    expect(() => parseMilestones(spec)).toThrow(
      'pending or a canonical UTC ISO timestamp',
    );
  });
});

describe('milestone/issue reconciliation', () => {
  it('keeps explicit markers authoritative and attaches stable sorted issue IDs', () => {
    const milestones = parseMilestones(makeSpec());
    const result = reconcileMilestonesWithIssues(milestones, [
      makeIssue({ id: 10 }),
      makeIssue({ id: 2 }),
      makeIssue({ id: 7, milestone: 'second-slice' }),
    ]);

    expect(
      result.milestones.map((entry) => ({
        slug: entry.slug,
        decomposedAt: entry.decomposedAt,
        issueIds: entry.issueIds,
      })),
    ).toEqual([
      { slug: 'first-slice', decomposedAt: null, issueIds: [2, 10] },
      { slug: 'second-slice', decomposedAt: null, issueIds: [7] },
    ]);
    expect(result.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'MILESTONE_MARKER_TAG_MISMATCH',
          milestoneSlug: 'first-slice',
        }),
        expect.objectContaining({
          code: 'MILESTONE_MARKER_TAG_MISMATCH',
          milestoneSlug: 'second-slice',
        }),
      ]),
    );
  });

  it('surfaces missing tags, unknown tags, and both directions of marker/tag disagreement', () => {
    const spec = makeSpec({
      milestones: [
        milestone({
          number: 1,
          title: 'Pending with issues',
          slug: 'pending-with-issues',
        }),
        milestone({
          number: 2,
          title: 'Marked without issues',
          slug: 'marked-without-issues',
          decomposed: '2026-07-10T12:00:00.000Z',
        }),
      ],
    });
    const result = reconcileMilestonesWithIssues(parseMilestones(spec), [
      makeIssue({ id: 1, milestone: 'pending-with-issues' }),
      makeIssue({ id: 2, milestone: 'not-planned' }),
      makeIssue({ id: 3, milestone: undefined }),
    ]);

    expect(result.findings.map((finding) => finding.code)).toEqual([
      'ISSUE_MILESTONE_MISSING',
      'ISSUE_MILESTONE_UNKNOWN',
      'MILESTONE_MARKER_TAG_MISMATCH',
      'MILESTONE_MARKER_TAG_MISMATCH',
    ]);
  });
});

describe('milestone filesystem state and marking', () => {
  let cwd: string;
  const feature: FeatureRecord = {
    id: 1,
    slug: 'sample-feature',
    status: 'in-progress',
    phase: 'implementation',
    focusPath: null,
  };

  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'milestone-state-'));
    await mkdir(getFeatureDir(cwd, feature.id, feature.slug), {
      recursive: true,
    });
    await writeFile(
      getFeaturesStatusPath(cwd),
      `${JSON.stringify({ features: [feature], version: '2' }, null, 2)}\n`,
      'utf8',
    );
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await rm(cwd, { recursive: true, force: true });
  });

  async function writeSpec(spec = makeSpec()) {
    const path = join(getFeatureDir(cwd, feature.id, feature.slug), 'SPEC.md');
    await writeFile(path, spec, 'utf8');
    return path;
  }

  async function writeIssue(id: number, milestoneSlug?: string) {
    const issueDir = join(
      getFeatureDir(cwd, feature.id, feature.slug),
      'issues',
      `${String(id).padStart(2, '0')}-issue-${id}`,
    );
    await mkdir(issueDir, { recursive: true });
    const metadata = [
      'Status: ready-for-agent',
      'Method: tdd',
      'Complexity: 1',
      'BlockedBy: none',
    ];

    if (milestoneSlug !== undefined) {
      metadata.push(`Milestone: ${milestoneSlug}`);
    }

    await writeFile(
      join(issueDir, 'issue.md'),
      [...metadata, `# Issue ${id}`, ''].join('\n'),
      'utf8',
    );
  }

  it('reads canonical issue Markdown without creating derived issue state', async () => {
    await writeSpec();
    await writeIssue(2, 'first-slice');
    await writeIssue(1, 'first-slice');

    const state = await getMilestoneState({ cwd, feature });

    expect(state.milestones[0].issueIds).toEqual([1, 2]);
    await expect(
      readFile(
        join(
          getFeatureDir(cwd, feature.id, feature.slug),
          'issues-status.json',
        ),
        'utf8',
      ),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('marks one milestone after canonical tagged issues validate', async () => {
    const specPath = await writeSpec();
    await writeIssue(1, 'first-slice');
    await writeIssue(2, 'second-slice');

    const result = await markMilestoneDecomposed({
      cwd,
      feature,
      milestoneSlug: 'first-slice',
      timestamp: '2026-07-10T12:00:00.000Z',
    });
    const stored = await readFile(specPath, 'utf8');

    expect(result).toMatchObject({
      changed: true,
      milestoneSlug: 'first-slice',
      decomposedAt: '2026-07-10T12:00:00.000Z',
    });
    expect(parseMilestones(stored).map((entry) => entry.decomposedAt)).toEqual([
      '2026-07-10T12:00:00.000Z',
      null,
    ]);
  });

  it('fails without writing when another repository writer holds the shared lock', async () => {
    const specPath = await writeSpec();
    await writeIssue(1, 'first-slice');
    const before = await readFile(specPath, 'utf8');

    await withFeatureStateLock(cwd, async () => {
      await expect(
        markMilestoneDecomposed({
          cwd,
          feature,
          milestoneSlug: 'first-slice',
          timestamp: '2026-07-10T12:00:00.000Z',
        }),
      ).rejects.toThrow('already in progress');
    });

    await expect(readFile(specPath, 'utf8')).resolves.toBe(before);
  });

  it('preserves BOM, CRLF, whitespace, unrelated content, and trailing newline byte-for-byte', async () => {
    const newline = '\r\n';
    const original = `\uFEFF${makeSpec({
      newline,
      prefix: '# Spec with  two spaces  ',
      suffix: 'Tail\tcontent\r\n',
    })}`;
    const specPath = await writeSpec(original);
    await writeIssue(1, 'first-slice');
    await writeIssue(2, 'second-slice');

    await markMilestoneDecomposed({
      cwd,
      feature,
      milestoneSlug: 'first-slice',
      timestamp: '2026-07-10T12:00:00.000Z',
    });

    const stored = await readFile(specPath, 'utf8');
    expect(stored).toBe(
      original.replace(
        '- **Decomposed:** pending',
        '- **Decomposed:** 2026-07-10T12:00:00.000Z',
      ),
    );
  });

  it('inserts a missing legacy marker using the existing line ending without changing other bytes', async () => {
    const legacyMilestone = milestone({
      number: 1,
      title: 'Legacy',
      slug: 'legacy',
      decomposed: null,
      newline: '\r\n',
    });
    const original = `\uFEFF${makeSpec({ milestones: [legacyMilestone], newline: '\r\n', suffix: 'tail' })}`;
    const specPath = await writeSpec(original);
    await writeIssue(1, 'legacy');

    await markMilestoneDecomposed({
      cwd,
      feature,
      milestoneSlug: 'legacy',
      timestamp: '2026-07-10T12:00:00.000Z',
    });

    const expected = original.replace(
      '- **DependsOn:** none\r\n',
      '- **DependsOn:** none\r\n- **Decomposed:** 2026-07-10T12:00:00.000Z\r\n',
    );
    await expect(readFile(specPath, 'utf8')).resolves.toBe(expected);
  });

  it('does not write when an existing canonical timestamp makes marking idempotent', async () => {
    const timestamp = '2026-07-10T12:00:00.000Z';
    const spec = makeSpec({
      milestones: [
        milestone({
          number: 1,
          title: 'First',
          slug: 'first-slice',
          decomposed: timestamp,
        }),
      ],
    });
    const specPath = await writeSpec(spec);
    await writeIssue(1, 'first-slice');
    const writeSpy = jest.spyOn(fsPromises, 'writeFile');
    const beforeStats = await stat(specPath);

    const result = await markMilestoneDecomposed({
      cwd,
      feature,
      milestoneSlug: 'first-slice',
      timestamp: '2026-07-11T12:00:00.000Z',
    });

    expect(result).toMatchObject({ changed: false, decomposedAt: timestamp });
    expect(writeSpy).not.toHaveBeenCalled();
    expect((await stat(specPath)).mtimeMs).toBe(beforeStats.mtimeMs);
    await expect(readFile(specPath, 'utf8')).resolves.toBe(spec);
  });

  it.each([
    [
      'an unknown selected milestone',
      async () => writeIssue(1, 'first-slice'),
      'unknown-milestone',
    ],
    [
      'no issues tagged to the selected milestone',
      async () => writeIssue(1, 'second-slice'),
      'first-slice',
    ],
    [
      'an issue with no milestone tag',
      async () => writeIssue(1),
      'first-slice',
    ],
    [
      'an issue with an unknown milestone tag',
      async () => writeIssue(1, 'not-planned'),
      'first-slice',
    ],
  ])(
    'fails without writing for %s',
    async (_label, arrangeIssues, selectedSlug) => {
      const specPath = await writeSpec();
      await arrangeIssues();
      const before = await readFile(specPath, 'utf8');

      await expect(
        markMilestoneDecomposed({
          cwd,
          feature,
          milestoneSlug: selectedSlug,
          timestamp: '2026-07-10T12:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(MilestoneStateError);

      await expect(readFile(specPath, 'utf8')).resolves.toBe(before);
    },
  );

  it('fails without writing when canonical issue Markdown is malformed', async () => {
    const specPath = await writeSpec();
    const issueDir = join(
      getFeatureDir(cwd, feature.id, feature.slug),
      'issues',
      '01-malformed',
    );
    await mkdir(issueDir, { recursive: true });
    await writeFile(
      join(issueDir, 'issue.md'),
      '# Missing canonical metadata\n',
      'utf8',
    );
    const before = await readFile(specPath, 'utf8');

    await expect(
      markMilestoneDecomposed({
        cwd,
        feature,
        milestoneSlug: 'first-slice',
        timestamp: '2026-07-10T12:00:00.000Z',
      }),
    ).rejects.toThrow('Expected a Status header');

    await expect(readFile(specPath, 'utf8')).resolves.toBe(before);
  });

  it('fails without writing for a noncanonical requested timestamp', async () => {
    const specPath = await writeSpec();
    await writeIssue(1, 'first-slice');
    const before = await readFile(specPath, 'utf8');

    await expect(
      markMilestoneDecomposed({
        cwd,
        feature,
        milestoneSlug: 'first-slice',
        timestamp: '2026-07-10',
      }),
    ).rejects.toThrow('canonical UTC ISO timestamp');

    await expect(readFile(specPath, 'utf8')).resolves.toBe(before);
  });

  it('keeps tagged milestones pending in compatibility output until an explicit timestamp exists', async () => {
    await writeSpec();
    await writeIssue(1, 'first-slice');

    const result = await runMilestoneProgress([feature.slug], { cwd });

    expect(result).toMatchObject({ exitCode: 0, stderr: '' });
    expect(result.stdout).toContain('[ pending  ] first-slice  — 1 issues');
    expect(result.stdout).toContain('Decomposed: 0/2');
  });
});
