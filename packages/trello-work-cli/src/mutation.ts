import { randomUUID } from 'node:crypto';
import { WorkCliError } from './errors';
import { assertCurrentVersion } from './version';

export type MutationOptions = {
  dryRun?: boolean;
  ifVersion?: string;
  operationId?: string;
};

const OPERATION_ID = /^[A-Za-z0-9._:-]{1,128}$/;

export function validateOperationId(operationId: string): void {
  if (!OPERATION_ID.test(operationId)) {
    throw new WorkCliError(
      'INVALID_OPERATION_ID',
      'Operation ID must be 1-128 safe ASCII letters, digits, dots, underscores, colons, or hyphens.',
      { exitCode: 2 },
    );
  }
}

export function operationRecord(
  operationId: string,
  postcondition: unknown,
): string {
  validateOperationId(operationId);
  const encoded = Buffer.from(JSON.stringify(postcondition), 'utf8').toString(
    'base64url',
  );
  return `<!-- work-operation: ${operationId} ${encoded} -->`;
}

export function operationRecordState(
  text: string,
  operationId: string,
  postcondition: unknown,
): 'absent' | 'match' | 'conflict' {
  validateOperationId(operationId);
  if (!text.includes(`<!-- work-operation: ${operationId} `)) return 'absent';
  return text.includes(operationRecord(operationId, postcondition))
    ? 'match'
    : 'conflict';
}

export function operationRecordValue(
  text: string,
  operationId: string,
): unknown | null {
  validateOperationId(operationId);
  const escaped = operationId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text.match(
    new RegExp(`<!-- work-operation: ${escaped} ([A-Za-z0-9_-]+) -->`),
  );
  if (!match) return null;
  try {
    return JSON.parse(Buffer.from(match[1], 'base64url').toString('utf8'));
  } catch {
    return { malformed: true };
  }
}

export type MutationPlan<T extends { version: string }> = {
  operation: string;
  operationId: string;
  currentVersion: string;
  proposed: T;
  dryRun: boolean;
  ifVersion?: string;
};

export type MutationResult<T> =
  | { outcome: 'planned'; plan: MutationPlan<T & { version: string }> }
  | { outcome: 'verified' | 'recovered'; value: T }
  | {
      outcome: 'partial' | 'ambiguous';
      recovery: Record<string, unknown>;
    };

export function planMutation<T extends { version: string }>(
  operation: string,
  current: T,
  proposedPatch: Partial<T>,
  options: MutationOptions = {},
): MutationPlan<T> {
  const operationId = options.operationId?.trim() || randomUUID();
  validateOperationId(operationId);
  return {
    operation,
    operationId,
    currentVersion: current.version,
    proposed: { ...current, ...proposedPatch, operationId } as T,
    dryRun: options.dryRun ?? false,
    ...(options.ifVersion === undefined
      ? {}
      : { ifVersion: options.ifVersion }),
  };
}

export async function executeMutation<T extends { version: string }>(input: {
  plan: MutationPlan<T>;
  current: T;
  findByOperationId?: (operationId: string) => Promise<T | null>;
  write: (proposed: T) => Promise<T>;
  readBack: (written: T) => Promise<T>;
  verify: (value: T, proposed: T) => boolean;
}): Promise<MutationResult<T>> {
  const { plan, current } = input;
  if (plan.dryRun) return { outcome: 'planned', plan };

  assertCurrentVersion(plan.ifVersion, current.version);

  if (input.findByOperationId) {
    const existing = await input.findByOperationId(plan.operationId);
    if (existing) {
      if (input.verify(existing, plan.proposed)) {
        return { outcome: 'recovered', value: existing };
      }
      return {
        outcome: 'partial',
        recovery: {
          operationId: plan.operationId,
          currentVersion: existing.version,
          reason:
            'operation-id state did not satisfy the requested postcondition',
        },
      };
    }
  }

  let written: T;
  try {
    written = await input.write(plan.proposed);
  } catch (error) {
    if (
      error instanceof WorkCliError &&
      error.code === 'TRELLO_MUTATION_AMBIGUOUS'
    ) {
      return {
        outcome: 'ambiguous',
        recovery: {
          operationId: plan.operationId,
          currentVersion: current.version,
          ...error.recovery,
        },
      };
    }
    throw error;
  }

  let readBack: T;
  try {
    readBack = await input.readBack(written);
  } catch (error) {
    return {
      outcome: 'partial',
      recovery: {
        operationId: plan.operationId,
        currentVersion: current.version,
        writtenVersion: written.version,
        reason: error instanceof Error ? error.message : String(error),
      },
    };
  }
  if (!input.verify(readBack, plan.proposed)) {
    return {
      outcome: 'partial',
      recovery: {
        operationId: plan.operationId,
        currentVersion: current.version,
        readBackVersion: readBack.version,
        reason: 'read-back verification mismatch',
      },
    };
  }
  return { outcome: 'verified', value: readBack };
}
