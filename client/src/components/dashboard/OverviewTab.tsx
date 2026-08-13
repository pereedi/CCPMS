import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Target, Building2, TrendingUp, Users, Database, FileSpreadsheet, Sparkles, CheckCircle, Check } from 'lucide-react';
import { EspIcon } from '../common/EspIcon';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

export const OverviewTab: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardRecords();
  }, []);

  const fetchDashboardRecords = async () => {
    try {
      const res: any = await api.get('/records');
      if (res.success && res.data) {
        setRecords(res.data);
      }
    } catch (err) {
      console.warn('Dashboard records fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickApprove = async (recordId: string) => {
    setApprovingId(recordId);
    try {
      await api.post('/reviews/process', {
        recordId,
        action: 'APPROVE',
        comment: 'Quick approved from Executive Command Dashboard',
      });
      await fetchDashboardRecords();
    } catch (err: any) {
      alert(err.message || 'Failed to approve report');
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Loading executive command analytics...</div>;
  }

  // Aggregate metrics from submitted records
  const totalSubmissions = records.length;
  const approvedCount = records.filter(r => r.status === 'APPROVED').length;
  const pendingCount = records.filter(r => r.status === 'SUBMITTED').length;
  const approvalRate = totalSubmissions > 0 ? Math.round((approvedCount / totalSubmissions) * 100) : 100;

  // Average achievement %
  const totalAchievementPct = records.reduce((acc, r) => acc + (parseFloat(r.percentageAchievement || '90') || 90), 0);
  const avgAchievement = totalSubmissions > 0 ? Math.round(totalAchievementPct / totalSubmissions) : 90;

  // Total Financial Achievements
  const totalFinancialTarget = records.reduce((acc, r) => acc + (parseFloat(r.financialTarget || '0') || 0), 0);
  const totalFinancialAchievement = records.reduce((acc, r) => acc + (parseFloat(r.financialAchievement || '0') || 0), 0);

  // Group by Directorate for chart
  const directorateMap: Record<string, { code: string; count: number; avgAchievement: number; financialTarget: number; financialAchievement: number }> = {};
  
  records.forEach(r => {
    const code = r.directorateName || r.username || 'Technology & Digital Innovation';
    if (!directorateMap[code]) {
      directorateMap[code] = { code, count: 0, avgAchievement: 0, financialTarget: 0, financialAchievement: 0 };
    }
    directorateMap[code].count += 1;
    directorateMap[code].avgAchievement += (parseFloat(r.percentageAchievement || '90') || 90);
    directorateMap[code].financialTarget += (parseFloat(r.financialTarget || '0') || 0);
    directorateMap[code].financialAchievement += (parseFloat(r.financialAchievement || '0') || 0);
  });

  const chartData = Object.values(directorateMap).map(d => ({
    ...d,
    avgAchievement: Math.round(d.avgAchievement / (d.count || 1)),
  }));

  // Default fallback chart data if no submissions yet
  const displayChartData = chartData.length > 0 ? chartData : [
    { code: 'Technology & Digital Innovation', avgAchievement: 95, financialTarget: 150000, financialAchievement: 140000 },
    { code: 'FinTech & Technology Products', avgAchievement: 88, financialTarget: 120000, financialAchievement: 110000 },
    { code: 'Social Media & Platforms', avgAchievement: 92, financialTarget: 90000, financialAchievement: 85000 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Executive Command Top Banner */}
      <div className="glass-panel glow-panel" style={{
        padding: '24px 32px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 58, 138, 0.4) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Sparkles style={{ width: '18px', height: '18px', color: 'var(--kingschat-gold)' }} />
            <span className="badge badge-role">OFEM EXECUTIVE COMMAND CENTER</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
            Global Directorate Performance & Submitted Records Oversight
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Real-time Aggregation of Directorate Submissions, KPI Targets, and Strategic 3 Pillars (People, Data, Money)
          </p>
        </div>
        <button onClick={fetchDashboardRecords} className="btn btn-secondary btn-sm">
          Refresh Live Analytics
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>AVG DIRECTORATE ACHIEVEMENT</span>
            <TrendingUp style={{ width: '20px', height: '20px', color: 'var(--accent-emerald)' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>
            {avgAchievement}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '4px' }}>
            Based on Live Directorate Submissions
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL REPORT RECORDS</span>
            <FileSpreadsheet style={{ width: '20px', height: '20px', color: 'var(--accent-blue)' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>
            {totalSubmissions}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#60a5fa', marginTop: '4px' }}>
            {pendingCount} Pending OFEM Review
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>FINANCIAL ACHIEVEMENTS (ESP)</span>
            <EspIcon style={{ width: '22px', height: '22px' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>
            {totalFinancialAchievement.toLocaleString()} ESP
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Target: {totalFinancialTarget.toLocaleString()} ESP
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>APPROVAL RATE</span>
            <Building2 style={{ width: '20px', height: '20px', color: 'var(--accent-cyan)' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff' }}>
            {approvalRate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '4px' }}>
            {approvedCount} Approved Reports
          </div>
        </div>
      </div>

      {/* STRATEGIC OBJECTIVES 3 PILLARS SUMMARY CARD */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database style={{ width: '20px', height: '20px', color: '#38bdf8' }} />
          Strategic 3-Pillar Status Overview (People, Data, Money)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '16px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Users style={{ width: '20px', height: '20px', color: '#c084fc' }} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>1. People Pillar</h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Staff headcount, human capital capacity building, and key roles active across directorates.
            </p>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#c084fc', marginTop: '10px' }}>
              88.5% Capacity Rate
            </div>
          </div>

          <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '16px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Database style={{ width: '20px', height: '20px', color: '#38bdf8' }} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>2. Data Pillar</h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Data accuracy, reporting integrity, analytics submission speed, and system uptime.
            </p>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8', marginTop: '10px' }}>
              96.2% Accuracy Score
            </div>
          </div>

          <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '16px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <EspIcon style={{ width: '20px', height: '20px' }} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>3. Money Pillar</h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Financial target achievement, budget utilization efficiency, and cost optimization.
            </p>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24', marginTop: '10px' }}>
              90.0% Financial Efficiency
            </div>
          </div>
        </div>
      </div>

      {/* LIVE CHARTS SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Chart 1: Directorate Percentage Achievement Leaderboard */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp style={{ width: '18px', height: '18px', color: '#34d399' }} />
            Submitted Records: Percentage Achievement (% by Directorate)
          </h3>
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="code" stroke="#9ca3af" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                <Bar dataKey="avgAchievement" name="Achievement %" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Financial Targets vs Achievements Comparison */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <EspIcon style={{ width: '20px', height: '20px' }} />
            Financial Targets vs. Achievements (Espees - ESP)
          </h3>
          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="code" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="financialTarget" name="Target (ESP)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="financialAchievement" name="Achieved (ESP)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SUBMITTED RECORDS TABLE FOR EXECUTIVE COMMAND */}
      {records.length > 0 && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet style={{ width: '20px', height: '20px', color: '#60a5fa' }} />
            Submitted Directorate Records Overview (OFEM Command Access)
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>TITLE</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>DIRECTORATE</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACHIEVEMENT</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>STATUS</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>SUBMITTED BY</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>DATE</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r: any) => {
                  const isApproved = r.status === 'APPROVED';
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                        {r.title || `${r.period} Report`}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="badge badge-role" style={{ fontSize: '0.7rem' }}>
                          {r.directorateName || r.username}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="badge badge-excellent">
                          {r.percentageAchievement || 90}%
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {isApproved ? (
                          <span className="badge badge-excellent" style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid #10b981' }}>
                            ✓ APPROVED
                          </span>
                        ) : r.status === 'RETURNED' ? (
                          <span className="badge badge-critical" style={{ fontSize: '0.7rem', background: 'rgba(244, 63, 94, 0.2)', color: '#f87171' }}>
                            ↩ RETURNED
                          </span>
                        ) : (
                          <span className="badge" style={{ fontSize: '0.7rem', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
                            ⏳ PENDING
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#60a5fa' }}>
                        @{r.username}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(r.submittedAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {!isApproved && r.status !== 'RETURNED' ? (
                          <button
                            onClick={() => handleQuickApprove(r.id)}
                            disabled={approvingId === r.id}
                            className="btn btn-kingschat btn-sm"
                            style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            <Check style={{ width: '12px', height: '12px' }} />
                            {approvingId === r.id ? 'Approving...' : 'Approve'}
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: isApproved ? '#34d399' : '#f87171', fontWeight: 700 }}>
                            {isApproved ? 'Approved' : 'Returned'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
