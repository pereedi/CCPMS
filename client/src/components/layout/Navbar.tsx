import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Bell, LogOut, KeyRound, ChevronDown, Menu, X, Crown, Building2 } from 'lucide-react';

interface NavbarProps {
  onOpenNotifications: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNotifications,
  onToggleMobileMenu,
  isMobileMenuOpen,
}) => {
  const { user, isAuthenticated, logout, currentRole } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const isOFEM = currentRole === 'OFEM';

  /** Get the clean @handle to display — always from kingschatUserId (resolved by auth service) */
  const displayHandle = (user?.kingschatUserId || user?.username || '').replace(/^@/, '');

  /** Get avatar: prefer profilePhoto from KC OAuth, fall back to avatar.kingschat.net with clean handle only */
  const getAvatarUrl = (u: any) => {
    if (u?.profilePhoto && u.profilePhoto.startsWith('http') && !u.profilePhoto.includes('undefined')) {
      return u.profilePhoto;
    }
    const handle = u?.kingschatUserId || u?.username;
    if (!handle || handle.length > 25 || handle.includes('/') || handle.includes('=') || handle.includes('+')) {
      return isOFEM
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';
    }
    return `https://avatar.kingschat.net/${handle.replace(/^@/, '')}`;
  };

  /** Get role label — OFEM or directorate title */
  const roleLabel = isOFEM
    ? '👑 Office of Executive Minister (OFEM)'
    : `🏢 ${(user as any)?.directorateRole || (user?.directorate?.name ? `${user.directorate.name} Director` : 'Assistant Director (AD)')}`;

  const roleColor = isOFEM ? '#c084fc' : '#fbbf24';

  return (
    <header className="navbar-container" style={{
      height: '72px',
      borderBottom: '1px solid var(--border-color)',
      background: 'rgba(11, 15, 25, 0.95)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>

      {/* Left: Hamburger + Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="btn btn-secondary btn-sm mobile-hamburger-btn"
            style={{ padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Toggle Navigation Menu"
          >
            {isMobileMenuOpen
              ? <X style={{ width: '20px', height: '20px', color: '#f87171' }} />
              : <Menu style={{ width: '20px', height: '20px', color: '#60a5fa' }} />}
            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Menu</span>
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', flexShrink: 0,
          }}>
            <Shield style={{ width: '22px', height: '22px', color: '#ffffff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              COMMAND & CONTROL{' '}
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                CCPMS
              </span>
            </h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Command and Control Performance System
            </p>
          </div>
        </div>
      </div>

      {/* Right: Role Badge + Notifications + User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

        {/* Role Badge */}
        {isAuthenticated && (
          <div style={{
            padding: '5px 12px', borderRadius: '9999px',
            background: isOFEM ? 'rgba(99,102,241,0.12)' : 'rgba(245,158,11,0.10)',
            border: `1px solid ${isOFEM ? 'rgba(99,102,241,0.35)' : 'rgba(245,158,11,0.35)'}`,
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '0.72rem', fontWeight: 700,
            color: isOFEM ? '#c084fc' : '#fbbf24',
          }}>
            {isOFEM
              ? <Crown style={{ width: '12px', height: '12px' }} />
              : <Building2 style={{ width: '12px', height: '12px' }} />}
            <span>{isOFEM ? 'OFEM' : 'AD Portal'}</span>
          </div>
        )}

        {/* Notifications */}
        {isAuthenticated && (
          <button
            onClick={onOpenNotifications}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0, position: 'relative', flexShrink: 0 }}
          >
            <Bell style={{ width: '18px', height: '18px' }} />
            <span style={{
              position: 'absolute', top: '8px', right: '8px',
              width: '8px', height: '8px', borderRadius: '50%',
              backgroundColor: 'var(--accent-rose)',
            }} />
          </button>
        )}

        {/* User Profile Dropdown */}
        {isAuthenticated && user ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(31, 41, 55, 0.7)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px', padding: '6px 12px',
                cursor: 'pointer', color: 'var(--text-primary)',
              }}
            >
              {/* Avatar */}
              <img
                src={getAvatarUrl(user)}
                alt={`@${displayHandle}`}
                style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${roleColor}`, flexShrink: 0 }}
                onError={(e: any) => {
                  e.target.src = isOFEM
                    ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                    : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';
                }}
              />
              <div style={{ textAlign: 'left', minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  @{displayHandle || 'user'}
                </div>
                <div style={{ fontSize: '0.65rem', color: roleColor, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isOFEM ? 'OFEM' : 'AD Portal'}
                </div>
              </div>
              <ChevronDown style={{ width: '14px', height: '14px', color: 'var(--text-muted)', flexShrink: 0 }} />
            </button>

            {showDropdown && (
              <div className="glass-panel animate-fade-in" style={{
                position: 'absolute', top: '52px', right: 0,
                width: '270px', padding: '16px', zIndex: 1000, background: '#0d1117',
                border: `1px solid ${roleColor}40`, borderRadius: '16px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
              }}>
                {/* Profile Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0 14px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '12px' }}>
                  <img
                    src={getAvatarUrl(user)}
                    alt={`@${displayHandle}`}
                    style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${roleColor}`, flexShrink: 0 }}
                    onError={(e: any) => {
                      e.target.src = isOFEM
                        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150';
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      @{displayHandle || 'user'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: roleColor, fontWeight: 700, marginTop: '2px' }}>
                      {roleLabel}
                    </div>
                    {user.email && (
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.email}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => { setShowDropdown(false); logout(); }}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', color: '#f87171' }}
                >
                  <LogOut style={{ width: '14px', height: '14px' }} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
};
