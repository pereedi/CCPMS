import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FolderKanban, CheckCircle2, Clock, Briefcase, RefreshCw } from 'lucide-react';
import { EspIcon } from '../common/EspIcon';

export const ProjectsTab: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/records');
      if (res.success && res.data) {
        setRecords(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch records for projects tab', err);
    } finally {
      setLoading(false);
    }
  };

  // Flatten all projects from submitted records
  const allProjects: Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
    spent: number;
    budget: number;
    milestones: string;
    directorate: string;
    submittedBy: string;
    submittedAt: string;
  }> = [];

  records.forEach((r) => {
    if (Array.isArray(r.projects)) {
      r.projects.forEach((p: any, idx: number) => {
        if (p.name && p.name.trim()) {
          allProjects.push({
            id: `${r.id}-proj-${idx}`,
            name: p.name,
            status: p.status || 'IN_PROGRESS',
            progress: p.progress || 0,
            spent: parseFloat(p.spent || '0') || 0,
            budget: parseFloat(p.budget || '0') || 0,
            milestones: p.milestones || '',
            directorate: r.directorateName || r.username,
            submittedBy: r.username,
            submittedAt: r.submittedAt,
          });
        }
      });
    }
  });

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Loading active projects...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Briefcase style={{ width: '18px', height: '18px', color: 'var(--accent-blue)' }} />
            <span className="badge badge-role">DIRECTORATE INITIATIVES & PROJECTS</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>Active Projects & Milestones</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Strategic Initiatives & Execution Progress Tracked Live from Directorate Report Submissions
          </p>
        </div>

        <button onClick={fetchRecords} className="btn btn-secondary btn-sm" title="Refresh Live Projects">
          <RefreshCw style={{ width: '14px', height: '14px' }} />
          Refresh
        </button>
      </div>

      {allProjects.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', borderRadius: '16px' }}>
          <FolderKanban style={{ width: '40px', height: '40px', color: 'var(--text-muted)', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>No Active Projects Listed</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            When Assistant Directors submit reports with active projects, they will automatically appear here for tracking.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {allProjects.map((proj) => (
            <div key={proj.id} className="glass-panel glow-panel" style={{ padding: '24px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span className="badge badge-good">
                      {proj.status.replace('_', ' ')}
                    </span>
                    <span className="badge badge-role" style={{ fontSize: '0.7rem' }}>
                      🏢 {proj.directorate}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>{proj.name}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Submitted by @{proj.submittedBy} • Date: {new Date(proj.submittedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Completion Progress</span>
                  <span style={{ fontWeight: 800, color: '#60a5fa' }}>{proj.progress}%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${proj.progress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)',
                    borderRadius: '4px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>

              {/* Financial Details */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
                padding: '12px', background: 'rgba(15, 23, 42, 0.5)',
                borderRadius: '10px', marginBottom: '16px', border: '1px solid var(--border-color)'
              }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <EspIcon style={{ width: '14px', height: '14px' }} /> BUDGET (ESP)
                  </span>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>
                    {proj.budget ? `${proj.budget.toLocaleString()} ESP` : 'N/A'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SPENT TO DATE</span>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fbbf24' }}>
                    {proj.spent ? `${proj.spent.toLocaleString()} ESP` : '0 ESP'}
                  </div>
                </div>
              </div>

              {/* Milestones Highlight */}
              {proj.milestones && (
                <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', marginBottom: '4px' }}>
                    Milestones & Highlights:
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {proj.milestones}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
