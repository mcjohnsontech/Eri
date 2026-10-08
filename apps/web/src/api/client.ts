const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const apiUrl = (path: string) => `${API_BASE}${path}`;

export const EriClient = {
  async getCases() {
    const res = await fetch(apiUrl('/v1/cases'));
    if (!res.ok) throw new Error('Failed to fetch cases');
    return res.json();
  },
  async getCase(id: string) {
    const res = await fetch(apiUrl(`/v1/cases/${id}`));
    if (!res.ok) throw new Error('Failed to fetch case');
    return res.json();
  },
  async getCaseEvidence(id: string) {
    const res = await fetch(apiUrl(`/v1/cases/${id}/evidence`));
    if (!res.ok) throw new Error('Failed to fetch evidence');
    return res.json();
  },
  async getCaseAudit(id: string) {
    const res = await fetch(apiUrl(`/v1/cases/${id}/audit`));
    if (!res.ok) throw new Error('Failed to fetch audit');
    return res.json();
  },
  async getCaseClocks(id: string) {
    const res = await fetch(apiUrl(`/v1/cases/${id}/clocks`));
    if (!res.ok) throw new Error('Failed to fetch clocks');
    return res.json();
  },
  async getReviewQueue() {
    const res = await fetch(apiUrl('/v1/review-queue'));
    if (!res.ok) throw new Error('Failed to fetch review queue');
    return res.json();
  },
  async submitReview(id: string, decision: string, reason: string) {
    const res = await fetch(apiUrl(`/v1/cases/${id}/review`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, reason })
    });
    if (!res.ok) throw new Error('Failed to submit review');
    return res.json();
  },
  async getMetrics() {
    const res = await fetch(apiUrl('/v1/metrics/summary'));
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return res.json();
  },
  async triggerBatch(refs: string[]) {
    const res = await fetch(apiUrl('/v1/batches'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refs })
    });
    if (!res.ok) throw new Error('Failed to trigger batch');
    return res.json();
  },
  async getActivePolicies() {
    const res = await fetch(apiUrl('/v1/policies/active'));
    if (!res.ok) throw new Error('Failed to fetch policies');
    return res.json();
  }
};
