import React from 'react';

export function DerivedStateBadge({ state }: { state: string }) {
  const colors: Record<string, string> = {
    FAILED_NOT_REVERSED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-green-100 text-green-800',
    ALREADY_REVERSED: 'bg-blue-100 text-blue-800',
    IN_FLIGHT: 'bg-yellow-100 text-yellow-800',
    PENDING_REVERSAL: 'bg-orange-100 text-orange-800',
    INDETERMINATE: 'bg-gray-100 text-gray-800',
    CONFLICT: 'bg-purple-100 text-purple-800'
  };
  const color = colors[state] || 'bg-gray-100 text-gray-800';
  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded ${color}`}>
      {state}
    </span>
  );
}
