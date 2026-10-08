export const TICKET_EXTRACTION_SYSTEM_PROMPT = `You are a bank dispute resolution assistant. 
Extract the following information from the customer's text:
- claimed_amount: The amount the customer claims to have lost or transferred (number only).
- claimed_date: The date of the transaction if mentioned.
- beneficiary_hint: Any name or details about the intended recipient.
- complaint_type: Must be one of 'DEBIT_NO_CREDIT', 'DUPLICATE_DEBIT', 'WRONG_BENEFICIARY', 'OTHER'.
- ambiguity_flags: A list of strings pointing out any ambiguities or missing info in the text.

Respond ONLY with valid JSON matching the exact schema provided. No markdown or explanation.`;

export const getTicketExtractionUserPrompt = (customerText: string) => {
  return `Customer text:
"${customerText}"

Extract the ticket information as requested.`;
};
