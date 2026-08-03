import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  repairPnpmBunShimFile,
  repairPnpmBunShimText,
} from './repair-pnpm-bun-shim.mjs';

const target =
  'C:/Users/example/AppData/Local/pnpm/global/v11/example/node_modules/@jz/ai-arsenal-trello-work-cli/src/bin.ts';

const brokenShim = `#!/bin/sh
basedir=$(dirname "$(echo "$0" | sed -e 's,\\\\,/,g')")
basedir_win="$basedir"
exe=""
msys=""

case \`uname -a\` in
  *CYGWIN*|*MINGW*|*MSYS*)
    if command -v cygpath > /dev/null 2>&1; then
      basedir_win=\`cygpath -w "$basedir"\`
    fi
    exe=".exe"
    msys="true"
  ;;
  *WSL2*)
    if command -v wslpath > /dev/null 2>&1; then
      basedir_win="$(wslpath -w "$basedir" 2> /dev/null)"
      if [ $? -ne 0 ] || [ -z "$basedir_win" ]; then
        basedir_win="$basedir"
      else
        exe=".exe"
      fi
    fi
  ;;
esac

if [ -n "$exe" ] && [ -x "$basedir/bun.exe" ]; then
  exec "$basedir/bun.exe" "$basedir_win/../global/v11/example/node_modules/@jz/ai-arsenal-trello-work-cli/src/bin.ts" "$@"
elif [ -x "$basedir/bun" ]; then
  exec "$basedir/bun" "$basedir/../global/v11/example/node_modules/@jz/ai-arsenal-trello-work-cli/src/bin.ts" "$@"
elif command -v bun >/dev/null 2>&1; then
  exec bun "$basedir/../global/v11/example/node_modules/@jz/ai-arsenal-trello-work-cli/src/bin.ts" "$@"
elif [ -n "$exe" ] && command -v bun.exe >/dev/null 2>&1; then
  exec bun.exe "$basedir_win/../global/v11/example/node_modules/@jz/ai-arsenal-trello-work-cli/src/bin.ts" "$@"
else
  exec bun "$basedir/../global/v11/example/node_modules/@jz/ai-arsenal-trello-work-cli/src/bin.ts" "$@"
fi
# cmd-shim-target=${target}
`;

test('repairs every MSYS-incompatible Bun target path', () => {
  const result = repairPnpmBunShimText(brokenShim, 'jz-trello-flow');

  assert.equal(result.status, 'repaired');
  assert.equal(result.replacements, 3);
  assert.doesNotMatch(result.text, /"\$basedir\/\.\.\/global/);
  assert.equal(result.text.match(/"\$basedir_win\/\.\.\/global/g)?.length, 5);
});

test('returns an already-correct shim unchanged', () => {
  const correctShim = brokenShim.replaceAll(
    '"$basedir/../global',
    '"$basedir_win/../global',
  );

  const result = repairPnpmBunShimText(correctShim, 'jz-trello-flow');

  assert.equal(result.status, 'unchanged');
  assert.equal(result.replacements, 0);
  assert.equal(result.text, correctShim);
});

test('rejects a shim whose target is not the requested command', () => {
  const unrelatedShim = brokenShim.replaceAll(
    '@jz/ai-arsenal-trello-work-cli',
    '@jz/ai-arsenal-features-cli',
  );

  assert.throws(
    () => repairPnpmBunShimText(unrelatedShim, 'jz-trello-flow'),
    /does not target command jz-trello-flow/,
  );
});

test('rejects mixed execution targets despite a valid marker', () => {
  const mixedShim = brokenShim.replace(
    '@jz/ai-arsenal-trello-work-cli/src/bin.ts" "$@"',
    'unrelated-package/src/bin.ts" "$@"',
  );

  assert.throws(
    () => repairPnpmBunShimText(mixedShim, 'jz-trello-flow'),
    /does not match the complete generated Bun shim/,
  );
});

test('rejects a truncated generated shim', () => {
  const truncatedShim = brokenShim.replace(
    'elif [ -n "$exe" ] && command -v bun.exe >/dev/null 2>&1; then\n  exec bun.exe "$basedir_win/../global/v11/example/node_modules/@jz/ai-arsenal-trello-work-cli/src/bin.ts" "$@"\n',
    '',
  );

  assert.throws(
    () => repairPnpmBunShimText(truncatedShim, 'jz-trello-flow'),
    /does not match the complete generated Bun shim/,
  );
});

test('rejects a non-Bun execution branch with an expected target', () => {
  const nonBunShim = brokenShim.replace(
    'exec bun "$basedir/../global/v11/example/node_modules/@jz/ai-arsenal-trello-work-cli/src/bin.ts" "$@"',
    'exec echo "$basedir/../global/v11/example/node_modules/@jz/ai-arsenal-trello-work-cli/src/bin.ts" "$@"',
  );

  assert.throws(
    () => repairPnpmBunShimText(nonBunShim, 'jz-trello-flow'),
    /does not match the complete generated Bun shim/,
  );
});

test('rejects newline-separated Bun executables and targets', () => {
  const newlineSeparatedShim = brokenShim.replace(
    'exec bun "$basedir/../global/v11/example/node_modules/@jz/ai-arsenal-trello-work-cli/src/bin.ts" "$@"',
    'exec bun\n  "$basedir/../global/v11/example/node_modules/@jz/ai-arsenal-trello-work-cli/src/bin.ts" "$@"',
  );

  assert.throws(
    () => repairPnpmBunShimText(newlineSeparatedShim, 'jz-trello-flow'),
    /does not match the complete generated Bun shim/,
  );
});

test('rejects executable statements outside the canonical dispatcher', () => {
  const beforeDispatcher = brokenShim.replace(
    'if [ -n "$exe" ]',
    'exec echo unexpected\nif [ -n "$exe" ]',
  );
  const afterMarker = `${brokenShim}exec echo unexpected\n`;

  for (const malformedShim of [beforeDispatcher, afterMarker]) {
    assert.throws(
      () => repairPnpmBunShimText(malformedShim, 'jz-trello-flow'),
      /does not match the complete generated Bun shim/,
    );
  }
});

test('rejects arbitrary commands before the dispatcher', () => {
  const commandShim = brokenShim.replace(
    'if [ -n "$exe" ]',
    'command true\nif [ -n "$exe" ]',
  );

  assert.throws(
    () => repairPnpmBunShimText(commandShim, 'jz-trello-flow'),
    /does not match the complete generated Bun shim/,
  );
});

test('rejects traversal in the marker and every branch target', () => {
  const traversalShim = brokenShim.replaceAll(
    'global/v11/example/node_modules',
    'global/../attacker/node_modules',
  );

  assert.throws(
    () => repairPnpmBunShimText(traversalShim, 'jz-trello-flow'),
    /does not target command jz-trello-flow/,
  );
});

test('rejects traversal before an otherwise canonical global marker layout', () => {
  const traversalPrefixShim = brokenShim.replaceAll(
    'C:/Users/example/AppData/Local/pnpm/global',
    'C:/arbitrary/../../pnpm/global',
  );

  assert.throws(
    () => repairPnpmBunShimText(traversalPrefixShim, 'jz-trello-flow'),
    /does not target command jz-trello-flow/,
  );
});

test('repairs a shim file idempotently', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'pnpm-bun-shim-'));
  const shimPath = path.join(directory, 'jz-trello-flow');

  try {
    await writeFile(shimPath, brokenShim, 'utf8');
    const first = await repairPnpmBunShimFile(shimPath, 'jz-trello-flow');
    const second = await repairPnpmBunShimFile(shimPath, 'jz-trello-flow');

    assert.equal(first.status, 'repaired');
    assert.equal(second.status, 'unchanged');
    assert.equal(await readFile(shimPath, 'utf8'), second.text);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
