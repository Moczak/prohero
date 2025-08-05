import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Lock, Mail, UserCircle } from 'lucide-react';
import logo from '../public/images/logo.jpg';
import logoImage from '../public/images/bg.jpg';
import { translateError } from '../utils/errorTranslations';

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }
    
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      // 1. Criar o usuário na autenticação do Supabase
      const { data: authData, error: authError } = await signUp({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        options: {
          data: {
            name: formData.name
          }
        }
      });

      if (authError) throw authError;

      if (authData?.user) {
        try {
          // Verificar se o usuário já existe na tabela users
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', formData.email)
            .maybeSingle();

          if (existingUser) {
            // Se o usuário já existe, apenas atualizar o auth_user_id se necessário
            if (existingUser.auth_user_id !== authData.user.id) {
              const { error: updateError } = await supabase
                .from('users')
                .update({ auth_user_id: authData.user.id })
                .eq('id', existingUser.id);

              if (updateError) {
                console.error('Erro ao atualizar auth_user_id:', updateError);
                throw new Error('Erro ao atualizar registro do usuário');
              }
            }
            navigate('/dashboard');
          } else {
            // 2. Criar o registro do usuário na tabela users se não existir
            const { error: dbError } = await supabase
              .from('users')
              .insert({
                auth_user_id: authData.user.id,
                email: formData.email,
                name: formData.name,
                role: 'atleta',
                created_at: new Date().toISOString(),
                onboarding: false
              });

            if (dbError) {
              console.error('Erro ao criar registro do usuário:', dbError);
              throw new Error('Erro ao criar registro do usuário');
            }
            navigate('/onboarding');
          }
        } catch (dbErr) {
          console.error('Erro ao interagir com o banco de dados:', dbErr);
          setError('Erro ao criar registro do usuário');
        }
      }
    } catch (err) {
      console.error('Erro no cadastro:', err);
      setError(err instanceof Error ? translateError(err.message) : 'Ocorreu um erro durante o cadastro.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      // Não precisamos navegar aqui, pois o redirecionamento é tratado pelo Supabase
    } catch (err) {
      console.error('Erro no login com Google:', err);
      setError('Ocorreu um erro durante o login com Google');
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 transition-all duration-1000 opacity-100"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${logoImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="w-full max-w-md">
        <div className="bg-black/90 backdrop-blur-lg rounded-2xl shadow-xl p-8 transition-transform duration-300">
          <div className="flex flex-col items-center mb-6">
            <img src={logo} alt="Logo" className="h-24 w-auto mb-4 rounded-lg" />
            <h2 className="text-xl font-bold text-white">Criar Conta</h2>
            <p className="text-gray-300 text-sm">Preencha os dados para se cadastrar</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserCircle className="h-5 w-5 text-gray-300" />
              </div>
              <input
                type="text"
                name="name"
                placeholder="Seu nome completo"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-gray-400/20 text-white placeholder-gray-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-300" />
              </div>
              <input
                type="email"
                name="email"
                placeholder="Seu email"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-gray-400/20 text-white placeholder-gray-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-300" />
              </div>
              <input
                type="password"
                name="password"
                placeholder="Sua senha"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-gray-400/20 text-white placeholder-gray-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-300" />
              </div>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirme sua senha"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-gray-400/20 text-white placeholder-gray-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform hover:-translate-y-0.5 transition-all duration-300"
            >
              {loading ? 'Processando...' : 'Criar Conta'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-black text-gray-400">Ou continue com</span>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-300"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Google
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-gray-300">
            Já tem uma conta?{' '}
            <button 
              onClick={() => navigate('/login')} 
              className="text-green-400 hover:text-green-300 font-semibold transition-colors duration-300"
            >
              Entrar
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
