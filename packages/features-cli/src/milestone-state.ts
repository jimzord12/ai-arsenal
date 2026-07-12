import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  type FeatureRecord,
  getFeatureDir,
  withFeatureStateLock,
} from './features-state';
import {
  deriveIssuesStateFromIssueFiles,
  type IssueRecord,
} from './issues-state';

const START_FENCE = '<!-- milestone-plan:start -->';
const END_FENCE = '<!-- milestone-plan:end -->';
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type MilestoneRecord = {
  number: number;
  title: string;
  slug: string;
  dependsOn: string[];
  decomposedAt: string | null;
};

export type MilestoneWithIssues = MilestoneRecord & { issueIds: number[] };

export type MilestoneFinding = {
  code:
    | 'ISSUE_MILESTONE_MISSING'
    | 'ISSUE_MILESTONE_UNKNOWN'
    | 'MILESTONE_MARKER_TAG_MISMATCH';
  message: string;
  issueId?: number;
  milestoneSlug?: string;
};

export class MilestoneStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MilestoneStateError';
  }
}

export function isCanonicalMilestoneTimestamp(value: string): boolean {
  try {
    return (
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
      new Date(value).toISOString() === value
    );
  } catch {
    return false;
  }
}

function findFence(
  spec: string,
  marker: string,
): Array<{ start: number; end: number }> {
  const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^[ \\t]*${escaped}[ \\t]*(?:\\r?\\n|$)`, 'gm');
  return [...spec.matchAll(pattern)].map((match) => ({
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
  }));
}

function getMilestoneBlock(spec: string): {
  start: number;
  end: number;
  text: string;
} {
  const starts = findFence(spec, START_FENCE);
  const ends = findFence(spec, END_FENCE);

  if (starts.length !== 1 || ends.length !== 1) {
    throw new MilestoneStateError(
      `SPEC.md must contain exactly one ${START_FENCE} fence and exactly one ${END_FENCE} fence.`,
    );
  }

  if (starts[0].start >= ends[0].start) {
    throw new MilestoneStateError(
      'Milestone plan fences are reversed. The start fence must precede the end fence.',
    );
  }

  return {
    start: starts[0].end,
    end: ends[0].start,
    text: spec.slice(starts[0].end, ends[0].start),
  };
}

function parseDependencies(value: string, slug: string): string[] {
  if (value === 'none') {
    return [];
  }

  const dependencyPattern = '`([a-z0-9]+(?:-[a-z0-9]+)*)`';
  if (
    !new RegExp(`^${dependencyPattern}(?:,\\s*${dependencyPattern})*$`).test(
      value,
    )
  ) {
    throw new MilestoneStateError(
      `Milestone "${slug}" has malformed DependsOn metadata. Use none or comma-separated backticked slugs.`,
    );
  }

  const dependencies = [...value.matchAll(/`([^`]+)`/g)].map(
    (match) => match[1],
  );
  if (new Set(dependencies).size !== dependencies.length) {
    throw new MilestoneStateError(
      `Milestone "${slug}" has duplicate dependencies.`,
    );
  }
  return dependencies;
}

function validateDependencyGraph(milestones: MilestoneRecord[]): void {
  const bySlug = new Map(milestones.map((entry) => [entry.slug, entry]));

  for (const milestone of milestones) {
    for (const dependency of milestone.dependsOn) {
      if (dependency === milestone.slug) {
        throw new MilestoneStateError(
          `Milestone "${milestone.slug}" cannot depend on itself.`,
        );
      }
      if (!bySlug.has(dependency)) {
        throw new MilestoneStateError(
          `Milestone "${milestone.slug}" depends on unknown milestone "${dependency}".`,
        );
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (slug: string) => {
    if (visiting.has(slug)) {
      throw new MilestoneStateError(
        `Milestone dependency cycle detected at "${slug}".`,
      );
    }
    if (visited.has(slug)) {
      return;
    }
    visiting.add(slug);
    for (const dependency of bySlug.get(slug)?.dependsOn ?? []) {
      visit(dependency);
    }
    visiting.delete(slug);
    visited.add(slug);
  };

  for (const milestone of milestones) {
    visit(milestone.slug);
  }
}

export function parseMilestones(spec: string): MilestoneRecord[] {
  const block = getMilestoneBlock(spec).text;
  const coverageIndex = block.search(/^###\s+Coverage\s*$/m);
  const plan = coverageIndex >= 0 ? block.slice(0, coverageIndex) : block;
  const headingLine =
    /^###\s+(\d+)\.\s+(.+?)\s+—\s+`([a-z0-9]+(?:-[a-z0-9]+)*)`\s*$/gm;
  const headingCandidates = [...plan.matchAll(/^###\s+\d+\..*$/gm)];
  const headings = [...plan.matchAll(headingLine)];

  if (headingCandidates.length !== headings.length) {
    throw new MilestoneStateError(
      'Malformed milestone heading. Expected: ### N. Title — `kebab-case-slug`.',
    );
  }

  const milestones: MilestoneRecord[] = [];
  const seenNumbers = new Set<number>();
  const seenSlugs = new Set<string>();

  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    const number = Number(heading[1]);
    const title = heading[2].trim();
    const slug = heading[3];
    const sectionStart = (heading.index ?? 0) + heading[0].length;
    const sectionEnd =
      index + 1 < headings.length
        ? (headings[index + 1].index ?? plan.length)
        : plan.length;
    const section = plan.slice(sectionStart, sectionEnd);

    if (
      !Number.isInteger(number) ||
      number <= 0 ||
      !title ||
      !SLUG_PATTERN.test(slug)
    ) {
      throw new MilestoneStateError(
        'Malformed milestone heading. Expected a positive number, title, and kebab-case slug.',
      );
    }
    if (seenNumbers.has(number)) {
      throw new MilestoneStateError(`Duplicate milestone number ${number}.`);
    }
    if (seenSlugs.has(slug)) {
      throw new MilestoneStateError(`Duplicate milestone slug "${slug}".`);
    }
    seenNumbers.add(number);
    seenSlugs.add(slug);

    const dependsRows = [
      ...section.matchAll(
        /^[ \t]*-[ \t]+\*\*DependsOn:\*\*[ \t]*(.*?)[ \t]*$/gm,
      ),
    ];
    const decomposedRows = [
      ...section.matchAll(
        /^[ \t]*-[ \t]+\*\*Decomposed:\*\*[ \t]*(.*?)[ \t]*$/gm,
      ),
    ];
    if (dependsRows.length !== 1) {
      throw new MilestoneStateError(
        `Milestone "${slug}" must contain exactly one DependsOn row.`,
      );
    }
    if (decomposedRows.length > 1) {
      throw new MilestoneStateError(
        `Milestone "${slug}" must contain at most one Decomposed row.`,
      );
    }

    const dependsOn = parseDependencies(dependsRows[0][1], slug);
    let decomposedAt: string | null = null;
    if (decomposedRows.length === 1) {
      const value = decomposedRows[0][1];
      if (value !== 'pending' && !isCanonicalMilestoneTimestamp(value)) {
        throw new MilestoneStateError(
          `Milestone "${slug}" Decomposed value must be pending or a canonical UTC ISO timestamp.`,
        );
      }
      decomposedAt = value === 'pending' ? null : value;
    }

    milestones.push({ number, title, slug, dependsOn, decomposedAt });
  }

  validateDependencyGraph(milestones);
  return milestones;
}

export function reconcileMilestonesWithIssues(
  milestones: MilestoneRecord[],
  issues: IssueRecord[],
): { milestones: MilestoneWithIssues[]; findings: MilestoneFinding[] } {
  const bySlug = new Map(
    milestones.map((entry) => [
      entry.slug,
      { ...entry, issueIds: [] as number[] },
    ]),
  );
  const findings: MilestoneFinding[] = [];

  for (const issue of [...issues].sort((a, b) => a.id - b.id)) {
    if (!issue.milestone) {
      findings.push({
        code: 'ISSUE_MILESTONE_MISSING',
        issueId: issue.id,
        message: `Issue ${issue.id} has no Milestone tag.`,
      });
      continue;
    }
    const milestone = bySlug.get(issue.milestone);
    if (!milestone) {
      findings.push({
        code: 'ISSUE_MILESTONE_UNKNOWN',
        issueId: issue.id,
        milestoneSlug: issue.milestone,
        message: `Issue ${issue.id} references unknown milestone "${issue.milestone}".`,
      });
      continue;
    }
    milestone.issueIds.push(issue.id);
  }

  const issueFindingOrder: Record<
    'ISSUE_MILESTONE_MISSING' | 'ISSUE_MILESTONE_UNKNOWN',
    number
  > = {
    ISSUE_MILESTONE_MISSING: 0,
    ISSUE_MILESTONE_UNKNOWN: 1,
  };
  findings.sort(
    (left, right) =>
      issueFindingOrder[left.code as keyof typeof issueFindingOrder] -
      issueFindingOrder[right.code as keyof typeof issueFindingOrder],
  );

  const reconciled = milestones.map(
    (entry) => bySlug.get(entry.slug) as MilestoneWithIssues,
  );
  for (const milestone of reconciled) {
    const hasIssues = milestone.issueIds.length > 0;
    const marked = milestone.decomposedAt !== null;
    if (hasIssues !== marked) {
      findings.push({
        code: 'MILESTONE_MARKER_TAG_MISMATCH',
        milestoneSlug: milestone.slug,
        message: marked
          ? `Milestone "${milestone.slug}" is marked decomposed but has no tagged issues.`
          : `Milestone "${milestone.slug}" has tagged issues but is not marked decomposed.`,
      });
    }
  }

  return { milestones: reconciled, findings };
}

export async function getMilestoneState(options: {
  cwd: string;
  feature: FeatureRecord;
}): Promise<{
  milestones: MilestoneWithIssues[];
  findings: MilestoneFinding[];
  specPath: string;
}> {
  const specPath = join(
    getFeatureDir(options.cwd, options.feature.id, options.feature.slug),
    'SPEC.md',
  );
  const spec = await readFile(specPath, 'utf8');
  const milestones = parseMilestones(spec);
  const issues = await deriveIssuesStateFromIssueFiles({
    cwd: options.cwd,
    feature: options.feature,
  });
  return {
    ...reconcileMilestonesWithIssues(milestones, issues.issues),
    specPath,
  };
}

function updateMilestoneMarker(
  spec: string,
  milestoneSlug: string,
  timestamp: string,
): string {
  const block = getMilestoneBlock(spec);
  const headingPattern =
    /^###\s+\d+\.\s+.+?\s+—\s+`([a-z0-9]+(?:-[a-z0-9]+)*)`\s*$/gm;
  const headings = [...block.text.matchAll(headingPattern)];
  const index = headings.findIndex((match) => match[1] === milestoneSlug);
  if (index < 0) {
    throw new MilestoneStateError(`Unknown milestone "${milestoneSlug}".`);
  }

  const heading = headings[index];
  const relativeStart = (heading.index ?? 0) + heading[0].length;
  const relativeEnd =
    index + 1 < headings.length
      ? (headings[index + 1].index ?? block.text.length)
      : block.text.length;
  const section = block.text.slice(relativeStart, relativeEnd);
  const marker = /^[ \t]*-[ \t]+\*\*Decomposed:\*\*[ \t]*(pending)[ \t]*$/m;
  const markerMatch = marker.exec(section);
  let nextSection: string;

  if (markerMatch?.index !== undefined) {
    const valueOffset = markerMatch[0].indexOf(markerMatch[1]);
    const start = markerMatch.index + valueOffset;
    nextSection = `${section.slice(0, start)}${timestamp}${section.slice(start + markerMatch[1].length)}`;
  } else {
    const depends =
      /^([ \t]*-[ \t]+\*\*DependsOn:\*\*[^\r\n]*)(\r\n|\n|$)/m.exec(section);
    if (!depends?.index && depends?.index !== 0) {
      throw new MilestoneStateError(
        `Milestone "${milestoneSlug}" is missing its DependsOn row.`,
      );
    }
    const newline = depends[2] || (spec.includes('\r\n') ? '\r\n' : '\n');
    const insertAt = depends.index + depends[0].length;
    nextSection = `${section.slice(0, insertAt)}- **Decomposed:** ${timestamp}${newline}${section.slice(insertAt)}`;
  }

  const absoluteStart = block.start + relativeStart;
  const absoluteEnd = block.start + relativeEnd;
  return `${spec.slice(0, absoluteStart)}${nextSection}${spec.slice(absoluteEnd)}`;
}

export async function markMilestoneDecomposed(options: {
  cwd: string;
  feature: FeatureRecord;
  milestoneSlug: string;
  timestamp?: string;
}): Promise<{
  changed: boolean;
  milestoneSlug: string;
  decomposedAt: string;
  specPath: string;
}> {
  return withFeatureStateLock(options.cwd, () =>
    markMilestoneDecomposedWhileLocked(options),
  );
}

async function markMilestoneDecomposedWhileLocked(options: {
  cwd: string;
  feature: FeatureRecord;
  milestoneSlug: string;
  timestamp?: string;
}): Promise<{
  changed: boolean;
  milestoneSlug: string;
  decomposedAt: string;
  specPath: string;
}> {
  const timestamp = options.timestamp ?? new Date().toISOString();
  if (!isCanonicalMilestoneTimestamp(timestamp)) {
    throw new MilestoneStateError(
      'The decomposition timestamp must be a canonical UTC ISO timestamp.',
    );
  }

  const specPath = join(
    getFeatureDir(options.cwd, options.feature.id, options.feature.slug),
    'SPEC.md',
  );
  const spec = await readFile(specPath, 'utf8');
  const milestones = parseMilestones(spec);
  const selected = milestones.find(
    (entry) => entry.slug === options.milestoneSlug,
  );
  if (!selected) {
    throw new MilestoneStateError(
      `Unknown milestone "${options.milestoneSlug}".`,
    );
  }

  const issuesState = await deriveIssuesStateFromIssueFiles({
    cwd: options.cwd,
    feature: options.feature,
  });
  const reconciled = reconcileMilestonesWithIssues(
    milestones,
    issuesState.issues,
  );
  const invalidIssueFinding = reconciled.findings.find(
    (finding) =>
      finding.code === 'ISSUE_MILESTONE_MISSING' ||
      finding.code === 'ISSUE_MILESTONE_UNKNOWN',
  );
  if (invalidIssueFinding) {
    throw new MilestoneStateError(invalidIssueFinding.message);
  }
  const selectedState = reconciled.milestones.find(
    (entry) => entry.slug === options.milestoneSlug,
  );
  if (!selectedState || selectedState.issueIds.length === 0) {
    throw new MilestoneStateError(
      `Milestone "${options.milestoneSlug}" has no tagged canonical issues and cannot be marked decomposed.`,
    );
  }

  if (selected.decomposedAt !== null) {
    return {
      changed: false,
      milestoneSlug: selected.slug,
      decomposedAt: selected.decomposedAt,
      specPath,
    };
  }

  const next = updateMilestoneMarker(spec, selected.slug, timestamp);
  await writeFile(specPath, next, 'utf8');
  return {
    changed: true,
    milestoneSlug: selected.slug,
    decomposedAt: timestamp,
    specPath,
  };
}
