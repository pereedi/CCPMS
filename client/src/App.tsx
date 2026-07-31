import React, { useState } from 'react';
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
import { KingsChatLoginModal } from './components/auth/KingsChatLoginModal';
import { NotificationsModal } from './components/notifications/NotificationsModal';

const DashboardContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [activeRoleView, setActiveRoleView] = useState<'SUPER_ADMIN' | 'DIRECTOR'>('SUPER_ADMIN');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

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
        Initializing Mission Control System (CCPMS)...
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />;
      case 'calendar': return <PerformanceCalendar />;
      case 'directorates': return <DirectoratesTab />;
      case 'kpis': return <KPIsTab />;
      case 'projects': return <ProjectsTab />;
      case 'reports': return <ReportsTab />;
      case 'audit': return <AuditLogsTab />;
      case 'submit-report': 
        return <DirectorReportForm onReportSubmitted={() => setActiveTab('submitted-reports')} />;
      case 'submitted-reports': 
        return <SubmittedReportsView />;
      default: 
        return <OverviewTab />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <Navbar
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Backdrop overlay for mobile menu drawer */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
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
          activeRoleView={activeRoleView}
          setActiveRoleView={setActiveRoleView}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
        
        <main className="app-main-view" style={{ flex: 1, padding: '32px', overflowY: 'auto', maxWidth: '1400px' }}>
          {renderTabContent()}
        </main>
      </div>

      <KingsChatLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

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
