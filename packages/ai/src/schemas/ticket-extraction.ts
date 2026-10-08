import { z } from 'zod';

export const TicketExtractionSchema = z.object({
  claimed_amount: z.number().nullable(),
  claimed_date: z.string().nullable(),
  beneficiary_hint: z.string().nullable(),
  complaint_type: z.enum(['DEBIT_NO_CREDIT', 'DUPLICATE_DEBIT', 'WRONG_BENEFICIARY', 'OTHER']),
  ambiguity_flags: z.array(z.string()),
});

export type TicketExtraction = z.infer<typeof TicketExtractionSchema>;
