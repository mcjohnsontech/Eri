import React from 'react';
import { Power } from 'lucide-react';

export function PolicyPanel() {
  const dummyPolicy = `version: "1.2"
name: Default Bank Policy
rules:
  - state: FAILED_NOT_REVERSED
    condition: "amount <= 100000"
    action: REVERSE
  - state: FAILED_NOT_REVERSED
    condition: "amount > 100000"
    action: ESCALATE`;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Active Policies</h1>
        <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
          <Power className="mr-2 h-4 w-4" /> System Kill Switch
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Ruleset YAML</h2>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-md text-sm overflow-x-auto font-mono">
            {dummyPolicy}
          </pre>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Explanation</h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              The current ruleset auto-reverses failed transactions under ₦100,000. Larger amounts are escalated for human review.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Version History</h2>
            <ul className="text-sm space-y-3">
              <li className="flex justify-between text-gray-700 dark:text-gray-300 border-b border-gray-200 pb-2">
                <span>v1.2 (Active)</span>
                <span className="text-gray-500">Today</span>
              </li>
              <li className="flex justify-between text-gray-500 line-through border-b border-gray-200 pb-2">
                <span>v1.1</span>
                <span>Yesterday</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
