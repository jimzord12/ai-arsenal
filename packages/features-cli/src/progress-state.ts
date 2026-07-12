import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, sep } from 'node:path';
import {
  type FeaturePhase,
  type FeatureRecord,
  type FeatureStatus,
  getFeatureDir,
} from './features-state';
import {
  deriveIssuesStateFromIssueFiles,
  getActionableIssues,
  getIssuesStatusPath,
  isIssueBlocked,
  type IssueRecord,
  type IssuesState,
  selectNextIssue,
  selectResumableIssue,
  validateIssuesState,
} from './issues-state';
import {
  parseMilestones,
  reconcileMilestonesWithIssues,
  type MilestoneWithIssues,
} from './milestone-state';

export type FrontierKind =
  | 'migration-required'
  | 'write-prd'
  | 'grill-and-consolidate-decisions'
  | 'design-ready'
  | 'write-spec'
  | 'plan-milestones'
  | 'decompose-milestone'
  | 'contract-issue'
  | 'implement-issue'
  | 'review-issue'
  | 'blocked'
  | 'feature-review'
  | 'archived';

export type FeatureProgress = {
  feature: {
    id: number;
    slug: string;
    status: FeatureStatus;
    phase: FeaturePhase;
    focusPath: string | null;
  };
  frontier: {
    kind: FrontierKind;
    summary: string;
    artifactPath?: string;
    milestoneSlug?: string;
    issueId?: number;
  };
  artifacts: {
    prd: boolean;
    grillSession: boolean;
    decisions: boolean;
    spec: boolean;
    migrationNote: boolean;
  };
  milestones: {
    planned: number;
    decomposed: number;
    pending: number;
    entries: Array<{
      slug: string;
      dependsOn: string[];
      decomposedAt: string | null;
      issueIds: number[];
    }>;
  } | null;
  issues: {
    total: number;
    done: number;
    wontfix: number;
    pending: number;
    ready: number;
    actionable: number;
    blocked: number;
    inProgress: number;
    inReview: number;
    readyForHuman: number;
    contracted: number;
    nextIssueId: number | null;
    resumableIssueId: number | null;
    byStatus: Record<string, number>;
  } | null;
  warnings: Array<{ code: string; message: string; path?: string }>;
};

async function pathKind(
  path: string,
): Promise<'file' | 'directory' | 'missing'> {
  try {
    const metadata = await stat(path);
    return metadata.isFile()
      ? 'file'
      : metadata.isDirectory()
        ? 'directory'
        : 'missing';
  } catch {
    return 'missing';
  }
}

function relativeIssuePath(cwd: string, issue: IssueRecord): string {
  return join(cwd, ...issue.filePath.split('/'));
}

function semanticIssues(state: IssuesState): unknown {
  return {
    featureId: state.featureId,
    featureSlug: state.featureSlug,
    issues: [...state.issues].sort((a, b) => a.id - b.id),
  };
}

async function addDerivedStateWarnings(
  cwd: string,
  feature: FeatureRecord,
  canonical: IssuesState,
  warnings: FeatureProgress['warnings'],
): Promise<void> {
  const path = getIssuesStatusPath(cwd, feature);
  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch {
    warnings.push({
      code: 'ISSUE_STATE_MISSING',
      message:
        'Canonical issues exist but derived issues-status.json is missing.',
      path: 'issues-status.json',
    });
    return;
  }

  let derived: IssuesState;
  try {
    derived = validateIssuesState(JSON.parse(raw), path);
  } catch {
    warnings.push({
      code: 'ISSUE_STATE_MALFORMED',
      message: 'Derived issues-status.json is malformed.',
      path: 'issues-status.json',
    });
    return;
  }

  if (derived.featureStatus !== feature.status) {
    warnings.push({
      code: 'ISSUE_STATE_FEATURE_STATUS_MISMATCH',
      message: `Derived issue state says featureStatus=${derived.featureStatus ?? 'missing'}; registry says ${feature.status}.`,
      path: 'issues-status.json',
    });
  }
  if (
    JSON.stringify(semanticIssues(derived)) !==
    JSON.stringify(semanticIssues(canonical))
  ) {
    warnings.push({
      code: 'ISSUE_STATE_STALE',
      message: 'Derived issue records do not match canonical issue Markdown.',
      path: 'issues-status.json',
    });
  }
}

async function addFocusWarning(
  cwd: string,
  feature: FeatureRecord,
  warnings: FeatureProgress['warnings'],
): Promise<void> {
  if (feature.focusPath === null) {
    return;
  }
  const featureDir = getFeatureDir(cwd, feature.id, feature.slug);
  const target = join(featureDir, ...feature.focusPath.split('/'));
  try {
    const [realFeatureDir, realTarget] = await Promise.all([
      realpath(featureDir),
      realpath(target),
    ]);
    const rel = relative(realFeatureDir, realTarget);
    if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
      warnings.push({
        code: 'FOCUS_PATH_OUTSIDE_FEATURE',
        message: 'The stored focus resolves outside the feature workspace.',
        path: feature.focusPath,
      });
    }
  } catch {
    warnings.push({
      code: 'FOCUS_PATH_MISSING',
      message: 'The stored focus path does not exist.',
      path: feature.focusPath,
    });
  }
}

export async function getContractedIssueIds(
  cwd: string,
  issues: IssueRecord[],
): Promise<Set<number>> {
  const values = await Promise.all(
    issues.map(async (issue) => ({
      id: issue.id,
      kind: await pathKind(
        join(dirname(relativeIssuePath(cwd, issue)), 'change-contract.md'),
      ),
    })),
  );

  return new Set(
    values.filter((value) => value.kind === 'file').map((value) => value.id),
  );
}

function mapMilestoneWarnings(
  milestones: MilestoneWithIssues[],
  findings: ReturnType<typeof reconcileMilestonesWithIssues>['findings'],
  warnings: FeatureProgress['warnings'],
): void {
  for (const finding of findings) {
    if (finding.code === 'ISSUE_MILESTONE_UNKNOWN') {
      warnings.push({
        code: 'UNKNOWN_ISSUE_MILESTONE',
        message: finding.message,
      });
    } else if (finding.code === 'ISSUE_MILESTONE_MISSING') {
      warnings.push({
        code: 'ISSUE_MILESTONE_MISSING',
        message: finding.message,
      });
    } else if (finding.milestoneSlug) {
      const milestone = milestones.find(
        (entry) => entry.slug === finding.milestoneSlug,
      );
      warnings.push({
        code: milestone?.decomposedAt
          ? 'MILESTONE_MARKED_WITHOUT_ISSUES'
          : 'MILESTONE_ISSUES_WITHOUT_MARKER',
        message: finding.message,
        path: 'SPEC.md',
      });
    }
  }
}

function summarizeIssues(
  state: IssuesState,
  contracted: number,
): NonNullable<FeatureProgress['issues']> {
  const byStatus: Record<string, number> = {};
  const issuesById = new Map(state.issues.map((issue) => [issue.id, issue]));
  for (const issue of [...state.issues].sort((a, b) => a.id - b.id)) {
    byStatus[issue.status] = (byStatus[issue.status] ?? 0) + 1;
  }
  const terminal = (issue: IssueRecord) =>
    issue.status === 'done' || issue.status === 'wontfix';
  const next = selectNextIssue(state);
  const resumable = selectResumableIssue(state);
  return {
    total: state.issues.length,
    done: state.issues.filter((issue) => issue.status === 'done').length,
    wontfix: state.issues.filter((issue) => issue.status === 'wontfix').length,
    pending: state.issues.filter((issue) => !terminal(issue)).length,
    ready: state.issues.filter((issue) => issue.status === 'ready-for-agent')
      .length,
    actionable: getActionableIssues(state).length,
    blocked: state.issues.filter(
      (issue) => !terminal(issue) && isIssueBlocked(issue, issuesById),
    ).length,
    inProgress: state.issues.filter((issue) => issue.status === 'in-progress')
      .length,
    inReview: state.issues.filter((issue) => issue.status === 'in-review')
      .length,
    readyForHuman: state.issues.filter(
      (issue) => issue.status === 'ready-for-human',
    ).length,
    contracted,
    nextIssueId: next.kind === 'winner' ? next.issue.id : null,
    resumableIssueId: resumable.kind === 'winner' ? resumable.issue.id : null,
    byStatus,
  };
}

export async function getFeatureProgress(options: {
  cwd: string;
  feature: FeatureRecord;
}): Promise<FeatureProgress> {
  const { cwd, feature } = options;
  const featureDir = getFeatureDir(cwd, feature.id, feature.slug);
  const names = [
    'PRD.md',
    'GRILL_SESSION.md',
    'DECISIONS.md',
    'SPEC.md',
    'WORKFLOW_MIGRATION_NOTE.md',
    'STATUS.md',
  ] as const;
  const kinds = await Promise.all(
    names.map((name) => pathKind(join(featureDir, name))),
  );
  const exists = Object.fromEntries(
    names.map((name, index) => [name, kinds[index] === 'file']),
  ) as Record<(typeof names)[number], boolean>;
  const artifacts = {
    prd: exists['PRD.md'],
    grillSession: exists['GRILL_SESSION.md'],
    decisions: exists['DECISIONS.md'],
    spec: exists['SPEC.md'],
    migrationNote: exists['WORKFLOW_MIGRATION_NOTE.md'],
  };
  const warnings: FeatureProgress['warnings'] = [];
  await addFocusWarning(cwd, feature, warnings);
  if (exists['STATUS.md'] && !artifacts.migrationNote) {
    warnings.push({
      code: 'RETIRED_STATUS_FILE_PRESENT',
      message: 'STATUS.md is retired for supported Spec-to-Ship features.',
      path: 'STATUS.md',
    });
  }

  const base = {
    feature: {
      id: feature.id,
      slug: feature.slug,
      status: feature.status,
      phase: feature.phase,
      focusPath: feature.focusPath,
    },
    artifacts,
    warnings,
  };

  if (feature.status === 'archived') {
    return {
      ...base,
      frontier: { kind: 'archived', summary: 'Feature is archived.' },
      milestones: null,
      issues: null,
    };
  }
  if (artifacts.migrationNote) {
    warnings.push({
      code: 'LEGACY_WORKFLOW_MIGRATION_REQUIRED',
      message: 'This feature remains on the legacy workflow.',
      path: 'WORKFLOW_MIGRATION_NOTE.md',
    });
    return {
      ...base,
      frontier: {
        kind: 'migration-required',
        summary: 'Read the workflow migration note before proceeding.',
        artifactPath: 'WORKFLOW_MIGRATION_NOTE.md',
      },
      milestones: null,
      issues: null,
    };
  }
  if (feature.phase === 'design') {
    if (!artifacts.prd) {
      return {
        ...base,
        frontier: {
          kind: 'write-prd',
          summary: 'Write PRD.md.',
          artifactPath: 'PRD.md',
        },
        milestones: null,
        issues: null,
      };
    }
    if (!artifacts.grillSession || !artifacts.decisions) {
      return {
        ...base,
        frontier: {
          kind: 'grill-and-consolidate-decisions',
          summary: 'Complete the grill and consolidate DECISIONS.md.',
          artifactPath: !artifacts.grillSession
            ? 'GRILL_SESSION.md'
            : 'DECISIONS.md',
        },
        milestones: null,
        issues: null,
      };
    }
    return {
      ...base,
      frontier: {
        kind: 'design-ready',
        summary: 'Design artifacts are ready for SPEC authoring.',
      },
      milestones: null,
      issues: null,
    };
  }

  if (!artifacts.decisions) {
    warnings.push({
      code: 'IMPLEMENTATION_WITHOUT_DECISIONS',
      message: 'Implementation phase has no DECISIONS.md.',
      path: 'DECISIONS.md',
    });
  }
  if (!artifacts.spec) {
    return {
      ...base,
      frontier: {
        kind: 'write-spec',
        summary: 'Write SPEC.md.',
        artifactPath: 'SPEC.md',
      },
      milestones: null,
      issues: null,
    };
  }

  const spec = await readFile(join(featureDir, 'SPEC.md'), 'utf8');
  const hasStart = spec.includes('<!-- milestone-plan:start -->');
  const hasEnd = spec.includes('<!-- milestone-plan:end -->');
  const parsedMilestones = !hasStart && !hasEnd ? [] : parseMilestones(spec);
  const issuesDirExists =
    (await pathKind(join(featureDir, 'issues'))) === 'directory';
  const canonicalIssues = issuesDirExists
    ? await deriveIssuesStateFromIssueFiles({ cwd, feature })
    : null;
  const reconciliation = reconcileMilestonesWithIssues(
    parsedMilestones,
    canonicalIssues?.issues ?? [],
  );
  mapMilestoneWarnings(
    reconciliation.milestones,
    reconciliation.findings,
    warnings,
  );
  const milestones: NonNullable<FeatureProgress['milestones']> = {
    planned: reconciliation.milestones.length,
    decomposed: reconciliation.milestones.filter(
      (entry) => entry.decomposedAt !== null,
    ).length,
    pending: reconciliation.milestones.filter(
      (entry) => entry.decomposedAt === null,
    ).length,
    entries: reconciliation.milestones.map((entry) => ({
      slug: entry.slug,
      dependsOn: entry.dependsOn,
      decomposedAt: entry.decomposedAt,
      issueIds: entry.issueIds,
    })),
  };

  if (milestones.planned === 0) {
    return {
      ...base,
      frontier: {
        kind: 'plan-milestones',
        summary: 'Add the milestone plan to SPEC.md.',
        artifactPath: 'SPEC.md',
      },
      milestones,
      issues: null,
    };
  }

  let issues: FeatureProgress['issues'] = null;
  if (canonicalIssues) {
    const contractedIssueIds = await getContractedIssueIds(
      cwd,
      canonicalIssues.issues,
    );
    issues = summarizeIssues(canonicalIssues, contractedIssueIds.size);
    await addDerivedStateWarnings(cwd, feature, canonicalIssues, warnings);
  }

  const inReview = canonicalIssues?.issues
    .filter((issue) => issue.status === 'in-review')
    .sort((a, b) => a.id - b.id)[0];
  if (inReview) {
    return {
      ...base,
      frontier: {
        kind: 'review-issue',
        summary: `Review issue ${inReview.id}.`,
        issueId: inReview.id,
      },
      milestones,
      issues,
    };
  }
  const inProgress = canonicalIssues?.issues
    .filter((issue) => issue.status === 'in-progress')
    .sort((a, b) => a.id - b.id)[0];
  if (inProgress) {
    return {
      ...base,
      frontier: {
        kind: 'implement-issue',
        summary: `Resume issue ${inProgress.id}.`,
        issueId: inProgress.id,
      },
      milestones,
      issues,
    };
  }
  if (canonicalIssues) {
    const next = selectNextIssue(canonicalIssues);
    if (next.kind === 'winner') {
      const contractPath = join(
        dirname(relativeIssuePath(cwd, next.issue)),
        'change-contract.md',
      );
      const contracted = (await pathKind(contractPath)) === 'file';
      return {
        ...base,
        frontier: {
          kind: contracted ? 'implement-issue' : 'contract-issue',
          summary: `${contracted ? 'Implement' : 'Contract'} issue ${next.issue.id}.`,
          issueId: next.issue.id,
          artifactPath: contracted
            ? next.issue.filePath
            : relative(cwd, contractPath).replaceAll('\\', '/'),
        },
        milestones,
        issues,
      };
    }
  }

  const decomposedSlugs = new Set(
    reconciliation.milestones
      .filter((entry) => entry.decomposedAt !== null)
      .map((entry) => entry.slug),
  );
  const readyMilestone = reconciliation.milestones.find(
    (entry) =>
      entry.decomposedAt === null &&
      entry.dependsOn.every((dependency) => decomposedSlugs.has(dependency)),
  );
  if (readyMilestone) {
    return {
      ...base,
      frontier: {
        kind: 'decompose-milestone',
        summary: `Decompose milestone ${readyMilestone.slug}.`,
        milestoneSlug: readyMilestone.slug,
        artifactPath: 'SPEC.md',
      },
      milestones,
      issues,
    };
  }

  const allIssuesTerminal =
    canonicalIssues !== null &&
    canonicalIssues.issues.every(
      (issue) => issue.status === 'done' || issue.status === 'wontfix',
    );
  if (milestones.pending === 0 && allIssuesTerminal) {
    return {
      ...base,
      frontier: {
        kind: 'feature-review',
        summary: 'All milestones and issues are complete; run feature review.',
      },
      milestones,
      issues,
    };
  }

  return {
    ...base,
    frontier: {
      kind: 'blocked',
      summary:
        'Work remains, but no issue or milestone is currently actionable.',
    },
    milestones,
    issues,
  };
}
