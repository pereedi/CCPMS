import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { OverviewTab } from './components/dashboard/OverviewTab';
import { DirectoratesTab } from './components/directorates/DirectoratesTab';
import { KPIsTab } from './components/kpis/KPIsTab';
import { ProjectsTab } from './components/projects/ProjectsTab';
import { ReportsTab } from './components/reports/ReportsTab';
import { AuditLogsTab } from './components/audit/AuditLogsTab';
import { DirectorReportForm } from './components/directorates/DirectorReportForm';
import { SubmittedReportsView } from './components/reports/SubmittedReportsView';
import { PerformanceCalendar } from './components/calendar/PerformanceCalendar';
import { NotificationsModal } from './components/notifications/NotificationsModal';
import { LoginScreen } from './components/auth/LoginScreen';

const DashboardContent: React.FC = () => {
  const { user, isAuthenticated, isLoading, currentRole } = useAuth();

  const defaultTab = currentRole === 'OFEM' ? 'overview' : 'submit-report';
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  // When currentRole changes (login/logout), reset to role's home tab
  useEffect(() => {
    if (currentRole === 'OFEM') setActiveTab('overview');
    else if (currentRole === 'AD') setActiveTab('submit-report');
  }, [currentRole]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // ── Loading state ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-secondary)',
        fontSize: '1.1rem',
        fontWeight: 600
      }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '40px', height: '40px',
            border: '3px solid rgba(59,130,246,0.3)',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          Initializing Mission Control System...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Not authenticated → show Login Screen ─────────────────────────
  if (!isAuthenticated || !user) {
    return <LoginScreen />;
  }

  // ── Render tabs based on role ─────────────────────────────────────
  const renderTabContent = () => {
    switch (activeTab) {
      // OFEM tabs
      case 'overview':          return <OverviewTab />;
      case 'calendar':          return <PerformanceCalendar />;
      case 'directorates':      return <DirectoratesTab />;
      case 'kpis':              return <KPIsTab />;
      case 'projects':          return <ProjectsTab />;
      case 'reports':           return <ReportsTab />;
      case 'audit':             return <AuditLogsTab />;
      // AD tabs
      case 'submit-report':
        return (
          <DirectorReportForm
            onReportSubmitted={() => setActiveTab('submitted-reports')}
          />
        );
      case 'submitted-reports': return <SubmittedReportsView />;
      default:
        return currentRole === 'OFEM' ? <OverviewTab /> : <DirectorReportForm onReportSubmitted={() => setActiveTab('submitted-reports')} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <Navbar
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Backdrop overlay for mobile menu drawer */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(5, 8, 16, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9998
          }}
        />
      )}

      <div className="main-content-layout" style={{ display: 'flex', flex: 1 }}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <main className="app-main-view" style={{ flex: 1, padding: '32px', overflowY: 'auto', maxWidth: '1400px' }}>
          {renderTabContent()}
        </main>
      </div>

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}

export default App;
