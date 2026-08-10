import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Sparkles, ArrowRight, AlertTriangle, Lock } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginWithKingsChat } = useAuth();
  const [customToken, setCustomToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingFor, setLoadingFor] = useState<'OFEM' | 'AD' | 'CUSTOM' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customToken.trim()) return;
    setLoading(true);
    setLoadingFor('CUSTOM');
    setErrorMsg('');
    try {
      await loginWithKingsChat(customToken.trim());
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Username not in authorized roster.');
    } finally {
      setLoading(false);
      setLoadingFor(null);
    }
  };

  const handleOfficialKingsChatOAuth = () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const clientId = import.meta.env.VITE_KINGSCHAT_CLIENT_ID || 'b4dbce23-356f-41f5-aad9-96368e1e929c';
      const redirectUri = window.location.origin + '/kingschat-callback';
      const scopes = encodeURIComponent(JSON.stringify(['user_info']));

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
        if (event.data && event.data.type === 'KINGSCHAT_OAUTH_SUCCESS' && event.data.token) {
          window.removeEventListener('message', messageHandler);
          if (popup && !popup.closed) popup.close();
          try {
            await loginWithKingsChat(event.data.token);
          } catch (err: any) {
            setErrorMsg(err.message || 'KingsChat OAuth verification failed');
          } finally {
            setLoading(false);
          }
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
            MISSION CONTROL
            <span style={{
              marginLeft: '10px', fontSize: '0.8rem', fontWeight: 700,
              padding: '2px 10px', borderRadius: '6px',
              background: 'rgba(59,130,246,0.15)', color: '#60a5fa',
              border: '1px solid rgba(59,130,246,0.3)', verticalAlign: 'middle',
            }}>CCPMS</span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Command &amp; Control Performance Management System
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
            Login with KingsChat automatically verifies your registered handle (e.g. <code>pereedi</code> for OFEM, <code>alexdabest</code> for Tech AD) and routes you to your authorized portal.
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

        {/* Custom Roster Handle Form for Manual Roster Testing */}
        <form onSubmit={handleCustomLogin} style={{
          borderTop: '1px solid var(--border-color)', paddingTop: '20px',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <div style={{
            fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            Or Sign In with Authorized KingsChat Username
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              id="custom-token-input"
              type="text"
              placeholder="e.g. pereedi, alexdabest, or fintech_ad"
              value={customToken}
              onChange={e => setCustomToken(e.target.value)}
              className="input-field"
              style={{ flex: 1, fontSize: '0.85rem' }}
              disabled={loading}
            />
            <button
              id="custom-login-btn"
              type="submit"
              disabled={loading || !customToken.trim()}
              className="btn btn-kingschat"
              style={{ whiteSpace: 'nowrap' }}
            >
              {loadingFor === 'CUSTOM' ? 'Verifying...' : 'Sign In'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Lock style={{ width: '12px', height: '12px' }} />
          Secured with KingsChat Auth · CCPMS v2.0 Testing Phase
        </div>
      </div>

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
