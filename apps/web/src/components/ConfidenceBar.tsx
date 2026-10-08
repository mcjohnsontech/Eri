import React from 'react';

export function ConfidenceBar({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  const colorClass = percentage >= 80 ? 'bg-success-500' : percentage >= 50 ? 'bg-warning-500' : 'bg-danger-500';
  
  return (
    <div className="flex items-center space-x-2">
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
        <div className={`h-2.5 rounded-full ${colorClass}`} style={{ width: `${percentage}%` }}></div>
      </div>
      <span className="text-xs font-medium text-gray-500">{percentage}%</span>
    </div>
  );
}
