import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '../components/Layout/DashboardLayout';

const AdicionarEquipe: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    organization_type: '',
    city: '',
    state: '',
    country: '',
    description: '',
    logo_url: '',
  });
  const [activeTab, setActiveTab] = useState('teams');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('sports_organizations')
        .insert({
          ...formData,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar organização:', error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Erro ao criar equipe: nenhum dado retornado');
      }

      console.log('Equipe criada com sucesso:', data);
      navigate('/minhaequipe');
    } catch (err: any) {
      console.error('Erro ao criar equipe:', err);
      setError(err.message || 'Não foi possível criar a equipe. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <>
      <button
        onClick={() => navigate('/minhaequipe')}
        className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft size={20} className="mr-2" />
        Voltar
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-8">Adicionar Nova Equipe</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl bg-white p-6 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Nome da Equipe*
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Esporte*
            </label>
            <select
              name="organization_type"
              value={formData.organization_type}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Selecione um tipo</option>
              <option value="Futebol">Futebol</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Cidade
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Estado
            </label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              País
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              URL do Logo
            </label>
            <input
              type="url"
              name="logo_url"
              value={formData.logo_url}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Descrição
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`
              bg-green-600 text-white px-6 py-2 rounded-lg
              ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}
              transition-colors
            `}
          >
            {loading ? 'Criando...' : 'Criar Equipe'}
          </button>
        </div>
      </form>
    </>
  );

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {content}
    </DashboardLayout>
  );
};

export default AdicionarEquipe;
