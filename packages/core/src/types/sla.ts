export enum SLAClock {
  REFUND_10M = 'REFUND_10M',
  REVERSAL_24H = 'REVERSAL_24H',
  CREDIT_4M = 'CREDIT_4M',
  PENDING_CREDIT_24H = 'PENDING_CREDIT_24H',
  DRS_3WD = 'DRS_3WD',
  CBN_ESC_5WD = 'CBN_ESC_5WD',
  COMPLAINT_2W = 'COMPLAINT_2W',
  RECALL_14WD = 'RECALL_14WD',
  LIEN_2W = 'LIEN_2W'
}

export interface SLAClockRecord {
  clockId: string;
  disputeId: string;
  type: SLAClock;
  startedAt: Date;
  deadlineAt: Date;
  completedAt: Date | null;
  isBreached: boolean;
}

export interface BreachRecord {
  breachId: string;
  disputeId: string;
  clockType: SLAClock;
  breachedAt: Date;
  severity: 'WARNING' | 'CRITICAL' | 'FATAL';
  resolvedAt: Date | null;
  notes: string;
}
