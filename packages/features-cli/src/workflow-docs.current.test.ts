import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runIssuesManagerCli } from './cli';
import {
  type FeatureRecord,
  getFeatureDir,
  getFeaturesStatusPath,
} from './features-state';

describe('docs current', () => {
  let cwd: string;

  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'features-cli-docs-current-'));
  });

  afterEach(async () => {
    await rm(cwd, { recursive: true, force: true });
  });

  async function seed(feature: FeatureRecord) {
    await mkdir(getFeatureDir(cwd, feature.id, feature.slug), {
      recursive: true,
    });
    await writeFile(
      getFeaturesStatusPath(cwd),
      `${JSON.stringify({ version: '2', nextFeatureId: 2, features: [feature] })}\n`,
      'utf8',
    );
  }

  it('reports no selected feature without changing state', async () => {
    await expect(runIssuesManagerCli(['init'], { cwd })).resolves.toMatchObject(
      {
        exitCode: 0,
      },
    );

    const result = await runIssuesManagerCli(['docs', 'current', '--json'], {
      cwd,
    });

    expect(result).toMatchObject({ exitCode: 0, stderr: '' });
    expect(JSON.parse(result.stdout)).toMatchObject({
      schemaVersion: '1',
      kind: 'docs-current',
      progress: null,
      guidance: expect.objectContaining({
        state: 'no-current-feature',
        recommendedSkill: null,
      }),
    });
  });

  it('wraps canonical progress with frontier guidance for an explicit paused selection', async () => {
    const feature: FeatureRecord = {
      id: 1,
      slug: 'sample-feature',
      status: 'paused',
      phase: 'design',
      focusPath: null,
    };
    await seed(feature);
    const featureDir = getFeatureDir(cwd, feature.id, feature.slug);
    await Promise.all(
      ['PRD.md', 'GRILL_SESSION.md', 'DECISIONS.md'].map((name) =>
        writeFile(join(featureDir, name), '# Ready\n', 'utf8'),
      ),
    );

    const result = await runIssuesManagerCli(
      ['docs', 'current', '--feature', '001', '--json'],
      { cwd },
    );

    expect(result).toMatchObject({ exitCode: 0, stderr: '' });
    expect(JSON.parse(result.stdout)).toMatchObject({
      schemaVersion: '1',
      kind: 'docs-current',
      selection: { selector: '001', mode: 'explicit' },
      progress: { frontier: { kind: 'design-ready' } },
      guidance: expect.objectContaining({
        state: 'selected',
        recommendedSkill: 'jz-write-spec',
        relatedTopics: expect.arrayContaining(['design', 'planning']),
      }),
    });
  });

  it('writes docs JSON errors to stderr for invalid explicit selection', async () => {
    await expect(runIssuesManagerCli(['init'], { cwd })).resolves.toMatchObject(
      {
        exitCode: 0,
      },
    );

    const result = await runIssuesManagerCli(
      ['docs', 'current', '--feature', 'missing', '--json'],
      { cwd },
    );

    expect(result).toMatchObject({ exitCode: 1, stdout: '' });
    expect(JSON.parse(result.stderr)).toMatchObject({
      schemaVersion: '1',
      kind: 'docs-error',
      error: { code: 'FEATURE_SELECTION_ERROR' },
    });
  });
});
