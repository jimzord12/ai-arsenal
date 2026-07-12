#!/usr/bin/env bun
import { readFeaturesState } from './features-state';
import { getMilestoneState, MilestoneStateError } from './milestone-state';

export type MilestoneProgressResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export async function runMilestoneProgress(
  args: string[],
  options: { cwd: string },
): Promise<MilestoneProgressResult> {
  const slug = args[0];
  if (!slug) {
    return {
      exitCode: 1,
      stdout: '',
      stderr:
        'Usage: bun scripts/features-cli/milestone-progress.ts <feature-slug>',
    };
  }

  try {
    const state = await readFeaturesState(options.cwd);
    const feature = state.features.find((entry) => entry.slug === slug);
    if (!feature) {
      return {
        exitCode: 1,
        stdout: '',
        stderr: `Unknown feature "${slug}". Known: ${state.features.map((entry) => entry.slug).join(', ')}`,
      };
    }

    const milestoneState = await getMilestoneState({
      cwd: options.cwd,
      feature,
    });
    const lines = [
      `Milestones planned in SPEC (${milestoneState.milestones.length}) for ${feature.id}-${feature.slug}:`,
    ];
    for (const milestone of milestoneState.milestones) {
      const label = milestone.decomposedAt ? '[decomposed]' : '[ pending  ]';
      const issueCount =
        milestone.issueIds.length > 0
          ? `  — ${milestone.issueIds.length} issues`
          : '';
      lines.push(`  ${label} ${milestone.slug}${issueCount}`);
    }
    const decomposed = milestoneState.milestones.filter(
      (entry) => entry.decomposedAt !== null,
    ).length;
    const pending = milestoneState.milestones
      .filter((entry) => entry.decomposedAt === null)
      .map((entry) => entry.slug);
    lines.push(
      '',
      `Decomposed: ${decomposed}/${milestoneState.milestones.length}   Pending: ${pending.join(', ') || 'none'}`,
    );
    return { exitCode: 0, stdout: lines.join('\n'), stderr: '' };
  } catch (error) {
    if (error instanceof Error) {
      return { exitCode: 1, stdout: '', stderr: error.message };
    }
    throw error;
  }
}

if (require.main === module) {
  runMilestoneProgress(process.argv.slice(2), { cwd: process.cwd() }).then(
    (result) => {
      if (result.stdout) {
        console.log(result.stdout);
      }
      if (result.stderr) {
        console.error(result.stderr);
      }
      process.exitCode = result.exitCode;
    },
  );
}

export { MilestoneStateError };
