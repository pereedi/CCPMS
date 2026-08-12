import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';

/**
 * KingsChatCallbackHandler
 *
 * This component is rendered at /kingschat-callback.
 * KingsChat redirects here with ?code=AUTHORIZATION_CODE after the user approves login.
 *
 * Flow:
 *  1. Extract the raw authorization code from the URL query string.
 *  2. POST it to /api/auth/kingschat — the backend exchanges it for a real access token,
 *     fetches the user profile, matches against the roster, and returns a signed CCPMS JWT.
 *  3. Send the signed JWT (NOT the raw code) back to the opener window via postMessage.
 *  4. The opener (LoginScreen.tsx) calls setDirectSession(jwt), which always calls /auth/me
 *     to get the definitive clean user profile — no base64 strings ever reach the UI.
 *
 * NOTE: We never postMessage the raw code. We always exchange it first.
 */
export const KingsChatCallbackHandler: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      // ── 1. Extract raw authorization code from URL ─────────────────────────
      const query = new URLSearchParams(window.location.search);
      const hash  = window.location.hash;

      let rawCode: string | null =
        query.get('code') ||
        query.get('token') ||
        query.get('access_token');

      if (!rawCode && hash) {
        const hashParams = new URLSearchParams(hash.substring(1));
        rawCode = hashParams.get('access_token') || hashParams.get('code') || hashParams.get('token');
      }

      if (!rawCode) {
        const msg = 'Authorization code missing from KingsChat OAuth redirect.';
        setErrorMsg(msg);
        setStatus('error');
        if (window.opener) {
          window.opener.postMessage({ type: 'KINGSCHAT_OAUTH_ERROR', message: msg }, '*');
          setTimeout(() => window.close(), 2000);
        }
        return;
      }

      // ── 2. Exchange code with CCPMS backend ────────────────────────────────
      // Backend returns: { accessToken: <signed CCPMS JWT>, user: {...}, ... }
      // OR: { requiresRoleSelection: true, ... }
      try {
        const res: any = await api.post('/auth/kingschat', { code: rawCode });

        if (!res?.success) {
          throw new Error(res?.message || 'KingsChat verification failed');
        }

        const data = res.data;

        // ── Dual role: send selection data back to opener ──────────────────
        if (data?.requiresRoleSelection) {
          if (window.opener) {
            window.opener.postMessage({ type: 'KINGSCHAT_OAUTH_DUAL_ROLE', dualRoleData: data }, '*');
            window.close();
          } else {
            sessionStorage.setItem('ccpms_dual_role_pending', JSON.stringify(data));
            window.location.href = '/?dual_role=1';
          }
          return;
        }

        // ── Single role: send signed CCPMS JWT back to opener ──────────────
        // We send the JWT accessToken, NOT the raw code.
        // LoginScreen will call setDirectSession(jwt) → /auth/me → clean user.
        const { accessToken } = data;
        if (!accessToken) {
          throw new Error('Backend did not return an access token');
        }

        if (window.opener) {
          window.opener.postMessage({ type: 'KINGSCHAT_OAUTH_SUCCESS', token: accessToken }, '*');
          window.close();
        } else {
          // Direct redirect fallback (no popup)
          localStorage.setItem('ccpms_access_token', accessToken);
          window.location.href = '/';
        }

      } catch (err: any) {
        const msg = err.message || 'Verification failed. Account not in authorized roster.';
        setErrorMsg(msg);
        setStatus('error');
        if (window.opener) {
          window.opener.postMessage({ type: 'KINGSCHAT_OAUTH_ERROR', message: msg }, '*');
          setTimeout(() => window.close(), 2500);
        }
      }
    };

    handleCallback();
  }, []);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0f1a',
      color: '#ffffff',
      fontFamily: 'system-ui, sans-serif',
      padding: '24px',
      textAlign: 'center',
    }}>
      {status === 'error' ? (
        <div style={{
          maxWidth: '440px',
          padding: '28px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '16px',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🚫</div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f87171', margin: '0 0 8px' }}>
            Access Denied
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
            {errorMsg}
          </p>
        </div>
      ) : (
        <>
          <div style={{
            width: '44px', height: '44px',
            border: '3px solid rgba(245,158,11,0.2)',
            borderTopColor: '#f59e0b',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '20px',
          }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 6px' }}>
            KingsChat Authentication
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
            Verifying credentials with CCPMS...
          </p>
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
