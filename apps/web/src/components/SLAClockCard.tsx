import React from 'react';
import { Clock } from 'lucide-react';

export function SLAClockCard({ name, deadline, timeRemainingMs }: { name: string; deadline: string; timeRemainingMs: number }) {
  const isUrgent = timeRemainingMs < 3600000; // < 1 hour
  const isExpired = timeRemainingMs <= 0;
  
  let color = 'bg-white border-gray-200 text-gray-800';
  if (isExpired) color = 'bg-red-50 border-red-200 text-red-800';
  else if (isUrgent) color = 'bg-orange-50 border-orange-200 text-orange-800';
  else color = 'bg-green-50 border-green-200 text-green-800';

  const hours = Math.max(0, Math.floor(timeRemainingMs / 3600000));
  const mins = Math.max(0, Math.floor((timeRemainingMs % 3600000) / 60000));

  return (
    <div className={`border rounded-lg p-4 flex flex-col ${color}`}>
      <div className="flex items-center space-x-2 font-semibold text-sm mb-2">
        <Clock className="w-4 h-4" />
        <span>{name}</span>
      </div>
      <div className="text-2xl font-bold">
        {isExpired ? 'EXPIRED' : `${hours}h ${mins}m`}
      </div>
      <div className="text-xs opacity-80 mt-1">
        Deadline: {new Date(deadline).toLocaleString()}
      </div>
    </div>
  );
}
