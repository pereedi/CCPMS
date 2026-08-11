import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Sparkles, ArrowRight, AlertTriangle, Lock } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginWithKingsChat, setDirectSession } = useAuth();
  const [customToken, setCustomToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingFor, setLoadingFor] = useState<'OFEM' | 'AD' | 'CUSTOM' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [dualRoleData, setDualRoleData] = useState<any>(null);

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customToken.trim()) return;
    setLoading(true);
    setLoadingFor('CUSTOM');
    setErrorMsg('');
    try {
      const res = await loginWithKingsChat(customToken.trim());
      if (res && res.requiresRoleSelection) {
        setDualRoleData(res);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Username not in authorized roster.');
    } finally {
      setLoading(false);
      setLoadingFor(null);
    }
  };

  const handleSelectDualRole = async (selectedRole: string) => {
    if (!dualRoleData) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const rawPayload = dualRoleData.tokenOrCodePayload || dualRoleData.originalPayload || dualRoleData.username;
      const cleanToken = typeof rawPayload === 'string' ? rawPayload : (rawPayload.code || rawPayload.token || dualRoleData.username);
      await loginWithKingsChat(cleanToken, selectedRole);
      setDualRoleData(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Role selection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOfficialKingsChatOAuth = () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const clientId = import.meta.env.VITE_KINGSCHAT_CLIENT_ID || 'd697c531-b03b-4370-a4b3-c26483c4f044';
      const redirectUri = window.location.origin + '/kingschat-callback';

      const oauthUrl = `https://accounts.kingschat.online/log-in?clientId=${clientId}&origin=${encodeURIComponent(redirectUri)}`;

      const width = 500;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        oauthUrl,
        'KingsChat OAuth',
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`
      );

      const messageHandler = async (event: MessageEvent) => {
        if (event.data && event.data.type === 'KINGSCHAT_OAUTH_DUAL_ROLE' && event.data.dualRoleData) {
          window.removeEventListener('message', messageHandler);
          if (popup && !popup.closed) popup.close();
          setDualRoleData(event.data.dualRoleData);
          setLoading(false);
        } else if (event.data && event.data.type === 'KINGSCHAT_OAUTH_SUCCESS' && event.data.token) {
          window.removeEventListener('message', messageHandler);
          if (popup && !popup.closed) popup.close();
          try {
            await setDirectSession(event.data.token, event.data.user);
          } catch (err: any) {
            setErrorMsg(err.message || 'KingsChat OAuth verification failed');
          } finally {
            setLoading(false);
          }
        } else if (event.data && event.data.type === 'KINGSCHAT_OAUTH_ERROR') {
          window.removeEventListener('message', messageHandler);
          if (popup && !popup.closed) popup.close();
          setErrorMsg(event.data.message || 'Access Denied: Account not registered in authorized roster.');
          setLoading(false);
        }
      };

      window.addEventListener('message', messageHandler);

      const timer = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(timer);
          window.removeEventListener('message', messageHandler);
          setLoading(false);
        }
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to open KingsChat OAuth window');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,246,0.18) 0%, rgba(5,8,16,1) 70%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)`,
        backgroundSize: '64px 64px',
        pointerEvents: 'none',
      }} />

      {/* Glow orbs */}
      <div style={{
        position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(59,130,246,0.15) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', bottom: '0', right: '10%',
        width: '300px', height: '300px',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '480px',
        display: 'flex', flexDirection: 'column', gap: '24px',
        animation: 'fadeSlideUp 0.5s ease both',
      }}>

        {/* Brand Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '68px', height: '68px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #3b82f6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 12px 40px rgba(245,158,11,0.35)',
          }}>
            <Shield style={{ width: '34px', height: '34px', color: '#fff' }} />
          </div>
          <h1 style={{
            fontSize: '1.6rem', fontWeight: 900, color: '#ffffff',
            letterSpacing: '-0.03em', marginBottom: '6px',
          }}>
            COMMAND AND CONTROL
            <span style={{
              marginLeft: '10px', fontSize: '0.8rem', fontWeight: 700,
              padding: '2px 10px', borderRadius: '6px',
              background: 'rgba(59,130,246,0.15)', color: '#60a5fa',
              border: '1px solid rgba(59,130,246,0.3)', verticalAlign: 'middle',
            }}>CCPMS</span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Command and Control Performance System
          </p>
        </div>

        {/* Primary Official KingsChat OAuth Sign-In Button */}
        <div>
          <button
            onClick={handleOfficialKingsChatOAuth}
            disabled={loading}
            className="btn"
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#000000',
              fontWeight: 800,
              fontSize: '1.05rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: '0 8px 25px rgba(245, 158, 11, 0.4)',
              cursor: loading ? 'not-allowed' : 'pointer',
              border: 'none',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            <Shield style={{ width: '22px', height: '22px' }} />
            {loading ? 'Authenticating with KingsChat...' : 'Sign In with Official KingsChat'}
          </button>
        </div>

        {/* Roster Information Card */}
        <div style={{
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '12px', padding: '14px 16px',
          display: 'flex', alignItems: 'flex-start', gap: '10px',
        }}>
          <Lock style={{ width: '18px', height: '18px', color: '#60a5fa', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.8rem', color: '#dbeafe' }}>
            <strong style={{ color: '#60a5fa', display: 'block', marginBottom: '2px' }}>
              Authorized Roster Enforcement Active
            </strong>
            Login with KingsChat automatically verifies your registered handle 
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div style={{
            background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)',
            borderRadius: '10px', padding: '10px 14px',
            color: '#f87171', fontSize: '0.85rem',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <AlertTriangle style={{ width: '16px', height: '16px' }} />
            {errorMsg}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Lock style={{ width: '12px', height: '12px' }} />
          Secured with KingsChat Auth · CCPMS Enterprise
        </div>
      </div>

      {/* Dual Access Role Selection Modal */}
      {dualRoleData && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(5, 8, 16, 0.88)', backdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '480px', width: '100%', padding: '32px',
            border: '1px solid rgba(245, 158, 11, 0.4)', borderRadius: '24px',
            background: 'linear-gradient(165deg, rgba(17, 24, 39, 0.98) 0%, rgba(10, 15, 26, 0.99) 100%)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 35px rgba(245, 158, 11, 0.2)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '18px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #3b82f6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px auto', boxShadow: '0 10px 25px rgba(245, 158, 11, 0.35)'
              }}>
                <Shield style={{ width: '30px', height: '30px', color: '#ffffff' }} />
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: '0 0 6px 0' }}>
                Dual Access Portal Select
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Welcome <strong style={{ color: '#60a5fa' }}>{dualRoleData.handle && dualRoleData.handle.length <= 20 && !dualRoleData.handle.includes('=') ? `@${dualRoleData.handle.replace(/^@/, '')}` : (dualRoleData.name || dualRoleData.username)}</strong>! Select your access portal level for this session.
              </p>
            </div>

            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
              Select Portal Mode for this Session:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {dualRoleData.availableRoles?.map((item: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => handleSelectDualRole(item.role)}
                  disabled={loading}
                  className="btn btn-secondary"
                  style={{
                    justifyContent: 'space-between', padding: '16px 18px',
                    textAlign: 'left', borderRadius: '14px',
                    borderColor: item.role === 'SUPER_ADMIN' ? 'rgba(139, 92, 246, 0.4)' : 'rgba(59, 130, 246, 0.4)',
                    background: item.role === 'SUPER_ADMIN' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{item.role === 'SUPER_ADMIN' ? '👑' : '🏢'}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>
                        {item.portalLabel}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: item.role === 'SUPER_ADMIN' ? '#c084fc' : '#60a5fa', marginTop: '3px', fontWeight: 500 }}>
                        {item.description}
                      </div>
                    </div>
                  </div>
                  <ArrowRight style={{ width: '18px', height: '18px', color: item.role === 'SUPER_ADMIN' ? '#c084fc' : '#60a5fa' }} />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setDualRoleData(null)}
              style={{
                marginTop: '20px', width: '100%', background: 'transparent',
                border: '1px solid var(--border-color)', borderRadius: '12px',
                padding: '10px', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer'
              }}
            >
              Cancel Sign In
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
