import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Project } from '../../types';
import { FolderKanban, CheckCircle2, Clock, AlertTriangle, Calendar } from 'lucide-react';
import { EspIcon } from '../common/EspIcon';

export const ProjectsTab: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res: any = await api.get('/projects');
      if (res.success && res.data) {
        setProjects(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch projects, using seed fallback', err);
      setProjects([
        {
          id: '1',
          name: 'CCPMS Enterprise Command System',
          code: 'PROJ_CCPMS',
          description: 'Executive performance monitoring dashboard and reporting suite',
          status: 'IN_PROGRESS',
          progress: 65.0,
          budget: 120000.0,
          spent: 45000.0,
          directorate: { name: 'Technology & Innovation', code: 'TECH' },
          milestones: [
            { id: 'm1', title: 'Backend Core Architecture & API Implementation', status: 'COMPLETED' },
            { id: 'm2', title: 'React + TypeScript Frontend Portal', status: 'IN_PROGRESS' }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Loading projects...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>Projects & Milestones</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Strategic Initiatives & Execution Progress
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {projects.map((proj) => (
          <div key={proj.id} className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <span className="badge badge-good" style={{ marginBottom: '8px' }}>
                  {proj.status.replace('_', ' ')}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>{proj.name}</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Code: {proj.code} • Directorate: {proj.directorate?.name || 'HQ'}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              {proj.description || 'No project description'}
            </p>

            {/* Progress Bar */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Overall Progress</span>
                <span style={{ fontWeight: 700, color: '#60a5fa' }}>{proj.progress}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${proj.progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)'
                }} />
              </div>
            </div>

            {/* Financial Details */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              padding: '12px',
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: '10px',
              marginBottom: '16px'
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <EspIcon style={{ width: '14px', height: '14px' }} /> BUDGET (ESP)
                </span>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>
                  {proj.budget.toLocaleString()} ESP
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SPENT TO DATE</span>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fbbf24' }}>
                  {proj.spent.toLocaleString()} ESP
                </div>
              </div>
            </div>

            {/* Milestones */}
            {proj.milestones && proj.milestones.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Milestones ({proj.milestones.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {proj.milestones.map((m) => (
                    <div key={m.id} style={{
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: m.status === 'COMPLETED' ? '#34d399' : 'var(--text-primary)'
                    }}>
                      <CheckCircle2 style={{ width: '14px', height: '14px', color: m.status === 'COMPLETED' ? '#34d399' : 'var(--text-muted)' }} />
                      <span>{m.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
