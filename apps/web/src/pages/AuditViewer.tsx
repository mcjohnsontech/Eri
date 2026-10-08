import React from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

export function AuditViewer() {
  const { id } = useParams();
  
  // Dummy data
  const events = [
    { type: 'CASE_CREATED', timestamp: '2026-10-08T04:20:00Z', hash: 'a1b2c3d4...', valid: true },
    { type: 'EVIDENCE_GATHERED', timestamp: '2026-10-08T04:20:05Z', hash: 'e5f6g7h8...', valid: true },
    { type: 'AI_REVIEW_COMPLETED', timestamp: '2026-10-08T04:20:15Z', hash: 'i9j0k1l2...', valid: true },
  ];

  const chainValid = true;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Trail: {id}</h1>
          <p className="text-sm text-gray-500 mt-1">Cryptographic verification of system decisions</p>
        </div>
        <div className={`flex items-center px-4 py-2 rounded-full ${chainValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {chainValid ? <ShieldCheck className="w-5 h-5 mr-2" /> : <ShieldAlert className="w-5 h-5 mr-2" />}
          <span className="font-semibold">{chainValid ? 'Chain Intact' : 'Chain Broken'}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {events.map((evt, idx) => (
            <li key={idx} className="p-6">
              <div className="flex justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{evt.type}</span>
                  <span className="text-xs text-gray-500">{new Date(evt.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2 font-mono text-xs text-gray-400 bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded">
                  <span>{evt.hash}</span>
                  {evt.valid && <ShieldCheck className="w-4 h-4 text-green-500" />}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
