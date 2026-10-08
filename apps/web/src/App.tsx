import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { ReviewQueue } from './pages/ReviewQueue';
import { CaseDetail } from './pages/CaseDetail';
import { AuditViewer } from './pages/AuditViewer';
import { PolicyPanel } from './pages/PolicyPanel';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="*"
          element={
            <div className="min-h-screen">
              <Navbar />
              <main className="mx-auto w-full max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/review-queue" element={<ReviewQueue />} />
                  <Route path="/cases/:id" element={<CaseDetail />} />
                  <Route path="/audit/:id" element={<AuditViewer />} />
                  <Route path="/policies" element={<PolicyPanel />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
