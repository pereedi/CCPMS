import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, PortalRole } from '../types';
import { api } from '../services/api';


interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentRole: PortalRole | null;
  loginWithKingsChat: (token?: string, requestedRole?: string) => Promise<any>;
  setDirectSession: (accessToken: string, user?: User) => Promise<void>;
  logout: () => void;
  isKingsChatBypassActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Derive the portal role from the user's DB role — handles both string and object shapes */
const derivePortalRole = (user: User | null): PortalRole | null => {
  if (!user) return null;
  // role can be a plain string (from login response) or an object { name } (from /auth/me)
  const raw: any = user.role;
  const roleName = typeof raw === 'string'
    ? raw.toUpperCase()
    : (raw?.name || '').toUpperCase();
  if (roleName === 'SUPER_ADMIN' || roleName === 'OFEM') return 'OFEM';
  return 'AD';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // On mount: restore existing session only — do NOT auto-login to keep login screen visible
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('ccpms_access_token');
      if (token) {
        try {
          const res: any = await api.get('/auth/me');
          if (res.success && res.data) {
            setUser(res.data);
          }
        } catch (err) {
          console.warn('Session restoration failed, clearing token:', err);
          localStorage.removeItem('ccpms_access_token');
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const loginWithKingsChat = async (token?: string, requestedRole?: string) => {
    setIsLoading(true);
    try {
      const payloadToken = token || 'KC_DIRECTOR';
      const res: any = await api.post('/auth/kingschat', { token: payloadToken, requestedRole });

      if (res.success && res.data) {
        if (res.data.requiresRoleSelection) {
          return res.data;
        }
        const { accessToken, user: authUser } = res.data;
        localStorage.setItem('ccpms_access_token', accessToken);
        setUser(authUser);
        return res.data;
      } else {
        throw new Error(res.message || 'KingsChat authentication failed');
      }
    } catch (error: any) {
      console.error('KingsChat Login Error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const setDirectSession = async (accessToken: string, _authUser?: User) => {
    // Always store token first
    localStorage.setItem('ccpms_access_token', accessToken);
    // Always fetch the definitive clean profile from /auth/me using the stored token.
    // We intentionally ignore the `_authUser` passed from postMessage — it may be
    // partial, missing, or contain the raw OAuth code instead of a clean user object.
    try {
      const res: any = await api.get('/auth/me');
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        localStorage.removeItem('ccpms_access_token');
      }
    } catch (err) {
      console.error('Failed to load user profile after OAuth session:', err);
      localStorage.removeItem('ccpms_access_token');
    }
  };

  const logout = () => {
    localStorage.removeItem('ccpms_access_token');
    setUser(null);
  };

  const currentRole = derivePortalRole(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        currentRole,
        loginWithKingsChat,
        setDirectSession,
        logout,
        isKingsChatBypassActive: true, // KingsChat security bypass enabled for dev/testing
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
