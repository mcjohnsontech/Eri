import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { DerivedStateBadge } from '../components/DerivedStateBadge';
import { SLAClockCard } from '../components/SLAClockCard';
import { EvidenceBundle } from '../components/EvidenceBundle';
import { ShieldAlert, GitCommit } from 'lucide-react';

export function CaseDetail() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Case {id}</h1>
          <div className="mt-1 flex items-center space-x-3">
            <DerivedStateBadge state="FAILED_NOT_REVERSED" />
            <span className="text-sm text-gray-500">Policy: Default-v1.2</span>
          </div>
        </div>
        <Link to={`/audit/${id}`} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
          <GitCommit className="mr-2 h-4 w-4" /> View Audit Trail
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Customer Claim</h2>
            <blockquote className="border-l-4 border-primary-500 pl-4 py-2 italic text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-r">
              "I transferred 150k but the recipient didn't get it."
            </blockquote>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Investigation Timeline</h2>
            <div className="relative border-l border-gray-200 dark:border-gray-700 ml-3 space-y-6">
              <div className="pl-6 relative">
                <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-1.5 top-1.5 border-2 border-white dark:border-gray-800"></div>
                <div className="text-xs font-bold text-blue-600 uppercase">LEDGER</div>
                <div className="text-sm text-gray-900 dark:text-white mt-1">Debit successful: ₦150,000</div>
              </div>
              <div className="pl-6 relative">
                <div className="absolute w-3 h-3 bg-purple-500 rounded-full -left-1.5 top-1.5 border-2 border-white dark:border-gray-800"></div>
                <div className="text-xs font-bold text-purple-600 uppercase">SWITCH</div>
                <div className="text-sm text-gray-900 dark:text-white mt-1">NIP Transfer Failed (Timeout)</div>
              </div>
            </div>
          </div>

          <EvidenceBundle items={[{ source: 'LEDGER', type: 'TX_RECEIPT', hash: '8f4a...2b1c', data: { amount: 150000 } }]} />
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-center mb-4 text-blue-800 dark:text-blue-300">
              <ShieldAlert className="w-5 h-5 mr-2" />
              <h2 className="text-lg font-bold">AI Advisory</h2>
            </div>
            <div className="text-xs uppercase font-bold text-gray-500 mb-2">NOT AUTHORITATIVE</div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Based on the switch failure and successful ledger debit, this case is a FAILED_NOT_REVERSED state. Reversal is recommended.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">SLA Clocks</h2>
            <SLAClockCard name="CBN Resolution SLA" deadline={new Date(Date.now() + 86400000).toISOString()} timeRemainingMs={86400000} />
          </div>
        </div>
      </div>
    </div>
  );
}
