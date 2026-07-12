import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'AGENTS.md',
  'NEXT.md',
  'docs/planning/CANONICAL_IMPLEMENTATION_PLAN.md',
  '.agents/skills/initializing-living-plan-workflow/SKILL.md',
  '.agents/skills/executing-living-plan-phase/SKILL.md',
  '.agents/skills/reconciling-living-plan/SKILL.md',
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
]) {
  if (!agents.includes(token)) errors.push(`AGENTS.md missing: ${token}`);
}

for (const heading of [
  '# NEXT',
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
  '# 8. Living-Plan Maintenance Contract',
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
  if (!/^name:\s+[a-z0-9-]+\s*$/m.test(frontmatter[1])) {
    errors.push(`${skillPath} has an invalid or missing name.`);
  }
  const description = frontmatter[1].match(/^description:\s+(.+)$/m)?.[1] ?? '';
  if (!description.startsWith('Use when')) {
    errors.push(`${skillPath} description must start with "Use when".`);
  }
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
