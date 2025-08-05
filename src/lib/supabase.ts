import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Supabase configuration
const supabaseUrl = 'https://dywsrkewiwzkjpkecxxt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5d3Nya2V3aXd6a2pwa2VjeHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMDE5MDQsImV4cCI6MjA1Nzg3NzkwNH0.iHYAWwmFlmgfPV6E7GEs_T2JSZEXjvxR1pyXxW1AxzY';

// Get the environment
const isProduction = window.location.hostname !== 'localhost';

// Get the base URL for redirects
const getBaseUrl = () => {
  if (isProduction) {
    return 'https://proherosports.netlify.app';
  }
  return window.location.origin; // localhost:3000 em desenvolvimento
};

// Create Supabase client with typed database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Tipos para autenticação
export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  name?: string;
  options?: {
    data?: {
      name?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

// Funções de autenticação atualizadas para Auth v2
export const signInWithEmail = async ({ email, password }: SignInCredentials) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

export const signUpWithEmail = async ({ email, password, name, options }: SignUpCredentials) => {
  // Preparar os dados do usuário
  const userData = {
    ...options?.data,
    name: name || options?.data?.name
  };

  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
      emailRedirectTo: `${getBaseUrl()}/auth/callback`
    }
  });
};

export const signInWithGoogle = async () => {
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${getBaseUrl()}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

export const resetPassword = async (email: string) => {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getBaseUrl()}/reset-password`,
  });
};

export const getCurrentUser = async () => {
  return await supabase.auth.getUser();
};

export const getSession = async () => {
  return await supabase.auth.getSession();
};

// Função para verificar e renovar a sessão
export const refreshSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Erro ao obter sessão:', error);
    return { session: null, error };
  }
  
  if (data?.session) {
    return { session: data.session, error: null };
  } else {
    return { session: null, error: null };
  }
};
