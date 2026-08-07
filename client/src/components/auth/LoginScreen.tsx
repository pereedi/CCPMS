import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Sparkles, ArrowRight, AlertTriangle, Lock } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginWithKingsChat } = useAuth();
  const [customToken, setCustomToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingFor, setLoadingFor] = useState<'OFEM' | 'AD' | 'CUSTOM' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (token: string, role: 'OFEM' | 'AD' | 'CUSTOM') => {
    setLoading(true);
    setLoadingFor(role);
    setErrorMsg('');
    try {
      await loginWithKingsChat(token);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
      setLoadingFor(null);
    }
  };

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customToken.trim()) return;
    await handleLogin(customToken.trim(), 'CUSTOM');
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
        display: 'flex', flexDirection: 'column', gap: '28px',
        animation: 'fadeSlideUp 0.5s ease both',
      }}>

        {/* Brand Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '68px', height: '68px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 12px 40px rgba(59,130,246,0.35)',
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
            Command & Control Performance Management System
          </p>
        </div>

        {/* Testing Mode Banner */}
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: '12px', padding: '12px 16px',
          display: 'flex', alignItems: 'flex-start', gap: '10px',
        }}>
          <Sparkles style={{ width: '18px', height: '18px', color: '#f59e0b', flexShrink: 0, marginTop: '1px' }} />
          <div style={{ fontSize: '0.78rem', color: '#fef3c7' }}>
            <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '2px' }}>
              Testing Phase — KingsChat Quick-Login Active
            </strong>
            OAuth security is bypassed. Select your portal below to access the system.
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

        {/* Login Tiles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px',
          }}>
            Select Your Portal
          </div>

          {/* OFEM Tile */}
          <button
            id="login-ofem-btn"
            onClick={() => handleLogin('KC_SUPERADMIN', 'OFEM')}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 20px', borderRadius: '14px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: loadingFor === 'OFEM'
                ? 'rgba(139,92,246,0.2)'
                : 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(99,102,241,0.08) 100%)',
              outline: '1.5px solid rgba(139,92,246,0.4)',
              transition: 'all 0.2s ease',
              textAlign: 'left',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.outline = '1.5px solid rgba(139,92,246,0.8)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.outline = '1.5px solid rgba(139,92,246,0.4)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(124,58,237,0.4)',
              }}>
                <span style={{ fontSize: '1.3rem' }}>👑</span>
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginBottom: '2px' }}>
                  OFEM — Office of Executive Minister
                </div>
                <div style={{ fontSize: '0.75rem', color: '#c084fc' }}>
                  Full system access · Approve reports · Mission Command
                </div>
              </div>
            </div>
            {loadingFor === 'OFEM'
              ? <div style={{ width: '16px', height: '16px', border: '2px solid #c084fc', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              : <ArrowRight style={{ width: '18px', height: '18px', color: '#c084fc' }} />
            }
          </button>

          {/* AD Tile */}
          <button
            id="login-ad-btn"
            onClick={() => handleLogin('KC_DIRECTOR', 'AD')}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '18px 20px', borderRadius: '14px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: loadingFor === 'AD'
                ? 'rgba(245,158,11,0.18)'
                : 'linear-gradient(135deg, rgba(245,158,11,0.10) 0%, rgba(59,130,246,0.07) 100%)',
              outline: '1.5px solid rgba(245,158,11,0.35)',
              transition: 'all 0.2s ease',
              textAlign: 'left',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.outline = '1.5px solid rgba(245,158,11,0.8)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.outline = '1.5px solid rgba(245,158,11,0.35)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(245,158,11,0.35)',
              }}>
                <span style={{ fontSize: '1.3rem' }}>🏢</span>
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginBottom: '2px' }}>
                  AD — Assistant Director Portal
                </div>
                <div style={{ fontSize: '0.75rem', color: '#fbbf24' }}>
                  Submit reports · Track KPIs · Directorate management
                </div>
              </div>
            </div>
            {loadingFor === 'AD'
              ? <div style={{ width: '16px', height: '16px', border: '2px solid #fbbf24', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              : <ArrowRight style={{ width: '18px', height: '18px', color: '#fbbf24' }} />
            }
          </button>
        </div>

        {/* Custom Token Form */}
        <form onSubmit={handleCustomLogin} style={{
          borderTop: '1px solid var(--border-color)', paddingTop: '20px',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <div style={{
            fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            Or Enter Custom KingsChat Handle
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              id="custom-token-input"
              type="text"
              placeholder="e.g. KC_CUSTOM_USER or email"
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
              {loadingFor === 'CUSTOM' ? 'Signing In...' : 'Sign In'}
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
