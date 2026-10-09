import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { ReviewQueue } from './pages/ReviewQueue';
import { CaseDetail } from './pages/CaseDetail';
import { AuditViewer } from './pages/AuditViewer';
import { PolicyPanel } from './pages/PolicyPanel';
import { AutomationFlow } from './pages/AutomationFlow';

export default function App() {
  const shell = (page: React.ReactNode) => (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto w-full max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12">{page}</main>
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={shell(<Dashboard />)} />
        <Route path="/review-queue" element={shell(<ReviewQueue />)} />
        <Route path="/cases/:id" element={shell(<CaseDetail />)} />
        <Route path="/audit/:id" element={shell(<AuditViewer />)} />
        <Route path="/policies" element={shell(<PolicyPanel />)} />
        <Route path="/automation-flow" element={shell(<AutomationFlow />)} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
