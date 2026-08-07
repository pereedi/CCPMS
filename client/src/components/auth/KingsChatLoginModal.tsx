import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Sparkles, UserCheck, KeyRound, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface KingsChatLoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const KingsChatLoginModal: React.FC<KingsChatLoginModalProps> = ({ isOpen, onClose }) => {
  const { loginWithKingsChat, isKingsChatBypassActive } = useAuth();
  const [customToken, setCustomToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handlePresetLogin = async (token: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      await loginWithKingsChat(token);
      if (onClose) onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customToken.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      await loginWithKingsChat(customToken.trim());
      if (onClose) onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 8, 16, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '32px',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '20px',
        background: 'linear-gradient(165deg, rgba(17, 24, 39, 0.95) 0%, rgba(10, 15, 26, 0.98) 100%)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(245, 158, 11, 0.15)'
      }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)'
          }}>
            <Shield style={{ width: '32px', height: '32px', color: '#ffffff' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            KingsChat Sign-In
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Mission Control Performance Management System (CCPMS)
          </p>
        </div>

        {/* No-Security Mode Warning/Notice Banner */}
        {isKingsChatBypassActive && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <Sparkles style={{ width: '20px', height: '20px', color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.8rem', color: '#fef3c7' }}>
              <strong style={{ display: 'block', color: '#f59e0b', marginBottom: '2px' }}>
                🔓 KingsChat Quick-Login Active (No-Security Mode)
              </strong>
              OAuth security check is currently bypassed for testing. Select a 1-click profile below or enter any KingsChat handle.
            </div>
          </div>
        )}

        {errorMsg && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '16px',
            color: '#f87171',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle style={{ width: '16px', height: '16px' }} />
            {errorMsg}
          </div>
        )}

        {/* 1-Click Preset Account Buttons */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>
            Select 1-Click Test Profile
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => handlePresetLogin('KC_SUPERADMIN')}
              disabled={loading}
              className="btn btn-secondary"
              style={{
                justifyContent: 'space-between',
                padding: '12px 16px',
                textAlign: 'left',
                borderRadius: '12px',
                borderColor: 'rgba(139, 92, 246, 0.4)',
                background: 'rgba(139, 92, 246, 0.08)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.2rem' }}>👑</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ffffff' }}>OFEM — Office of Executive Minister</div>
                  <div style={{ fontSize: '0.75rem', color: '#c084fc' }}>Full System Controls &amp; Approvals</div>
                </div>
              </div>
              <ArrowRight style={{ width: '16px', height: '16px', color: '#c084fc' }} />
            </button>

            <button
              onClick={() => handlePresetLogin('KC_DIRECTOR')}
              disabled={loading}
              className="btn btn-secondary"
              style={{
                justifyContent: 'space-between',
                padding: '12px 16px',
                textAlign: 'left',
                borderRadius: '12px',
                borderColor: 'rgba(59, 130, 246, 0.4)',
                background: 'rgba(59, 130, 246, 0.08)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.2rem' }}>🏢</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ffffff' }}>AD — Assistant Director</div>
                  <div style={{ fontSize: '0.75rem', color: '#60a5fa' }}>Submit &amp; Manage Directorate Reports</div>
                </div>
              </div>
              <ArrowRight style={{ width: '16px', height: '16px', color: '#60a5fa' }} />
            </button>
          </div>
        </div>

        {/* Custom KingsChat handle form */}
        <form onSubmit={handleCustomLogin} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
            Or Enter Custom KingsChat Username / Token
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="e.g. kingschat_user_123"
              value={customToken}
              onChange={(e) => setCustomToken(e.target.value)}
              className="input-field"
              style={{ flex: 1 }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !customToken.trim()}
              className="btn btn-kingschat"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
