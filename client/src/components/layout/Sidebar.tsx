import React from 'react';
import { LayoutDashboard, Building2, Target, FolderKanban, FileText, Activity, FileSpreadsheet, Send, ShieldCheck, Calendar, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen,
  onCloseMobile
}) => {
  const { user, currentRole } = useAuth();

  const ofemMenuItems = [
    { id: 'overview',     label: 'Executive Command Center',  icon: LayoutDashboard },
    { id: 'calendar',     label: 'Performance Calendar',       icon: Calendar },
    { id: 'directorates', label: 'Directorates & Depts',       icon: Building2 },
    { id: 'kpis',         label: 'KPI Target Tracker',         icon: Target },
    { id: 'projects',     label: 'Projects & Milestones',      icon: FolderKanban },
    { id: 'reports',      label: 'Submitted Reports Feed',     icon: FileText },
    { id: 'audit',        label: 'System Audit Trail',         icon: Activity },
  ];

  const adMenuItems = [
    { id: 'submit-report',     label: 'Submit Directorate Report', icon: Send },
    { id: 'submitted-reports', label: 'View Submitted Reports',    icon: FileSpreadsheet },
    { id: 'calendar',          label: 'Performance Calendar',      icon: Calendar },
    { id: 'kpis',              label: 'Directorate KPIs',          icon: Target },
    { id: 'projects',          label: 'Directorate Projects',      icon: FolderKanban },
  ];

  const menuItems   = currentRole === 'OFEM' ? ofemMenuItems : adMenuItems;
  const isOFEM      = currentRole === 'OFEM';
  const accentColor = isOFEM ? 'var(--accent-blue)' : 'var(--kingschat-gold)';

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside
      className={`app-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
      style={{
        width: '270px',
        borderRight: '1px solid var(--border-color)',
        background: 'rgba(11, 15, 25, 0.98)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 16px',
        height: 'calc(100vh - 72px)',
        position: 'sticky',
        top: '72px',
        zIndex: 90,
      }}
    >
      {/* Mobile Close Button */}
      {onCloseMobile && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }} className="mobile-close-btn">
          <button
            onClick={onCloseMobile}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px 12px', borderRadius: '8px', color: '#f87171', borderColor: 'rgba(244, 63, 94, 0.3)' }}
          >
            <X style={{ width: '16px', height: '16px' }} /> Close Menu
          </button>
        </div>
      )}

      {/* Active Portal Badge */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          Active Portal
        </div>
        <div style={{
          padding: '10px 14px',
          borderRadius: '10px',
          background: isOFEM ? 'rgba(99,102,241,0.12)' : 'rgba(245,158,11,0.10)',
          border: `1px solid ${isOFEM ? 'rgba(99,102,241,0.35)' : 'rgba(245,158,11,0.35)'}`,
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontSize: '1.1rem' }}>{isOFEM ? '👑' : '🏢'}</span>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff' }}>
              {isOFEM ? 'Office of Executive Minister (OFEM)' : (user?.directorate?.name || 'AD — Assistant Director Portal')}
            </div>
            <div style={{ fontSize: '0.72rem', color: isOFEM ? '#c084fc' : '#fbbf24', fontWeight: 600 }}>
              {user?.name || (isOFEM ? 'Executive Access' : 'Directorate Access')}
              {(user?.kingschatUserId || user?.username) && (
                <span style={{ color: '#60a5fa', marginLeft: '6px', fontWeight: 700 }}>
                  (@{user.kingschatUserId || user.username})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section label */}
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px 8px 8px' }}>
        {isOFEM ? 'Executive Management' : 'Directorate Actions'}
      </div>

      {/* Nav Items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto' }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                border: 'none',
                background: isActive
                  ? (isOFEM
                    ? 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(99,102,241,0.2) 100%)'
                    : 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(59,130,246,0.2) 100%)')
                  : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                borderLeft: isActive ? `3px solid ${accentColor}` : '3px solid transparent',
              }}
            >
              <Icon style={{ width: '18px', height: '18px', color: isActive ? accentColor : 'var(--text-muted)' }} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* System Status Banner */}
      <div style={{
        padding: '14px',
        borderRadius: '12px',
        background: 'rgba(31, 41, 55, 0.4)',
        border: '1px solid var(--border-color)',
        marginTop: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <ShieldCheck style={{ width: '16px', height: '16px', color: '#10b981' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff' }}>CCPMS Online</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          Mode: {isOFEM ? 'OFEM — Office of Executive Minister' : 'AD — Assistant Director Reporting Portal'}
        </div>
      </div>
    </aside>
  );
};
