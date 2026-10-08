import { z } from 'zod';

export const LogInterpretationSchema = z.object({
  plain_meaning: z.string(),
  indicates_state: z.string(),
  uncertainty: z.boolean(),
});

export type LogInterpretation = z.infer<typeof LogInterpretationSchema>;
