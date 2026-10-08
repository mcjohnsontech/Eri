import { DisputeStatus } from '../types/dispute';

export const validTransitions: Record<DisputeStatus, DisputeStatus[]> = {
  [DisputeStatus.RECEIVED]: [DisputeStatus.ENRICHING, DisputeStatus.REJECTED_NOT_ELIGIBLE, DisputeStatus.FAILED],
  [DisputeStatus.ENRICHING]: [DisputeStatus.RECONSTRUCTED, DisputeStatus.FAILED],
  [DisputeStatus.RECONSTRUCTED]: [DisputeStatus.DECIDING, DisputeStatus.WAITING, DisputeStatus.FAILED],
  [DisputeStatus.DECIDING]: [DisputeStatus.AUTO_APPROVED, DisputeStatus.PENDING_HUMAN, DisputeStatus.FAILED],
  [DisputeStatus.WAITING]: [DisputeStatus.STATUS_REQUERY, DisputeStatus.PENDING_HUMAN, DisputeStatus.FAILED],
  [DisputeStatus.STATUS_REQUERY]: [DisputeStatus.PENDING_HUMAN, DisputeStatus.ENRICHING, DisputeStatus.FAILED],
  [DisputeStatus.AUTO_APPROVED]: [DisputeStatus.EXECUTING, DisputeStatus.FAILED],
  [DisputeStatus.PENDING_HUMAN]: [DisputeStatus.EXECUTING, DisputeStatus.REJECTED_NOT_ELIGIBLE, DisputeStatus.FAILED],
  [DisputeStatus.REJECTED_NOT_ELIGIBLE]: [DisputeStatus.WRITTEN_BACK, DisputeStatus.FAILED],
  [DisputeStatus.EXECUTING]: [DisputeStatus.VERIFYING, DisputeStatus.FAILED],
  [DisputeStatus.VERIFYING]: [DisputeStatus.RESOLVED, DisputeStatus.FAILED],
  [DisputeStatus.RESOLVED]: [DisputeStatus.WRITTEN_BACK, DisputeStatus.FAILED],
  [DisputeStatus.WRITTEN_BACK]: [DisputeStatus.CLOSED, DisputeStatus.FAILED],
  [DisputeStatus.CLOSED]: [],
  [DisputeStatus.FAILED]: []
};

export function isValidTransition(from: DisputeStatus, to: DisputeStatus): boolean {
  const allowedNext = validTransitions[from];
  if (!allowedNext) return false;
  return allowedNext.includes(to);
}

export function getNextStates(from: DisputeStatus): DisputeStatus[] {
  return validTransitions[from] || [];
}
