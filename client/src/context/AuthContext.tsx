import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithKingsChat: (token?: string) => Promise<void>;
  logout: () => void;
  isKingsChatBypassActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check existing saved session on initial mount or auto-login default session
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('ccpms_access_token');
      if (token) {
        try {
          const res: any = await api.get('/auth/me');
          if (res.success && res.data) {
            setUser(res.data);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Session restoration failed, auto-logging in default user:', err);
        }
      }
      
      // Auto-authenticate default session in no-security mode
      try {
        await loginWithKingsChat('KC_SUPERADMIN');
      } catch (e) {
        console.warn('Default auto-login failed:', e);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const loginWithKingsChat = async (token?: string) => {
    setIsLoading(true);
    try {
      const payloadToken = token || 'KC_SUPERADMIN';
      const res: any = await api.post('/auth/kingschat-login', { token: payloadToken });
      
      if (res.success && res.data) {
        const { accessToken, user: authUser } = res.data;
        localStorage.setItem('ccpms_access_token', accessToken);
        setUser(authUser);
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

  const logout = () => {
    localStorage.removeItem('ccpms_access_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithKingsChat,
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
