import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const dummyBurnData = [
  { time: '08:00', resolved: 400, new: 450 },
  { time: '09:00', resolved: 800, new: 900 },
  { time: '10:00', resolved: 1500, new: 1200 },
  { time: '11:00', resolved: 2300, new: 1400 },
  { time: '12:00', resolved: 3200, new: 1600 },
];

const dummyMTTR = [
  { name: 'Human Review', time: 14400 }, // 4 hours in seconds
  { name: 'Eri Auto-Resolve', time: 15 }, // 15 seconds
];

export function Dashboard() {
  const [metrics, setMetrics] = useState({ total: 0, closed: 0, pending_human: 0, failed: 0, verified_reversals: 0, auto_resolution_rate: 0 });

  useEffect(() => {
    fetch('/api/metrics/summary')
      .then((response) => {
        if (!response.ok) throw new Error('Metrics request failed');
        return response.json();
      })
      .then(setMetrics)
      .catch((error) => console.error('[Dashboard] metrics unavailable', error));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ops Dashboard</h1>
      
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Cases (24h)</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{metrics.total}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-success-600 dark:text-success-400">Auto-Resolved</div>
          <div className="mt-2 text-3xl font-semibold text-success-600 dark:text-success-400">{metrics.verified_reversals}</div>
          <div className="text-xs text-gray-500 mt-1">{Number(metrics.auto_resolution_rate).toFixed(1)}% automatic rate</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-warning-600 dark:text-warning-400">Pending Human Review</div>
          <div className="mt-2 text-3xl font-semibold text-warning-600 dark:text-warning-400">{metrics.pending_human}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-danger-600 dark:text-danger-400">Failed / Errors</div>
          <div className="mt-2 text-3xl font-semibold text-danger-600 dark:text-danger-400">{metrics.failed}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Burn-down Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Resolution Velocity</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dummyBurnData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="resolved" stroke="#16a34a" strokeWidth={2} />
                <Line type="monotone" dataKey="new" stroke="#4f46e5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MTTR Comparison */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">MTTR Comparison (Seconds)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dummyMTTR}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis scale="log" domain={['auto', 'auto']} />
                <Tooltip />
                <Bar dataKey="time" fill="#6366f1">
                  {dummyMTTR.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 1 ? '#22c55e' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
