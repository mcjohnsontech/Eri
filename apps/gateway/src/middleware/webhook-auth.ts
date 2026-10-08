import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export const verifyWebhookSignature = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = req.headers['x-eri-timestamp'] as string;
  const signature = req.headers['x-eri-signature'] as string;

  if (!timestamp || !signature) {
    return res.status(401).json({ error: 'Missing auth headers' });
  }

  // Check if timestamp is within 5 minutes
  const now = Math.floor(Date.now() / 1000);
  const reqTime = parseInt(timestamp, 10);
  if (Math.abs(now - reqTime) > 300) {
    return res.status(401).json({ error: 'Timestamp expired' });
  }

  const payload = JSON.stringify(req.body);
  const secret = process.env.WEBHOOK_SECRET || 'default-secret';
  
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');

  if (signature !== expectedSig) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  next();
};
