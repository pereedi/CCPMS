import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Send, FileSpreadsheet, Target, TrendingUp, Users, Database, AlertCircle, CheckCircle2, Calendar, Building2, Briefcase, Plus, Trash2, Upload, FileText } from 'lucide-react';
import { EspIcon } from '../common/EspIcon';

interface ProjectFormItem {
  id?: string;
  name: string;
  code?: string;
  progress: number;
  status: string;
  spent: string;
  budget: string;
  milestones: string;
}

interface DirectorReportFormProps {
  editReportData?: any;
  onReportSubmitted?: () => void;
  onCancelEdit?: () => void;
}

export const DirectorReportForm: React.FC<DirectorReportFormProps> = ({
  editReportData,
  onReportSubmitted,
  onCancelEdit
}) => {
  const { user } = useAuth();
  
  // Official 7 Directorates List
  const officialDirectoratesList = [
    { name: 'Technology & Digital Innovation', code: 'TECH_DIGITAL' },
    { name: 'FinTech & Technology Products', code: 'FINTECH' },
    { name: 'Social Media, Platforms & Distribution', code: 'SOCIAL_MEDIA' },
    { name: 'Citizen Engagement & Global Localization', code: 'CITIZEN_GLOBAL' },
    { name: 'Research, Data Intelligence & Governance', code: 'RESEARCH_DATA' },
    { name: 'Content & Media Production', code: 'CONTENT_MEDIA' },
    { name: 'Digital Asset Management & Language Services', code: 'DIGITAL_ASSETS' },
  ];

  const [directorates, setDirectorates] = useState<any[]>(officialDirectoratesList);
  const [selectedDirectorateId, setSelectedDirectorateId] = useState<string>('');
  const [selectedDirectorateName, setSelectedDirectorateName] = useState<string>('Technology & Digital Innovation');

  // Dates & Core Info
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [reportDate, setReportDate] = useState(todayStr);
  const [startDate, setStartDate] = useState(firstDayOfMonthStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [period, setPeriod] = useState(todayStr.slice(0, 7));
  const [type, setType] = useState('WEEKLY');
  const [specificGoals, setSpecificGoals] = useState('');

  // Performance & Milestones
  const [percentageAchievement, setPercentageAchievement] = useState('90');
  const [milestoneProgress, setMilestoneProgress] = useState('');
  const [challengesFaced, setChallengesFaced] = useState('');

  // Financial Objectives
  const [financialTarget, setFinancialTarget] = useState('');
  const [financialAchievement, setFinancialAchievement] = useState('');

  // Strategic Objectives (3 Pillars)
  const [peopleObjective, setPeopleObjective] = useState('');
  const [dataObjective, setDataObjective] = useState('');
  const [moneyObjective, setMoneyObjective] = useState('');

  // Staffing
  const [headcount, setHeadcount] = useState('');
  const [keyRoles, setKeyRoles] = useState(''); // Lengthy multi-line textarea
  const [staffingGaps, setStaffingGaps] = useState('');

  // Active Projects (No stand-in hardcoded title — starts empty with clean placeholders)
  const [projects, setProjects] = useState<ProjectFormItem[]>([]);

  // File Upload State (R2 Object Storage)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchDirectorates();
  }, []);

  // Lock directorate to user's assigned directorate from KingsChat login
  useEffect(() => {
    if (user?.directorate) {
      if (typeof user.directorate === 'string') {
        setSelectedDirectorateName(user.directorate);
      } else if (user.directorate.name) {
        setSelectedDirectorateName(user.directorate.name);
        setSelectedDirectorateId(user.directorate.id || '');
      }
    }
  }, [user]);

  // Pre-fill state if editReportData prop is supplied
  useEffect(() => {
    if (editReportData) {
      setTitle(editReportData.title || editReportData.summary?.slice(0, 60) || '');
      setType(editReportData.type || 'WEEKLY');
      setPeriod(editReportData.period || todayStr.slice(0, 7));
      if (editReportData.file_url) setExistingFileUrl(editReportData.file_url);

      if (editReportData.specificGoals) setSpecificGoals(editReportData.specificGoals);
      else if (editReportData.summary) setSpecificGoals(editReportData.summary);

      if (editReportData.percentageAchievement) setPercentageAchievement(String(editReportData.percentageAchievement));
      if (editReportData.milestoneProgress) setMilestoneProgress(editReportData.milestoneProgress);
      if (editReportData.challengesFaced) setChallengesFaced(editReportData.challengesFaced);
      if (editReportData.financialTarget) setFinancialTarget(String(editReportData.financialTarget));
      if (editReportData.financialAchievement) setFinancialAchievement(String(editReportData.financialAchievement));

      if (editReportData.strategicObjectives) {
        if (editReportData.strategicObjectives.people) setPeopleObjective(editReportData.strategicObjectives.people);
        if (editReportData.strategicObjectives.data) setDataObjective(editReportData.strategicObjectives.data);
        if (editReportData.strategicObjectives.money) setMoneyObjective(editReportData.strategicObjectives.money);
      }

      if (editReportData.staffing) {
        if (editReportData.staffing.headcount) setHeadcount(String(editReportData.staffing.headcount));
        if (editReportData.staffing.keyRoles) setKeyRoles(editReportData.staffing.keyRoles);
        if (editReportData.staffing.gaps) setStaffingGaps(editReportData.staffing.gaps);
      }

      if (Array.isArray(editReportData.projects)) {
        setProjects(editReportData.projects);
      }
    }
  }, [editReportData]);

  const fetchDirectorates = async () => {
    try {
      const res: any = await api.get('/directorates');
      if (res.success && res.data && res.data.length > 0) {
        setDirectorates(res.data);
      }
    } catch (_) {}
  };

  const handleAddProject = () => {
    setProjects([
      ...projects,
      {
        name: '', // Clean empty string so input placeholder is visible
        progress: 0,
        status: 'IN_PROGRESS',
        spent: '0',
        budget: '0',
        milestones: '',
      }
    ]);
  };

  const handleRemoveProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const handleProjectChange = (index: number, field: keyof ProjectFormItem, value: any) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    setProjects(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!title.trim() || title.trim().length < 5) {
      setErrorMsg('⚠️ Report Title is required (minimum 5 characters).');
      return;
    }

    if (!specificGoals.trim() || specificGoals.trim().length < 10) {
      setErrorMsg('⚠️ Please state specific goals/achievements for this period (minimum 10 characters).');
      return;
    }

    setSubmitting(true);

    const reportPayload = {
      title,
      type,
      period: period || reportDate.slice(0, 7),
      summary: specificGoals,
      directorateName: selectedDirectorateName,
      reportDate,
      startDate,
      endDate,
      specificGoals,
      percentageAchievement,
      milestoneProgress,
      challengesFaced,
      financialTarget: financialTarget || '0',
      financialAchievement: financialAchievement || '0',
      strategicObjectives: {
        people: peopleObjective,
        data: dataObjective,
        money: moneyObjective,
      },
      staffing: {
        headcount: headcount || '0',
        keyRoles,
        gaps: staffingGaps,
      },
      projects,
      file_url: existingFileUrl,
    };

    try {
      let res: any;
      let recordId: string;

      if (editReportData && editReportData.id) {
        // PUT /api/records/:id (update existing)
        res = await api.put(`/records/${editReportData.id}`, reportPayload);
        recordId = editReportData.id;
      } else {
        // POST /api/records (create new)
        res = await api.post('/records', reportPayload);
        recordId = res.data?.id;
      }

      if (res.success) {
        // Handle file upload if a new file is attached
        if (selectedFile && recordId) {
          try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            await api.post(`/upload/records/${recordId}`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          } catch (uploadErr: any) {
            console.warn('File upload failed:', uploadErr.message);
          }
        }

        const actionText = editReportData ? 'updated and resubmitted' : 'submitted';
        setSuccessMsg(`Report "${title}" ${actionText} successfully! Reflecting live on OFEM Executive Command Center.`);

        if (!editReportData) {
          setTitle('');
          setSpecificGoals('');
          setMilestoneProgress('');
          setChallengesFaced('');
          setPeopleObjective('');
          setDataObjective('');
          setMoneyObjective('');
          setKeyRoles('');
          setStaffingGaps('');
          setProjects([]);
          setSelectedFile(null);
        }

        if (onReportSubmitted) {
          onReportSubmitted();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div className="glass-panel glow-panel" style={{
        padding: '24px 32px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'var(--kingschat-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)'
          }}>
            <FileSpreadsheet style={{ width: '26px', height: '26px', color: '#ffffff' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
              {editReportData ? 'Edit & Resubmit Directorate Report' : 'Directorate Performance Report Form'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Assigned Directorate: <strong style={{ color: '#60a5fa' }}>{selectedDirectorateName}</strong>
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {onCancelEdit && (
            <button type="button" onClick={onCancelEdit} className="btn btn-secondary btn-sm">
              Cancel
            </button>
          )}
          <span className="badge badge-role" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
            AD Director Mode
          </span>
        </div>
      </div>

      {successMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px', padding: '16px', color: '#34d399', fontSize: '0.9rem',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <CheckCircle2 style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: '12px', padding: '16px', color: '#f87171', fontSize: '0.9rem',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <AlertCircle style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* SECTION 1: GENERAL INFO, DATES & GOALS */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Target style={{ width: '20px', height: '20px', color: 'var(--accent-blue)' }} />
            Section 1: General Details, Dates & Specific Goals
          </h3>

          <div style={{
            background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.4)',
            padding: '16px 20px', borderRadius: '12px', marginBottom: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
                <Building2 style={{ width: '22px', height: '22px', color: '#ffffff' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                  Assigned Directorate
                </label>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                  🏢 {selectedDirectorateName}
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '6px 12px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              🔒 Verified Roster
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Report Title *
              </label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="e.g., August 2026 Technology & Digital Innovation Summary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Report Cycle
              </label>
              <select className="input-field" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="WEEKLY">WEEKLY</option>
                <option value="MONTHLY">MONTHLY</option>
              </select>
            </div>
          </div>

          {/* DATES ROW */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px',
            padding: '16px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '12px', border: '1px solid var(--border-color)'
          }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Calendar style={{ width: '14px', height: '14px', color: '#ffffff' }} /> Submission Date *
              </label>
              <input type="date" required className="input-field" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Period Start Date</label>
              <input type="date" className="input-field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Period End Date</label>
              <input type="date" className="input-field" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              State Specific Goals & Achievements for this Period *
            </label>
            <textarea
              rows={4}
              required
              className="input-field"
              placeholder="Outline the core operational and strategic goals planned and achieved for this reporting period..."
              value={specificGoals}
              onChange={(e) => setSpecificGoals(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        {/* SECTION 2: ACHIEVEMENTS, MILESTONES & CHALLENGES */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp style={{ width: '20px', height: '20px', color: 'var(--accent-emerald)' }} />
            Section 2: Achievements, Milestones & Challenges
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Overall Target Achievement (%)
            </label>
            <select
              className="input-field"
              value={percentageAchievement}
              onChange={(e) => setPercentageAchievement(e.target.value)}
              style={{ fontWeight: 700, color: '#34d399', fontSize: '1rem' }}
            >
              <option value="100">100% - Full Accomplishment Target Reached</option>
              <option value="90">90% - Outstanding Progress with Minor Items Open</option>
              <option value="75">75% - Solid Progress (On Schedule)</option>
              <option value="50">50% - Half Completion Achieved</option>
              <option value="25">25% - Initial Milestones Started</option>
              <option value="10">10% - Behind Schedule / Deferred</option>
              <option value="0">0% - Critical Blocked / Not Achieved</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Milestone Progress Explanation
              </label>
              <textarea
                rows={4}
                className="input-field"
                placeholder="Explain specific milestone deliverables completed so far..."
                value={milestoneProgress}
                onChange={(e) => setMilestoneProgress(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Operational Challenges & Bottlenecks Faced
              </label>
              <textarea
                rows={4}
                className="input-field"
                placeholder="Describe key blockers, resource constraints, or technical hurdles..."
                value={challengesFaced}
                onChange={(e) => setChallengesFaced(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: FINANCIAL OBJECTIVES */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <EspIcon style={{ width: '20px', height: '20px' }} />
            Section 3: Financial Objectives (Targets vs Achievements)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Financial Target (Espees - ESP)
              </label>
              <input
                type="text"
                inputMode="numeric"
                className="input-field"
                placeholder="e.g. 150000"
                value={financialTarget}
                onChange={(e) => setFinancialTarget(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Financial Achievement (Espees - ESP)
              </label>
              <input
                type="text"
                inputMode="numeric"
                className="input-field"
                placeholder="e.g. 135000"
                value={financialAchievement}
                onChange={(e) => setFinancialAchievement(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: STRATEGIC 3 PILLARS */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database style={{ width: '20px', height: '20px', color: 'var(--accent-cyan)' }} />
            Section 4: Strategic Objectives (People, Data, Money)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '16px', borderRadius: '12px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Users style={{ width: '16px', height: '16px' }} /> 1. People Pillar Objectives
              </label>
              <textarea
                rows={3}
                className="input-field"
                placeholder="State staff development, team productivity, and capacity building..."
                value={peopleObjective}
                onChange={(e) => setPeopleObjective(e.target.value)}
              />
            </div>

            <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '16px', borderRadius: '12px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Database style={{ width: '16px', height: '16px' }} /> 2. Data Pillar Objectives
              </label>
              <textarea
                rows={3}
                className="input-field"
                placeholder="State data integrity, analytics reporting, and system performance metrics..."
                value={dataObjective}
                onChange={(e) => setDataObjective(e.target.value)}
              />
            </div>

            <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '16px', borderRadius: '12px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <EspIcon style={{ width: '18px', height: '18px' }} /> 3. Money Pillar Objectives
              </label>
              <textarea
                rows={3}
                className="input-field"
                placeholder="State budget efficiency, cost savings, and financial optimization strategy..."
                value={moneyObjective}
                onChange={(e) => setMoneyObjective(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: STAFFING & KEY ROLES (LENGTHY TEXTAREA INPUT) */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users style={{ width: '20px', height: '20px', color: 'var(--accent-purple)' }} />
            Section 5: Directorate Staffing & Key Roles
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Active Headcount (Staff Count)
              </label>
              <input
                type="text"
                inputMode="numeric"
                className="input-field"
                placeholder="e.g. 12"
                value={headcount}
                onChange={(e) => setHeadcount(e.target.value)}
              />
            </div>

            {/* LENGTHY TEXTAREA FOR KEY DIRECTORATE ROLES */}
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', display: 'block', marginBottom: '6px' }}>
                Key Directorate Roles Filled & Responsibilities (Lengthy Input)
              </label>
              <textarea
                rows={4}
                className="input-field"
                placeholder="Detailed breakdown of key roles filled in your directorate (e.g., Lead Architect, Senior Software Engineer, Data Governance Lead, Operations Manager, QA Specialist)..."
                value={keyRoles}
                onChange={(e) => setKeyRoles(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Staffing Needs & Recruitment Gaps
              </label>
              <textarea
                rows={3}
                className="input-field"
                placeholder="Outline required additions, skill gaps, or hiring priorities..."
                value={staffingGaps}
                onChange={(e) => setStaffingGaps(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 6: PROJECTS (CLEAN INPUT PLACEHOLDERS, NO STAND-IN DEFAULT TITLE) */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <Briefcase style={{ width: '20px', height: '20px', color: 'var(--accent-blue)' }} />
              Section 6: Directorate Active Projects & Deliverables Tracking
            </h3>
            <button
              type="button"
              onClick={handleAddProject}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus style={{ width: '14px', height: '14px' }} />
              Add Project
            </button>
          </div>

          {projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
              No active projects listed. Click <strong>"Add Project"</strong> to log your Directorate's active projects.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {projects.map((proj, idx) => (
                <div key={idx} style={{
                  background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border-color)',
                  padding: '18px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Project Title #{idx + 1}
                      </label>
                      {/* CLEAN HTML PLACEHOLDER */}
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g., Cloud Infrastructure & Architecture Upgrade"
                        value={proj.name}
                        onChange={(e) => handleProjectChange(idx, 'name', e.target.value)}
                      />
                    </div>

                    <div style={{ width: '160px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Status
                      </label>
                      <select
                        className="input-field"
                        value={proj.status}
                        onChange={(e) => handleProjectChange(idx, 'status', e.target.value)}
                        style={{ fontSize: '0.85rem' }}
                      >
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="ON_HOLD">On Hold</option>
                        <option value="RISKY">Risky / Delayed</option>
                        <option value="PLANNING">Planning</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveProject(idx)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)', color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px',
                        padding: '8px', cursor: 'pointer', marginTop: '18px'
                      }}
                      title="Remove Project"
                    >
                      <Trash2 style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Completion Progress</span>
                        <span style={{ fontWeight: 800, color: '#60a5fa' }}>{proj.progress}%</span>
                      </div>
                      <input
                        type="range" min="0" max="100"
                        value={proj.progress}
                        onChange={(e) => handleProjectChange(idx, 'progress', parseInt(e.target.value, 10))}
                        style={{ width: '100%', cursor: 'pointer', accentColor: '#3b82f6' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                        Spent Budget (Espees - ESP)
                      </label>
                      <input
                        type="text" inputMode="numeric" className="input-field"
                        placeholder="e.g. 45000"
                        value={proj.spent}
                        onChange={(e) => handleProjectChange(idx, 'spent', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Key Milestones & Deliverables Highlight
                    </label>
                    <input
                      type="text" className="input-field"
                      placeholder="e.g. Released v1.2 API endpoints, updated database schemas..."
                      value={proj.milestones}
                      onChange={(e) => handleProjectChange(idx, 'milestones', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 7: OFFICIAL DOCUMENT ATTACHMENT (CLOUDFLARE R2) */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Upload style={{ width: '20px', height: '20px', color: 'var(--kingschat-gold)' }} />
            Section 7: Official Document Attachment (Cloudflare R2 Storage)
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Attach full PDF/DOCX report documentation or financial statements for executive review.
          </p>

          <div style={{
            border: '2px dashed rgba(59, 130, 246, 0.3)',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            background: 'rgba(15, 23, 42, 0.4)'
          }}>
            <input
              type="file"
              id="report-file-input"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
              style={{ display: 'none' }}
            />
            <label htmlFor="report-file-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Upload style={{ width: '32px', height: '32px', color: '#60a5fa' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                {selectedFile ? `Selected: ${selectedFile.name}` : 'Click to select document (PDF, DOCX, Images)'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Max file size: 20 MB • Stores on Cloudflare R2 Object Storage
              </span>
            </label>
            {existingFileUrl && !selectedFile && (
              <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <FileText style={{ width: '16px', height: '16px' }} /> Attached File: <a href={existingFileUrl} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>View Document</a>
              </div>
            )}
          </div>
        </div>

        {/* Submit Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          {onCancelEdit && (
            <button type="button" onClick={onCancelEdit} className="btn btn-secondary" style={{ padding: '14px 24px' }}>
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-kingschat"
            style={{ padding: '14px 28px', fontSize: '1rem', borderRadius: '12px' }}
          >
            <Send style={{ width: '18px', height: '18px' }} />
            {submitting ? 'Submitting Report...' : editReportData ? 'Resubmit Report to OFEM' : 'Submit Directorate Report'}
          </button>
        </div>
      </form>
    </div>
  );
};
