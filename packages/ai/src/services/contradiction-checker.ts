import { client } from '../client';
import { TicketExtraction } from '../schemas/ticket-extraction';
import { ContradictionCheck, ContradictionCheckSchema } from '../schemas/contradiction-check';

export async function checkContradiction(extracted: TicketExtraction, timeline: any): Promise<ContradictionCheck> {
    const prompt = `You are evaluating a customer's claim against the reconstructed state.
    
Customer Claim:
${JSON.stringify(extracted, null, 2)}

Reconstructed Timeline:
${JSON.stringify(timeline, null, 2)}

Check if the customer's claimed amount, date, or beneficiary contradicts the timeline.
Respond with JSON strictly matching this schema:
{
  "contradiction": boolean,
  "details": string,
  "forces_escalation": boolean
}`;

    const response = await client.interactions.create({
        model: 'gemini-3.8-flash',
        generation_config: { temperature: 0 },
        response_mime_type: 'application/json',
        input: prompt
    });

    const parsed = JSON.parse(response.output_text || '{}');
    return ContradictionCheckSchema.parse(parsed);
}
