import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileJson } from 'lucide-react';

export function EvidenceBundle({ items }: { items: any[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
      >
        <div className="flex items-center">
          <FileJson className="w-5 h-5 mr-2 text-primary-500" />
          Evidence Bundle ({items.length} items)
        </div>
        {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>
      {isOpen && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          {items.map((item, idx) => (
            <div key={idx} className="py-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{item.source} - {item.type}</span>
                <span className="text-xs font-mono text-gray-400 truncate max-w-xs">{item.hash}</span>
              </div>
              <pre className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-xs text-gray-800 dark:text-gray-200 overflow-x-auto">
                {JSON.stringify(item.data, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
