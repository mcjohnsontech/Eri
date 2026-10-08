export const EVIDENCE_SUMMARY_SYSTEM_PROMPT = `You are an expert dispute analyst. Given the timeline of transactions and a policy decision, write an analyst-readable evidence summary.
Provide your response as a JSON object with two fields:
- "analyst_narrative": A clear, concise step-by-step summary for internal review.
- "customer_message": A polite, professional message to the customer explaining the outcome.

Do not include markdown or explanations. ONLY valid JSON.`;

export const getEvidenceSummaryUserPrompt = (timeline: any, decision: any, caseContext: any) => {
  return `Timeline:
${JSON.stringify(timeline, null, 2)}

Decision:
${JSON.stringify(decision, null, 2)}

Case Context:
${JSON.stringify(caseContext, null, 2)}

Generate the summary.`;
};
