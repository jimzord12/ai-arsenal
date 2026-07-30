import type { WorkConfig } from './config';
import { WorkCliError } from './errors';
import { normalizeRemoteCard, resolveCard } from './read-commands';
import type { TrelloCard } from './trello-types';
import { assertCurrentVersion } from './version';
import {
  operationRecord,
  operationRecordState,
  preflightDescription,
  validateOperationId,
} from './mutation';
import {
  parseWorkUnit,
  renderWorkUnit,
  type WorkUnitStatus,
} from './work-unit';

export interface TransitionClient {
  getCard(reference: string): Promise<TrelloCard>;
  listBoardCards(boardId: string): Promise<TrelloCard[]>;
  updateCard(
    cardId: string,
    input: { desc?: string; idList?: string },
  ): Promise<TrelloCard>;
}

export type TransitionOptions = {
  dryRun?: boolean;
  ifVersion?: string;
  operationId: string;
  now?: string;
};

const STATUSES: WorkUnitStatus[] = [
  'inbox',
  'in_design',
  'ready',
  'in_progress',
  'review',
  'blocked',
  'done',
];

const RESOLVED_OPEN_QUESTIONS = /^(?:none\.?|n\/a\.?|no open questions\.?)$/i;

function hasUnresolvedOpenQuestions(value: string | undefined): boolean {
  if (value === undefined) return false;
  const normalized = value
    .trim()
    .replace(/^[-*]\s+/, '')
    .trim();
  return !RESOLVED_OPEN_QUESTIONS.test(normalized);
}

function configuredPolicy(
  config: WorkConfig,
): NonNullable<WorkConfig['transitionGraph']> {
  if (!config.boardId || !config.transitionGraph) {
    throw new WorkCliError(
      'TRANSITION_POLICY_UNCONFIGURED',
      'Board and transition graph must be configured before transition.',
    );
  }
  return config.transitionGraph;
}

function proposedDescription(
  card: TrelloCard,
  target: WorkUnitStatus,
  operationId: string,
  now: string,
  postcondition: unknown,
): string {
  const current = normalizeRemoteCard(card);
  const marker = operationRecord(operationId, postcondition);
  const sections = { ...current.sections };
  if (
    target === 'ready' &&
    sections['Open Questions'] !== undefined &&
    !hasUnresolvedOpenQuestions(sections['Open Questions'])
  ) {
    delete sections['Open Questions'];
  }
  const document = {
    metadata: { ...current.metadata, status: target, updated_at: now },
    sections: {
      ...sections,
      Context: sections.Context.includes(marker)
        ? sections.Context
        : `${sections.Context}\n\n${marker}`,
    },
  };
  const description = renderWorkUnit(document).replace(
    /^status: [^\n]+$/m,
    `status: ${JSON.stringify(target)}`,
  );
  parseWorkUnit(description);
  return description;
}

export async function transitionWorkUnit(
  reference: string,
  target: string,
  config: WorkConfig,
  client: TransitionClient,
  options: TransitionOptions,
): Promise<Record<string, unknown>> {
  validateOperationId(options.operationId);
  const graph = configuredPolicy(config);
  if (!STATUSES.includes(target as WorkUnitStatus)) {
    throw new WorkCliError(
      'TRANSITION_UNSUPPORTED',
      `Unsupported target status: ${target}.`,
    );
  }
  const possible = Object.values(graph).some((targets) =>
    targets?.includes(target as WorkUnitStatus),
  );
  if (!possible) {
    throw new WorkCliError(
      'TRANSITION_UNSUPPORTED',
      `No configured transition reaches ${target}.`,
    );
  }
  const targetStatus = target as WorkUnitStatus;
  const targetListId = config.listIds[targetStatus];
  if (!targetListId) {
    throw new WorkCliError(
      'TRANSITION_POLICY_UNCONFIGURED',
      `No list mapping is configured for ${targetStatus}.`,
    );
  }

  const card = await resolveCard(reference, config, client);
  const current = normalizeRemoteCard(card);
  const sourceListId = config.listIds[current.metadata.status];
  if (!sourceListId || card.idList !== sourceListId) {
    throw new WorkCliError(
      'RECONCILIATION_REQUIRED',
      'Current description status and Trello list are not synchronized.',
    );
  }
  const postcondition = {
    operation: 'transition',
    targetStatus,
    targetListId,
  };
  const operationState = operationRecordState(
    card.desc,
    options.operationId,
    postcondition,
  );
  if (operationState !== 'absent') {
    const exact =
      operationState === 'match' &&
      current.metadata.status === targetStatus &&
      card.idList === targetListId;
    return exact
      ? {
          outcome: 'recovered',
          operationId: options.operationId,
          workUnit: current,
        }
      : {
          outcome: 'partial',
          recovery: {
            operationId: options.operationId,
            cardId: card.id,
            action: 'reconcile',
            reason: 'operation record conflicts with requested postcondition',
          },
        };
  }
  assertCurrentVersion(options.ifVersion, current.version);
  if (!graph[current.metadata.status]?.includes(targetStatus)) {
    throw new WorkCliError(
      'TRANSITION_UNSUPPORTED',
      `Transition ${current.metadata.status} -> ${targetStatus} is not configured.`,
    );
  }
  if (
    current.metadata.status === 'in_design' &&
    targetStatus === 'ready' &&
    (hasUnresolvedOpenQuestions(current.sections['Open Questions']) ||
      Object.values(current.sections).some((section) =>
        /\bpending\s*:/i.test(section),
      ))
  ) {
    throw new WorkCliError(
      'WORK_UNIT_NOT_READY',
      'Resolve all Pending entries and Open Questions before entering Ready.',
    );
  }
  const now = options.now ?? new Date().toISOString();
  const desc = proposedDescription(
    card,
    targetStatus,
    options.operationId,
    now,
    postcondition,
  );
  const marker = operationRecord(options.operationId, postcondition);
  preflightDescription({
    current: card.desc,
    proposed: desc,
    operation: 'transition',
    operationRecord: marker,
  });
  if (options.dryRun) {
    return {
      outcome: 'planned',
      plan: {
        operationId: options.operationId,
        from: current.metadata.status,
        to: targetStatus,
        targetListId,
        currentVersion: current.version,
        proposedDescription: desc,
      },
    };
  }
  try {
    await client.updateCard(card.id, { desc, idList: targetListId });
  } catch (error) {
    if (
      error instanceof WorkCliError &&
      error.code === 'TRELLO_MUTATION_AMBIGUOUS'
    ) {
      return {
        outcome: 'ambiguous',
        recovery: {
          operationId: options.operationId,
          cardId: card.id,
          action: 'reconcile',
        },
      };
    }
    throw error;
  }
  let readBack: TrelloCard;
  try {
    readBack = await client.getCard(card.id);
  } catch {
    return {
      outcome: 'partial',
      recovery: {
        operationId: options.operationId,
        cardId: card.id,
        action: 'reconcile',
        expected: { status: targetStatus, listId: targetListId },
      },
    };
  }
  if (readBack.desc !== desc || readBack.idList !== targetListId) {
    return {
      outcome: 'partial',
      recovery: {
        operationId: options.operationId,
        cardId: card.id,
        action: 'reconcile',
      },
    };
  }
  return {
    outcome: 'verified',
    operationId: options.operationId,
    workUnit: normalizeRemoteCard(readBack),
  };
}
