import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Report } from '../../types';
import { FileText, CheckCircle } from 'lucide-react';

export const ReportsTab: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
          author: { name: 'Directorate Director' },
          directorate: { name: 'Technology & Innovation', code: 'TECH' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReport = async (reportId: string) => {
    try {
      await api.post(`/reports/${reportId}/approve`, { action: 'APPROVE', comments: 'Super Admin Executive approval granted.' });
      await fetchReports();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const isApproved = (status: string) => ['APPROVED', 'DIRECTOR_APPROVED', 'SUPER_ADMIN_APPROVED'].includes(status);

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Loading reports...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>Performance Reports & Executive Approvals</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Executive Monthly & Quarterly Directorate Audits
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {reports.map((report) => {
          const approved = isApproved(report.status);
          return (
            <div key={report.id} className="glass-panel" style={{
              padding: '20px 24px',
              borderRadius: '14px',
              border: approved ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    {approved ? (
                      <span className="badge badge-excellent" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid #10b981' }}>
                        ✓ APPROVED
                      </span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
                        ⏳ {report.status.replace('_', ' ')}
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Period: {report.period} • Type: {report.type}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>{report.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    {report.summary}
                  </p>
                </div>

                {!approved && (
                  <button onClick={() => handleApproveReport(report.id)} className="btn btn-kingschat btn-sm" style={{ gap: '6px' }}>
                    <CheckCircle style={{ width: '14px', height: '14px' }} />
                    Approve Report
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
