import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const digestPrefix = 'sha256:';
const excludedRepositoryPaths = new Set(['NEXT.md']);
const excludedWorkItemFields = new Set([
  'Stage',
  'Status',
  'Started at',
  'Max time',
  'Last time check',
  'Turns since time check',
  'Review cycles',
  'Review status',
  'Review snapshot',
  'Review batch',
  'Review expected',
  'Review received',
]);
const excludedWorkItemSections = new Set([
  '## Review findings and repairs',
  '## Final verification',
  '## Delivery evidence',
]);

/**
 * Workflow v2 review-snapshot contract
 *
 * The candidate is the repository's tracked changes from HEAD plus non-ignored
 * untracked files, with rename detection disabled. NEXT.md is excluded because
 * it contains only mutable operator routing. The active work item is always
 * included, but mutable stage/status/timing/review fields and review,
 * verification, and delivery evidence sections are removed from its byte view.
 * All other work-item content is included by default, notably identity, safety
 * classification, goal, non-goals, acceptance criteria, and implementation
 * summary.
 *
 * Entries use normalized repository-relative slash paths, ordinal ordering,
 * explicit length-delimited fields, baseline and current mode identity,
 * present or deleted state, and raw baseline/current file, symbolic-link, or
 * gitlink bytes. Deletions are explicit entries; renames are deletion plus
 * addition. The only public result is a lowercase SHA-256 digest with the
 * `sha256:` prefix.
 */
export function calculateReviewSnapshot({
  repositoryRoot,
  workItemPath,
  baselineRef,
  candidateRef,
}) {
  if (typeof repositoryRoot !== 'string' || repositoryRoot.length === 0) {
    throw new Error('repositoryRoot must be a non-empty path');
  }
  if (typeof workItemPath !== 'string' || workItemPath.length === 0) {
    throw new Error('workItemPath must be a non-empty path');
  }

  const root = fs.realpathSync(path.resolve(repositoryRoot));
  assertRepositoryRoot(root);
  const normalizedWorkItemPath = normalizeRepositoryPath(root, workItemPath);
  const usesCommitCandidate =
    baselineRef !== undefined || candidateRef !== undefined;
  if (
    usesCommitCandidate &&
    (typeof baselineRef !== 'string' ||
      baselineRef.length === 0 ||
      typeof candidateRef !== 'string' ||
      candidateRef.length === 0)
  ) {
    throw new Error(
      'baselineRef and candidateRef must both be non-empty strings',
    );
  }
  const entries = usesCommitCandidate
    ? discoverCommitCandidateEntries(root, baselineRef, candidateRef)
    : discoverCandidateEntries(root);
  if (!entries.has(normalizedWorkItemPath)) {
    entries.set(
      normalizedWorkItemPath,
      usesCommitCandidate
        ? readForcedCommitWorkItemEntry(
            root,
            normalizedWorkItemPath,
            baselineRef,
            candidateRef,
          )
        : readForcedWorkItemEntry(root, normalizedWorkItemPath),
    );
  }

  const hash = createHash('sha256');
  frame(hash, Buffer.from('ai-arsenal-review-snapshot-v1', 'utf8'));
  for (const [relativePath, entry] of [...entries].sort(([left], [right]) =>
    left < right ? -1 : left > right ? 1 : 0,
  )) {
    const bytes =
      relativePath === normalizedWorkItemPath && entry.state === 'present'
        ? filterWorkItemBytes(entry.bytes)
        : entry.bytes;
    const baselineBytes =
      relativePath === normalizedWorkItemPath && entry.baselineBytes.length > 0
        ? filterWorkItemBytes(entry.baselineBytes)
        : entry.baselineBytes;
    frame(hash, Buffer.from(relativePath, 'utf8'));
    frame(hash, Buffer.from(entry.state, 'ascii'));
    frame(hash, Buffer.from(entry.baselineMode, 'ascii'));
    frame(hash, Buffer.from(entry.currentMode, 'ascii'));
    frame(hash, Buffer.from(entry.submoduleState, 'ascii'));
    frame(hash, baselineBytes);
    frame(hash, bytes);
  }
  return `${digestPrefix}${hash.digest('hex')}`;
}

function discoverCommitCandidateEntries(root, baselineRef, candidateRef) {
  verifyCommitRef(root, baselineRef);
  verifyCommitRef(root, candidateRef);
  const changedPaths = splitNullRecords(
    runGit(root, [
      'diff',
      '--name-only',
      '-z',
      '--no-renames',
      '--ignore-submodules=none',
      baselineRef,
      candidateRef,
      '--',
    ]),
  ).map((record) => normalizeGitPath(record.toString('utf8')));
  const entries = new Map();
  for (const relativePath of changedPaths) {
    if (excludedRepositoryPaths.has(relativePath)) continue;
    const baseline = readTreeEntry(root, baselineRef, relativePath);
    const candidate = readTreeEntry(root, candidateRef, relativePath);
    entries.set(relativePath, commitCandidateEntry(root, baseline, candidate));
  }
  return entries;
}

function verifyCommitRef(root, ref) {
  runGit(root, ['rev-parse', '--verify', `${ref}^{commit}`]);
}

function readTreeEntry(root, ref, relativePath) {
  const records = splitNullRecords(
    runGit(root, ['ls-tree', '-z', ref, '--', relativePath]),
  );
  if (records.length === 0) return null;
  if (records.length !== 1) {
    throw new Error('Git returned an ambiguous tree entry');
  }
  const match = records[0]
    .toString('utf8')
    .match(/^([0-7]{6}) (blob|commit) ([0-9a-f]+)\t(.+)$/);
  if (!match || normalizeGitPath(match[4]) !== relativePath) {
    throw new Error('Git returned an unsupported tree entry');
  }
  return { mode: match[1], type: match[2], objectId: match[3] };
}

function commitCandidateEntry(root, baseline, candidate) {
  if (!baseline && !candidate) {
    throw new Error('Git candidate entry is absent from both commits');
  }
  return {
    state: candidate ? 'present' : 'deleted',
    baselineBytes: readTreeEntryBytes(root, baseline),
    baselineMode: baseline?.mode ?? '000000',
    currentMode: candidate?.mode ?? '000000',
    submoduleState:
      baseline?.mode === '160000' || candidate?.mode === '160000'
        ? 'S...'
        : 'N...',
    bytes: readTreeEntryBytes(root, candidate),
  };
}

function readTreeEntryBytes(root, entry) {
  if (!entry) return Buffer.alloc(0);
  if (entry.mode === '160000' || entry.type === 'commit') {
    return Buffer.from(entry.objectId, 'ascii');
  }
  return runGit(root, ['cat-file', '-p', entry.objectId]);
}

function readForcedCommitWorkItemEntry(
  root,
  relativePath,
  baselineRef,
  candidateRef,
) {
  const baseline = readTreeEntry(root, baselineRef, relativePath);
  const candidate = readTreeEntry(root, candidateRef, relativePath);
  if (!candidate) throw new Error('The active work item does not exist');
  return commitCandidateEntry(root, baseline, candidate);
}

function assertRepositoryRoot(root) {
  const inside = runGit(root, ['rev-parse', '--is-inside-work-tree'])
    .toString('utf8')
    .trim();
  const prefix = runGit(root, ['rev-parse', '--show-prefix'])
    .toString('utf8')
    .trim();
  if (inside !== 'true' || prefix !== '') {
    throw new Error('repositoryRoot must name the Git root');
  }
}

function normalizeRepositoryPath(root, candidatePath) {
  const absolutePath = path.isAbsolute(candidatePath)
    ? path.resolve(candidatePath)
    : path.resolve(root, candidatePath);
  const relativePath = path.relative(root, absolutePath);
  if (
    relativePath === '' ||
    relativePath === '..' ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error('workItemPath must be a file inside repositoryRoot');
  }
  return relativePath.split(path.sep).join('/');
}

function discoverCandidateEntries(root) {
  const output = runGit(root, [
    'status',
    '--porcelain=v2',
    '-z',
    '--untracked-files=all',
    '--ignore-submodules=none',
    '--no-renames',
  ]);
  const entries = new Map();
  for (const recordBytes of splitNullRecords(output)) {
    const record = recordBytes.toString('utf8');
    if (record.startsWith('1 ')) {
      const fields = splitFixed(record, 8);
      if (fields.length !== 9) {
        throw new Error('Git returned an unsupported candidate record');
      }
      const [
        ,
        ,
        submoduleState,
        baselineMode,
        indexMode,
        worktreeMode,
        baselineObject,
        ,
        gitPath,
      ] = fields;
      const relativePath = normalizeGitPath(gitPath);
      if (excludedRepositoryPaths.has(relativePath)) continue;
      const absolutePath = fromGitPath(root, relativePath);
      const exists =
        fs.existsSync(absolutePath) || isSymbolicLink(absolutePath);
      const currentMode = exists
        ? chooseCurrentMode(indexMode, worktreeMode)
        : '000000';
      entries.set(relativePath, {
        state: exists ? 'present' : 'deleted',
        baselineBytes: readBaselineBytes(root, baselineObject, baselineMode),
        baselineMode,
        currentMode,
        submoduleState,
        bytes: exists
          ? readCandidateBytes(root, absolutePath, currentMode)
          : Buffer.alloc(0),
      });
      continue;
    }
    if (record.startsWith('? ')) {
      const relativePath = normalizeGitPath(record.slice(2));
      if (excludedRepositoryPaths.has(relativePath)) continue;
      const absolutePath = fromGitPath(root, relativePath);
      const currentMode = readUntrackedMode(absolutePath);
      entries.set(relativePath, {
        state: 'present',
        baselineBytes: Buffer.alloc(0),
        baselineMode: '000000',
        currentMode,
        submoduleState: 'N...',
        bytes: readCandidateBytes(root, absolutePath, currentMode),
      });
      continue;
    }
    throw new Error('Git returned an unsupported candidate state');
  }
  return entries;
}

function readForcedWorkItemEntry(root, relativePath) {
  const absolutePath = fromGitPath(root, relativePath);
  if (!fs.existsSync(absolutePath) && !isSymbolicLink(absolutePath)) {
    throw new Error('The active work item does not exist');
  }
  const stage = runGit(root, ['ls-files', '--stage', '-z', '--', relativePath]);
  const firstRecord = splitNullRecords(stage)[0];
  const tracked = firstRecord
    ? firstRecord.toString('utf8').match(/^([0-7]{6}) ([0-9a-f]+) /)
    : null;
  const trackedMode = tracked?.[1] ?? null;
  const currentMode = trackedMode ?? readUntrackedMode(absolutePath);
  return {
    state: 'present',
    baselineBytes: tracked
      ? readBaselineBytes(root, tracked[2], trackedMode)
      : Buffer.alloc(0),
    baselineMode: trackedMode ?? '000000',
    currentMode,
    submoduleState: 'N...',
    bytes: readCandidateBytes(root, absolutePath, currentMode),
  };
}

function readBaselineBytes(root, objectId, mode) {
  if (mode === '160000') return Buffer.from(objectId, 'ascii');
  return /^0+$/.test(objectId)
    ? Buffer.alloc(0)
    : runGit(root, ['cat-file', '-p', objectId]);
}

function chooseCurrentMode(indexMode, worktreeMode) {
  if (worktreeMode !== '000000') return worktreeMode;
  return indexMode;
}

function readUntrackedMode(absolutePath) {
  const stats = fs.lstatSync(absolutePath);
  if (stats.isSymbolicLink()) return '120000';
  if (!stats.isFile()) {
    throw new Error('Candidate additions must be files or symbolic links');
  }
  return process.platform !== 'win32' && (stats.mode & 0o111) !== 0
    ? '100755'
    : '100644';
}

function readCandidateBytes(root, absolutePath, mode) {
  if (mode === '120000')
    return fs.readlinkSync(absolutePath, { encoding: 'buffer' });
  if (mode === '160000') {
    return Buffer.from(
      runGit(absolutePath, ['rev-parse', 'HEAD']).toString('ascii').trim(),
      'ascii',
    );
  }
  if (!/^100(?:644|755)$/.test(mode)) {
    throw new Error('Candidate contains an unsupported file mode');
  }
  return fs.readFileSync(absolutePath);
}

function isSymbolicLink(absolutePath) {
  try {
    return fs.lstatSync(absolutePath).isSymbolicLink();
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

function filterWorkItemBytes(bytes) {
  const text = bytes.toString('utf8');
  if (!Buffer.from(text, 'utf8').equals(bytes)) {
    throw new Error('The active work item must be UTF-8');
  }
  const lines = text.match(/[^\r\n]*(?:\r\n|\n|\r|$)/g) ?? [];
  const included = [];
  let excludeSection = false;
  for (const line of lines) {
    if (line.length === 0) continue;
    const content = line.replace(/(?:\r\n|\n|\r)$/, '');
    if (content.startsWith('## ')) {
      excludeSection = excludedWorkItemSections.has(content);
      if (excludeSection) continue;
    }
    if (excludeSection) continue;
    const field = content.match(/^([^:]+): /)?.[1];
    if (field && excludedWorkItemFields.has(field)) continue;
    included.push(line);
  }
  return Buffer.from(included.join(''), 'utf8');
}

function normalizeGitPath(gitPath) {
  if (
    gitPath.length === 0 ||
    gitPath.startsWith('/') ||
    gitPath === '..' ||
    gitPath.startsWith('../') ||
    gitPath.includes('\\')
  ) {
    throw new Error('Git returned an invalid repository-relative path');
  }
  return gitPath;
}

function fromGitPath(root, gitPath) {
  return path.join(root, ...gitPath.split('/'));
}

function splitFixed(value, separatorCount) {
  const fields = [];
  let offset = 0;
  for (let count = 0; count < separatorCount; count += 1) {
    const separator = value.indexOf(' ', offset);
    if (separator === -1) return fields;
    fields.push(value.slice(offset, separator));
    offset = separator + 1;
  }
  fields.push(value.slice(offset));
  return fields;
}

function splitNullRecords(buffer) {
  const records = [];
  let start = 0;
  for (let index = 0; index < buffer.length; index += 1) {
    if (buffer[index] !== 0) continue;
    if (index > start) records.push(buffer.subarray(start, index));
    start = index + 1;
  }
  if (start !== buffer.length) {
    throw new Error('Git returned a non-terminated candidate record');
  }
  return records;
}

function frame(hash, bytes) {
  const length = Buffer.allocUnsafe(8);
  length.writeBigUInt64BE(BigInt(bytes.length));
  hash.update(length);
  hash.update(bytes);
}

function runGit(cwd, arguments_) {
  const result = spawnSync(
    'git',
    ['-c', 'core.quotepath=false', ...arguments_],
    {
      cwd,
      encoding: 'buffer',
      maxBuffer: 64 * 1024 * 1024,
      windowsHide: true,
    },
  );
  if (result.error || result.status !== 0) {
    throw new Error('Git could not inspect the review candidate');
  }
  return result.stdout;
}

function parseCliArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument !== '--repository-root' && argument !== '--work-item') {
      throw new Error('Expected --repository-root and --work-item');
    }
    const value = argv[index + 1];
    if (!value || value.startsWith('--') || options[argument]) {
      throw new Error('Expected --repository-root and --work-item');
    }
    options[argument] = value;
    index += 1;
  }
  if (!options['--repository-root'] || !options['--work-item']) {
    throw new Error('Expected --repository-root and --work-item');
  }
  return {
    repositoryRoot: options['--repository-root'],
    workItemPath: options['--work-item'],
  };
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  try {
    process.stdout.write(
      `${calculateReviewSnapshot(parseCliArguments(process.argv.slice(2)))}\n`,
    );
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
