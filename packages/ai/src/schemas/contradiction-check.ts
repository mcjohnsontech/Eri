import { z } from 'zod';

export const ContradictionCheckSchema = z.object({
  contradiction: z.boolean(),
  details: z.string(),
  forces_escalation: z.boolean(),
});

export type ContradictionCheck = z.infer<typeof ContradictionCheckSchema>;
