import { client } from '../client';
import { EVIDENCE_SUMMARY_SYSTEM_PROMPT, getEvidenceSummaryUserPrompt } from '../prompts/evidence-summary';
import { TransactionTimeline, PolicyDecision, CaseContext } from '@eri/core';

export interface EvidenceSummary {
  analystNarrative: string;
  customerMessage: string;
}

export async function summarizeEvidence(
  timeline: TransactionTimeline,
  decision: PolicyDecision,
  caseContext: CaseContext
): Promise<EvidenceSummary> {
  try {
    const response = await client.interactions.create({
      model: 'gemini-3.8-flash',
      system_instruction: EVIDENCE_SUMMARY_SYSTEM_PROMPT,
      input: getEvidenceSummaryUserPrompt(timeline, decision, caseContext),
      response_format: {
        type: 'object',
        properties: {
          analyst_narrative: { type: 'string' },
          customer_message: { type: 'string' }
        }
      },
      generation_config: { temperature: 0 },
    });

    const responseText = response.output_text || '';
    const parsed = JSON.parse(responseText);
    return {
      analystNarrative: parsed.analyst_narrative || 'Evidence summary unavailable.',
      customerMessage: parsed.customer_message || `Your dispute has been reviewed and processed.`
    };
  } catch (e) {
    console.error('[AI] Evidence summarizer failed:', e);
    // Graceful fallback — never block resolution on AI failure
    return {
      analystNarrative: `Derived state: ${timeline.derived_state}. Decision: ${(decision as any).action || 'unknown'}.`,
      customerMessage: `Your dispute has been reviewed. Our team has taken action on your account.`
    };
  }
}

