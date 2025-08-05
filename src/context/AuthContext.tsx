import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { 
  supabase, 
  signInWithEmail, 
  signUpWithEmail, 
  signInWithGoogle as signInGoogle, 
  resetPassword as resetPasswordApi
} from '../lib/supabase';

// Definição do tipo do contexto
interface SignInCredentials {
  email: string;
  password: string;
}

interface SignUpCredentials extends SignInCredentials {
  name: string;
  options?: any;
}

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (credentials: SignInCredentials) => Promise<{ data: { user: User | null } | null; error: any }>;
  signUp: (credentials: SignUpCredentials) => Promise<{ data: { user: User | null } | null; error: any }>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  checkUserOnboarding: (userId: string) => Promise<{ onboarding: boolean | null, error: any }>;
  updateOnboardingCache: (userId: string, status: boolean) => void;
  redirectAfterAuth: boolean;
  setRedirectAfterAuth: (redirect: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectAfterAuth, setRedirectAfterAuth] = useState(true);
  const onboardingCache = useRef<Record<string, boolean>>({});

  // Funções de gerenciamento de cache
  const saveOnboardingCache = useCallback(() => {
    try {
      localStorage.setItem('onboardingCache', JSON.stringify(onboardingCache.current));
    } catch (error) {
      console.error('Erro ao salvar cache de onboarding:', error);
    }
  }, []);

  const loadOnboardingCache = useCallback(() => {
    try {
      const cachedData = localStorage.getItem('onboardingCache');
      if (cachedData) {
        onboardingCache.current = JSON.parse(cachedData);
      }
    } catch (error) {
      console.error('Erro ao carregar cache de onboarding:', error);
    }
  }, []);

  const updateOnboardingCache = useCallback((userId: string, status: boolean) => {
    console.log(`Atualizando cache de onboarding para ${userId}: ${status}`);
    onboardingCache.current[userId] = status;
    saveOnboardingCache();
  }, [saveOnboardingCache]);

  // Carregar cache ao inicializar
  useEffect(() => {
    loadOnboardingCache();
  }, [loadOnboardingCache]);

  // Monitorar mudanças na sessão
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Mudança no estado de autenticação:', { event, session });
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user);
          setSession(session);
          
          // Se o usuário está no dashboard, assumir que onboarding está completo
          if (window.location.pathname === '/dashboard') {
            updateOnboardingCache(session.user.id, true);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        onboardingCache.current = {};
        localStorage.removeItem('onboardingCache');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [updateOnboardingCache]);

  // Verificar sessão inicial
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (session?.user) {
          setUser(session.user);
          setSession(session);
          
          // Se o usuário está no dashboard, assumir que onboarding está completo
          if (window.location.pathname === '/dashboard') {
            updateOnboardingCache(session.user.id, true);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [updateOnboardingCache]);

  const handleSignIn = async (credentials: SignInCredentials) => {
    try {
      const { data, error } = await signInWithEmail(credentials);
      
      if (error) {
        console.error('Erro ao fazer login:', error);
        return { data: null, error };
      }
      
      return { data: { user: data.user }, error: null };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return { data: null, error };
    }
  };

  const handleSignUp = async (credentials: SignUpCredentials) => {
    try {
      const { data, error } = await signUpWithEmail(credentials);
      
      if (error) {
        console.error('Erro ao criar conta:', error);
        return { data: null, error };
      }
      
      return { data: { user: data.user }, error: null };
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      return { data: null, error };
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      console.log('Iniciando login com Google...');
      const { error } = await signInGoogle();
      
      if (error) {
        console.error('Erro no login com Google:', error);
      } else {
        console.log('Login com Google iniciado com sucesso, redirecionando...');
      }
    } catch (error) {
      console.error('Erro no login com Google:', error);
    }
  };

  const handleLogout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Limpar o cache de onboarding
      onboardingCache.current = {};
      localStorage.removeItem('onboardingCache');
      
      setRedirectAfterAuth(true);
      return { error: null };
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      return { error };
    }
  }, [setRedirectAfterAuth]);

  const handleResetPassword = async (email: string) => {
    try {
      const { error } = await resetPasswordApi(email);
      return { error };
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      return { error };
    }
  };

  const checkUserOnboarding = useCallback(async (userId: string) => {
    // Se o usuário está no dashboard, retornar true imediatamente
    if (window.location.pathname === '/dashboard') {
      console.log('Usuário está no dashboard, assumindo onboarding como completo');
      updateOnboardingCache(userId, true);
      return { onboarding: true, error: null };
    }

    // Se já temos o status de onboarding no cache, retornar imediatamente
    if (onboardingCache.current[userId] !== undefined) {
      console.log(`Usando cache de onboarding para ${userId}: ${onboardingCache.current[userId]}`);
      return { onboarding: onboardingCache.current[userId], error: null };
    }

    console.log(`Verificando status de onboarding para o usuário: ${userId}`);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('onboarding')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao verificar status de onboarding:', error);
        return { onboarding: null, error };
      }

      if (!data) {
        console.log('Usuário não encontrado na tabela users');
        return { onboarding: false, error: null };
      }

      // Armazenar no cache e persistir
      updateOnboardingCache(userId, data.onboarding);
      return { onboarding: data.onboarding, error: null };
    } catch (error) {
      console.error('Erro ao verificar status de onboarding:', error);
      return { onboarding: null, error };
    }
  }, [saveOnboardingCache, updateOnboardingCache]);

  const value = {
    user,
    session,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signInWithGoogle: handleSignInWithGoogle,
    logout: handleLogout,
    resetPassword: handleResetPassword,
    checkUserOnboarding,
    updateOnboardingCache,
    redirectAfterAuth,
    setRedirectAfterAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
