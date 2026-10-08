import { z } from 'zod';

export enum DisputeStatus {
  RECEIVED = 'RECEIVED',
  ENRICHING = 'ENRICHING',
  RECONSTRUCTED = 'RECONSTRUCTED',
  DECIDING = 'DECIDING',
  WAITING = 'WAITING',
  STATUS_REQUERY = 'STATUS_REQUERY',
  AUTO_APPROVED = 'AUTO_APPROVED',
  PENDING_HUMAN = 'PENDING_HUMAN',
  REJECTED_NOT_ELIGIBLE = 'REJECTED_NOT_ELIGIBLE',
  EXECUTING = 'EXECUTING',
  VERIFYING = 'VERIFYING',
  RESOLVED = 'RESOLVED',
  WRITTEN_BACK = 'WRITTEN_BACK',
  CLOSED = 'CLOSED',
  FAILED = 'FAILED'
}

export enum DerivedState {
  COMPLETED = 'COMPLETED',
  FAILED_REVERSED = 'FAILED_REVERSED',
  FAILED_NOT_REVERSED = 'FAILED_NOT_REVERSED',
  PENDING_REVERSAL = 'PENDING_REVERSAL',
  IN_FLIGHT = 'IN_FLIGHT',
  INDETERMINATE = 'INDETERMINATE',
  CONFLICT = 'CONFLICT'
}

export enum ResolutionMode {
  AUTO = 'AUTO',
  HUMAN_APPROVAL = 'HUMAN_APPROVAL',
  HUMAN_ONLY = 'HUMAN_ONLY'
}

export enum CanonicalEventType {
  INITIATED = 'INITIATED',
  DEBITED = 'DEBITED',
  SUBMITTED_TO_SWITCH = 'SUBMITTED_TO_SWITCH',
  SWITCH_ACKED = 'SWITCH_ACKED',
  SWITCH_TIMEOUT = 'SWITCH_TIMEOUT',
  DESTINATION_CREDITED = 'DESTINATION_CREDITED',
  DESTINATION_REJECTED = 'DESTINATION_REJECTED',
  AUTO_REVERSAL_INITIATED = 'AUTO_REVERSAL_INITIATED',
  AUTO_REVERSAL_POSTED = 'AUTO_REVERSAL_POSTED',
  SETTLED = 'SETTLED',
  RECON_MISMATCH = 'RECON_MISMATCH',
  MANUAL_REVERSAL_POSTED = 'MANUAL_REVERSAL_POSTED'
}

export interface CanonicalEvent {
  source: string;
  occurred_at: Date;
  event_type: CanonicalEventType;
  raw_ref: string;
  payload: Record<string, any>;
}

export interface TransactionTimeline {
  events: CanonicalEvent[];
  derived_state: DerivedState;
  anomalies: string[];
  missing_sources: string[];
}

export interface EvidenceBundle {
  documentIds: string[];
  summary: string;
  metadata: Record<string, any>;
}

export interface PolicyDecision {
  mode: ResolutionMode;
  reason: string;
  confidenceScore: number;
  recommendedAction: string;
}

export interface ActionRequest {
  type: string;
  payload: Record<string, any>;
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: Record<string, any>;
}

export interface DisputeCase {
  id: string;
  dispute_ref: string;
  transaction_ref: string;
  channel: string;
  category: string;
  status: DisputeStatus;
  derived_state: DerivedState | null;
  confidence: number | null;
  policy_version: string | null;
  amount: number;
  currency: string;
  customer_text: string | null;
  callback_url: string;
  created_at: Date;
  resolved_at: Date | null;
}

export type ReviewDecision = 'approve' | 'reject' | 'override';

export const InboundDisputePayloadSchema = z.object({
  dispute_ref: z.string(),               // e.g. "DSP-2026-004812"
  transaction_ref: z.string(),           // e.g. "NIP240930104455000123"
  channel: z.string(),                   // e.g. "mobile_app"
  category_hint: z.enum(['DEBIT_NO_CREDIT', 'DUPLICATE_DEBIT', 'WRONG_BENEFICIARY', 'OTHER']).optional(),
  customer_text: z.string().optional(),  // Free-text complaint
  amount: z.number().positive(),
  currency: z.string().default('NGN'),
  opened_at: z.string().datetime(),
  callback_url: z.string().url(),
});

export const OutboundWriteBackPayloadSchema = z.object({
  dispute_ref: z.string(),
  eri_case_id: z.string(),
  status: z.enum(['RESOLVED', 'CLOSED', 'PENDING_HUMAN', 'FAILED']),
  resolution_category: z.string().optional(),
  action_taken: z.object({
    type: z.string(),
    reference: z.string().optional(),
    amount: z.number().optional(),
    executed_at: z.string().datetime().optional(),
    mode: z.enum(['AUTO', 'HUMAN_APPROVAL']).optional(),
  }).optional(),
  finding: z.string().optional(),
  policy_version: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  evidence_url: z.string().url().optional(),
  customer_message: z.string().optional(),
  audit_head_hash: z.string().optional(),
});

export type InboundDisputePayload = z.infer<typeof InboundDisputePayloadSchema>;
export type OutboundWriteBackPayload = z.infer<typeof OutboundWriteBackPayloadSchema>;

export interface CaseContext {
  caseId: string;
  amount: number;
  currency: string;
  customerFlags: string[];
  repeatDisputes30d: number;
  contradictionDetected: boolean;
}

export interface EvidenceSummary {
  analystNarrative: string;
  customerMessage: string;
  modelVersion: string;
  promptVersion: string;
}

export interface SimilarCase {
  caseId: string;
  outcome: string;
  similarity: number;
  derivedState: DerivedState;
}

export interface ConfidenceParams {
  derivedState: DerivedState;
  evidenceCompleteness: number;
  anomalyCount: number;
  contradictionDetected: boolean;
  similarCaseAgreementFactor: number;
}
