import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getRandomText } from './generators/customer-texts';
import { generateTransaction } from './generators/transaction-data';

const TOTAL_CASES = 500;

interface ScenarioConfig {
  tag: string;
  expectedOutcome: string;
  percentage: number;
  generator: () => any;
}

const scenarios: ScenarioConfig[] = [
  {
    tag: 'FAILED_NOT_REVERSED_UNDER_100K',
    expectedOutcome: 'AUTO_REVERSE',
    percentage: 30,
    generator: () => ({ amount: Math.floor(Math.random() * 90000) + 1000, state: 'FAILED_NOT_REVERSED' })
  },
  {
    tag: 'COMPLETED_MISTAKEN',
    expectedOutcome: 'AUTO_CLOSE_NOT_UPHELD',
    percentage: 20,
    generator: () => ({ amount: Math.floor(Math.random() * 50000) + 1000, state: 'COMPLETED' })
  },
  {
    tag: 'ALREADY_REVERSED',
    expectedOutcome: 'AUTO_CLOSE_REVERSED',
    percentage: 10,
    generator: () => ({ amount: Math.floor(Math.random() * 50000) + 1000, state: 'ALREADY_REVERSED' })
  },
  {
    tag: 'IN_FLIGHT',
    expectedOutcome: 'DEFER',
    percentage: 8,
    generator: () => ({ amount: Math.floor(Math.random() * 50000) + 1000, state: 'IN_FLIGHT' })
  },
  {
    tag: 'INDETERMINATE',
    expectedOutcome: 'STATUS_QUERY',
    percentage: 8,
    generator: () => ({ amount: Math.floor(Math.random() * 50000) + 1000, state: 'INDETERMINATE' })
  },
  {
    tag: 'FAILED_NOT_REVERSED_OVER_100K',
    expectedOutcome: 'ESCALATE_APPROVAL',
    percentage: 8,
    generator: () => ({ amount: Math.floor(Math.random() * 500000) + 100001, state: 'FAILED_NOT_REVERSED' })
  },
  {
    tag: 'CONFLICT',
    expectedOutcome: 'ESCALATE',
    percentage: 6,
    generator: () => ({ amount: Math.floor(Math.random() * 50000) + 1000, state: 'CONFLICT' })
  },
  {
    tag: 'CONTRADICTORY_CLAIM',
    expectedOutcome: 'ESCALATE',
    percentage: 5,
    generator: () => ({ amount: Math.floor(Math.random() * 50000) + 1000, state: 'FAILED_NOT_REVERSED', claim_contradiction: true })
  },
  {
    tag: 'DUPLICATE',
    expectedOutcome: 'LINK_CLOSE',
    percentage: 5,
    generator: () => ({ amount: Math.floor(Math.random() * 50000) + 1000, state: 'FAILED_NOT_REVERSED', duplicate: true })
  }
];

async function generate() {
  const cases: any[] = [];
  const groundTruth: any[] = [];
  
  for (const scenario of scenarios) {
    const count = Math.floor((scenario.percentage / 100) * TOTAL_CASES);
    for (let i = 0; i < count; i++) {
      const details = scenario.generator();
      const tx = generateTransaction(details.amount);
      const disputeRef = `CAS-${uuidv4().substring(0, 8)}`;
      
      cases.push({
        disputeRef,
        ...tx,
        ...details,
        customerText: getRandomText()
      });
      
      groundTruth.push({
        dispute_ref: disputeRef,
        expected_outcome: scenario.expectedOutcome,
        scenario_tag: scenario.tag
      });
    }
  }

  // Write out ground truth
  fs.writeFileSync(path.join(__dirname, '../../ground_truth.json'), JSON.stringify(groundTruth, null, 2));
  if (process.env.SEED_SIMULATORS === 'true') {
    const base = process.env.SIMULATOR_HOST || 'http://localhost';
    const ledger = cases.map((item) => ({
      transaction_ref: item.transaction_ref,
      amount: item.amount,
      currency: item.currency || 'NGN',
      debit_account: 'SEED-DEBIT',
      credit_account: 'SEED-CREDIT',
      status: 'DEBITED',
      debited_at: new Date().toISOString(),
      scenario_tag: item.tag,
    }));
    const switchData = cases.map((item) => ({
      transaction_ref: item.transaction_ref, status: item.state === 'COMPLETED' ? 'CREDITED' : item.state === 'FAILED_NOT_REVERSED' ? 'REJECTED' : 'TIMEOUT',
      submitted_at: new Date().toISOString(), response_code: item.state === 'FAILED_NOT_REVERSED' ? '05' : '99',
      response_message: item.state === 'FAILED_NOT_REVERSED' ? 'Destination rejected' : 'Timeout', scenario_tag: item.tag,
    }));
    const settlement = cases.map((item) => ({
      transaction_ref: item.transaction_ref, status: item.state === 'COMPLETED' ? 'SETTLED' : 'UNSETTLED',
      settlement_date: new Date().toISOString().slice(0, 10), amount: item.amount, recon_file: 'seed.json',
    }));
    for (const [port, data] of [[4001, ledger], [4002, switchData], [4003, settlement]] as const) {
      const response = await fetch(`${base}:${port}/eri/v1/seed`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
      if (!response.ok) throw new Error(`Simulator seed failed on port ${port}: ${response.status}`);
    }
  }
  console.log(`Generated ${cases.length} cases and wrote ground truth${process.env.SEED_SIMULATORS === 'true' ? '; simulators seeded.' : '.'}`);
}

generate().catch(console.error);
