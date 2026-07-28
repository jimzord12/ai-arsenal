export const METADATA_FIELDS = [
  'id',
  'trello_card_id',
  'title',
  'type',
  'status',
  'priority',
  'complexity',
  'engineering_depth',
  'risk',
  'owner',
  'parent',
  'blocked_by',
  'labels',
  'created_at',
  'updated_at',
] as const;

export const REQUIRED_SECTIONS = [
  'Objective',
  'Scope',
  'Out of Scope',
  'Acceptance Criteria',
  'Verification',
  'Context',
] as const;

export type WorkUnitType = 'chore' | 'task' | 'slice';
export type WorkUnitStatus =
  | 'inbox'
  | 'in_design'
  | 'ready'
  | 'in_progress'
  | 'review'
  | 'blocked'
  | 'done';
export type WorkUnitPriority = 'critical' | 'high' | 'normal' | 'low';
export type WorkUnitComplexity = 'low' | 'medium' | 'high';
export type EngineeringDepth =
  'exploratory' | 'production-pragmatic' | 'hardened';
export type WorkUnitRisk = 'low' | 'medium' | 'high';

export type WorkUnitMetadata = {
  id: string | null;
  trello_card_id: string | null;
  title: string;
  type: WorkUnitType;
  status: WorkUnitStatus;
  priority: WorkUnitPriority;
  complexity: WorkUnitComplexity;
  engineering_depth: EngineeringDepth;
  risk: WorkUnitRisk;
  owner: string | null;
  parent: string | null;
  blocked_by: string[];
  labels: string[];
  created_at: string | null;
  updated_at: string | null;
};

export type WorkUnitDocument = {
  metadata: WorkUnitMetadata;
  sections: Record<(typeof REQUIRED_SECTIONS)[number], string> & {
    'Open Questions'?: string;
  };
};

export class WorkUnitError extends Error {
  readonly code = 'INVALID_WORK_UNIT';

  constructor(message: string) {
    super(message);
    this.name = 'WorkUnitError';
  }
}

const WU_ID = /^WU-[1-9][0-9]*$/;
const TRELLO_ID = /^[0-9a-fA-F]{24}$/;
const DATE_TIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;
const ENUMS = {
  type: ['chore', 'task', 'slice'],
  status: [
    'inbox',
    'in_design',
    'ready',
    'in_progress',
    'review',
    'blocked',
    'done',
  ],
  priority: ['critical', 'high', 'normal', 'low'],
  complexity: ['low', 'medium', 'high'],
  engineering_depth: ['exploratory', 'production-pragmatic', 'hardened'],
  risk: ['low', 'medium', 'high'],
} as const;

function fail(message: string): never {
  throw new WorkUnitError(message);
}

function parseToken(token: string, line: number): unknown {
  if (token === 'null') return null;
  if (token.startsWith('"') || token.startsWith('[')) {
    try {
      const value: unknown = JSON.parse(token);
      if (token.startsWith('"') && typeof value !== 'string') {
        fail(`metadata line ${line}: expected a quoted string`);
      }
      if (token.startsWith('[') && !Array.isArray(value)) {
        fail(`metadata line ${line}: expected an array`);
      }
      return value;
    } catch (error) {
      if (error instanceof WorkUnitError) throw error;
      fail(`metadata line ${line}: malformed or unsafe YAML value`);
    }
  }
  if (/(?:!!|&|\*|\||>)/.test(token)) {
    fail(`metadata line ${line}: unsafe YAML construct`);
  }
  if (/^[a-z][a-z0-9_-]*$/.test(token)) return token;
  fail(`metadata line ${line}: unsafe or unquoted scalar`);
}

function parseMetadata(block: string): WorkUnitMetadata {
  const values: Record<string, unknown> = {};
  const keys: string[] = [];
  for (const [index, raw] of block.split('\n').entries()) {
    const line = index + 1;
    if (!raw.trim() || raw.trimStart().startsWith('#')) continue;
    if (/^\s/.test(raw) || !raw.includes(':')) {
      fail(
        `metadata line ${line}: only top-level key/value entries are allowed`,
      );
    }
    const separator = raw.indexOf(':');
    const key = raw.slice(0, separator).trim();
    const token = raw.slice(separator + 1).trim();
    if (!/^[a-z_]+$/.test(key)) {
      fail(`metadata line ${line}: invalid field ${JSON.stringify(key)}`);
    }
    if (Object.hasOwn(values, key)) {
      fail(`metadata line ${line}: duplicate field ${key}`);
    }
    values[key] = parseToken(token, line);
    keys.push(key);
  }

  if (keys.join('\n') !== METADATA_FIELDS.join('\n')) {
    const unknown = keys.filter(
      (key) =>
        !METADATA_FIELDS.includes(key as (typeof METADATA_FIELDS)[number]),
    );
    fail(
      unknown.length > 0
        ? `metadata contains unknown or legacy fields: ${unknown.join(', ')}`
        : `metadata field order must be: ${METADATA_FIELDS.join(', ')}`,
    );
  }

  return validateMetadata(values);
}

function rejectControlCharacters(value: string, field: string): void {
  if (
    [...value].some((character) => {
      const code = character.charCodeAt(0);
      return code <= 31 || code === 127;
    })
  ) {
    fail(`${field}: CR, LF, NUL, and control characters are not allowed`);
  }
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(`${field}: expected a non-empty string`);
  }
  rejectControlCharacters(value, field);
  return value;
}

function requireNullableString(value: unknown, field: string): string | null {
  return value === null ? null : requireString(value, field);
}

function requireEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    fail(`${field}: expected one of ${allowed.join(', ')}`);
  }
  rejectControlCharacters(value, field);
  return value as T;
}

function requireStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    fail(`${field}: expected an array of strings`);
  }
  const result = value as string[];
  if (result.some((item) => item.length === 0)) {
    fail(`${field}: empty values are not allowed`);
  }
  result.forEach((item) => rejectControlCharacters(item, field));
  if (new Set(result).size !== result.length) {
    fail(`${field}: duplicate values are not allowed`);
  }
  return [...result];
}

export function validateMetadata(value: unknown): WorkUnitMetadata {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail('metadata must be an object');
  }
  const input = value as Record<string, unknown>;
  const keys = Object.keys(input);
  const missing = METADATA_FIELDS.filter(
    (field) => !Object.hasOwn(input, field),
  );
  const unknown = keys.filter(
    (key) => !METADATA_FIELDS.includes(key as (typeof METADATA_FIELDS)[number]),
  );
  if (missing.length > 0)
    fail(`metadata missing fields: ${missing.join(', ')}`);
  if (unknown.length > 0)
    fail(`metadata has unknown fields: ${unknown.join(', ')}`);

  const metadata: WorkUnitMetadata = {
    id: requireNullableString(input.id, 'id'),
    trello_card_id: requireNullableString(
      input.trello_card_id,
      'trello_card_id',
    ),
    title: requireString(input.title, 'title'),
    type: requireEnum(input.type, 'type', ENUMS.type),
    status: requireEnum(input.status, 'status', ENUMS.status),
    priority: requireEnum(input.priority, 'priority', ENUMS.priority),
    complexity: requireEnum(input.complexity, 'complexity', ENUMS.complexity),
    engineering_depth: requireEnum(
      input.engineering_depth,
      'engineering_depth',
      ENUMS.engineering_depth,
    ),
    risk: requireEnum(input.risk, 'risk', ENUMS.risk),
    owner: requireNullableString(input.owner, 'owner'),
    parent: requireNullableString(input.parent, 'parent'),
    blocked_by: requireStringArray(input.blocked_by, 'blocked_by'),
    labels: requireStringArray(input.labels, 'labels'),
    created_at: requireNullableString(input.created_at, 'created_at'),
    updated_at: requireNullableString(input.updated_at, 'updated_at'),
  };

  if (metadata.id !== null && !WU_ID.test(metadata.id))
    fail('id: invalid Work Unit ID');
  if (
    metadata.trello_card_id !== null &&
    !TRELLO_ID.test(metadata.trello_card_id)
  ) {
    fail('trello_card_id: expected a 24-character hexadecimal Trello ID');
  }
  if (metadata.parent !== null && !WU_ID.test(metadata.parent)) {
    fail('parent: invalid Work Unit ID');
  }
  if (metadata.blocked_by.some((id) => !WU_ID.test(id))) {
    fail('blocked_by: contains an invalid Work Unit ID');
  }
  for (const field of ['created_at', 'updated_at'] as const) {
    const timestamp = metadata[field];
    if (
      timestamp !== null &&
      (!DATE_TIME.test(timestamp) || !Number.isFinite(Date.parse(timestamp)))
    ) {
      fail(`${field}: invalid ISO-8601 date-time`);
    }
  }
  if ((metadata.id === null) !== (metadata.trello_card_id === null)) {
    fail('id and trello_card_id must both be null or paired');
  }
  const isDraft = metadata.id === null;
  if (isDraft && metadata.status !== 'inbox') {
    fail('a draft must have status inbox');
  }
  if (
    isDraft &&
    (metadata.created_at !== null || metadata.updated_at !== null)
  ) {
    fail('draft timestamps must be null');
  }
  if (
    !isDraft &&
    (metadata.created_at === null || metadata.updated_at === null)
  ) {
    fail('persisted Work Units require paired timestamps');
  }
  if (metadata.id !== null && metadata.blocked_by.includes(metadata.id)) {
    fail('a Work Unit cannot block itself');
  }
  if (metadata.id !== null && metadata.parent === metadata.id) {
    fail('a Work Unit cannot be its own parent');
  }
  return metadata;
}

function parseSections(source: string): WorkUnitDocument['sections'] {
  const matches = [...source.matchAll(/^## ([^\n]+)\n/gm)];
  const names = matches.map((match) => match[1]);
  const duplicates = names.filter(
    (name, index) => names.indexOf(name) !== index,
  );
  if (duplicates.length > 0) fail(`duplicate section: ${duplicates[0]}`);

  const allowed = [...REQUIRED_SECTIONS, 'Open Questions'];
  const unknown = names.filter((name) => !allowed.includes(name));
  if (unknown.length > 0) fail(`unknown Work Unit section: ${unknown[0]}`);
  const expected = names.includes('Open Questions')
    ? [...REQUIRED_SECTIONS, 'Open Questions']
    : [...REQUIRED_SECTIONS];
  if (names.join('\n') !== expected.join('\n')) {
    const missing = REQUIRED_SECTIONS.filter((name) => !names.includes(name));
    if (missing.length > 0) fail(`missing required section: ${missing[0]}`);
    fail(
      `Work Unit sections are out of order; expected ${expected.join(', ')}`,
    );
  }

  const sections: Record<string, string> = {};
  matches.forEach((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? source.length;
    const body = source.slice(start, end).trim();
    if (!body) fail(`${match[1]} section is empty`);
    sections[match[1]] = body;
  });
  return sections as WorkUnitDocument['sections'];
}

export function parseWorkUnit(source: string): WorkUnitDocument {
  if (source.startsWith('\uFEFF')) fail('UTF-8 BOM is not allowed');
  const normalized = source.replace(/\r\n?/g, '\n');
  const headingCount = [...normalized.matchAll(/^# Work Unit$/gm)].length;
  if (headingCount !== 1 || !normalized.startsWith('# Work Unit\n')) {
    fail("document must contain exactly one leading '# Work Unit'");
  }
  const yamlFences = [...normalized.matchAll(/^```yaml$/gm)].length;
  if (yamlFences !== 1)
    fail('document must contain exactly one fenced yaml block');
  const match = normalized.match(/^# Work Unit\n\n```yaml\n([\s\S]*?)\n```\n/);
  if (!match) {
    fail("fenced yaml metadata must immediately follow '# Work Unit'");
  }
  const metadata = parseMetadata(match[1]);
  const body = normalized.slice(match[0].length);
  const sections = parseSections(body);
  if (
    sections['Open Questions'] &&
    metadata.status !== 'inbox' &&
    metadata.status !== 'in_design'
  ) {
    fail('Open Questions is allowed only for status inbox or in_design');
  }
  return { metadata, sections };
}

function renderToken(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value) || typeof value === 'string') {
    return JSON.stringify(value);
  }
  fail('cannot render unsupported metadata value');
}

function renderMetadata(metadata: WorkUnitMetadata): string {
  const plainFields = new Set([
    'type',
    'status',
    'priority',
    'complexity',
    'engineering_depth',
    'risk',
  ]);
  return METADATA_FIELDS.map((field) => {
    const value = metadata[field];
    return `${field}: ${plainFields.has(field) ? String(value) : renderToken(value)}`;
  }).join('\n');
}

export function renderWorkUnit(document: WorkUnitDocument): string {
  const metadata = validateMetadata(document.metadata);
  const names: Array<(typeof REQUIRED_SECTIONS)[number] | 'Open Questions'> =
    document.sections['Open Questions']
      ? [...REQUIRED_SECTIONS, 'Open Questions']
      : [...REQUIRED_SECTIONS];
  const sections = names.map((name) => {
    const body = document.sections[name];
    if (!body?.trim()) fail(`${name} section is empty`);
    return `## ${name}\n\n${body.trim()}`;
  });
  return [
    '# Work Unit',
    '',
    '```yaml',
    renderMetadata(metadata),
    '```',
    '',
    sections.join('\n\n'),
    '',
  ].join('\n');
}

const EDITABLE_FIELDS = new Set([
  'title',
  'type',
  'priority',
  'complexity',
  'engineering_depth',
  'risk',
  'owner',
  'parent',
  'blocked_by',
  'labels',
]);

export function applyMetadataMergePatch(
  metadata: WorkUnitMetadata,
  patch: unknown,
): WorkUnitMetadata {
  if (typeof patch !== 'object' || patch === null || Array.isArray(patch)) {
    fail('metadata patch must be a JSON object');
  }
  const input = patch as Record<string, unknown>;
  for (const field of Object.keys(input)) {
    if (!EDITABLE_FIELDS.has(field)) {
      fail(`metadata field ${field} is unknown or system-managed`);
    }
  }
  return validateMetadata({ ...metadata, ...input });
}
