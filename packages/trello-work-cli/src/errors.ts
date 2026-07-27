import { redactSecrets } from './config';
import { WorkUnitError } from './work-unit';

export type WorkErrorOptions = {
  exitCode?: number;
  recovery?: Record<string, unknown>;
  cause?: unknown;
};

export class WorkCliError extends Error {
  readonly code: string;
  readonly exitCode: number;
  readonly recovery?: Record<string, unknown>;
  override readonly cause?: unknown;

  constructor(code: string, message: string, options: WorkErrorOptions = {}) {
    super(message);
    this.name = 'WorkCliError';
    this.code = code;
    this.exitCode = options.exitCode ?? 1;
    this.recovery = options.recovery;
    this.cause = options.cause;
  }
}

function redactValue(value: unknown, secrets: readonly string[]): unknown {
  if (typeof value === 'string') return redactSecrets(value, secrets);
  if (Array.isArray(value))
    return value.map((item) => redactValue(item, secrets));
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        redactValue(item, secrets),
      ]),
    );
  }
  return value;
}

export function asWorkCliError(error: unknown): WorkCliError {
  if (error instanceof WorkCliError) return error;
  if (error instanceof WorkUnitError) {
    return new WorkCliError('INVALID_WORK_UNIT', error.message, {
      cause: error,
    });
  }
  return new WorkCliError(
    'UNEXPECTED_ERROR',
    error instanceof Error ? error.message : String(error),
    { cause: error },
  );
}

export function formatWorkError(
  error: WorkCliError,
  json: boolean,
  secrets: readonly string[] = [],
): string {
  const message = redactSecrets(error.message, secrets);
  if (!json) return `${error.code}: ${message}\n`;
  const body: Record<string, unknown> = { code: error.code, message };
  if (error.recovery) body.recovery = redactValue(error.recovery, secrets);
  return `${JSON.stringify({ error: body })}\n`;
}
