import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FileSpreadsheet, Eye, RefreshCw, CheckCircle2, XCircle, Edit3, MessageSquare, AlertTriangle, FileText, FileDown } from 'lucide-react';
import { DirectorReportForm } from '../directorates/DirectorReportForm';

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
            Track report statuses, view OFEM review feedback, and edit/resubmit returned reports
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
                          ⏳ PENDING REVIEW
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
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
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

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {isReturned && (
                      <button
                        onClick={() => setEditingRecord(rec)}
                        className="btn btn-kingschat btn-sm"
                        style={{ gap: '6px', fontWeight: 800 }}
                      >
                        <Edit3 style={{ width: '14px', height: '14px' }} />
                        Edit & Resubmit
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedRecord(rec)}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '6px' }}
                    >
                      <Eye style={{ width: '14px', height: '14px' }} /> Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
