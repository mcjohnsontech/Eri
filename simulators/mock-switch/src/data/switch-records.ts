export interface SwitchRecord {
  transaction_ref: string;
  status: 'SUBMITTED' | 'ACKED' | 'TIMEOUT' | 'REJECTED' | 'CREDITED';
  submitted_at: string;
  acked_at?: string;
  credited_at?: string;
  response_code: string;
  response_message: string;
  scenario_tag: string;
}

export const switchRecords: Map<string, SwitchRecord> = new Map([
  ['TX1001', { transaction_ref: 'TX1001', status: 'TIMEOUT', submitted_at: new Date().toISOString(), response_code: '99', response_message: 'Timeout', scenario_tag: 'NO_CREDIT_NO_REVERSAL' }],
  ['TX1002', { transaction_ref: 'TX1002', status: 'ACKED', submitted_at: new Date().toISOString(), acked_at: new Date().toISOString(), response_code: '00', response_message: 'Success', scenario_tag: 'LATE_REVERSAL' }],
  ['TX1003', { transaction_ref: 'TX1003', status: 'CREDITED', submitted_at: new Date().toISOString(), credited_at: new Date().toISOString(), response_code: '00', response_message: 'Success', scenario_tag: 'COMPLETED_BENEFICIARY_CREDITED' }]
  ,['TX1004', { transaction_ref: 'TX1004', status: 'REJECTED', submitted_at: new Date().toISOString(), response_code: '05', response_message: 'Destination rejected', scenario_tag: 'CONFIRMED_FAILURE' }]
  ,['TX1005', { transaction_ref: 'TX1005', status: 'REJECTED', submitted_at: new Date().toISOString(), response_code: '05', response_message: 'Destination rejected', scenario_tag: 'CONFIRMED_FAILURE' }]
]);
