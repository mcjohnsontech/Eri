import { v4 as uuidv4 } from 'uuid';

export function generateSessionId(): string {
  const date = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const randomStr = Math.random().toString(36).substring(2, 14).toUpperCase();
  return `099${date}${randomStr}`; // Standard NIP format
}

export function generateTransaction(amount: number) {
  return {
    sessionId: generateSessionId(),
    amount,
    senderAccount: Math.floor(Math.random() * 10000000000).toString().padStart(10, '0'),
    receiverAccount: Math.floor(Math.random() * 10000000000).toString().padStart(10, '0'),
    senderBank: '044',
    receiverBank: '011',
    timestamp: new Date().toISOString()
  };
}
