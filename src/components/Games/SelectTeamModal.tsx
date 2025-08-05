import React, { useState, useEffect } from 'react';
import { X, Search, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import '../../styles/scrollbar.css';

interface Team {
  id: string;
  name: string;
  logo_url: string | null;
}

interface SelectTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamSelected: (teamId: string, teamName: string) => void;
}

const SelectTeamModal: React.FC<SelectTeamModalProps> = ({ 
  isOpen, 
  onClose, 
  onTeamSelected 
}) => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        if (!user) return;
        
        setLoading(true);
        
        // Buscar equipes que pertencem ao usuário atual
        const { data, error } = await supabase
          .from('sports_organizations')
          .select('id, name, logo_url')
          .eq('created_by', user.id)
          .order('name');
          
        if (error) throw error;
        
        setTeams(data || []);
      } catch (err) {
        console.error('Erro ao buscar equipes:', err);
        setError('Não foi possível carregar as equipes. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen) {
      fetchTeams();
    }
  }, [isOpen, user]);

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md flex flex-col max-h-[80vh] overflow-hidden">
        {/* Cabeçalho fixo */}
        <div className="sticky top-0 z-10 bg-white border-b rounded-t-xl">
          <div className="flex justify-between items-center p-4">
            <h2 className="text-xl font-semibold">Selecionar Equipe</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Barra de busca */}
          <div className="px-4 pb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar equipe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>
        </div>
        
        {/* Lista de equipes */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader size={24} className="animate-spin text-green-600" />
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg">
              {error}
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma equipe encontrada.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTeams.map(team => (
                <button
                  key={team.id}
                  onClick={() => onTeamSelected(team.id, team.name)}
                  className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 border transition-colors"
                >
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center mr-3">
                    {team.logo_url ? (
                      <img 
                        src={team.logo_url} 
                        alt={team.name} 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-500 font-medium">{team.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium">{team.name}</h3>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectTeamModal;
