import { client } from '../client';
import { TicketExtraction, TicketExtractionSchema } from '../schemas/ticket-extraction';
import { TICKET_EXTRACTION_SYSTEM_PROMPT, getTicketExtractionUserPrompt } from '../prompts/ticket-extraction';
import { redactPII } from '@eri/core';

export const TICKET_EXTRACTOR_VERSION = 'ticket-extractor-v1.0';

export async function extractTicketInfo(customerText: string): Promise<TicketExtraction | null> {
  // 1. Redact PII before sending to LLM
  const { redacted: redactedText } = redactPII(customerText);

  const model = 'gemini-3.8-flash';
  let attempts = 0;

  while (attempts < 2) {
    attempts++;
    try {
      const response = await client.interactions.create({
        model,
        system_instruction: TICKET_EXTRACTION_SYSTEM_PROMPT,
        input: getTicketExtractionUserPrompt(redactedText),
        response_format: {
          type: 'object',
          description: 'Structured ticket extraction',
          properties: {
            claimed_amount: { type: 'number', nullable: true },
            claimed_date: { type: 'string', nullable: true },
            beneficiary_hint: { type: 'string', nullable: true },
            complaint_type: {
              type: 'string',
              enum: ['DEBIT_NO_CREDIT', 'DUPLICATE_DEBIT', 'WRONG_BENEFICIARY', 'OTHER']
            },
            ambiguity_flags: { type: 'array', items: { type: 'string' } }
          }
        },
        generation_config: { temperature: 0 },
      });

      const responseText = response.output_text || '';
      const parsed = JSON.parse(responseText);
      const validated = TicketExtractionSchema.parse(parsed);

      return { ...validated, _model: model, _promptVersion: TICKET_EXTRACTOR_VERSION } as any;
    } catch (e) {
      console.error(`[AI] Ticket extraction attempt ${attempts} failed:`, e);
      if (attempts >= 2) {
        // On second failure, escalate (return null triggers escalation in workflow)
        return null;
      }
    }
  }
  return null;
}
