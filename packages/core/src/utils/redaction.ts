import { randomBytes } from 'crypto';

export function redactPII(text: string): { redacted: string; map: Record<string, string> } {
  const map: Record<string, string> = {};
  let redactedText = text;

  // Function to generate a deterministic-ish token or just random hex for replacement
  const getToken = (prefix: string) => `[REDACTED_${prefix}_${randomBytes(4).toString('hex')}]`;

  // 1. Redact 10-digit account numbers (NUBAN)
  const nubanRegex = /\b\d{10}\b/g;
  redactedText = redactedText.replace(nubanRegex, (match) => {
    if (!map[match]) {
      map[match] = getToken('ACCT');
    }
    return map[match];
  });

  // 2. Redact phone numbers (Nigerian formats, e.g. 080..., +234...)
  const phoneRegex = /(?:\+?234|0)[789][01]\d{8}\b/g;
  redactedText = redactedText.replace(phoneRegex, (match) => {
    if (!map[match]) {
      map[match] = getToken('PHONE');
    }
    return map[match];
  });

  // 3. Redact names-before-patterns (Basic heuristic: capitalized words before specific keywords, or just generally recognizing names might be tricky without NLP, so we do a simple heuristic for demonstration)
  // Let's look for "Mr. Name", "Mrs. Name"
  const titleNameRegex = /\b(?:Mr\.|Mrs\.|Ms\.|Dr\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/g;
  redactedText = redactedText.replace(titleNameRegex, (match, p1) => {
    if (!map[p1]) {
      map[p1] = getToken('NAME');
    }
    return match.replace(p1, map[p1]);
  });
  
  // Re-map the reverse for easy rehydration
  const reverseMap: Record<string, string> = {};
  for (const [key, value] of Object.entries(map)) {
    reverseMap[value] = key;
  }

  return { redacted: redactedText, map: reverseMap };
}

export function rehydrate(text: string, map: Record<string, string>): string {
  let rehydratedText = text;
  for (const [token, original] of Object.entries(map)) {
    // Escape token for regex if it contains special chars like brackets
    const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedToken, 'g');
    rehydratedText = rehydratedText.replace(regex, original);
  }
  return rehydratedText;
}
