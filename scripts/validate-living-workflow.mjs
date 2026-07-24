import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const normalSkills = [
  'orchestrate-monorepo-work',
  'capture-monorepo-change',
  'orient-monorepo-change',
  'scope-monorepo-change',
  'plan-monorepo-change',
  'record-monorepo-approval',
  'implement-monorepo-change',
  'verify-monorepo-change',
  'reconcile-monorepo-change',
];

const revisionSkill = 'request-monorepo-revision';

const requiredFiles = [
  'AGENTS.md',
  'NEXT.md',
  'docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md',
  'docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md',
  '.agents/skills/initializing-living-plan-workflow/SKILL.md',
  '.agents/skills/executing-living-plan-phase/SKILL.md',
  '.agents/skills/reconciling-living-plan/SKILL.md',
  `.agents/skills/${revisionSkill}/SKILL.md`,
  ...normalSkills.map((skill) => `.agents/skills/${skill}/SKILL.md`),
];

const errors = [];
const warnings = [];

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    errors.push(`Missing required file: ${relativePath}`);
    return '';
  }
  return fs.readFileSync(absolutePath, 'utf8');
}

for (const file of requiredFiles) read(file);

const agents = read('AGENTS.md');
const next = read('NEXT.md');
const plan = read('docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md');

for (const token of [
  '<!-- living-plan-workflow:start -->',
  '<!-- living-plan-workflow:end -->',
  'NEXT.md',
  'CANONICAL_IMPLEMENTATION_PLAN.md',
  'initializing-living-plan-workflow',
  'executing-living-plan-phase',
  'reconciling-living-plan',
  revisionSkill,
  ...normalSkills,
]) {
  if (!agents.includes(token)) errors.push(`AGENTS.md missing: ${token}`);
}

for (const legacyToken of [
  '→ execute exactly one phase',
  '→ execute one approved phase',
  '- Run `reconciling-living-plan`.',
]) {
  if (agents.includes(legacyToken)) {
    errors.push(
      `AGENTS.md retains legacy broad execution loop: ${legacyToken}`,
    );
  }
}

for (const heading of [
  '# NEXT',
  '**Active work item:**',
  '**Pipeline step:**',
  '## Next Action',
  '## Why This Is Next',
  '## Requirements',
  '## Done When',
  '## Source of Truth',
]) {
  if (!next.includes(heading))
    errors.push(`NEXT.md missing heading: ${heading}`);
}

const nextWords = next.trim().split(/\s+/).length;
if (nextWords > 550) {
  warnings.push(
    `NEXT.md is ${nextWords} words; target <= 550 for rapid orientation.`,
  );
}

for (const heading of [
  '# 1. Purpose and Authority',
  '# 4. Current Verified State',
  '# 6. Definition of Done',
  '# 8. Monorepo Work-Item Pipeline and Legacy Plan Maintenance',
  '# 9. Phase Map',
  '# 19. Current Risks',
  '# 20. Current Open Decisions',
  '# 24. Immediate Next Step',
]) {
  if (!plan.includes(heading))
    errors.push(`Canonical plan missing heading: ${heading}`);
}

if (
  plan.includes('@jz/ai-arsenal/features-cli') ||
  agents.includes('@jz/ai-arsenal/features-cli')
) {
  errors.push(
    'Invalid nested npm package name found. Use @jz/ai-arsenal-features-cli.',
  );
}

for (const skillPath of requiredFiles.filter((f) => f.endsWith('/SKILL.md'))) {
  const skill = read(skillPath);
  const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) {
    errors.push(`${skillPath} has no YAML frontmatter.`);
    continue;
  }
  const name = frontmatter[1].match(/^name:\s+(.+?)\s*$/m)?.[1];
  if (!name || !/^[a-z0-9-]+$/.test(name)) {
    errors.push(`${skillPath} has an invalid or missing name.`);
  } else {
    const expectedName = path.basename(path.dirname(skillPath));
    if (name !== expectedName) {
      errors.push(
        `${skillPath} frontmatter name must equal "${expectedName}"; found "${name}".`,
      );
    }
  }
  const description = frontmatter[1].match(/^description:\s+(.+)$/m)?.[1] ?? '';
  if (!description.startsWith('Use when')) {
    errors.push(`${skillPath} description must start with "Use when".`);
  }
}

for (const { skill, label, tokens } of [
  {
    skill: 'orchestrate-monorepo-work',
    label: 'orchestrate-monorepo-work direct user revision request',
    tokens: ['request-monorepo-revision', 'direct user revision request'],
  },
  {
    skill: 'scope-monorepo-change',
    label: 'scope-monorepo-change revision recovery',
    tokens: [
      'Contract revision recovery',
      'revision-request.md',
      'reverse dependency order',
      'contract@N+1',
      'plan-monorepo-change',
    ],
  },
  {
    skill: 'plan-monorepo-change',
    label: 'plan-monorepo-change revision recovery',
    tokens: [
      'Plan revision recovery',
      'revision-request.md',
      'reverse dependency order',
      'plan@N+1',
      'record-monorepo-approval',
    ],
  },
  {
    skill: revisionSkill,
    label: 'request-monorepo-revision contract',
    tokens: [
      'direct user revision request',
      'revision-request.md',
      'scope-monorepo-change',
      'plan-monorepo-change',
    ],
  },
]) {
  const skillPath = `.agents/skills/${skill}/SKILL.md`;
  const content = read(skillPath);
  for (const token of tokens) {
    if (!content.includes(token)) {
      errors.push(`${label} missing: ${token}`);
    }
  }
}

const packageManifest = read('package.json');
try {
  const workflowCommand =
    JSON.parse(packageManifest).scripts?.['validate:workflow'];
  if (
    typeof workflowCommand !== 'string' ||
    !/node\s+scripts\/validate-monorepo-work-item\.mjs\s+--current\b/.test(
      workflowCommand,
    )
  ) {
    errors.push(
      'package.json validate:workflow must validate the current registration with --current.',
    );
  }
} catch {
  errors.push(
    'package.json must be valid JSON with a validate:workflow script.',
  );
}

if (/\b(TBD|TODO)\b/.test(next)) {
  errors.push('NEXT.md contains TBD/TODO instead of an actionable next step.');
}

if (errors.length > 0) {
  console.error('Living workflow validation failed:\n');
  for (const error of errors) console.error(`- ERROR: ${error}`);
  for (const warning of warnings) console.error(`- WARNING: ${warning}`);
  process.exit(1);
}

console.log('Living workflow validation passed.');
for (const warning of warnings) console.log(`- WARNING: ${warning}`);
console.log(`- NEXT.md words: ${nextWords}`);
console.log(`- Required files: ${requiredFiles.length}`);
