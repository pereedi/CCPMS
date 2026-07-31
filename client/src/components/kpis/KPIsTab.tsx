import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { KPI } from '../../types';
import { Target, TrendingUp, Plus, Edit2, CheckCircle2 } from 'lucide-react';

export const KPIsTab: React.FC = () => {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedKpi, setSelectedKpi] = useState<KPI | null>(null);
  const [actualValue, setActualValue] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      const res: any = await api.get('/kpis');
      if (res.success && res.data) {
        setKpis(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch KPIs, using seed fallback', err);
      setKpis([
        {
          id: '1',
          name: 'System Uptime & Availability',
          code: 'KPI_UPTIME',
          unit: '%',
          weight: 25.0,
          targetValue: 99.0,
          currentValue: 99.8,
          performanceScore: 100.0,
          status: 'EXCELLENT',
          category: { name: 'Operational Excellence' },
          directorate: { name: 'Technology & Innovation', code: 'TECH' }
        }
      ]);
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
        period: '2026-M07',
        actualValue: parseFloat(actualValue),
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

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Loading KPIs...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>KPI Target Tracker</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Key Performance Indicators & Measured Actuals
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {kpis.map((kpi) => (
          <div key={kpi.id} className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <span className={`badge ${getBadgeClass(kpi.status)}`} style={{ marginBottom: '8px' }}>
                  {kpi.status.replace('_', ' ')}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>{kpi.name}</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Code: {kpi.code} • Category: {kpi.category?.name || 'General'}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedKpi(kpi);
                  setActualValue(kpi.currentValue.toString());
                }}
                className="btn btn-secondary btn-sm"
                title="Update Actual Value"
              >
                <Edit2 style={{ width: '14px', height: '14px' }} />
                Record
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              margin: '16px 0',
              padding: '12px',
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: '10px'
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TARGET</span>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ffffff' }}>
                  {kpi.targetValue} {kpi.unit}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CURRENT ACTUAL</span>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#60a5fa' }}>
                  {kpi.currentValue} {kpi.unit}
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Performance Score</span>
                <span style={{ fontWeight: 700, color: '#34d399' }}>{kpi.performanceScore.toFixed(1)}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(kpi.performanceScore, 100)}%`,
                  height: '100%',
                  background: 'var(--accent-emerald)'
                }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Record actual KPI value Modal */}
      {selectedKpi && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999
        }}>
          <div className="glass-panel" style={{ width: '400px', padding: '24px', borderRadius: '16px', background: '#111827' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
              Submit KPI Value: {selectedKpi.name}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Target: {selectedKpi.targetValue} {selectedKpi.unit}
            </p>

            <form onSubmit={handleUpdateResult} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Actual Value ({selectedKpi.unit})</label>
                <input
                  type="number"
                  step="any"
                  className="input-field"
                  value={actualValue}
                  onChange={(e) => setActualValue(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Remarks</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Monthly audit results"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setSelectedKpi(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Saving...' : 'Submit Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
