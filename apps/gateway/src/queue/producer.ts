import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const caseProcessingQueue = new Queue('case-processing', { connection });

export const enqueueCase = async (caseId: string, payload: any) => {
  await caseProcessingQueue.add('process-case', { caseId, payload }, {
    jobId: caseId, // Ensure idempotency
    removeOnComplete: true,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  });
};
