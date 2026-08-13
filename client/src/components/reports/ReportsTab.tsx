import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  FileText, Eye, CheckCircle2, Users, Database, Target,
  X, Check, XCircle, ShieldCheck, AlertCircle, MessageSquare, FileDown
} from 'lucide-react';
import { EspIcon } from '../common/EspIcon';

export const ReportsTab: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  
  // Executive action modal state
  const [returningRecord, setReturningRecord] = useState<any | null>(null);
  const [returnComment, setReturnComment] = useState<string>('');

  const [actionFeedback, setActionFeedback] = useState<{ id: string; msg: string; type: 'success' | 'error' } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res: any = await api.get('/records');
      if (res.success && res.data) {
        setRecords(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch records', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReport = async (recordId: string) => {
    setProcessingId(recordId);
    setActionFeedback(null);
    try {
      const res: any = await api.post('/reviews/process', {
        recordId,
        action: 'APPROVE',
        comment: 'Approved by OFEM Executive Command',
      });
      if (res.success) {
        setActionFeedback({ id: recordId, msg: '✅ Report approved by OFEM Command!', type: 'success' });
        await fetchRecords();
        if (selectedRecord?.id === recordId) {
          setSelectedRecord((prev: any) => prev ? { ...prev, status: 'APPROVED' } : null);
        }
      }
    } catch (err: any) {
      setActionFeedback({ id: recordId, msg: err.message || 'Approval failed.', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReturnReport = async () => {
    if (!returningRecord) return;
    if (!returnComment.trim()) {
      alert('Please enter executive comments explaining why the report is being returned.');
      return;
    }

    const recordId = returningRecord.id;
    setProcessingId(recordId);
    setActionFeedback(null);

    try {
      const res: any = await api.post('/reviews/process', {
        recordId,
        action: 'RETURN',
        comment: returnComment,
      });

      if (res.success) {
        setActionFeedback({ id: recordId, msg: '↩️ Report returned to AD with feedback & notification sent!', type: 'error' });
        setReturningRecord(null);
        setReturnComment('');
        await fetchRecords();
        if (selectedRecord?.id === recordId) {
          setSelectedRecord((prev: any) => prev ? { ...prev, status: 'RETURNED' } : null);
        }
      }
    } catch (err: any) {
      setActionFeedback({ id: recordId, msg: err.message || 'Return failed.', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const isApproved = (status: string) => status === 'APPROVED';
  const isReturned = (status: string) => status === 'RETURNED';

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Loading submitted reports...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <ShieldCheck style={{ width: '18px', height: '18px', color: 'var(--kingschat-gold)' }} />
            <span className="badge badge-role">OFEM EXECUTIVE COMMAND FEED</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>Submitted Directorate Reports Feed</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Review, Approve & Return Directorate Submissions — Managed in real-time records & audit trail
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: '0.75rem', fontWeight: 700 }}>
            ⏳ {records.filter(r => !isApproved(r.status) && !isReturned(r.status)).length} Pending
          </span>
          <span className="badge badge-excellent" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid #10b981', fontSize: '0.75rem', fontWeight: 700 }}>
            ✓ {records.filter(r => isApproved(r.status)).length} Approved
          </span>
        </div>
      </div>

      {/* Record Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {records.length === 0 && (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', borderRadius: '16px' }}>
            <FileText style={{ width: '40px', height: '40px', margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontWeight: 600 }}>No directorate reports have been submitted yet.</p>
          </div>
        )}

        {records.map((rec) => {
          const pct = rec.percentageAchievement || '90';
          const approved = isApproved(rec.status);
          const returned = isReturned(rec.status);
          const pending = !approved && !returned;
          const isProcessing = processingId === rec.id;

          return (
            <div key={rec.id} className="glass-panel" style={{
              padding: '20px 24px',
              borderRadius: '16px',
              border: approved
                ? '1px solid rgba(16, 185, 129, 0.4)'
                : returned
                  ? '1px solid rgba(244, 63, 94, 0.4)'
                  : '1px solid rgba(245, 158, 11, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                  {/* Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    {approved ? (
                      <span className="badge badge-excellent" style={{ fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid #10b981' }}>
                        <CheckCircle2 style={{ width: '14px', height: '14px' }} /> APPROVED
                      </span>
                    ) : returned ? (
                      <span className="badge badge-critical" style={{ fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(244, 63, 94, 0.2)', color: '#f87171', border: '1px solid #f43f5e' }}>
                        <XCircle style={{ width: '14px', height: '14px' }} /> RETURNED FOR REVISION
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
                      {rec.directorateName || rec.username}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Submitted: {new Date(rec.submittedAt).toLocaleDateString()} • By @{rec.username}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
                    {rec.title || `${rec.period} Directorate Performance Report`}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px', whiteSpace: 'pre-wrap' }}>
                    {rec.summary}
                  </p>

                  {/* Feedback Message if action taken */}
                  {actionFeedback && actionFeedback.id === rec.id && (
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
                        onClick={() => handleApproveReport(rec.id)}
                        disabled={isProcessing}
                        className="btn btn-kingschat btn-sm"
                        style={{ gap: '6px', padding: '8px 16px', fontWeight: 800 }}
                      >
                        <Check style={{ width: '16px', height: '16px' }} />
                        {isProcessing ? 'Processing...' : 'Approve'}
                      </button>

                      <button
                        onClick={() => setReturningRecord(rec)}
                        disabled={isProcessing}
                        className="btn btn-secondary btn-sm"
                        style={{ gap: '6px', color: '#f87171', borderColor: 'rgba(244, 63, 94, 0.4)' }}
                      >
                        <XCircle style={{ width: '14px', height: '14px' }} />
                        Return & Comment
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setSelectedRecord(rec)}
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

      {/* RETURN WITH COMMENTS MODAL OVERLAY */}
      {returningRecord && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '560px', width: '100%', padding: '28px', borderRadius: '20px', background: '#111827', border: '1px solid rgba(244, 63, 94, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MessageSquare style={{ width: '22px', height: '22px', color: '#f87171' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                  Return Report to @{returningRecord.username}
                </h3>
              </div>
              <button onClick={() => setReturningRecord(null)} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Enter executive feedback/corrections required. An instant notification will be sent directly to the AD's notification bell.
            </p>

            <textarea
              rows={4}
              required
              className="input-field"
              placeholder="e.g. Please clarify uptime figures for week 3 and re-upload the attached financial breakdown..."
              value={returnComment}
              onChange={(e) => setReturnComment(e.target.value)}
              style={{ width: '100%', resize: 'vertical', marginBottom: '20px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setReturningRecord(null)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button
                onClick={handleConfirmReturnReport}
                disabled={processingId === returningRecord.id}
                className="btn btn-secondary btn-sm"
                style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#f87171', border: '1px solid #f43f5e', fontWeight: 800 }}
              >
                {processingId === returningRecord.id ? 'Sending...' : 'Confirm & Send to AD'}
              </button>
            </div>
          </div>
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
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="badge badge-excellent" style={{ fontSize: '0.8rem' }}>
                    {selectedRecord.percentageAchievement || '90'}% Target Achievement
                  </span>
                  {isApproved(selectedRecord.status) ? (
                    <span className="badge badge-excellent" style={{ fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid #10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 style={{ width: '14px', height: '14px' }} /> APPROVED BY OFEM
                    </span>
                  ) : (
                    <span className="badge" style={{ fontSize: '0.8rem', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
                      ⏳ PENDING OFEM APPROVAL
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>
                  {selectedRecord.title || `${selectedRecord.period} Performance Report`}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Directorate: {selectedRecord.directorateName || selectedRecord.username} • Submitted by @{selectedRecord.username}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {!isApproved(selectedRecord.status) && !isReturned(selectedRecord.status) && (
                  <>
                    <button
                      onClick={() => handleApproveReport(selectedRecord.id)}
                      className="btn btn-kingschat btn-sm"
                      style={{ gap: '6px' }}
                    >
                      <Check style={{ width: '14px', height: '14px' }} /> Approve
                    </button>
                    <button
                      onClick={() => setReturningRecord(selectedRecord)}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '6px', color: '#f87171', borderColor: 'rgba(244, 63, 94, 0.4)' }}
                    >
                      <XCircle style={{ width: '14px', height: '14px' }} /> Return
                    </button>
                  </>
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

              {/* R2 Document Download link if present */}
              {selectedRecord.file_url && (
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText style={{ width: '20px', height: '20px', color: '#34d399' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>Attached Official Report Document</span>
                  </div>
                  <a href={selectedRecord.file_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399' }}>
                    <FileDown style={{ width: '14px', height: '14px' }} /> View / Download Document
                  </a>
                </div>
              )}

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
