import { createHash, createHmac } from 'crypto';

export function hashPayload(payload: string): string {
  return createHash('sha256').update(payload).digest('hex');
}

export function chainHash(prevHash: string, payload: string): string {
  return createHash('sha256').update(prevHash + payload).digest('hex');
}

export function hmacSign(secret: string, data: string): string {
  return createHmac('sha256', secret).update(data).digest('hex');
}

export function hmacVerify(secret: string, data: string, signature: string): boolean {
  const expected = hmacSign(secret, data);
  return expected === signature;
}
