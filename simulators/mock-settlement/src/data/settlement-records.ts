export interface SettlementRecord {
  transaction_ref: string;
  status: 'SETTLED' | 'UNSETTLED' | 'MISMATCH';
  settlement_date: string;
  amount: number;
  settled_amount?: number;
  recon_file: string;
}

export const settlementRecords: Map<string, SettlementRecord> = new Map([
  ['TX1001', { transaction_ref: 'TX1001', status: 'UNSETTLED', settlement_date: '2023-10-01', amount: 50.0, recon_file: 'recon_2023-10-01.csv' }],
  ['TX1002', { transaction_ref: 'TX1002', status: 'SETTLED', settlement_date: '2023-10-01', amount: 100.0, settled_amount: 100.0, recon_file: 'recon_2023-10-01.csv' }],
  ['TX1003', { transaction_ref: 'TX1003', status: 'SETTLED', settlement_date: '2023-10-01', amount: 75.0, settled_amount: 75.0, recon_file: 'recon_2023-10-01.csv' }]
  ,['TX1004', { transaction_ref: 'TX1004', status: 'UNSETTLED', settlement_date: '2023-10-01', amount: 50.0, recon_file: 'recon_2023-10-01.csv' }]
  ,['TX1005', { transaction_ref: 'TX1005', status: 'UNSETTLED', settlement_date: '2023-10-01', amount: 25.0, recon_file: 'recon_2023-10-01.csv' }]
]);
