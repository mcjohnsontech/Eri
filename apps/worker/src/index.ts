import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { processCaseWorkflow } from './workflows/case-workflow';
import { pollSentinel } from './services/sentinel';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const worker = new Worker('case-processing', async (job) => {
  const { caseId, payload } = job.data;
  console.log(`Processing case ${caseId}`);
  await processCaseWorkflow(caseId, payload);
}, { connection });

worker.on('completed', (job) => {
  console.log(`Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} has failed with ${err.message}`);
});

console.log('Worker is listening for jobs...');

const sentinelIntervalMs = Number(process.env.SENTINEL_POLL_MS || 5000);
const runSentinel = async () => {
  try {
    const processed = await pollSentinel();
    if (processed > 0) console.log(`[Sentinel] tracked ${processed} new transfer(s)`);
  } catch (error) {
    console.error('[Sentinel] poll failed', error);
  }
};
void runSentinel();
setInterval(() => void runSentinel(), sentinelIntervalMs);
