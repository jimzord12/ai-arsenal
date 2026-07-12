import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { FeatureRecord, FeaturesState } from './features-state';

export type IssueBreakdownEntry = {
  id: number;
  title: string;
  status: string;
  decomposed: boolean;
  reopens: number;
  phase?: string;
  milestone?: string;
};

export type FeatureArtifacts = {
  hasGrillSession: boolean;
  hasBrief: boolean;
  hasSpec: boolean;
  hasIssues: boolean;
  issueCounts: { done: number; total: number; decomposed: number } | null;
  aiReviewPassed: boolean;
  humanReviewPassed: boolean;
};

export type StatusOutput = {
  stdout: string;
  stderr: string;
};

// ---------------------------------------------------------------------------
// Feature directory resolution (reuses the padStart convention)
// ---------------------------------------------------------------------------

function formatFeatureDir(feature: FeatureRecord): string {
  return `${String(feature.id).padStart(3, '0')}-${feature.slug}`;
}

function getFeatureDir(cwd: string, feature: FeatureRecord): string {
  return join(cwd, '.scratch', 'features', formatFeatureDir(feature));
}

// ---------------------------------------------------------------------------
// Filesystem artifact scanning
// ---------------------------------------------------------------------------

async function fileExists(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.isFile();
  } catch {
    return false;
  }
}

async function dirHasMdFiles(dirPath: string): Promise<boolean> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    return (
      entries.some((entry) => entry.isFile() && entry.name.endsWith('.md')) ||
      entries.some((entry) => entry.isDirectory() && /^(\d+)/.test(entry.name))
    );
  } catch {
    return false;
  }
}

async function readIssueCounts(
  cwd: string,
  feature: FeatureRecord,
  hasIssues: boolean,
): Promise<{ done: number; total: number; decomposed: number } | null> {
  if (!hasIssues) return null;

  const issuesStatePath = join(
    getFeatureDir(cwd, feature),
    'issues-status.json',
  );

  try {
    const raw = await import('node:fs/promises').then((fs) =>
      fs.readFile(issuesStatePath, 'utf8'),
    );
    const parsed = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.issues)) return null;

    const terminalStatuses = ['done', 'wontfix'];
    const total = parsed.issues.length;
    const done = parsed.issues.filter(
      (issue: { status?: string }) =>
        typeof issue.status === 'string' &&
        terminalStatuses.includes(issue.status),
    ).length;
    const decomposed = parsed.issues.filter(
      (issue: { decomposed?: string }) =>
        typeof issue.decomposed === 'string' &&
        issue.decomposed.trim().length > 0,
    ).length;

    return { done, total, decomposed };
  } catch {
    return null;
  }
}

export async function scanFeatureArtifacts(
  cwd: string,
  feature: FeatureRecord,
): Promise<FeatureArtifacts> {
  const featureDir = getFeatureDir(cwd, feature);

  const hasGrillSession = await fileExists(
    join(featureDir, 'GRILL_SESSION.md'),
  );
  const hasBrief = await fileExists(join(featureDir, 'BRIEF.md'));
  const hasSpec = await fileExists(join(featureDir, 'SPEC.md'));
  const hasIssues = await dirHasMdFiles(join(featureDir, 'issues'));

  const issueCounts = await readIssueCounts(cwd, feature, hasIssues);

  const aiReviewPassed = await dirHasMdFiles(join(featureDir, 'reviews'));

  const humanReviewPassed =
    feature.status === 'archived' && feature.finalStatus === 'done';

  return {
    hasGrillSession,
    hasBrief,
    hasSpec,
    hasIssues,
    issueCounts,
    aiReviewPassed,
    humanReviewPassed,
  };
}

export async function scanAllFeatures(
  cwd: string,
  state: FeaturesState,
): Promise<Map<number, FeatureArtifacts>> {
  const result = new Map<number, FeatureArtifacts>();

  for (const feature of state.features) {
    const artifacts = await scanFeatureArtifacts(cwd, feature);
    result.set(feature.id, artifacts);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Status output formatting
// ---------------------------------------------------------------------------

function formatIssueLine(entry: IssueBreakdownEntry, indent: string): string {
  const paddedId = String(entry.id).padStart(2, '0');
  const decomposedMark = entry.decomposed ? '  ✓ decomposed' : '';
  const phaseMark =
    (entry.status === 'in-progress' || entry.status === 'in-review') &&
    entry.phase
      ? `  phase: ${entry.phase}`
      : '';
  const reopenMark = entry.reopens > 0 ? `  ⟲ ${entry.reopens}` : '';
  return `${indent}- #${paddedId} ${entry.title}  [${entry.status}]${phaseMark}${reopenMark}${decomposedMark}`;
}

export function formatStatusOutput(
  artifacts: Map<number, FeatureArtifacts>,
  features: FeatureRecord[],
  issueBreakdowns: Map<number, IssueBreakdownEntry[]> = new Map(),
): StatusOutput {
  const stdoutLines: string[] = [];

  if (features.length === 0) {
    return { stdout: 'No features registered.', stderr: '' };
  }

  for (const feature of features) {
    const artifact = artifacts.get(feature.id);

    if (!artifact) continue;

    stdoutLines.push(
      `> Feature: ${formatFeatureDir(feature)} (${feature.status})`,
    );

    stdoutLines.push(
      `  - Has Grill Session: ${artifact.hasGrillSession}`,
      `  - Has Brief: ${artifact.hasBrief}`,
      `  - Has SPEC: ${artifact.hasSpec}`,
      `  - Has issues: ${artifact.hasIssues}`,
    );

    if (artifact.issueCounts !== null) {
      stdoutLines.push(
        `  - decomposed issues: ${artifact.issueCounts.decomposed}/${artifact.issueCounts.total}`,
      );
    } else {
      stdoutLines.push('  - decomposed issues: —');
    }

    if (artifact.issueCounts !== null) {
      stdoutLines.push(
        `  - completed issues: ${artifact.issueCounts.done}/${artifact.issueCounts.total}`,
      );
    } else {
      stdoutLines.push('  - completed issues: —');
    }

    stdoutLines.push(
      `  - AI Review Passed: ${artifact.aiReviewPassed}`,
      `  - Human Review Passed: ${artifact.humanReviewPassed}`,
    );

    // Issue breakdown — only for in-progress features. Grouped by the Milestone
    // tag when issues carry one, so the board reads as demoable checkpoints;
    // otherwise a flat list ordered by id.
    if (feature.status === 'in-progress') {
      const entries = issueBreakdowns.get(feature.id);
      if (entries && entries.length > 0) {
        const sorted = [...entries].sort((a, b) => a.id - b.id);
        stdoutLines.push('  - Issues:');

        if (sorted.some((entry) => entry.milestone)) {
          const milestoneOrder = [
            ...new Set(sorted.map((entry) => entry.milestone ?? '')),
          ];
          for (const milestone of milestoneOrder) {
            stdoutLines.push(
              `    ▸ ${milestone === '' ? '(no milestone)' : milestone}`,
            );
            for (const issueEntry of sorted.filter(
              (entry) => (entry.milestone ?? '') === milestone,
            )) {
              stdoutLines.push(formatIssueLine(issueEntry, '      '));
            }
          }
        } else {
          for (const entry of sorted) {
            stdoutLines.push(formatIssueLine(entry, '    '));
          }
        }
      } else {
        stdoutLines.push('  - Issues: none');
      }
    }
  }

  return {
    stdout: stdoutLines.join('\n'),
    stderr: '',
  };
}
