import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FileSpreadsheet, Eye, RefreshCw, CheckCircle2, XCircle, Edit3, MessageSquare, AlertTriangle, FileText, FileDown, X, Target, Users } from 'lucide-react';
import { DirectorReportForm } from '../directorates/DirectorReportForm';
import { EspIcon } from '../common/EspIcon';

export const SubmittedReportsView: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);

  useEffect(() => {
    fetchMyRecords();
  }, []);

  const fetchMyRecords = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/records');
      if (res.success && res.data) {
        setRecords(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch user records', err);
    } finally {
      setLoading(false);
    }
  };

  if (editingRecord) {
    return (
      <DirectorReportForm
        editReportData={editingRecord}
        onReportSubmitted={() => {
          setEditingRecord(null);
          fetchMyRecords();
        }}
        onCancelEdit={() => setEditingRecord(null)}
      />
    );
  }

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Loading your submitted reports...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>Your Directorate Reports History</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Track report statuses, view OFEM review feedback, update freshly submitted reports, and edit/resubmit returned reports
          </p>
        </div>
        <button onClick={fetchMyRecords} className="btn btn-secondary btn-sm" title="Refresh">
          <RefreshCw style={{ width: '14px', height: '14px' }} /> Refresh
        </button>
      </div>

      {records.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: '16px' }}>
          <FileSpreadsheet style={{ width: '40px', height: '40px', color: 'var(--text-muted)', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>No Reports Submitted Yet</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Use the "Submit Directorate Report" tab to file your performance summary to OFEM.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {records.map((rec) => {
            const isApproved = rec.status === 'APPROVED';
            const isReturned = rec.status === 'RETURNED';
            const isPending  = !isApproved && !isReturned;

            return (
              <div key={rec.id} className="glass-panel" style={{
                padding: '24px', borderRadius: '16px',
                border: isApproved
                  ? '1px solid rgba(16, 185, 129, 0.4)'
                  : isReturned
                    ? '1px solid rgba(244, 63, 94, 0.5)'
                    : '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      {isApproved ? (
                        <span className="badge badge-excellent" style={{ fontSize: '0.75rem', fontWeight: 800, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid #10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 style={{ width: '14px', height: '14px' }} /> APPROVED BY OFEM
                        </span>
                      ) : isReturned ? (
                        <span className="badge badge-critical" style={{ fontSize: '0.75rem', fontWeight: 800, background: 'rgba(244, 63, 94, 0.2)', color: '#f87171', border: '1px solid #f43f5e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <XCircle style={{ width: '14px', height: '14px' }} /> RETURNED FOR REVISION
                        </span>
                      ) : (
                        <span className="badge" style={{ fontSize: '0.75rem', fontWeight: 800, background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid #f59e0b' }}>
                          ⏳ PENDING OFEM REVIEW
                        </span>
                      )}
                      <span className="badge badge-role" style={{ fontSize: '0.7rem' }}>{rec.directorateName || rec.username}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Submitted: {new Date(rec.submittedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
                      {rec.title || `${rec.period} Performance Report`}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px', whiteSpace: 'pre-wrap' }}>
                      {rec.summary}
                    </p>

                    {/* OFEM EXECUTIVE RETURNED FEEDBACK BOX */}
                    {isReturned && Array.isArray(rec.comments) && rec.comments.length > 0 && (
                      <div style={{
                        marginTop: '14px', padding: '14px', borderRadius: '12px',
                        background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)'
                      }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <MessageSquare style={{ width: '16px', height: '16px' }} /> OFEM Feedback Comments:
                        </div>
                        {rec.comments.map((c: any, idx: number) => (
                          <div key={idx} style={{ fontSize: '0.8rem', color: '#ffffff', marginTop: '4px' }}>
                            "{c.message}" <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>- @{c.by} ({new Date(c.createdAt).toLocaleString()})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ACTION BUTTONS BASED ON REPORT LIFECYCLE */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* View Details for all states */}
                    <button
                      onClick={() => setSelectedRecord(rec)}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '6px' }}
                    >
                      <Eye style={{ width: '14px', height: '14px' }} /> View Details
                    </button>

                    {/* Update Report for Freshly Uploaded / Pending */}
                    {isPending && (
                      <button
                        onClick={() => setEditingRecord(rec)}
                        className="btn btn-secondary btn-sm"
                        style={{ gap: '6px', borderColor: 'rgba(59, 130, 246, 0.5)', color: '#60a5fa' }}
                        title="Update report contents before OFEM review"
                      >
                        <Edit3 style={{ width: '14px', height: '14px' }} />
                        Update Report
                      </button>
                    )}

                    {/* Edit & Resubmit for Returned Reports */}
                    {isReturned && (
                      <button
                        onClick={() => setEditingRecord(rec)}
                        className="btn btn-kingschat btn-sm"
                        style={{ gap: '6px', fontWeight: 800 }}
                        title="Edit and resubmit report to OFEM"
                      >
                        <Edit3 style={{ width: '14px', height: '14px' }} />
                        Edit & Resubmit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL REPORT DETAIL MODAL */}
      {selectedRecord && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '840px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
            padding: '32px', borderRadius: '20px', background: '#111827', border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="badge badge-excellent" style={{ fontSize: '0.8rem' }}>
                    {selectedRecord.percentageAchievement || '90'}% Target Achievement
                  </span>
                  {selectedRecord.status === 'APPROVED' ? (
                    <span className="badge badge-excellent" style={{ fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid #10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 style={{ width: '14px', height: '14px' }} /> APPROVED BY OFEM
                    </span>
                  ) : selectedRecord.status === 'RETURNED' ? (
                    <span className="badge badge-critical" style={{ fontSize: '0.8rem', background: 'rgba(244, 63, 94, 0.2)', color: '#f87171', border: '1px solid #f43f5e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <XCircle style={{ width: '14px', height: '14px' }} /> RETURNED FOR REVISION
                    </span>
                  ) : (
                    <span className="badge" style={{ fontSize: '0.8rem', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
                      ⏳ PENDING OFEM REVIEW
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>
                  {selectedRecord.title || `${selectedRecord.period} Performance Report`}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Directorate: {selectedRecord.directorateName || selectedRecord.username} • Submitted: {new Date(selectedRecord.submittedAt).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {selectedRecord.status !== 'APPROVED' && (
                  <button
                    onClick={() => {
                      const recToEdit = selectedRecord;
                      setSelectedRecord(null);
                      setEditingRecord(recToEdit);
                    }}
                    className="btn btn-kingschat btn-sm"
                    style={{ gap: '6px' }}
                  >
                    <Edit3 style={{ width: '14px', height: '14px' }} />
                    {selectedRecord.status === 'RETURNED' ? 'Edit & Resubmit' : 'Update Report'}
                  </button>
                )}
                <button onClick={() => setSelectedRecord(null)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                  <X style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Target style={{ width: '16px', height: '16px' }} /> Specific Goals & Achievements
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#ffffff', whiteSpace: 'pre-wrap' }}>
                  {selectedRecord.specificGoals || selectedRecord.summary || 'No specific goals recorded'}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>Milestones Progress</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                    {selectedRecord.milestoneProgress || 'Progress is on track with scheduled milestone dates.'}
                  </p>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f87171', marginBottom: '8px' }}>Challenges & Bottlenecks</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                    {selectedRecord.challengesFaced || 'No critical bottlenecks logged.'}
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
                      {selectedRecord.financialTarget ? parseFloat(selectedRecord.financialTarget).toLocaleString() : '0'} ESP
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Achieved Financials</span>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>
                      {selectedRecord.financialAchievement ? parseFloat(selectedRecord.financialAchievement).toLocaleString() : '0'} ESP
                    </div>
                  </div>
                </div>
              </div>

              {/* Staffing & Key Roles */}
              <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '16px', borderRadius: '12px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c084fc', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users style={{ width: '16px', height: '16px' }} /> Directorate Staffing & Key Roles
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Headcount:</span> <strong style={{ color: '#ffffff' }}>{selectedRecord.staffing?.headcount || '12'} Staff</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Key Roles:</span> <span style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{selectedRecord.staffing?.keyRoles || 'N/A'}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
