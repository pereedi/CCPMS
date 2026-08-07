import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Send, FileSpreadsheet, Target, TrendingUp, Users, Database, AlertCircle, CheckCircle2, Calendar, Building2 } from 'lucide-react';
import { EspIcon } from '../common/EspIcon';

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

  // Section 1: General Info, Calendar Dates & Specific Goals
  const [title, setTitle] = useState('');
  const [reportDate, setReportDate] = useState('2026-07-31');
  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState('2026-07-31');
  const [period, setPeriod] = useState('2026-M07');
  const [type, setType] = useState('MONTHLY');
  const [specificGoals, setSpecificGoals] = useState('');

  // Section 2: Performance & Milestones
  const [percentageAchievement, setPercentageAchievement] = useState('90');
  const [milestoneProgress, setMilestoneProgress] = useState('');
  const [challengesFaced, setChallengesFaced] = useState('');

  // Section 3: Financial Objectives
  const [financialTarget, setFinancialTarget] = useState('150000');
  const [financialAchievement, setFinancialAchievement] = useState('135000');

  // Section 4: Strategic Objectives (3 Pillars: People, Data, Money)
  const [peopleObjective, setPeopleObjective] = useState('');
  const [dataObjective, setDataObjective] = useState('');
  const [moneyObjective, setMoneyObjective] = useState('');

  // Section 5: Staffing
  const [headcount, setHeadcount] = useState('12');
  const [keyRoles, setKeyRoles] = useState('Software Engineers, Data Analysts, Cyber Security Officers');
  const [staffingGaps, setStaffingGaps] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchDirectorates();
  }, []);

  // Pre-fill state if editReportData prop is supplied
  useEffect(() => {
    if (editReportData) {
      setTitle(editReportData.title || '');
      setType(editReportData.type || 'MONTHLY');
      setPeriod(editReportData.period || '2026-M07');

      if (editReportData.directorate) {
        setSelectedDirectorateId(editReportData.directorate.id || '');
        setSelectedDirectorateName(editReportData.directorate.name || 'Technology & Digital Innovation');
      }

      let parsed: any = {};
      if (editReportData.dataJson) {
        try {
          parsed = typeof editReportData.dataJson === 'string' ? JSON.parse(editReportData.dataJson) : editReportData.dataJson;
        } catch (e) {
          parsed = {};
        }
      }

      if (parsed.directorateName) setSelectedDirectorateName(parsed.directorateName);
      if (parsed.reportDate) setReportDate(parsed.reportDate);
      if (parsed.startDate) setStartDate(parsed.startDate);
      if (parsed.endDate) setEndDate(parsed.endDate);
      if (parsed.specificGoals) setSpecificGoals(parsed.specificGoals);
      if (parsed.percentageAchievement) setPercentageAchievement(String(parsed.percentageAchievement));
      if (parsed.milestoneProgress) setMilestoneProgress(parsed.milestoneProgress);
      if (parsed.challengesFaced) setChallengesFaced(parsed.challengesFaced);
      if (parsed.financialTarget) setFinancialTarget(String(parsed.financialTarget));
      if (parsed.financialAchievement) setFinancialAchievement(String(parsed.financialAchievement));

      if (parsed.strategicObjectives) {
        if (parsed.strategicObjectives.people) setPeopleObjective(parsed.strategicObjectives.people);
        if (parsed.strategicObjectives.data) setDataObjective(parsed.strategicObjectives.data);
        if (parsed.strategicObjectives.money) setMoneyObjective(parsed.strategicObjectives.money);
      }

      if (parsed.staffing) {
        if (parsed.staffing.headcount) setHeadcount(String(parsed.staffing.headcount));
        if (parsed.staffing.keyRoles) setKeyRoles(parsed.staffing.keyRoles);
        if (parsed.staffing.gaps) setStaffingGaps(parsed.staffing.gaps);
      }
    }
  }, [editReportData]);

  const fetchDirectorates = async () => {
    try {
      const res: any = await api.get('/directorates');
      if (res.success && res.data && res.data.length > 0) {
        setDirectorates(res.data);
        if (!editReportData) {
          setSelectedDirectorateId(res.data[0].id);
          setSelectedDirectorateName(res.data[0].name);
        }
      }
    } catch (err) {
      console.warn('Using official directorate list fallback', err);
    }
  };

  const handleDirectorateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const found = directorates.find((d) => d.id === val || d.name === val || d.code === val);
    if (found) {
      setSelectedDirectorateId(found.id || '');
      setSelectedDirectorateName(found.name);
    } else {
      setSelectedDirectorateName(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Comprehensive Form Validation
    if (!title.trim() || title.trim().length < 5) {
      setErrorMsg('⚠️ Report Title is required (minimum 5 characters).');
      return;
    }

    if (!selectedDirectorateName.trim()) {
      setErrorMsg('⚠️ Please select a valid Directorate from the dropdown.');
      return;
    }

    if (!reportDate) {
      setErrorMsg('⚠️ Exact Report Date is required.');
      return;
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setErrorMsg('⚠️ Period Start Date cannot be after Period End Date.');
      return;
    }

    if (!specificGoals.trim() || specificGoals.trim().length < 10) {
      setErrorMsg('⚠️ Please state specific goals for this period (minimum 10 characters).');
      return;
    }

    const fTarget = parseFloat(financialTarget);
    const fAchieved = parseFloat(financialAchievement);

    if (isNaN(fTarget) || fTarget < 0) {
      setErrorMsg('⚠️ Financial Target must be a valid non-negative number.');
      return;
    }

    if (isNaN(fAchieved) || fAchieved < 0) {
      setErrorMsg('⚠️ Financial Achievement must be a valid non-negative number.');
      return;
    }

    const hCount = parseInt(headcount, 10);
    if (isNaN(hCount) || hCount < 0) {
      setErrorMsg('⚠️ Staff Headcount must be a valid non-negative number.');
      return;
    }

    setSubmitting(true);

    // Package detailed form content into dataJson
    const reportPayload = {
      directorateName: selectedDirectorateName,
      reportDate,
      startDate,
      endDate,
      specificGoals,
      percentageAchievement,
      milestoneProgress,
      challengesFaced,
      financialTarget,
      financialAchievement,
      strategicObjectives: {
        people: peopleObjective,
        data: dataObjective,
        money: moneyObjective,
      },
      staffing: {
        headcount,
        keyRoles,
        gaps: staffingGaps,
      },
    };

    const executiveSummary = `[${selectedDirectorateName}] Goal Achievement: ${percentageAchievement}%. Report Date: ${reportDate}. Financial Achievement: ${parseFloat(financialAchievement).toLocaleString()} ESP of ${parseFloat(financialTarget).toLocaleString()} ESP Target. Headcount: ${headcount} Staff.`;

    try {
      let res: any;
      if (editReportData && editReportData.id) {
        // UPDATE existing report
        res = await api.put(`/reports/${editReportData.id}`, {
          title,
          type,
          period: reportDate || period,
          summary: executiveSummary,
          directorateId: selectedDirectorateId || user?.directorate?.id,
          dataJson: JSON.stringify(reportPayload),
        });
      } else {
        // CREATE new report
        res = await api.post('/reports', {
          title,
          type,
          period: reportDate || period,
          summary: executiveSummary,
          directorateId: selectedDirectorateId || user?.directorate?.id,
          dataJson: JSON.stringify(reportPayload),
        });
      }

      if (res.success) {
        const actionText = editReportData ? 'updated' : 'submitted';
        setSuccessMsg(`Report "${title}" ${actionText} successfully for [${selectedDirectorateName}] on ${reportDate}! It is reflected on the OFEM Executive Command.`);
        
        if (!editReportData) {
          setTitle('');
          setSpecificGoals('');
          setMilestoneProgress('');
          setChallengesFaced('');
          setPeopleObjective('');
          setDataObjective('');
          setMoneyObjective('');
          setStaffingGaps('');
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
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--kingschat-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)'
          }}>
            <FileSpreadsheet style={{ width: '26px', height: '26px', color: '#ffffff' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
              Directorate Performance Report Form
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Selected Directorate: <strong style={{ color: '#60a5fa' }}>{selectedDirectorateName}</strong>
            </p>
          </div>
        </div>
        <span className="badge badge-role" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
          Director Mode
        </span>
      </div>

      {successMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          color: '#34d399',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: '12px',
          padding: '16px',
          color: '#f87171',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* SECTION 1: DIRECTORATE SELECTION, GENERAL INFO, DATES & SPECIFIC GOALS */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Target style={{ width: '20px', height: '20px', color: 'var(--accent-blue)' }} />
            Section 1: Directorate Selection, Calendar Dates & Specific Goals
          </h3>

          {/* PROMINENT DIRECTORATE DROPDOWN SELECTOR */}
          <div style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '16px'
          }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Building2 style={{ width: '18px', height: '18px' }} />
              Select Directorate for Report Submission *
            </label>
            <select
              className="input-field"
              value={selectedDirectorateId || selectedDirectorateName}
              onChange={handleDirectorateChange}
              style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff', background: '#0f172a' }}
            >
              {directorates.map((dir, idx) => (
                <option key={dir.id || idx} value={dir.id || dir.name}>
                  🏢 {dir.name}
                </option>
              ))}
            </select>
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
                placeholder="e.g. July 2026 Directorate Performance Summary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Report Cycle
              </label>
              <select className="input-field" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="DAILY">DAILY</option>
                <option value="WEEKLY">WEEKLY</option>
                <option value="BI-WEEKLY">BI-WEEKLY</option>
                <option value="MONTHLY">MONTHLY</option>
                <option value="QUARTERLY">QUARTERLY</option>
                <option value="ANNUAL">ANNUAL</option>
              </select>
            </div>
          </div>

          {/* INTERACTIVE CALENDAR DATES ROW */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '16px',
            marginBottom: '16px',
            padding: '16px',
            background: 'rgba(15, 23, 42, 0.5)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Calendar style={{ width: '14px', height: '14px' }} /> Exact Report Date *
              </label>
              <input
                type="date"
                required
                className="input-field"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Period Start Date
              </label>
              <input
                type="date"
                className="input-field"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Period End Date
              </label>
              <input
                type="date"
                className="input-field"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              State Specific Goals for this Period *
            </label>
            <textarea
              rows={3}
              required
              className="input-field"
              placeholder="Outline the core operational and strategic goals planned for this period..."
              value={specificGoals}
              onChange={(e) => setSpecificGoals(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        {/* SECTION 2: PERFORMANCE, MILESTONES & CHALLENGES */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp style={{ width: '20px', height: '20px', color: 'var(--accent-emerald)' }} />
            Section 2: Achievements, Milestones & Challenges
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Overall Percentage Achievement Dropdown (%)
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
                type="number"
                step="any"
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
                type="number"
                step="any"
                className="input-field"
                placeholder="e.g. 135000"
                value={financialAchievement}
                onChange={(e) => setFinancialAchievement(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: STRATEGIC OBJECTIVES (3 PILLARS: PEOPLE, DATA, MONEY) */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database style={{ width: '20px', height: '20px', color: 'var(--accent-cyan)' }} />
            Section 4: Strategic Objectives (3 Pillars: People, Data, Money)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', padding: '16px', borderRadius: '12px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Users style={{ width: '16px', height: '16px' }} />
                1. People Pillar Objectives (Human Capital, Training & Capacity)
              </label>
              <textarea
                rows={2}
                className="input-field"
                placeholder="State staff development, team productivity, and training initiatives..."
                value={peopleObjective}
                onChange={(e) => setPeopleObjective(e.target.value)}
              />
            </div>

            <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '16px', borderRadius: '12px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Database style={{ width: '16px', height: '16px' }} />
                2. Data Pillar Objectives (Analytics Accuracy, System Reporting & Metrics)
              </label>
              <textarea
                rows={2}
                className="input-field"
                placeholder="State data integrity, analytics reporting, and system performance metrics..."
                value={dataObjective}
                onChange={(e) => setDataObjective(e.target.value)}
              />
            </div>

            <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '16px', borderRadius: '12px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <EspIcon style={{ width: '18px', height: '18px' }} />
                3. Money Pillar Objectives (Financial Efficiency, ROI & Cost Management)
              </label>
              <textarea
                rows={2}
                className="input-field"
                placeholder="State budget efficiency, cost savings, and financial optimization strategy..."
                value={moneyObjective}
                onChange={(e) => setMoneyObjective(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: STAFFING */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users style={{ width: '20px', height: '20px', color: 'var(--accent-purple)' }} />
            Section 5: Directorate Staffing & Team Roster
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Active Headcount (Staff Count)
              </label>
              <input
                type="number"
                className="input-field"
                value={headcount}
                onChange={(e) => setHeadcount(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Key Directorate Roles Filled
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Lead Engineer, Project Manager, QA Analyst"
                value={keyRoles}
                onChange={(e) => setKeyRoles(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Staffing Needs & Recruitment Gaps
            </label>
            <textarea
              rows={2}
              className="input-field"
              placeholder="Outline required additions, skill gaps, or hiring priorities..."
              value={staffingGaps}
              onChange={(e) => setStaffingGaps(e.target.value)}
            />
          </div>
        </div>

        {/* Submit Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-kingschat"
            style={{ padding: '14px 28px', fontSize: '1rem', borderRadius: '12px' }}
          >
            <Send style={{ width: '18px', height: '18px' }} />
            {submitting ? 'Submitting Report...' : 'Submit Directorate Report'}
          </button>
        </div>
      </form>
    </div>
  );
};
