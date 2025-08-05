import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock } from 'lucide-react';
import logo from '../public/images/logo.jpg';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a valid hash for password reset
    const hash = window.location.hash;
    if (!hash || !hash.includes('type=recovery')) {
      navigate('/login');
    }
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage({ text: 'As senhas não coincidem', type: 'error' });
      return;
    }
    
    if (password.length < 6) {
      setMessage({ text: 'A senha deve ter pelo menos 6 caracteres', type: 'error' });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        setMessage({ text: error.message, type: 'error' });
      } else {
        setMessage({ text: 'Senha atualizada com sucesso!', type: 'success' });
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setMessage({ text: 'Ocorreu um erro ao redefinir sua senha', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-black/90 backdrop-blur-lg rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center mb-8">
            <img src={logo} alt="Logo" className="h-32 w-auto mb-4 rounded-lg" />
            <h2 className="text-xl font-bold text-white">Redefinir Senha</h2>
            <p className="text-gray-300 text-sm mt-1">Digite sua nova senha abaixo</p>
          </div>

          {message && (
            <div className={`p-3 rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-300" />
              </div>
              <input
                type="password"
                placeholder="Nova senha"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-gray-400/20 text-white placeholder-gray-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-300" />
              </div>
              <input
                type="password"
                placeholder="Confirme a nova senha"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-gray-400/20 text-white placeholder-gray-300 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform hover:-translate-y-0.5 transition-all duration-300"
            >
              {loading ? 'Processando...' : 'Redefinir Senha'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => navigate('/login')} 
              className="text-green-400 hover:text-green-300 font-medium"
            >
              Voltar para o login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
