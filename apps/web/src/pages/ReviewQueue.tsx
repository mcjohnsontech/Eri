import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfidenceBar } from '../components/ConfidenceBar';
import { ReviewModal } from '../components/ReviewModal';
import { EriClient } from '../api/client';

export function ReviewQueue() {
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { EriClient.getReviewQueue().then(data => setQueue(data.cases || [])).catch(e => setError(e.message)); }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Review Queue</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Case</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount / Issue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommendation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {queue.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link to={`/cases/${item.id}`} className="text-primary-600 hover:text-primary-900 font-medium">{item.id}</Link>
                  <div className={`text-xs mt-1 font-semibold ${item.timeRemainingMs < 3600000 ? 'text-red-600' : 'text-orange-500'}`}>
                    SLA: {Math.floor(item.timeRemainingMs / 60000)}m left
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">₦{Number(item.amount || 0).toLocaleString()}</div>
                  <div className="text-sm text-gray-500 truncate max-w-xs">{item.reason || 'Pending investigation'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {item.action}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <ConfidenceBar score={item.confidence} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => setSelectedCase(item)} className="text-primary-600 hover:text-primary-900 bg-primary-50 px-3 py-1 rounded">
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ReviewModal 
        isOpen={!!selectedCase} 
        onClose={() => setSelectedCase(null)} 
        onSubmit={(decision, reason) => {
          if (selectedCase) EriClient.submitReview(selectedCase.id, decision, reason)
            .then(() => setQueue(queue.filter(item => item.id !== selectedCase.id)))
            .catch(e => setError(e.message));
          setSelectedCase(null);
        }}
        defaultAction="APPROVE"
      />
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
