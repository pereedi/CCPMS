import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Target, TrendingUp, Building2, Filter, RefreshCw } from 'lucide-react';

export const KPIsTab: React.FC = () => {
  const { user, currentRole } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [directorates, setDirectorates] = useState<any[]>([]);
  const [selectedDirectorateFilter, setSelectedDirectorateFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDirectorates();
    fetchRecords();
  }, []);

  const fetchDirectorates = async () => {
    try {
      const res: any = await api.get('/directorates');
      if (res.success && res.data) {
        setDirectorates(res.data);
      }
    } catch (_) {}
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/records');
      if (res.success && res.data) {
        setRecords(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch records for KPI tab', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter records by directorate selection if OFEM, or user directorate if AD
  const filteredRecords = records.filter(r => {
    if (currentRole === 'AD' && user?.directorate) {
      const dirName = typeof user.directorate === 'string' ? user.directorate : user.directorate.name;
      return r.directorateName === dirName || r.username === user.username;
    }
    if (selectedDirectorateFilter) {
      return r.directorateName === selectedDirectorateFilter || r.username === selectedDirectorateFilter;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & Filter Controls */}
      <div className="glass-panel glow-panel" style={{
        padding: '24px 28px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 58, 138, 0.4) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '12px',
            background: 'var(--kingschat-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)'
          }}>
            <Target style={{ width: '24px', height: '24px', color: '#ffffff' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Directorate KPI Target Tracker
              <span className="badge badge-role" style={{ fontSize: '0.72rem', textTransform: 'none' }}>
                Report Synchronization Active
              </span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {currentRole === 'OFEM'
                ? 'Executive Target Tracking & Directorate Performance Metrics'
                : `Target Tracking for ${typeof user?.directorate === 'string' ? user.directorate : user?.directorate?.name || 'Assigned Directorate'}`}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentRole === 'OFEM' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter style={{ width: '16px', height: '16px', color: '#60a5fa' }} />
              <select
                className="input-field"
                value={selectedDirectorateFilter}
                onChange={(e) => setSelectedDirectorateFilter(e.target.value)}
                style={{ fontSize: '0.85rem', minWidth: '220px' }}
              >
                <option value="">🏢 All 7 Directorates</option>
                {directorates.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          <button onClick={fetchRecords} className="btn btn-secondary btn-sm" title="Refresh Live KPI Targets">
            <RefreshCw style={{ width: '14px', height: '14px' }} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading KPI performance metrics...
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: '16px' }}>
          <Target style={{ width: '40px', height: '40px', color: 'var(--text-muted)', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>No Submitted Records Found</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Submit a performance report to populate live KPI targets and achievement scores for your Directorate.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {filteredRecords.map((rec) => {
            const pct = parseFloat(rec.percentageAchievement || '90') || 90;
            const targetFin = parseFloat(rec.financialTarget || '0') || 0;
            const actualFin = parseFloat(rec.financialAchievement || '0') || 0;

            return (
              <div key={rec.id} className="glass-panel glow-panel" style={{ padding: '24px', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span className="badge badge-excellent" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                        {pct >= 90 ? 'EXCELLENT' : pct >= 75 ? 'GOOD' : 'NEEDS ATTENTION'}
                      </span>
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                        🏢 {rec.directorateName || rec.username}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                      {rec.title || `${rec.period} Performance Goals`}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Period: {rec.period} • Submitted by @{rec.username}
                    </div>
                  </div>
                </div>

                {/* Target vs Actual Grid */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
                  margin: '16px 0', padding: '16px',
                  background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', border: '1px solid var(--border-color)'
                }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Target Financial Budget
                    </span>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff', marginTop: '2px' }}>
                      {targetFin ? `${targetFin.toLocaleString()} ESP` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Achieved Financials
                    </span>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#34d399', marginTop: '2px' }}>
                      {actualFin ? `${actualFin.toLocaleString()} ESP` : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Performance Score Progress Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Overall Goal Completion Score</span>
                    <span style={{ fontWeight: 800, color: '#34d399' }}>{pct}%</span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(pct, 100)}%`, height: '100%',
                      background: pct >= 90
                        ? 'linear-gradient(90deg, #10b981, #34d399)'
                        : pct >= 75
                        ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                        : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease'
                    }} />
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
