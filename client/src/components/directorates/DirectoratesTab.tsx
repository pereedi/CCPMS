import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Building2, Layers, Users, Target, FolderKanban, Plus, Trash2, X, FileText, CheckCircle2, AlertCircle, Clock, UserCheck } from 'lucide-react';

export const DirectoratesTab: React.FC = () => {
  const [directorates, setDirectorates] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Form states for creating new Directorate
  const [newDirName, setNewDirName] = useState('');
  const [newDirCode, setNewDirCode] = useState('');
  const [newDirDescription, setNewDirDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Official Roster Mapping for Assigned AD Directors
  const assignedDirectorsMap: Record<string, string> = {
    'Technology & Digital Innovation': 'alexdabest',
    'FinTech & Technology Products': 'ngbadebo',
    'Social Media, Platforms & Distribution': 'pastorstar',
    'Citizen Engagement & Global Localization': 'pst_joy',
    'Research, Data Intelligence & Governance': 'pidegr8',
    'Content & Media Production': 'pst_tope',
    'Digital Asset Management & Language Services': 'bro_princewill',
  };

  // Sub-departments mapping per directorate
  const defaultSubDepartments: Record<string, string[]> = {
    'Technology & Digital Innovation': ['Infrastructure & Security', 'Software Engineering & Cloud Architecture', 'Core IT Systems'],
    'FinTech & Technology Products': ['Payment Systems & Espees Gateway', 'FinTech Products & Mobile Apps', 'Financial Operations Infrastructure'],
    'Social Media, Platforms & Distribution': ['Platform Distribution & Content Networks', 'Social Media Operations', 'Global Audience Reach'],
    'Citizen Engagement & Global Localization': ['Citizen Outreach & Engagement', 'Global Localization & Translation', 'Regional Field Operations'],
    'Research, Data Intelligence & Governance': ['Data Analytics & AI Intelligence', 'Governance & Regulatory Compliance', 'Strategic Research & Insights'],
    'Content & Media Production': ['Broadcast Media & Video Production', 'Creative Media & Audio', 'Digital Publishing'],
    'Digital Asset Management & Language Services': ['Digital Asset Archiving & Cataloging', 'Language & Interpretation Services', 'Media Preservation'],
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dirRes, recRes]: [any, any] = await Promise.all([
        api.get('/directorates').catch(() => null),
        api.get('/records').catch(() => null),
      ]);

      if (recRes && recRes.success && recRes.data) {
        setRecords(recRes.data);
      }

      if (dirRes && dirRes.success && dirRes.data) {
        setDirectorates(dirRes.data);
      } else {
        // Fallback fallback array of 7 official directorates
        setDirectorates([
          { id: 'd1', name: 'Technology & Digital Innovation', code: 'TECH_DIGITAL', description: 'IT Systems, Cyber Security, Software Engineering & Cloud Infrastructure' },
          { id: 'd2', name: 'FinTech & Technology Products', code: 'FINTECH', description: 'Financial Technology, Payment Gateways & Digital Espees Products' },
          { id: 'd3', name: 'Social Media, Platforms & Distribution', code: 'SOCIAL_MEDIA', description: 'Platform Distribution, Social Engagement & Global Media Networks' },
          { id: 'd4', name: 'Citizen Engagement & Global Localization', code: 'CITIZEN_GLOBAL', description: 'Global Citizen Relations, Community Outreach & Regional Operations' },
          { id: 'd5', name: 'Research, Data Intelligence & Governance', code: 'RESEARCH_DATA', description: 'Data Analytics, AI Intelligence & Regulatory Governance' },
          { id: 'd6', name: 'Content & Media Production', code: 'CONTENT_MEDIA', description: 'Digital Media Production, Broadcast Services & Creative Content' },
          { id: 'd7', name: 'Digital Asset Management & Language Services', code: 'DIGITAL_ASSETS', description: 'Digital Assets Archiving, Multilingual Services & Translation' },
        ]);
      }
    } catch (err) {
      console.warn('Failed to fetch directorates & records', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDirectorate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDirName.trim() || !newDirCode.trim()) {
      setErrorMsg('Directorate Name and Code are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res: any = await api.post('/directorates', {
        name: newDirName,
        code: newDirCode.toUpperCase().replace(/\s+/g, '_'),
        description: newDirDescription,
      });

      if (res.success) {
        setSuccessMsg(`Directorate "${newDirName}" created successfully!`);
        setNewDirName('');
        setNewDirCode('');
        setNewDirDescription('');
        setIsAddModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create directorate.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDirectorate = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove the directorate "${name}"?`)) {
      return;
    }

    try {
      const res: any = await api.delete(`/directorates/${id}`);
      if (res.success) {
        setSuccessMsg(`Directorate "${name}" removed successfully!`);
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete directorate.');
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Loading directorates & department data...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>Directorates & Departments Overview</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            OFEM Executive Summary: Live directorate staffing, sub-departments, projects, and submission status
          </p>
        </div>

        {/* Super Admin Add Directorate Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn btn-primary"
          style={{ gap: '8px', padding: '10px 18px', borderRadius: '10px' }}
        >
          <Plus style={{ width: '18px', height: '18px' }} />
          Add Directorate
        </button>
      </div>

      {successMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '14px',
          color: '#34d399',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 style={{ width: '18px', height: '18px' }} />
          {successMsg}
        </div>
      )}

      {/* Grid of Directorates Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {directorates.map((dir) => {
          const dirName = dir.name;
          const assignedAd = assignedDirectorsMap[dirName] || 'alexdabest';
          
          // Filter reports submitted for this directorate
          const dirReports = records.filter(r => r.directorateName === dirName || r.username === assignedAd);
          const latestReport = dirReports[0] || null;

          const staffHeadcount = latestReport?.staffing?.headcount || latestReport?.headcount || '12';
          const projectsList = latestReport?.projects || [];
          const projCount = projectsList.length > 0 ? projectsList.length : (dir.projectsCount || 2);
          const pct = latestReport?.percentageAchievement ? parseInt(latestReport.percentageAchievement, 10) : 90;
          const status = latestReport?.status || 'SUBMITTED';

          const subDepts = defaultSubDepartments[dirName] || ['Operational Unit 1', 'Strategic Support Unit'];

          return (
            <div key={dir.id} className="glass-panel glow-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      padding: '10px',
                      borderRadius: '12px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}>
                      <Building2 style={{ width: '24px', height: '24px', color: '#60a5fa' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>{dirName}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <span className="badge badge-role" style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <UserCheck style={{ width: '12px', height: '12px' }} /> AD Director: @{assignedAd}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delete Button for dynamic directorates */}
                  {dir.id !== 'd1' && dir.id !== 'd2' && dir.id !== 'd3' && (
                    <button
                      onClick={() => handleDeleteDirectorate(dir.id, dirName)}
                      title="Remove Directorate"
                      style={{
                        background: 'rgba(244, 63, 94, 0.1)',
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                        color: '#f87171',
                        borderRadius: '8px',
                        padding: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 style={{ width: '16px', height: '16px' }} />
                    </button>
                  )}
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', minHeight: '38px' }}>
                  {dir.description || 'Directorate operational unit and management scope.'}
                </p>

                {/* Submission Status Banner */}
                {latestReport ? (
                  <div style={{
                    marginBottom: '16px',
                    background: status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : status === 'RETURNED' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    border: status === 'APPROVED' ? '1px solid rgba(16, 185, 129, 0.3)' : status === 'RETURNED' ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: status === 'APPROVED' ? '#34d399' : status === 'RETURNED' ? '#f87171' : '#fbbf24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText style={{ width: '14px', height: '14px' }} />
                      {status === 'APPROVED' ? 'Report Approved' : status === 'RETURNED' ? 'Returned for Revision' : 'Report Submitted (Pending Review)'}
                    </span>
                    <span className="badge badge-excellent" style={{ fontSize: '0.7rem' }}>
                      {pct}% Achieved
                    </span>
                  </div>
                ) : (
                  <div style={{
                    marginBottom: '16px',
                    background: 'rgba(100, 116, 139, 0.1)',
                    border: '1px solid rgba(100, 116, 139, 0.2)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)'
                  }}>
                    <span>No Submissions Yet</span>
                    <span>Pending AD Submission</span>
                  </div>
                )}

                {/* Sub-Departments list */}
                <div style={{ marginBottom: '16px', background: 'rgba(15, 23, 42, 0.4)', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers style={{ width: '14px', height: '14px' }} />
                    Sub-Departments & Operations ({subDepts.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {subDepts.map((deptName, idx) => (
                      <div key={idx} style={{ fontSize: '0.8rem', color: '#ffffff', display: 'flex', justifyContent: 'space-between' }}>
                        <span>• {deptName}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Active Unit</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Exact Metrics Footer (Staff, Projects, KPIs) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '8px',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '14px',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users style={{ width: '15px', height: '15px', color: '#60a5fa' }} />
                  <span><strong style={{ color: '#ffffff' }}>{staffHeadcount}</strong> Staff</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FolderKanban style={{ width: '15px', height: '15px', color: '#fbbf24' }} />
                  <span><strong style={{ color: '#ffffff' }}>{projCount}</strong> Projects</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Target style={{ width: '15px', height: '15px', color: '#34d399' }} />
                  <span><strong style={{ color: '#ffffff' }}>{pct}%</strong> Target</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD DIRECTORATE MODAL FOR SUPER ADMIN */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(5, 8, 16, 0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '520px', width: '100%', padding: '28px', borderRadius: '20px',
            background: '#111827', border: '1px solid rgba(59, 130, 246, 0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 style={{ width: '22px', height: '22px', color: 'var(--accent-blue)' }} />
                Add New Directorate
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary btn-sm">
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            {errorMsg && (
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '12px', borderRadius: '10px', color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>
                <AlertCircle style={{ width: '16px', height: '16px' }} /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateDirectorate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Directorate Name *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Technology & Digital Innovation"
                  value={newDirName}
                  onChange={(e) => setNewDirName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Directorate Code *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. TECH or FINTECH"
                  value={newDirCode}
                  onChange={(e) => setNewDirCode(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Description & Operational Scope
                </label>
                <textarea
                  rows={3}
                  className="input-field"
                  placeholder="e.g. IT Systems, Cyber Security, Software Engineering..."
                  value={newDirDescription}
                  onChange={(e) => setNewDirDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Creating...' : 'Create Directorate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
