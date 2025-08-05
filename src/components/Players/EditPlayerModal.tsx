import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayerUpdated: () => void;
  player: {
    id: string;
    name: string;
    position: string;
    number: number;
    user_id: string;
    email: string;
  };
}

const EditPlayerModal: React.FC<EditPlayerModalProps> = ({ 
  isOpen, 
  onClose, 
  onPlayerUpdated,
  player
}) => {
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    number: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Efeito para buscar dados do usuário quando o player mudar
  useEffect(() => {
    const fetchUserData = async () => {
      if (player && player.user_id) {
        try {
          // Buscar o nome e email do usuário diretamente da tabela users
          const { data, error } = await supabase
            .from('users')
            .select('name, email')
            .eq('auth_user_id', player.user_id)
            .single();
          
          if (error) {
            console.error('Erro ao buscar dados do usuário:', error);
            // Usar os dados do player como fallback
            setFormData({
              name: player.name,
              position: player.position,
              number: player.number.toString(),
            });
            return;
          }
          
          if (data) {
            // Usar o nome da tabela users
            setFormData({
              name: data.name || player.name,
              position: player.position,
              number: player.number.toString(),
            });
            
            // Definir o email
            setPlayerEmail(data.email || '');
          }
        } catch (err) {
          console.error('Erro ao buscar dados do usuário:', err);
          // Usar os dados do player como fallback
          setFormData({
            name: player.name,
            position: player.position,
            number: player.number.toString(),
          });
        }
      }
    };
    
    fetchUserData();
  }, [player]);
  
  // Usar um estado para o email do usuário
  const [playerEmail, setPlayerEmail] = useState('');

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      // Validar os dados
      if (!formData.name || !formData.position || !formData.number) {
        setError('Todos os campos são obrigatórios');
        return;
      }
      
      // 1. Atualizar o nome do usuário na tabela users
      if (formData.name !== player.name) {
        const { error: userError } = await supabase
          .from('users')
          .update({ name: formData.name })
          .eq('auth_user_id', player.user_id);
        
        if (userError) {
          console.error('Erro ao atualizar nome do usuário:', userError);
          // Continuar mesmo com erro, para pelo menos atualizar os dados do jogador
        }
      }
      
      // 2. Atualizar o jogador no banco de dados
      const { error } = await supabase
        .from('players')
        .update({
          name: formData.name,
          position: formData.position,
          number: parseInt(formData.number)
        })
        .eq('id', player.id);
      
      if (error) throw error;
      
      // Sucesso
      onPlayerUpdated();
      onClose();
    } catch (err: any) {
      console.error('Erro ao atualizar jogador:', err);
      setError(err.message || 'Erro ao atualizar jogador. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Editar Jogador</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              id="email"
              value={playerEmail}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado.</p>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Posição
            </label>
            <select
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Selecione uma posição</option>
              <option value="Goleiro">Goleiro</option>
              <option value="Zagueiro">Zagueiro</option>
              <option value="Lateral">Lateral</option>
              <option value="Volante">Volante</option>
              <option value="Meio-campo">Meio-campo</option>
              <option value="Atacante">Atacante</option>
              <option value="Ponta">Ponta</option>
              <option value="Centroavante">Centroavante</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Número
            </label>
            <input
              type="number"
              name="number"
              value={formData.number}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Número da camisa"
              min="1"
              max="99"
            />
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPlayerModal;
