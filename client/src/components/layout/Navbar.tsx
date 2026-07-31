import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Bell, User, LogOut, Lock, KeyRound, Sparkles, ChevronDown, Menu, X } from 'lucide-react';

interface NavbarProps {
  onOpenNotifications: () => void;
  onOpenLoginModal: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNotifications,
  onOpenLoginModal,
  onToggleMobileMenu,
  isMobileMenuOpen
}) => {
  const { user, isAuthenticated, logout, isKingsChatBypassActive } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

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
      zIndex: 100
    }}>
      {/* Left Section: Mobile Hamburger Toggle & Brand Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="btn btn-secondary btn-sm mobile-hamburger-btn"
            style={{ padding: '8px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X style={{ width: '20px', height: '20px', color: '#f87171' }} /> : <Menu style={{ width: '20px', height: '20px', color: '#60a5fa' }} />}
            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Menu</span>
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            flexShrink: 0
          }}>
            <Shield style={{ width: '22px', height: '22px', color: '#ffffff' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              MISSION CONTROL <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>CCPMS</span>
            </h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Command & Control Performance Management System
            </p>
          </div>
        </div>
      </div>

      {/* Security Status & Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* KingsChat Security Mode Indicator Badge */}
        <div 
          onClick={onOpenLoginModal}
          style={{
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: '9999px',
            background: isKingsChatBypassActive ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
            border: `1px solid ${isKingsChatBypassActive ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: isKingsChatBypassActive ? '#fbbf24' : '#34d399'
          }}
          title="Click to configure KingsChat mode"
        >
          <Sparkles style={{ width: '13px', height: '13px' }} />
          <span>{isKingsChatBypassActive ? 'KingsChat Quick Login' : 'KingsChat OAuth'}</span>
        </div>

        {/* Notifications Icon Button */}
        {isAuthenticated && (
          <button
            onClick={onOpenNotifications}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0, position: 'relative', flexShrink: 0 }}
          >
            <Bell style={{ width: '18px', height: '18px' }} />
            <span style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-rose)'
            }} />
          </button>
        )}

        {/* User Profile / KingsChat Login Button */}
        {isAuthenticated && user ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(31, 41, 55, 0.7)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '6px 12px',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
            >
              <img
                src={user.profilePhoto || `https://avatar.kingschat.net/${user.kingschatUserId}`}
                alt={user.name}
                style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }}
                onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'; }}
              />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{user.name}</div>
              </div>
              <ChevronDown style={{ width: '14px', height: '14px', color: 'var(--text-muted)' }} />
            </button>

            {showDropdown && (
              <div className="glass-panel animate-fade-in" style={{
                position: 'absolute',
                top: '48px',
                right: 0,
                width: '240px',
                padding: '12px',
                zIndex: 1000,
                background: '#111827'
              }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>{user.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.email || user.kingschatUserId}</div>
                </div>
                
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    onOpenLoginModal();
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '6px' }}
                >
                  <KeyRound style={{ width: '14px', height: '14px' }} />
                  Switch KingsChat Account
                </button>

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    logout();
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', color: '#f87171' }}
                >
                  <LogOut style={{ width: '14px', height: '14px' }} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={onOpenLoginModal} className="btn btn-kingschat" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
            <Shield style={{ width: '16px', height: '16px' }} />
            Sign In with KingsChat
          </button>
        )}
      </div>
    </header>
  );
};
