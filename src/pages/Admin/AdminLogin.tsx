import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';
import logoImage from '../../public/images/bg.jpg';
import logo from '../../public/images/logo.jpg';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const AdminLogin: React.FC = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error || !data.user) {
        setError('Usuário ou senha inválidos.');
        setLoading(false);
        return;
      }
      // Buscar usuário na tabela users pelo auth_user_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', data.user.id)
        .maybeSingle();
      setLoading(false);
      if (userError || !userData) {
        setError('Erro ao verificar permissões do usuário.');
        return;
      }
      if (userData.role !== 'admin') {
        setError('Apenas administradores podem acessar este painel.');
        return;
      }
      navigate('/admin');
    } catch (err) {
      setError('Erro inesperado ao tentar fazer login.');
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${logoImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-md">
        <div className="bg-black/90 backdrop-blur-lg rounded-2xl shadow-xl p-8 transition-transform duration-300">
          <div className="flex flex-col items-center mb-8">
            <img src={logo} alt="Logo" className="h-32 w-auto mb-4 rounded-lg" />
            <p className="text-gray-200">Acesso administrativo</p>
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
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transform hover:-translate-y-0.5 transition-all duration-300"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
