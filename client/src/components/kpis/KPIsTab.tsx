import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { KPI } from '../../types';
import { Target, TrendingUp, Edit2, Building2, Filter, RefreshCw } from 'lucide-react';

export const KPIsTab: React.FC = () => {
  const { user, currentRole } = useAuth();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [directorates, setDirectorates] = useState<any[]>([]);
  const [selectedDirectorateFilter, setSelectedDirectorateFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedKpi, setSelectedKpi] = useState<KPI | null>(null);
  const [actualValue, setActualValue] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchDirectorates();
  }, []);

  useEffect(() => {
    fetchKPIs();
  }, [selectedDirectorateFilter, user]);

  const fetchDirectorates = async () => {
    try {
      const res: any = await api.get('/directorates');
      if (res.success && res.data) {
        setDirectorates(res.data);
      }
    } catch (_) {}
  };

  const fetchKPIs = async () => {
    setLoading(true);
    try {
      let endpoint = '/kpis';
      const dirId = currentRole === 'AD' ? user?.directorate?.id : selectedDirectorateFilter;
      if (dirId) {
        endpoint += `?directorateId=${dirId}`;
      }

      const res: any = await api.get(endpoint);
      if (res.success && res.data) {
        setKpis(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch KPIs, using fallback', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKpi || !actualValue) return;

    setSubmitting(true);
    try {
      await api.post(`/kpis/${selectedKpi.id}/results`, {
        period: new Date().toISOString().slice(0, 7),
        actualValue: parseFloat(actualValue.replace(/,/g, '')),
        remarks: remarks || 'Updated performance result'
      });
      setSelectedKpi(null);
      setActualValue('');
      setRemarks('');
      await fetchKPIs();
    } catch (err: any) {
      alert(err.message || 'Failed to submit KPI result');
    } finally {
      setSubmitting(false);
    }
  };

  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'EXCELLENT': return 'badge-excellent';
      case 'GOOD': return 'badge-good';
      case 'NEEDS_ATTENTION': return 'badge-attention';
      case 'CRITICAL': return 'badge-critical';
      default: return 'badge-good';
    }
  };

  const formatValue = (val: number, unit: string) => {
    if (unit === 'ESP') {
      return `${val.toLocaleString()} ESP`;
    }
    if (unit === '%') {
      return `${val}%`;
    }
    return `${val.toLocaleString()} ${unit}`;
  };

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
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'var(--kingschat-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)'
          }}>
            <Target style={{ width: '24px', height: '24px', color: '#ffffff' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              KPI Target Tracker
              <span className="badge badge-role" style={{ fontSize: '0.72rem', textTransform: 'none' }}>
                Live Form Synchronization Active
              </span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {currentRole === 'OFEM'
                ? 'Executive Target Tracking & Directorate Performance Metrics'
                : `Target Tracking for ${user?.directorate?.name || 'Assigned Directorate'}`}
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
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          <button onClick={fetchKPIs} className="btn btn-secondary btn-sm" title="Refresh Live KPI Targets">
            <RefreshCw style={{ width: '14px', height: '14px' }} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading KPI performance metrics...
        </div>
      ) : kpis.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: '16px' }}>
          <Target style={{ width: '40px', height: '40px', color: 'var(--text-muted)', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>No KPI Targets Found</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Submit a performance report using the report form to automatically initialize and track live KPI metrics for your Directorate.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {kpis.map((kpi) => (
            <div key={kpi.id} className="glass-panel glow-panel" style={{ padding: '24px', borderRadius: '16px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span className={`badge ${getBadgeClass(kpi.status)}`}>
                      {kpi.status.replace(/_/g, ' ')}
                    </span>
                    {kpi.directorate?.name && (
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                        🏢 {kpi.directorate.name}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>{kpi.name}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Code: <code>{kpi.code}</code> • Category: {kpi.category?.name || 'Operational Excellence'}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedKpi(kpi);
                    setActualValue(kpi.currentValue.toString());
                  }}
                  className="btn btn-secondary btn-sm"
                  title="Update Actual Value"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <Edit2 style={{ width: '14px', height: '14px' }} />
                  Record
                </button>
              </div>

              {/* Target vs Actual Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                margin: '16px 0',
                padding: '16px',
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)'
              }}>
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Target Value
                  </span>
                  <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#ffffff', marginTop: '2px' }}>
                    {formatValue(kpi.targetValue, kpi.unit)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Current Actual
                  </span>
                  <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#60a5fa', marginTop: '2px' }}>
                    {formatValue(kpi.currentValue, kpi.unit)}
                  </div>
                </div>
              </div>

              {/* Performance Score Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Performance Achievement Score</span>
                  <span style={{ fontWeight: 800, color: '#34d399' }}>{kpi.performanceScore.toFixed(1)}%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(kpi.performanceScore, 100)}%`,
                    height: '100%',
                    background: kpi.performanceScore >= 90
                      ? 'linear-gradient(90deg, #10b981, #34d399)'
                      : kpi.performanceScore >= 75
                      ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                      : kpi.performanceScore >= 50
                      ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                      : 'linear-gradient(90deg, #f43f5e, #f87171)',
                    borderRadius: '4px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record actual KPI value Modal */}
      {selectedKpi && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(5, 8, 16, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '420px', padding: '28px', borderRadius: '16px', background: '#111827', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>
              Update KPI Value: {selectedKpi.name}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Target: <strong>{formatValue(selectedKpi.targetValue, selectedKpi.unit)}</strong>
            </p>

            <form onSubmit={handleUpdateResult} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Actual Measured Value ({selectedKpi.unit})
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input-field"
                  value={actualValue}
                  onChange={(e) => setActualValue(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Measurement Remarks / Context
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Verified via report submission"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setSelectedKpi(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Saving Result...' : 'Update KPI Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
