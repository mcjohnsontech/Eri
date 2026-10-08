import crypto from 'crypto';

export const writeBackToDisputeSystem = async (caseId: string, callbackUrl: string | null, payload: any) => {
  if (!callbackUrl) {
    return { skipped: true, reason: 'No callback URL configured for autonomous tracked transfer' };
  }
  const secret = process.env.WEBHOOK_SECRET || 'default-secret';
  
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payloadString = JSON.stringify({ caseId, ...payload });

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payloadString}`)
    .digest('hex');

  // Using fetch (available in Node 18+)
  const response = await fetch(callbackUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Eri-Timestamp': timestamp,
      'X-Eri-Signature': signature
    },
    body: payloadString
  });

  if (!response.ok) {
    throw new Error(`Writeback failed with status: ${response.status}`);
  }
  return { skipped: false };
};
