import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';

export const KingsChatCallbackHandler: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const hash = window.location.hash;
      const query = new URLSearchParams(window.location.search);

      let rawCodeOrToken = query.get('code') || query.get('token') || query.get('access_token');

      if (!rawCodeOrToken && hash) {
        const hashParams = new URLSearchParams(hash.substring(1));
        rawCodeOrToken = hashParams.get('access_token') || hashParams.get('code') || hashParams.get('token');
      }

      if (!rawCodeOrToken) {
        if (window.opener) {
          window.opener.postMessage({ type: 'KINGSCHAT_OAUTH_ERROR', message: 'Authorization code missing from OAuth redirect' }, '*');
          setTimeout(() => window.close(), 1500);
        } else {
          setError('Authorization code missing from OAuth redirect');
        }
        return;
      }

      try {
        // Exchange code with CCPMS backend to retrieve real access tokens & sanitized user profile
        const res: any = await api.post('/auth/kingschat', { code: rawCodeOrToken, token: rawCodeOrToken });

        if (res.success && res.data) {
          if (res.data.requiresRoleSelection) {
            if (window.opener) {
              window.opener.postMessage({ type: 'KINGSCHAT_OAUTH_DUAL_ROLE', dualRoleData: res.data }, '*');
              window.close();
            } else {
              sessionStorage.setItem('ccpms_dual_role_pending', JSON.stringify(res.data));
              window.location.href = '/?dual_role=1';
            }
            return;
          }

          const { accessToken, user } = res.data;
          if (window.opener) {
            window.opener.postMessage({ type: 'KINGSCHAT_OAUTH_SUCCESS', token: accessToken, user }, '*');
            window.close();
          } else {
            localStorage.setItem('ccpms_access_token', accessToken);
            window.location.href = '/';
          }
        } else {
          throw new Error(res.message || 'KingsChat verification failed');
        }
      } catch (err: any) {
        const message = err.message || 'Verification failed. Username not in authorized roster.';
        if (window.opener) {
          window.opener.postMessage({ type: 'KINGSCHAT_OAUTH_ERROR', message }, '*');
          setTimeout(() => window.close(), 2000);
        } else {
          setError(message);
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
      fontFamily: 'sans-serif'
    }}>
      {error ? (
        <div style={{
          maxWidth: '450px',
          padding: '24px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f87171' }}>Access Denied</h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '8px' }}>{error}</p>
        </div>
      ) : (
        <>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(245, 158, 11, 0.3)',
            borderTopColor: '#f59e0b',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '16px'
          }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>KingsChat Authentication Complete</h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '6px' }}>Exchanging security credentials with CCPMS...</p>
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
