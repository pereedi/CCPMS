import React, { useEffect } from 'react';

export const KingsChatCallbackHandler: React.FC = () => {
  useEffect(() => {
    // Parse token or authorization code from URL hash (#access_token=...) or query string (?code=... or ?token=...)
    const hash = window.location.hash;
    const query = new URLSearchParams(window.location.search);

    let token = query.get('code') || query.get('token') || query.get('access_token');

    if (!token && hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      token = hashParams.get('access_token') || hashParams.get('code') || hashParams.get('token');
    }

    if (token) {
      if (window.opener) {
        window.opener.postMessage({ type: 'KINGSCHAT_OAUTH_SUCCESS', token }, '*');
        window.close();
      } else {
        // Direct page load fallback
        localStorage.setItem('ccpms_kc_oauth_token', token);
        window.location.href = '/';
      }
    }
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
      <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '6px' }}>Returning to Mission Control System...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
