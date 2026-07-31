const SNAPSHOT_PATTERN = /^sha256:[0-9a-f]{64}$/;
const REVIEWER_PATTERN = /^[a-z][a-z0-9-]*$/;
const OUTCOMES = new Set(['passed', 'failed', 'cancelled', 'unknown']);

function requireString(value, name) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`${name} must be a non-empty string.`);
  }
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function normalizeExpectedReviewers(expectedReviewers) {
  if (!Array.isArray(expectedReviewers) || expectedReviewers.length === 0) {
    throw new TypeError('expectedReviewers must be a non-empty array.');
  }

  const normalized = expectedReviewers.map((reviewer) => {
    requireString(reviewer, 'reviewer');
    if (!REVIEWER_PATTERN.test(reviewer)) {
      throw new TypeError(`Invalid reviewer role: ${reviewer}`);
    }
    return reviewer;
  });

  if (new Set(normalized).size !== normalized.length) {
    throw new TypeError('expectedReviewers must contain unique roles.');
  }

  return normalized.toSorted(compareText);
}

function normalizeReceivedResults(receivedResults) {
  if (!Array.isArray(receivedResults)) {
    throw new TypeError('receivedResults must be an array.');
  }

  return receivedResults
    .map((received, index) => {
      if (received === null || typeof received !== 'object') {
        throw new TypeError(`receivedResults[${index}] must be an object.`);
      }

      const { reviewer, outcome, batchId, snapshot } = received;
      requireString(reviewer, `receivedResults[${index}].reviewer`);
      requireString(outcome, `receivedResults[${index}].outcome`);
      requireString(batchId, `receivedResults[${index}].batchId`);
      requireString(snapshot, `receivedResults[${index}].snapshot`);

      if (!REVIEWER_PATTERN.test(reviewer)) {
        throw new TypeError(`Invalid received reviewer role: ${reviewer}`);
      }
      if (!OUTCOMES.has(outcome)) {
        throw new TypeError(`Invalid review outcome: ${outcome}`);
      }

      return { reviewer, outcome, batchId, snapshot };
    })
    .toSorted((left, right) =>
      compareText(
        `${left.reviewer}\0${left.batchId}\0${left.snapshot}\0${left.outcome}`,
        `${right.reviewer}\0${right.batchId}\0${right.snapshot}\0${right.outcome}`,
      ),
    );
}

/**
 * Reconcile all review results currently available for one recorded batch.
 * Callers persist the returned canonical evidence and may reconcile it again
 * with later arrivals, so synchronous and background runtimes use one path.
 */
export function reconcileReviewBatch({
  batchId,
  snapshot,
  expectedReviewers,
  receivedResults,
}) {
  requireString(batchId, 'batchId');
  if (batchId === 'pending') {
    throw new TypeError('batchId must identify a concrete dispatched batch.');
  }
  if (!SNAPSHOT_PATTERN.test(snapshot)) {
    throw new TypeError('snapshot must be a concrete sha256 digest.');
  }

  const expected = normalizeExpectedReviewers(expectedReviewers);
  const received = normalizeReceivedResults(receivedResults);
  const expectedSet = new Set(expected);
  const matchingByReviewer = new Map();
  const blockers = [];

  for (const result of received) {
    if (result.batchId !== batchId) {
      blockers.push(
        `wrong batch for reviewer ${result.reviewer}: ${result.batchId}`,
      );
      continue;
    }
    if (result.snapshot !== snapshot) {
      blockers.push(`wrong snapshot for reviewer ${result.reviewer}`);
      continue;
    }
    if (!expectedSet.has(result.reviewer)) {
      blockers.push(`unexpected reviewer: ${result.reviewer}`);
      continue;
    }

    const matches = matchingByReviewer.get(result.reviewer) ?? [];
    matches.push(result);
    matchingByReviewer.set(result.reviewer, matches);
  }

  for (const reviewer of expected) {
    const matches = matchingByReviewer.get(reviewer) ?? [];
    if (matches.length === 0) {
      blockers.push(`missing required reviewer: ${reviewer}`);
    } else if (matches.length > 1) {
      blockers.push(`duplicate required reviewer: ${reviewer}`);
    }
  }

  const structuralBlockers = blockers.length > 0;
  if (!structuralBlockers) {
    for (const reviewer of expected) {
      const [matching] = matchingByReviewer.get(reviewer);
      if (matching.outcome !== 'passed') {
        blockers.push(`${reviewer} review outcome: ${matching.outcome}`);
      }
    }
  }

  return {
    batchId,
    snapshot,
    expectedReviewers: expected,
    receivedResults: received,
    status: structuralBlockers
      ? 'pending'
      : blockers.length > 0
        ? 'failed'
        : 'passed',
    blockers,
  };
}
