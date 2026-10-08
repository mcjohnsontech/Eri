import { ActionRequest } from '../action-executor';

export async function reverseDebit(action: ActionRequest, idempotencyKey: string): Promise<boolean> {
  const baseUrl = process.env.MOCK_LEDGER_URL || 'http://localhost:4001';
  const response = await fetch(`${baseUrl}/ledger/reversals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ transaction_ref: action.transaction_ref }),
  });
  if (response.status === 400) return false;
  if (!response.ok) throw new Error(`Ledger reversal failed: ${response.status}`);
  return Boolean((await response.json() as { reversal_ref?: string }).reversal_ref);
}

export async function verifyReversal(transactionRef: string): Promise<boolean> {
  const baseUrl = process.env.MOCK_LEDGER_URL || 'http://localhost:4001';
  const response = await fetch(`${baseUrl}/ledger/tx/${encodeURIComponent(transactionRef)}`);
  if (!response.ok) throw new Error(`Ledger verification failed: ${response.status}`);
  const record = await response.json() as { status: string };
  return record.status === 'REVERSED';
}
