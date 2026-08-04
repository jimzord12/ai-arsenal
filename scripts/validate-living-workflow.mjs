import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const normalSkills = [
  'orchestrate-monorepo-work',
  'define-monorepo-change',
  'implement-monorepo-change',
  'review-monorepo-change',
  'verify-monorepo-change',
  'deliver-monorepo-change',
];

const retiredV1Skills = [
  'capture-monorepo-change',
  'orient-monorepo-change',
  'scope-monorepo-change',
  'plan-monorepo-change',
  'record-monorepo-approval',
  'request-monorepo-revision',
  'reconcile-monorepo-change',
];

const requiredFiles = [
  'AGENTS.md',
  'NEXT.md',
  'docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md',
  'docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md',
  'docs/workflow/WORKFLOW_OVERVIEW.md',
  '.agents/skills/initializing-living-plan-workflow/SKILL.md',
  '.agents/skills/initializing-living-plan-workflow/assets/AGENTS.template.md',
  '.agents/skills/executing-living-plan-phase/SKILL.md',
  '.agents/skills/reconciling-living-plan/SKILL.md',
  'docs/workflow/templates/work-item/work-item.md',
  ...normalSkills.map((skill) => `.agents/skills/${skill}/SKILL.md`),
  ...retiredV1Skills.map((skill) => `.agents/skills/${skill}/SKILL.md`),
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
const overview = read('docs/workflow/WORKFLOW_OVERVIEW.md');
const pipeline = read('docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md');
const reviewSkill = read('.agents/skills/review-monorepo-change/SKILL.md');
const orchestrateSkill = read(
  '.agents/skills/orchestrate-monorepo-work/SKILL.md',
);
const defineSkill = read('.agents/skills/define-monorepo-change/SKILL.md');
const deliverSkill = read('.agents/skills/deliver-monorepo-change/SKILL.md');
const compactTemplate = read('docs/workflow/templates/work-item/work-item.md');
const agentsTemplate = read(
  '.agents/skills/initializing-living-plan-workflow/assets/AGENTS.template.md',
);

for (const [file, contents] of [
  ['docs/workflow/WORKFLOW_OVERVIEW.md', overview],
  [
    '.agents/skills/initializing-living-plan-workflow/assets/AGENTS.template.md',
    agentsTemplate,
  ],
]) {
  for (const [label, pattern] of [
    [
      'define → implement → review/repair → verify → deliver',
      /define → implement → review\/repair → verify → deliver/,
    ],
    ['one compact `work-item.md`', /one\s+compact\s+`work-item\.md`/],
    ['orchestrate-monorepo-work', /orchestrate-monorepo-work/],
    ['deliver-monorepo-change', /deliver-monorepo-change/],
  ]) {
    if (!pattern.test(contents)) {
      errors.push(`${file} is missing Workflow v2 guidance: ${label}`);
    }
  }
}

for (const [file, contents] of [
  ['AGENTS.md', agents],
  ['docs/workflow/templates/work-item/work-item.md', compactTemplate],
  ['docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md', pipeline],
  ['docs/workflow/WORKFLOW_OVERVIEW.md', overview],
  ['.agents/skills/orchestrate-monorepo-work/SKILL.md', orchestrateSkill],
  ['.agents/skills/define-monorepo-change/SKILL.md', defineSkill],
  ['.agents/skills/deliver-monorepo-change/SKILL.md', deliverSkill],
]) {
  if (!/work\/<work-item-id>/.test(contents) || !/\.worktrees/.test(contents)) {
    errors.push(`${file} is missing isolated worktree-per-item policy.`);
  }
}
if (!/^Worktree: isolated$/m.test(compactTemplate)) {
  errors.push('Compact work-item template must initialize Worktree: isolated.');
}
if (!/provision-monorepo-worktree\.mjs/.test(defineSkill)) {
  errors.push('Definition skill must use the worktree provisioner.');
}
if (!/remov(?:e|al).*dangerous deletion/is.test(deliverSkill)) {
  errors.push(
    'Delivery skill must retain dangerous-deletion worktree-removal boundary.',
  );
}

for (const [file, contents, requirements] of [
  [
    'AGENTS.md',
    agents,
    [
      [
        'snapshot definition',
        /calculate-review-snapshot\.mjs.*NEXT\.md.*excluded/is,
      ],
      ['pending initialization', /all five.*pending/is],
      [
        'complete matching evidence',
        /every\s+expected reviewer.*exactly one matching successful/is,
      ],
      ['repair reset', /candidate-changing repair resets all five.*pending/is],
      ['fail-closed advancement', /verify\s+and\s+deliver fail closed/is],
      ['historical compatibility', /immutable delivered records/is],
    ],
  ],
  [
    'docs/workflow/templates/work-item/work-item.md',
    compactTemplate,
    [
      [
        'snapshot definition',
        /calculate-review-snapshot\.mjs.*NEXT\.md.*excluded/is,
      ],
      [
        'pending initialization',
        /status.*snapshot.*batch.*expected.*received.*pending/is,
      ],
      [
        'complete matching evidence',
        /every expected role.*exactly one matching successful/is,
      ],
      ['repair reset', /repair that changes candidate bytes resets.*pending/is],
      ['fail-closed advancement', /verify\s+and\s+deliver fail closed/is],
      [
        'historical compatibility',
        /immutable delivered records.*exact matching hash/is,
      ],
    ],
  ],
  [
    '.agents/skills/review-monorepo-change/SKILL.md',
    reviewSkill,
    [
      [
        'snapshot definition',
        /calculate-review-snapshot\.mjs.*NEXT\.md.*excluded/is,
      ],
      [
        'pending initialization',
        /Review status.*Review snapshot.*Review batch.*Review expected.*Review received.*pending/is,
      ],
      [
        'complete matching evidence',
        /every\s+expected reviewer.*exactly once.*matching passed/is,
      ],
      ['repair reset', /repair that changes candidate bytes resets.*pending/is],
      ['fail-closed advancement', /verify\s+and\s+deliver fail closed/is],
    ],
  ],
  [
    'docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md',
    pipeline,
    [
      [
        'snapshot definition',
        /calculate-review-snapshot\.mjs.*NEXT\.md.*excluded/is,
      ],
      ['pending initialization', /all five.*pending/is],
      [
        'complete matching evidence',
        /every\s+expected reviewer.*exactly once.*matching successful/is,
      ],
      ['repair reset', /candidate-changing repair resets all five.*pending/is],
      ['fail-closed advancement', /verify\s+and\s+deliver fail closed/is],
      [
        'historical compatibility',
        /immutable historical compatibility.*exact hash/is,
      ],
    ],
  ],
]) {
  for (const [label, pattern] of requirements) {
    if (!pattern.test(contents)) {
      errors.push(`${file} is missing review-barrier ${label}.`);
    }
  }
}

for (const token of [
  '<!-- living-plan-workflow:start -->',
  '<!-- living-plan-workflow:end -->',
  'NEXT.md',
  'CANONICAL_IMPLEMENTATION_PLAN.md',
  'initializing-living-plan-workflow',
  'executing-living-plan-phase',
  'reconciling-living-plan',
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
  if (
    !retiredV1Skills.includes(path.basename(path.dirname(skillPath))) &&
    !description.startsWith('Use when')
  ) {
    errors.push(`${skillPath} description must start with "Use when".`);
  }
}

for (const token of [
  'define → implement → review/repair → verify → deliver',
  'define-monorepo-change',
]) {
  const skillPath = '.agents/skills/orchestrate-monorepo-work/SKILL.md';
  if (!read(skillPath).includes(token)) {
    errors.push(`orchestrate-monorepo-work stage order missing: ${token}`);
  }
}

for (const skillPath of [
  '.agents/skills/orchestrate-monorepo-work/SKILL.md',
  '.agents/skills/executing-living-plan-phase/SKILL.md',
]) {
  if (
    /capture-monorepo-change|digest-authorization stage|stale approval/i.test(
      read(skillPath),
    )
  ) {
    errors.push(`${skillPath} contains retired v1 routing guidance.`);
  }
}

for (const skill of retiredV1Skills) {
  const skillPath = `.agents/skills/${skill}/SKILL.md`;
  const content = read(skillPath);
  if (
    !content.includes('Historical Workflow v1 Compatibility') ||
    !content.includes('never use for new work')
  ) {
    errors.push(`${skillPath} is missing its historical compatibility marker.`);
  }
}

for (const token of [
  '## Goal',
  '## Non-goals',
  '## Acceptance criteria',
  'Started at:',
  'Max time:',
  '## Implementation summary',
  '## Review findings and repairs',
  '## Final verification',
]) {
  if (!compactTemplate.includes(token)) {
    errors.push(`Compact work-item template missing: ${token}`);
  }
}

for (const [file, contents] of [
  ['AGENTS.md', agents],
  ['docs/workflow/MONOREPO_WORK_ITEM_PIPELINE.md', pipeline],
  ['docs/workflow/templates/work-item/work-item.md', compactTemplate],
  ['.agents/skills/review-monorepo-change/SKILL.md', reviewSkill],
]) {
  for (const field of [
    'Review status',
    'Review snapshot',
    'Review batch',
    'Review expected',
    'Review received',
  ]) {
    if (!contents.includes(field)) {
      errors.push(`${file} is missing review-barrier field: ${field}`);
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
