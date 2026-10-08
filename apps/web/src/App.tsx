import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { ReviewQueue } from './pages/ReviewQueue';
import { CaseDetail } from './pages/CaseDetail';
import { AuditViewer } from './pages/AuditViewer';
import { PolicyPanel } from './pages/PolicyPanel';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/review-queue" element={<ReviewQueue />} />
            <Route path="/cases/:id" element={<CaseDetail />} />
            <Route path="/audit/:id" element={<AuditViewer />} />
            <Route path="/policies" element={<PolicyPanel />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
