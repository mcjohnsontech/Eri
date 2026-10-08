import React, { useState } from 'react';

export function ReviewModal({ isOpen, onClose, onSubmit, defaultAction }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (decision: string, reason: string) => void;
  defaultAction: string;
}) {
  const [reason, setReason] = useState('');
  const [decision, setDecision] = useState(defaultAction);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none bg-black bg-opacity-50">
      <div className="relative w-full max-w-md p-6 mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Review Case</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Decision</label>
          <select 
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="APPROVE">Approve Recommendation</option>
            <option value="REJECT">Reject</option>
            <option value="OVERRIDE_REVERSE">Override: Reverse</option>
            <option value="OVERRIDE_DECLINE">Override: Decline</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason (required)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Explain your decision..."
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSubmit(decision, reason)}
            disabled={!reason.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}
