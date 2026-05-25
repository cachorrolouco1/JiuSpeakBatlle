import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  profile_image: string;
  belt_rank: 'White' | 'Blue' | 'Purple' | 'Brown' | 'Black';
  xp: number;
  streak: number;
  email_verified: boolean;
  is_online: boolean;
  role?: 'ADMIN' | 'MODERATOR' | 'USER';
  is_admin?: boolean;
  permissions?: string[];
  last_login?: string;
  username?: string;
  username_locked?: boolean;
  is_verified?: boolean;
  last_profile_update?: string;
  biography?: string;
  social_instagram?: string;
  social_twitter?: string;
  language?: string;
  theme_visual?: string;
  privacy_profile?: 'public' | 'private';
  created_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  registerUser: (formData: any) => Promise<{ success: boolean; message: string; simulatedLink?: string }>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string; simulatedLink?: string }>;
  submitPasswordReset: (token: string, pass: string, confirm: string) => Promise<{ success: boolean; message: string }>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; message: string }>;
  triggerSocialSignIn: (provider: 'Google' | 'Apple', email: string, name: string) => Promise<{ success: boolean; message: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-authenticate on load if token exists
  useEffect(() => {
    const savedToken = localStorage.getItem('jiuspeak_auth_token');
    if (savedToken) {
      setToken(savedToken);
      fetchCurrentUser(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const response = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Token stale, logout
        logout();
      }
    } catch (e) {
      console.error("Error fetching user profile from server backend", e);
      // Resilient local fallback if backend server isn't ready
      const localCachedUser = localStorage.getItem('jiuspeak_local_user');
      if (localCachedUser) {
        setUser(JSON.parse(localCachedUser));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, message: data.error || 'Falha na autenticação.' };
      }

      localStorage.setItem('jiuspeak_auth_token', data.token);
      localStorage.setItem('jiuspeak_local_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      
      // Sync XP values securely
      localStorage.setItem('jiuspeak_xp', data.user.xp.toString());
      localStorage.setItem('jiuspeak_streak', data.user.streak.toString());

      return { success: true, message: data.message };
    } catch (e) {
      return { success: false, message: 'Erro de conexão com o servidor de batalha. Verifique sua rede.' };
    }
  };

  const registerUser = async (formData: any) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.error || 'Erro ao processar cadastro.' };
      }

      localStorage.setItem('jiuspeak_auth_token', data.token);
      localStorage.setItem('jiuspeak_local_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);

      // Sync local assets
      localStorage.setItem('jiuspeak_xp', '0');
      localStorage.setItem('jiuspeak_streak', '1');

      return { 
        success: true, 
        message: data.message, 
        simulatedLink: data.verification_link_simulated 
      };
    } catch (e) {
      return { success: false, message: 'Conexão interrompida. Verifique sua conexão e tente novamente.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('jiuspeak_auth_token');
    localStorage.removeItem('jiuspeak_local_user');
    setToken(null);
    setUser(null);
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, message: data.error || 'Erro ao emitir redefinição.' };
      }

      return { 
        success: true, 
        message: data.message, 
        simulatedLink: data.reset_link_simulated 
      };
    } catch (e) {
      return { success: false, message: 'Conexão malsucedida com o servidor.' };
    }
  };

  const submitPasswordReset = async (resetToken: string, pass: string, confirm: string) => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, new_password: pass, confirm_password: confirm })
      });
      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.error || 'Erro ao redefinir sua senha.' };
      }

      return { success: true, message: data.message };
    } catch (e) {
      return { success: false, message: 'Verifique sua conexão e tente novamente.' };
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!token) return { success: false, message: 'Usuário não autenticado.' };

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.error || 'Erro ao atualizar dados.' };
      }

      setUser(data.user);
      localStorage.setItem('jiuspeak_local_user', JSON.stringify(data.user));
      
      if (data.user.xp !== undefined) {
        localStorage.setItem('jiuspeak_xp', data.user.xp.toString());
      }
      if (data.user.streak !== undefined) {
        localStorage.setItem('jiuspeak_streak', data.user.streak.toString());
      }

      return { success: true, message: data.message };
    } catch (e) {
      return { success: false, message: 'Servidor indisponível no momento. Salvando alterações temporariamente.' };
    }
  };

  const triggerSocialSignIn = async (provider: 'Google' | 'Apple', email: string, name: string) => {
    try {
      const response = await fetch('/api/auth/social-sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provider, 
          email, 
          first_name: name.split(' ')[0] || 'Atleta', 
          last_name: name.split(' ').slice(1).join(' ') || 'Social',
          profile_image: provider === 'Google' ? '🌐' : '🍎'
        })
      });
      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.error || 'Falha no login social.' };
      }

      localStorage.setItem('jiuspeak_auth_token', data.token);
      localStorage.setItem('jiuspeak_local_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);

      localStorage.setItem('jiuspeak_xp', data.user.xp.toString());
      localStorage.setItem('jiuspeak_streak', data.user.streak.toString());

      return { success: true, message: data.message };
    } catch (e) {
      return { success: false, message: 'Erro ao processar login com provedor social externo.' };
    }
  };

  const refreshUser = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      login,
      registerUser,
      logout,
      requestPasswordReset,
      submitPasswordReset,
      updateUserProfile,
      triggerSocialSignIn,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser invocado de dentro de um AuthProvider');
  }
  return context;
}
