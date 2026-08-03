#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const commandTargets = new Map([
  ['jz-trello-flow', '/@jz/ai-arsenal-trello-work-cli/src/bin.ts'],
]);

const canonicalPreamble = `#!/bin/sh
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

`;

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function repairPnpmBunShimText(text, command) {
  const expectedTarget = commandTargets.get(command);
  if (!expectedTarget) {
    throw new Error(`Unsupported Bun command: ${command}`);
  }
  if (!text.startsWith('#!/bin/sh\n')) {
    throw new Error(
      `Refusing to repair ${command}: file is not a POSIX shell shim`,
    );
  }

  const marker = text.match(/^# cmd-shim-target=(.+)$/m)?.[1];
  const normalizedMarker = marker?.replaceAll('\\', '/');
  const markerMatch = normalizedMarker?.match(
    /\/pnpm\/global\/(v\d+\/[A-Za-z0-9-]+\/node_modules\/@jz\/ai-arsenal-trello-work-cli\/src\/bin\.ts)$/,
  );
  if (
    !normalizedMarker ||
    normalizedMarker.split('/').includes('..') ||
    !markerMatch ||
    !normalizedMarker.endsWith(expectedTarget)
  ) {
    throw new Error(
      `Refusing to repair shim: it does not target command ${command}`,
    );
  }
  const relativeTarget = markerMatch[1];
  const shimTarget = `"\\$basedir(?:_win)?/\\.\\./global/${escapeRegularExpression(relativeTarget)}"`;
  const dispatcher = new RegExp(
    `if \\[ -n "\\$exe" \\] && \\[ -x "\\$basedir/bun\\.exe" \\]; then\\n` +
      `  exec "\\$basedir/bun\\.exe"[ \\t]+${shimTarget} "\\$@"\\n` +
      `elif \\[ -x "\\$basedir/bun" \\]; then\\n` +
      `  exec "\\$basedir/bun"[ \\t]+${shimTarget} "\\$@"\\n` +
      `elif command -v bun >/dev/null 2>&1; then\\n` +
      `  exec bun[ \\t]+${shimTarget} "\\$@"\\n` +
      `elif \\[ -n "\\$exe" \\] && command -v bun\\.exe >/dev/null 2>&1; then\\n` +
      `  exec bun\\.exe[ \\t]+${shimTarget} "\\$@"\\n` +
      `else\\n  exec bun[ \\t]+${shimTarget} "\\$@"\\nfi\\n# cmd-shim-target=${escapeRegularExpression(marker)}`,
  );
  const dispatcherMatch = dispatcher.exec(text);
  const markerCount = [...text.matchAll(/^# cmd-shim-target=/gm)].length;
  if (
    !dispatcherMatch ||
    markerCount !== 1 ||
    dispatcherMatch.index !== canonicalPreamble.length ||
    text !== `${canonicalPreamble}${dispatcherMatch[0]}\n`
  ) {
    throw new Error(
      `Refusing to repair ${command}: shim does not match the complete generated Bun shim`,
    );
  }

  const brokenTarget = /"\$basedir\/\.\.\/global/g;
  const matches = text.match(brokenTarget) ?? [];
  if (matches.length === 0) {
    if (/"\$basedir_win\/\.\.\/global/.test(text)) {
      return { status: 'unchanged', replacements: 0, text };
    }
    throw new Error(
      `Refusing to repair ${command}: expected pnpm target paths are missing`,
    );
  }

  return {
    status: 'repaired',
    replacements: matches.length,
    text: text.replaceAll('"$basedir/../global', '"$basedir_win/../global'),
  };
}

export async function repairPnpmBunShimFile(shimPath, command) {
  if (path.basename(shimPath) !== command) {
    throw new Error(
      `Refusing to repair ${shimPath}: expected filename ${command}`,
    );
  }

  const text = await readFile(shimPath, 'utf8');
  const result = repairPnpmBunShimText(text, command);
  if (result.status === 'repaired') {
    await writeFile(shimPath, result.text, 'utf8');
  }
  return result;
}

function resolveGlobalShim(command) {
  const executable =
    process.platform === 'win32' ? process.env.ComSpec : 'pnpm';
  const args =
    process.platform === 'win32'
      ? ['/d', '/s', '/c', 'pnpm bin --global']
      : ['bin', '--global'];
  if (!executable) {
    throw new Error('ComSpec is unavailable; cannot locate pnpm on Windows');
  }

  const globalBin = execFileSync(executable, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  if (!globalBin) {
    throw new Error('pnpm returned an empty global bin directory');
  }
  return path.join(globalBin, command);
}

async function main() {
  const command = process.argv[2];
  if (!command || process.argv.length !== 3) {
    throw new Error('Usage: node scripts/repair-pnpm-bun-shim.mjs <command>');
  }

  const shimPath = resolveGlobalShim(command);
  const result = await repairPnpmBunShimFile(shimPath, command);
  process.stdout.write(
    `${command}: ${result.status} (${result.replacements} replacement${result.replacements === 1 ? '' : 's'}) at ${shimPath}\n`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
