import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Report } from '../../types';
import { FileText, Plus, CheckCircle, Clock, Send, ShieldAlert } from 'lucide-react';

export const ReportsTab: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [title, setTitle] = useState('');
  const [period, setPeriod] = useState('2026-M07');
  const [type, setType] = useState('MONTHLY');
  const [summary, setSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res: any = await api.get('/reports');
      if (res.success && res.data) {
        setReports(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch reports, using fallback', err);
      setReports([
        {
          id: '1',
          title: 'Q2 2026 Technology & Innovation Performance Report',
          type: 'QUARTERLY',
          period: '2026-Q2',
          summary: 'Software systems uptime achieved 99.8%. Milestone 1 completed on time.',
          status: 'DIRECTOR_APPROVED',
          createdAt: new Date().toISOString(),
          author: { name: 'Super Admin User' },
          directorate: { name: 'Technology & Innovation', code: 'TECH' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/reports', { title, type, period, summary });
      setShowCreateModal(false);
      setTitle('');
      setSummary('');
      await fetchReports();
    } catch (err: any) {
      alert(err.message || 'Failed to create report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveReport = async (reportId: string) => {
    try {
      await api.post(`/reports/${reportId}/approve`, { action: 'APPROVED', comments: 'Executive approval granted.' });
      await fetchReports();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Loading reports...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>Performance Reports & Approvals</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Executive Monthly & Quarterly Directorate Audits
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus style={{ width: '16px', height: '16px' }} />
          Create Report
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {reports.map((report) => (
          <div key={report.id} className="glass-panel" style={{ padding: '20px 24px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span className="badge badge-excellent">
                    {report.status.replace('_', ' ')}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Period: {report.period} • Type: {report.type}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>{report.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  {report.summary}
                </p>
              </div>

              {report.status !== 'DIRECTOR_APPROVED' && (
                <button onClick={() => handleApproveReport(report.id)} className="btn btn-secondary btn-sm">
                  <CheckCircle style={{ width: '14px', height: '14px', color: '#10b981' }} />
                  Approve Report
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
          <div className="glass-panel" style={{ width: '480px', padding: '28px', borderRadius: '16px', background: '#111827' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
              Submit Performance Report
            </h3>
            <form onSubmit={handleCreateReport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Report Title</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. July 2026 Tech Directorate Summary"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Period</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Report Type</label>
                  <select
                    className="input-field"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="QUARTERLY">QUARTERLY</option>
                    <option value="ANNUAL">ANNUAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Executive Summary</label>
                <textarea
                  rows={4}
                  required
                  className="input-field"
                  placeholder="Detailed breakdown of achievements, KPI results, and risks..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
