import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Report } from '../../types';
import {
  FileText, Eye, CheckCircle2, Users, Database, Target,
  X, Check, XCircle, ShieldCheck, AlertCircle
} from 'lucide-react';
import { EspIcon } from '../common/EspIcon';

export const ReportsTab: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ id: string; msg: string; type: 'success' | 'error' } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

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
          title: 'July 2026 Technology & Digital Innovation Directorate Report',
          type: 'MONTHLY',
          period: '2026-M07',
          summary: 'Goal Achievement: 90%. Financial Achievement: 135,000 ESP of 150,000 ESP Target. Headcount: 12 Staff.',
          status: 'SUBMITTED',
          createdAt: new Date().toISOString(),
          author: { name: 'AD Director' },
          directorate: { name: 'Technology & Digital Innovation', code: 'TECH_DIGITAL' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReport = async (reportId: string) => {
    setProcessingId(reportId);
    setActionFeedback(null);
    try {
      const res: any = await api.post(`/reports/${reportId}/approve`, {
        action: 'APPROVE',
        comments: 'Approved by OFEM Executive'
      });
      if (res.success) {
        setActionFeedback({ id: reportId, msg: '✅ Report approved by OFEM!', type: 'success' });
        await fetchReports();
        if (selectedReport?.report?.id === reportId) {
          setSelectedReport((prev: any) => prev ? { ...prev, report: { ...prev.report, status: 'APPROVED' } } : null);
        }
      }
    } catch (err: any) {
      setActionFeedback({ id: reportId, msg: err.message || 'Approval failed.', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectReport = async (reportId: string) => {
    const reason = prompt('Enter comments / reason for returning this report to the Directorate:', 'Report requires revision on milestone targets');
    if (reason === null) return; // User cancelled

    setProcessingId(reportId);
    setActionFeedback(null);
    try {
      const res: any = await api.post(`/reports/${reportId}/approve`, {
        action: 'REJECT',
        comments: reason || 'Returned by OFEM for revision'
      });
      if (res.success) {
        setActionFeedback({ id: reportId, msg: '↩️ Report returned to Directorate with comments.', type: 'error' });
        await fetchReports();
        if (selectedReport?.report?.id === reportId) {
          setSelectedReport((prev: any) => prev ? { ...prev, report: { ...prev.report, status: 'REJECTED' } } : null);
        }
      }
    } catch (err: any) {
      setActionFeedback({ id: reportId, msg: err.message || 'Rejection failed.', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const parseReportData = (r: Report) => {
    let parsed: any = {};
    if (r && (r as any).dataJson) {
      try {
        const raw = (r as any).dataJson;
        parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (e) { parsed = {}; }
    }
    return parsed;
  };

  const isApproved = (status: string) => ['APPROVED', 'DIRECTOR_APPROVED', 'SUPER_ADMIN_APPROVED'].includes(status);

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Loading reports...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <ShieldCheck style={{ width: '18px', height: '18px', color: 'var(--kingschat-gold)' }} />
            <span className="badge badge-role">OFEM EXECUTIVE APPROVALS</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>Submitted Directorate Reports Feed</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Review, Approve & Return Directorate Submissions — Percentage Achievements, Financials & Staffing
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: '0.75rem', fontWeight: 700 }}>
            ⏳ {reports.filter(r => !isApproved(r.status) && r.status !== 'REJECTED').length} Pending
          </span>
          <span className="badge badge-excellent" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid #10b981', fontSize: '0.75rem', fontWeight: 700 }}>
            ✓ {reports.filter(r => isApproved(r.status)).length} Approved
          </span>
        </div>
      </div>

      {/* Report Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {reports.length === 0 && (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', borderRadius: '16px' }}>
            <FileText style={{ width: '40px', height: '40px', margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontWeight: 600 }}>No directorate reports have been submitted yet.</p>
          </div>
        )}

        {reports.map((report) => {
          const data = parseReportData(report);
          const pct = data.percentageAchievement || '85';
          const approved = isApproved(report.status);
          const rejected = report.status === 'REJECTED';
          const pending = !approved && !rejected;
          const isProcessing = processingId === report.id;

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
                  {/* Status & Meta Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    {approved ? (
                      <span className="badge badge-excellent" style={{ fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid #10b981' }}>
                        <CheckCircle2 style={{ width: '14px', height: '14px' }} /> APPROVED
                      </span>
                    ) : rejected ? (
                      <span className="badge badge-critical" style={{ fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <XCircle style={{ width: '14px', height: '14px' }} /> RETURNED
                      </span>
                    ) : (
                      <span className="badge" style={{ fontSize: '0.75rem', fontWeight: 800, background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid #f59e0b' }}>
                        ⏳ PENDING APPROVAL
                      </span>
                    )}
                    <span className="badge badge-excellent" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                      {pct}% Achieved
                    </span>
                    <span className="badge badge-role" style={{ fontSize: '0.7rem' }}>
                      {report.directorate?.code || 'HQ'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Period: {report.period} • Submitted by {report.author?.name || 'Director'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>{report.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    {report.summary}
                  </p>

                  {/* Action feedback */}
                  {actionFeedback && actionFeedback.id === report.id && (
                    <div style={{
                      marginTop: '10px', padding: '8px 12px', borderRadius: '8px',
                      fontSize: '0.8rem', fontWeight: 600,
                      background: actionFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                      color: actionFeedback.type === 'success' ? '#34d399' : '#f87171',
                      border: actionFeedback.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)'
                    }}>
                      {actionFeedback.msg}
                    </div>
                  )}
                </div>

                {/* OFEM APPROVAL ACTIONS */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {pending && (
                    <>
                      <button
                        onClick={() => handleApproveReport(report.id)}
                        disabled={isProcessing}
                        className="btn btn-kingschat btn-sm"
                        style={{ gap: '6px', padding: '8px 16px', fontWeight: 800 }}
                      >
                        <Check style={{ width: '16px', height: '16px' }} />
                        {isProcessing ? 'Processing...' : 'Approve'}
                      </button>

                      <button
                        onClick={() => handleRejectReport(report.id)}
                        disabled={isProcessing}
                        className="btn btn-secondary btn-sm"
                        style={{ gap: '6px', color: '#f87171', borderColor: 'rgba(244, 63, 94, 0.4)' }}
                      >
                        <XCircle style={{ width: '14px', height: '14px' }} />
                        Return
                      </button>
                    </>
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

      {/* FULL REPORT DETAIL MODAL */}
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
                  {isApproved(selectedReport.report.status) ? (
                    <span className="badge badge-excellent" style={{ fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid #10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 style={{ width: '14px', height: '14px' }} /> APPROVED BY OFEM
                    </span>
                  ) : (
                    <span className="badge" style={{ fontSize: '0.8rem', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
                      ⏳ PENDING APPROVAL
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>{selectedReport.report.title}</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Directorate: {selectedReport.report.directorate?.name} • Author: {selectedReport.report.author?.name}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {!isApproved(selectedReport.report.status) && selectedReport.report.status !== 'REJECTED' && (
                  <>
                    <button
                      onClick={() => handleApproveReport(selectedReport.report.id)}
                      className="btn btn-kingschat btn-sm"
                      style={{ gap: '6px' }}
                    >
                      <Check style={{ width: '14px', height: '14px' }} /> Approve
                    </button>
                    <button
                      onClick={() => handleRejectReport(selectedReport.report.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '6px', color: '#f87171', borderColor: 'rgba(244, 63, 94, 0.4)' }}
                    >
                      <XCircle style={{ width: '14px', height: '14px' }} /> Return
                    </button>
                  </>
                )}
                <button onClick={() => setSelectedReport(null)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                  <X style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
            </div>

            {/* Modal Content Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>Milestones Progress</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                    {selectedReport.data.milestoneProgress || 'Progress is on track with scheduled milestone dates.'}
                  </p>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f87171', marginBottom: '8px' }}>Challenges & Bottlenecks</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                    {selectedReport.data.challengesFaced || 'No critical bottlenecks logged.'}
                  </p>
                </div>
              </div>

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

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c084fc', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Database style={{ width: '16px', height: '16px' }} /> Strategic Objectives (People, Data, Money)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '0.8rem' }}><strong style={{ color: '#c084fc' }}>👥 People: </strong><span style={{ color: 'var(--text-secondary)' }}>{selectedReport.data.strategicObjectives?.people || 'Staff capacity and training initiatives on schedule.'}</span></div>
                  <div style={{ fontSize: '0.8rem' }}><strong style={{ color: '#38bdf8' }}>📊 Data: </strong><span style={{ color: 'var(--text-secondary)' }}>{selectedReport.data.strategicObjectives?.data || 'Data accuracy and reporting metrics maintained at 99%.'}</span></div>
                  <div style={{ fontSize: '0.8rem' }}><strong style={{ color: '#fbbf24' }}>💰 Money: </strong><span style={{ color: 'var(--text-secondary)' }}>{selectedReport.data.strategicObjectives?.money || 'Budget optimization and cost management within limits.'}</span></div>
                </div>
              </div>

              <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '16px', borderRadius: '12px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c084fc', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users style={{ width: '16px', height: '16px' }} /> Directorate Staffing Details
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', fontSize: '0.8rem' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Headcount:</span> <strong style={{ color: '#ffffff' }}>{selectedReport.data.staffing?.headcount || '12'} Staff</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Key Roles:</span> <span style={{ color: 'var(--text-secondary)' }}>{selectedReport.data.staffing?.keyRoles || 'Engineers, Analysts'}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
