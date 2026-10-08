import { ActionRequest } from '../action-executor';

export async function queryStatus(action: ActionRequest, idempotencyKey: string): Promise<any> {
  const baseUrl = process.env.MOCK_SWITCH_URL || 'http://localhost:4002';
  const response = await fetch(`${baseUrl}/switch/status-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ transaction_ref: action.transaction_ref }),
  });
  if (!response.ok) throw new Error(`Switch status query failed: ${response.status}`);
  return response.json();
}
