#!/usr/bin/env node
import { createHash } from 'node:crypto';
import {
  lstat,
  readFile,
  readdir,
  realpath,
  writeFile,
} from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

const NAMES = [
  'trello-work-orchestrator',
  'trello-work-design',
  'trello-work-deliver',
  'trello-work-recover',
];
const CANONICAL_LINK =
  '../../../packages/trello-work-cli/assets/agent-workflow-protocol.md';
const INSTALLED_LINK = 'references/agent-workflow-protocol.md';
const MANAGED = '.jz-trello-flow-managed.json';
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

function args(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    if (!key?.startsWith('--') || argv[i + 1] === undefined)
      throw new Error(`invalid argument: ${key ?? '<missing>'}`);
    result[key.slice(2)] = argv[i + 1];
  }
  for (const key of [
    'payload-root',
    'repo-root',
    'sentinel',
    'sentinel-sha256',
  ]) {
    if (!result[key]) throw new Error(`missing --${key}`);
  }
  if (result['write-manifest'] && result['compare-manifest'])
    throw new Error('choose only one manifest mode');
  return result;
}

function contains(root, candidate) {
  const rel = relative(root, candidate);
  return (
    rel === '' ||
    (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel))
  );
}

async function declaredDirectory(path, label) {
  const absolute = resolve(path);
  const stat = await lstat(absolute);
  if (!stat.isDirectory() || stat.isSymbolicLink())
    throw new Error(`redirected or invalid ${label}: ${absolute}`);
  return realpath(absolute);
}

async function regularContainedFile(root, path, label) {
  const absolute = resolve(path);
  const stat = await lstat(absolute);
  if (!stat.isFile() || stat.isSymbolicLink())
    throw new Error(`redirected or invalid ${label}: ${absolute}`);
  const actual = await realpath(absolute);
  if (!contains(root, actual))
    throw new Error(`${label} escapes declared root: ${absolute} -> ${actual}`);
  return actual;
}

async function redirectFreeSentinel(root, path) {
  const absolute = resolve(path);
  const parent = dirname(absolute);
  const parentStat = await lstat(parent);
  const parentReal = await realpath(parent);
  if (parentStat.isSymbolicLink() || !contains(root, parentReal))
    throw new Error(`redirected or invalid sentinel parent: ${parent}`);
  return regularContainedFile(root, absolute, 'sentinel');
}

async function manifestPath(path, mode) {
  const absolute = resolve(path);
  const parent = await declaredDirectory(
    dirname(absolute),
    `${mode} manifest parent`,
  );
  const canonical = join(parent, absolute.slice(dirname(absolute).length + 1));
  if (mode === 'compare')
    await regularContainedFile(parent, canonical, 'compare manifest');
  else {
    try {
      await regularContainedFile(parent, canonical, 'write manifest');
    } catch (error) {
      if (!(
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ))
        throw error;
    }
  }
  return canonical;
}

async function files(root, current = root) {
  const currentReal = await realpath(current);
  if (!contains(root, currentReal))
    throw new Error(
      `redirected managed directory: ${current} -> ${currentReal}`,
    );
  const output = [];
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const path = join(current, entry.name);
    if (entry.isSymbolicLink())
      throw new Error(`redirected managed path: ${path}`);
    if (entry.isDirectory()) output.push(...(await files(root, path)));
    else if (entry.isFile()) {
      await regularContainedFile(root, path, 'managed file');
      output.push(relative(root, path).split(sep).join('/'));
    } else throw new Error(`redirected or unsupported managed path: ${path}`);
  }
  return output.sort();
}

async function main() {
  const options = args(process.argv.slice(2));
  const payload = await declaredDirectory(
    options['payload-root'],
    'payload root',
  );
  const repo = await declaredDirectory(options['repo-root'], 'repository root');
  const sentinel = await redirectFreeSentinel(repo, options.sentinel);
  const sentinelHash = sha(await readFile(sentinel));
  if (sentinelHash !== options['sentinel-sha256'])
    throw new Error(
      `sentinel SHA-256 mismatch: expected ${options['sentinel-sha256']}, observed ${sentinelHash}`,
    );
  const protocolPath = await regularContainedFile(
    payload,
    join(payload, 'agent-workflow-protocol.md'),
    'protocol payload',
  );
  const protocol = await readFile(protocolPath);
  const manifest = {};
  for (const name of NAMES) {
    const sourcePath = await regularContainedFile(
      payload,
      join(payload, name, 'SKILL.md'),
      `${name} payload`,
    );
    const source = await readFile(sourcePath, 'utf8');
    const first = source.indexOf(CANONICAL_LINK);
    if (first < 0 || source.indexOf(CANONICAL_LINK, first + 1) >= 0)
      throw new Error(
        `${name} payload must contain exactly one canonical protocol link`,
      );
    const expected = {
      [MANAGED]: Buffer.from(
        `${JSON.stringify({ managedBy: 'jz-trello-flow', replaceable: true, skill: name, version: 1 })}\n`,
      ),
      'SKILL.md': Buffer.from(source.replace(CANONICAL_LINK, INSTALLED_LINK)),
      'references/agent-workflow-protocol.md': protocol,
    };
    const root = await declaredDirectory(
      join(repo, '.agents', 'skills', name),
      `${name} managed root`,
    );
    if (!contains(repo, root))
      throw new Error(`${name} managed root escapes repository root: ${root}`);
    const actualFiles = await files(root);
    const expectedFiles = Object.keys(expected).sort();
    for (const path of expectedFiles)
      if (!actualFiles.includes(path))
        throw new Error(`missing managed file: ${name}/${path}`);
    for (const path of actualFiles)
      if (!expectedFiles.includes(path))
        throw new Error(`unexpected managed file: ${name}/${path}`);
    for (const path of expectedFiles) {
      const actualPath = await regularContainedFile(
        root,
        join(root, ...path.split('/')),
        'managed file',
      );
      const actual = await readFile(actualPath);
      if (!actual.equals(expected[path]))
        throw new Error(`byte mismatch: ${name}/${path}`);
      manifest[`${name}/${path}`] = sha(actual);
    }
  }
  const stable = `${JSON.stringify(manifest, Object.keys(manifest).sort(), 2)}\n`;
  if (options['write-manifest'])
    await writeFile(
      await manifestPath(options['write-manifest'], 'write'),
      stable,
    );
  if (options['compare-manifest']) {
    const prior = await readFile(
      await manifestPath(options['compare-manifest'], 'compare'),
      'utf8',
    );
    if (prior !== stable)
      throw new Error('repeat manifest differs from baseline');
  }
  console.log(
    `verified ${Object.keys(manifest).length} managed files across ${NAMES.length} skills; sentinel ${sentinelHash}${options['compare-manifest'] ? '; repeat manifest identical' : ''}`,
  );
}

main().catch((error) => {
  console.error(
    `byte proof failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
