export interface LedgerRecord {
  transaction_ref: string;
  amount: number;
  currency: string;
  debit_account: string;
  credit_account: string;
  status: 'DEBITED' | 'REVERSED' | 'FAILED';
  debited_at: string;
  reversed_at?: string;
  reversal_ref?: string;
  scenario_tag: string;
}

export const transactions: Map<string, LedgerRecord> = new Map([
  ['TX1001', { transaction_ref: 'TX1001', amount: 50.0, currency: 'USD', debit_account: 'ACC123', credit_account: 'ACC999', status: 'DEBITED', debited_at: new Date().toISOString(), scenario_tag: 'NO_CREDIT_NO_REVERSAL' }],
  ['TX1002', { transaction_ref: 'TX1002', amount: 100.0, currency: 'USD', debit_account: 'ACC124', credit_account: 'ACC998', status: 'REVERSED', debited_at: new Date().toISOString(), reversed_at: new Date().toISOString(), reversal_ref: 'REV1002', scenario_tag: 'LATE_REVERSAL' }],
  ['TX1003', { transaction_ref: 'TX1003', amount: 75.0, currency: 'USD', debit_account: 'ACC125', credit_account: 'ACC997', status: 'DEBITED', debited_at: new Date().toISOString(), scenario_tag: 'COMPLETED_BENEFICIARY_CREDITED' }]
  ,['TX1004', { transaction_ref: 'TX1004', amount: 50.0, currency: 'USD', debit_account: 'ACC126', credit_account: 'ACC996', status: 'DEBITED', debited_at: new Date().toISOString(), scenario_tag: 'CONFIRMED_FAILURE' }]
  ,['TX1005', { transaction_ref: 'TX1005', amount: 25.0, currency: 'NGN', debit_account: 'ACC127', credit_account: 'ACC995', status: 'DEBITED', debited_at: new Date().toISOString(), scenario_tag: 'CONFIRMED_FAILURE' }]
]);
