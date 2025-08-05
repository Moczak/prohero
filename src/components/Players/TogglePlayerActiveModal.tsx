import React, { useState } from 'react';
import { X, UserX, UserCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TogglePlayerActiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayerDeactivated: () => void;
  player: {
    id: string;
    name: string;
    user_id: string;
    active: boolean;
  };
}

const TogglePlayerActiveModal: React.FC<TogglePlayerActiveModalProps> = ({ 
  isOpen, 
  onClose, 
  onPlayerDeactivated,
  player
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleActive = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Alternar o status ativo do jogador na tabela players
      const { error: playerError } = await supabase
        .from('players')
        .update({ active: !player.active })
        .eq('id', player.id);
      
      if (playerError) throw playerError;
      
      // Nota: Não estamos atualizando a tabela users porque a coluna 'active' não existe
      // Se for necessário alterar o status do usuário no futuro, precisaremos adicionar essa coluna ao esquema
      
      // Sucesso
      onPlayerDeactivated();
      onClose();
    } catch (err: any) {
      console.error('Erro ao alterar status do jogador:', err);
      setError(err.message || 'Erro ao alterar status do jogador. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">{player.active ? 'Desativar' : 'Ativar'} Jogador</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <p className="text-gray-700 mb-4">
            <p className="mb-4">Tem certeza que deseja {player.active ? 'desativar' : 'ativar'} o jogador <strong>{player.name}</strong>?</p>
            <p className="mb-4 text-gray-600">
              {player.active 
                ? 'Esta ação irá remover o jogador da lista de jogadores ativos.' 
                : 'Esta ação irá adicionar o jogador de volta à lista de jogadores ativos.'}
            </p>
          </p>
          
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
              type="button"
              onClick={handleToggleActive}
              className={`px-4 py-2 text-white rounded-md flex items-center justify-center disabled:opacity-50 ${player.active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
              disabled={loading}
            >
              {loading 
                ? (player.active ? 'Desativando...' : 'Ativando...') 
                : (player.active ? 'Desativar' : 'Ativar')
              }
              {player.active 
                ? <UserX size={16} className="ml-2" /> 
                : <UserCheck size={16} className="ml-2" />
              } Jogador
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TogglePlayerActiveModal;
