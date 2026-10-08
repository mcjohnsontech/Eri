export interface DisputeRecord {
  id: string;
  transaction_ref: string;
  amount: number;
  customer_id: string;
  status: string;
  created_at: string;
  resolution?: string;
  resolution_at?: string;
}

export const disputes: Map<string, DisputeRecord> = new Map([
  ['D1001', { id: 'D1001', transaction_ref: 'TX1001', amount: 50.0, customer_id: 'CUST1', status: 'OPEN', created_at: new Date().toISOString() }],
  ['D1002', { id: 'D1002', transaction_ref: 'TX1002', amount: 100.0, customer_id: 'CUST2', status: 'OPEN', created_at: new Date().toISOString() }],
  ['D1003', { id: 'D1003', transaction_ref: 'TX1003', amount: 75.0, customer_id: 'CUST3', status: 'OPEN', created_at: new Date().toISOString() }],
  ['D1004', { id: 'D1004', transaction_ref: 'TX1004', amount: 200.0, customer_id: 'CUST4', status: 'OPEN', created_at: new Date().toISOString() }],
  ['D1005', { id: 'D1005', transaction_ref: 'TX1005', amount: 15.0, customer_id: 'CUST5', status: 'OPEN', created_at: new Date().toISOString() }],
  ['D1006', { id: 'D1006', transaction_ref: 'TX1006', amount: 80.0, customer_id: 'CUST6', status: 'OPEN', created_at: new Date().toISOString() }],
  ['D1007', { id: 'D1007', transaction_ref: 'TX1007', amount: 120.0, customer_id: 'CUST7', status: 'OPEN', created_at: new Date().toISOString() }],
  ['D1008', { id: 'D1008', transaction_ref: 'TX1008', amount: 45.0, customer_id: 'CUST8', status: 'OPEN', created_at: new Date().toISOString() }],
  ['D1009', { id: 'D1009', transaction_ref: 'TX1009', amount: 60.0, customer_id: 'CUST9', status: 'OPEN', created_at: new Date().toISOString() }],
  ['D1010', { id: 'D1010', transaction_ref: 'TX1010', amount: 35.0, customer_id: 'CUST10', status: 'OPEN', created_at: new Date().toISOString() }],
  ['D1011', { id: 'D1011', transaction_ref: 'TX1011', amount: 90.0, customer_id: 'CUST11', status: 'OPEN', created_at: new Date().toISOString() }],
  ['D1012', { id: 'D1012', transaction_ref: 'TX1012', amount: 150.0, customer_id: 'CUST12', status: 'OPEN', created_at: new Date().toISOString() }],
  ['D1013', { id: 'D1013', transaction_ref: 'TX1013', amount: 25.0, customer_id: 'CUST13', status: 'OPEN', created_at: new Date().toISOString() }],
  ['D1014', { id: 'D1014', transaction_ref: 'TX1014', amount: 110.0, customer_id: 'CUST14', status: 'OPEN', created_at: new Date().toISOString() }],
  ['D1015', { id: 'D1015', transaction_ref: 'TX1015', amount: 5.0, customer_id: 'CUST15', status: 'OPEN', created_at: new Date().toISOString() }],
  ['D1016', { id: 'D1016', transaction_ref: 'TX1016', amount: 300.0, customer_id: 'CUST16', status: 'OPEN', created_at: new Date().toISOString() }],
  ['D1017', { id: 'D1017', transaction_ref: 'TX1017', amount: 85.0, customer_id: 'CUST17', status: 'OPEN', created_at: new Date().toISOString() }],
  ['D1018', { id: 'D1018', transaction_ref: 'TX1018', amount: 40.0, customer_id: 'CUST18', status: 'OPEN', created_at: new Date().toISOString() }],
  ['D1019', { id: 'D1019', transaction_ref: 'TX1019', amount: 70.0, customer_id: 'CUST19', status: 'OPEN', created_at: new Date().toISOString() }],
  ['D1020', { id: 'D1020', transaction_ref: 'TX1020', amount: 95.0, customer_id: 'CUST20', status: 'OPEN', created_at: new Date().toISOString() }]
]);
