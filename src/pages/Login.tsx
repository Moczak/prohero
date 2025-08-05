import React, { useState, useEffect } from 'react';
import { User, Lock } from 'lucide-react';
import logoImage from '../public/images/bg.jpg';
import logo from '../public/images/logo.jpg';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { translateError } from '../utils/errorTranslations';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      const { error } = await signIn({
        email: formData.email,
        password: formData.password
      });
      
      if (error) {
        setError(translateError(error.message));
      }
      // O redirecionamento será feito pelo AppRoutes com base no status de onboarding
    } catch (err) {
      console.error('Error during login:', err);
      setError('Ocorreu um erro durante o login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Error during Google login:', err);
      setError('Ocorreu um erro durante o login com Google');
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Digite seu email para redefinir a senha');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await useAuth().resetPassword(formData.email);
      
      if (error) {
        setError(translateError(error.message));
      } else {
        alert('Verifique seu email para redefinir sua senha!');
      }
    } catch (err) {
      console.error('Error requesting password reset:', err);
      setError('Ocorreu um erro ao solicitar redefinição de senha');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${logoImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="w-full max-w-md">
        <div className="bg-black/90 backdrop-blur-lg rounded-2xl shadow-xl p-8 transition-transform duration-300">
          <div className="flex flex-col items-center mb-8">
            <img src={logo} alt="Logo" className="h-32 w-auto mb-4 rounded-lg" />
            <p className="text-gray-200">Entre com sua conta</p>
          </div>
            
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
            
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-300" />
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

            <div className="flex items-center justify-between text-sm">
              <button 
                type="button"
                onClick={handleForgotPassword}
                className="text-gray-200 hover:text-white transition-colors duration-300"
              >
                Esqueceu a senha?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform hover:-translate-y-0.5 transition-all duration-300"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
            
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-black text-gray-400">Ou continue com</span>
              </div>
            </div>
              
            <div className="mt-6">
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
                </svg>
                Google
              </button>
            </div>
          </div>
            
          <p className="mt-8 text-center text-gray-400">
            Não tem uma conta?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-green-500 hover:text-green-400 focus:outline-none"
            >
              Cadastre-se
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
