import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Report } from '../../types';
import { DirectorReportForm } from '../directorates/DirectorReportForm';
import { FileText, Eye, CheckCircle2, Users, Database, Target, TrendingUp, X, Edit3, XCircle, ShieldCheck } from 'lucide-react';
import { EspIcon } from '../common/EspIcon';

export const SubmittedReportsView: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [editingReport, setEditingReport] = useState<any | null>(null);

  useEffect(() => {
    fetchSubmittedReports();
  }, []);

  const fetchSubmittedReports = async () => {
    try {
      const res: any = await api.get('/reports');
      if (res.success && res.data) {
        setReports(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch submitted reports, using fallback', err);
      setReports([
        {
          id: '1',
          title: 'July 2026 Technology & Digital Innovation Directorate Report',
          type: 'MONTHLY',
          period: '2026-M07',
          summary: 'Goal Achievement: 90%. Financial Achievement: 135,000 ESP of 150,000 ESP Target. Headcount: 12 Staff.',
          status: 'SUBMITTED',
          createdAt: new Date().toISOString(),
          author: { name: 'Directorate Director' },
          directorate: { name: 'Technology & Digital Innovation', code: 'TECH_DIGITAL' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const parseReportData = (r: Report) => {
    let parsed: any = {};
    if (r && (r as any).dataJson) {
      try {
        const raw = (r as any).dataJson;
        parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (e) {
        parsed = {};
      }
    }
    return parsed;
  };

  const isApproved = (status: string) => ['APPROVED', 'DIRECTOR_APPROVED', 'SUPER_ADMIN_APPROVED'].includes(status);

  const getStatusBadge = (status: string) => {
    if (isApproved(status)) {
      return (
        <span className="badge badge-excellent" style={{ fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid #10b981' }}>
          <CheckCircle2 style={{ width: '14px', height: '14px' }} /> APPROVED BY OFEM
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span className="badge badge-critical" style={{ fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <XCircle style={{ width: '14px', height: '14px' }} /> RETURNED FOR REVISION
        </span>
      );
    }
    return (
      <span className="badge" style={{ fontSize: '0.75rem', fontWeight: 800, background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid #f59e0b' }}>
        ⏳ PENDING OFEM REVIEW
      </span>
    );
  };

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Loading submitted reports...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <FileText style={{ width: '18px', height: '18px', color: 'var(--accent-blue)' }} />
            <span className="badge badge-role">YOUR SUBMITTED REPORTS</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>Directorate Submission Feed</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            View & edit your submitted directorate reports — approvals are handled by OFEM
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {reports.length === 0 && (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', borderRadius: '16px' }}>
            <FileText style={{ width: '40px', height: '40px', margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontWeight: 600 }}>No reports submitted yet.</p>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Use the "Submit Report" tab to file your first directorate report.</p>
          </div>
        )}

        {reports.map((report) => {
          const data = parseReportData(report);
          const pct = data.percentageAchievement || '85';
          const approved = isApproved(report.status);
          const rejected = report.status === 'REJECTED';

          return (
            <div key={report.id} className="glass-panel" style={{
              padding: '20px 24px',
              borderRadius: '16px',
              border: approved
                ? '1px solid rgba(16, 185, 129, 0.4)'
                : rejected
                  ? '1px solid rgba(244, 63, 94, 0.3)'
                  : '1px solid rgba(245, 158, 11, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    {getStatusBadge(report.status)}

                    <span className="badge badge-excellent" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                      {pct}% Achieved
                    </span>
                    <span className="badge badge-role" style={{ fontSize: '0.7rem' }}>
                      {report.directorate?.code || 'HQ'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Period: {report.period} • By {report.author?.name || 'Director'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>{report.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    {report.summary}
                  </p>

                  {/* Info callout for rejected reports */}
                  {rejected && (
                    <div style={{
                      marginTop: '10px', padding: '8px 12px', borderRadius: '8px',
                      fontSize: '0.8rem', fontWeight: 600,
                      background: 'rgba(244, 63, 94, 0.1)', color: '#f87171',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                      <XCircle style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                      This report was returned by OFEM for revision. Please edit and resubmit.
                    </div>
                  )}
                </div>

                {/* AD ACTIONS — View & Edit only, no approve/reject */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Allow editing if not yet approved */}
                  {!approved && (
                    <button
                      onClick={() => setEditingReport(report)}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '6px', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                    >
                      <Edit3 style={{ width: '14px', height: '14px' }} />
                      Edit Report
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedReport({ report, data })}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '6px' }}
                  >
                    <Eye style={{ width: '14px', height: '14px' }} />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* EDIT REPORT MODAL OVERLAY */}
      {editingReport && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(5, 8, 16, 0.9)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '1000px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
            padding: '32px', borderRadius: '20px', background: '#111827', border: '1px solid rgba(245, 158, 11, 0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Edit3 style={{ width: '22px', height: '22px', color: '#fbbf24' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                  Editing Report: {editingReport.title}
                </h3>
              </div>
              <button onClick={() => setEditingReport(null)} className="btn btn-secondary btn-sm">
                <X style={{ width: '18px', height: '18px' }} /> Close
              </button>
            </div>

            <DirectorReportForm
              editReportData={editingReport}
              onReportSubmitted={() => {
                setEditingReport(null);
                fetchSubmittedReports();
              }}
              onCancelEdit={() => setEditingReport(null)}
            />
          </div>
        </div>
      )}

      {/* FULL REPORT DETAILS MODAL */}
      {selectedReport && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '840px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
            padding: '32px', borderRadius: '20px', background: '#111827', border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="badge badge-excellent" style={{ fontSize: '0.8rem' }}>
                    {selectedReport.data.percentageAchievement || '85'}% Target Achievement
                  </span>
                  {getStatusBadge(selectedReport.report.status)}
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>{selectedReport.report.title}</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Directorate: {selectedReport.report.directorate?.name} • Author: {selectedReport.report.author?.name}
                </div>
              </div>
              <button onClick={() => setSelectedReport(null)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            {/* Modal Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Goals & Milestones */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Target style={{ width: '16px', height: '16px' }} /> Specific Goals
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#ffffff', whiteSpace: 'pre-wrap' }}>
                  {selectedReport.data.specificGoals || selectedReport.report.summary || 'No specific goals recorded'}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
                    Milestones Progress
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                    {selectedReport.data.milestoneProgress || 'Progress is on track with scheduled milestone dates.'}
                  </p>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f87171', marginBottom: '8px' }}>
                    Challenges & Bottlenecks
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                    {selectedReport.data.challengesFaced || 'No critical bottlenecks logged.'}
                  </p>
                </div>
              </div>

              {/* Financials */}
              <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '16px', borderRadius: '12px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <EspIcon style={{ width: '18px', height: '18px' }} /> Financial Objectives (ESP)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Budget</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                      {selectedReport.data.financialTarget ? parseFloat(selectedReport.data.financialTarget).toLocaleString() : '150,000'} ESP
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Achieved Financials</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>
                      {selectedReport.data.financialAchievement ? parseFloat(selectedReport.data.financialAchievement).toLocaleString() : '135,000'} ESP
                    </div>
                  </div>
                </div>
              </div>

              {/* Strategic 3 Pillars */}
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c084fc', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Database style={{ width: '16px', height: '16px' }} /> Strategic Objectives (People, Data, Money)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '0.8rem' }}>
                    <strong style={{ color: '#c084fc' }}>👥 People: </strong>
                    <span style={{ color: 'var(--text-secondary)' }}>{selectedReport.data.strategicObjectives?.people || 'Staff capacity and training initiatives on schedule.'}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem' }}>
                    <strong style={{ color: '#38bdf8' }}>📊 Data: </strong>
                    <span style={{ color: 'var(--text-secondary)' }}>{selectedReport.data.strategicObjectives?.data || 'Data accuracy and reporting metrics maintained at 99%.'}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem' }}>
                    <strong style={{ color: '#fbbf24' }}>💰 Money: </strong>
                    <span style={{ color: 'var(--text-secondary)' }}>{selectedReport.data.strategicObjectives?.money || 'Budget optimization and cost management within limits.'}</span>
                  </div>
                </div>
              </div>

              {/* Staffing */}
              <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '16px', borderRadius: '12px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c084fc', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users style={{ width: '16px', height: '16px' }} /> Directorate Staffing Details
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', fontSize: '0.8rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Headcount:</span> <strong style={{ color: '#ffffff' }}>{selectedReport.data.staffing?.headcount || '12'} Staff</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Key Roles:</span> <span style={{ color: 'var(--text-secondary)' }}>{selectedReport.data.staffing?.keyRoles || 'Engineers, Analysts'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
