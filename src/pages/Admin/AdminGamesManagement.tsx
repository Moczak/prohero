import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, MapPin, Trash2, Eye } from 'lucide-react';
import ConfirmationDialog from '../../components/UI/ConfirmationDialog';
import { Link } from 'react-router-dom';

interface Game {
  id: string;
  team_id: string;
  opponent_name: string;
  game_date: string;
  game_time: string;
  location: string;
  city?: string;
  state?: string;
  home_game: boolean;
  score_team?: number | null;
  score_opponent?: number | null;
  game_status?: string;
  opponent_logo_url?: string | null;
  notes?: string;
  created_at: string;
  sports_organizations?: {
    id: string;
    name: string;
    logo_url?: string | null;
  };
}

const GAME_STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'scheduled', label: 'Agendado' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed', label: 'Concluído' },
  { value: 'canceled', label: 'Cancelado' },
  { value: 'postponed', label: 'Adiado' }
];

const AdminGamesManagement: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmDeleteGame, setConfirmDeleteGame] = useState<Game | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('');

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      setError('');
      
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          sports_organizations (
            id, name, logo_url
          )
        `)
        .order('game_date', { ascending: false });
        
      if (error) {
        console.error('Erro ao buscar jogos:', error);
        setError('Erro ao carregar jogos.');
        setLoading(false);
        return;
      }
      
      setGames(data || []);
      setLoading(false);
    };
    
    fetchGames();
  }, []);

  useEffect(() => {
    let filtered = games;
    
    // Filtro por texto (nome do oponente ou local)
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(game => 
        (game.opponent_name?.toLowerCase().includes(searchLower)) || 
        (game.location?.toLowerCase().includes(searchLower)) ||
        (game.sports_organizations?.name?.toLowerCase().includes(searchLower))
      );
    }
    
    // Filtro por status
    if (statusFilter) {
      filtered = filtered.filter(game => game.game_status === statusFilter);
    }
    
    // Filtro por data
    if (dateFilter) {
      filtered = filtered.filter(game => game.game_date === dateFilter);
    }
    
    setFilteredGames(filtered);
  }, [games, search, statusFilter, dateFilter]);

  // Função para formatar a data
  const formatDate = (dateString: string) => {
    // Adicionar 'T00:00:00' para garantir que a data seja interpretada no fuso horário local
    // e não seja afetada pela conversão UTC -> local
    const [year, month, day] = dateString.split('-');
    return new Date(`${year}-${month}-${day}T00:00:00`).toLocaleDateString('pt-BR');
  };

  const handleDelete = (game: Game) => {
    setConfirmDeleteGame(game);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteGame) return;
    
    setDeleteLoadingId(confirmDeleteGame.id);
    
    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', confirmDeleteGame.id);
      
    setDeleteLoadingId(null);
    setConfirmDeleteGame(null);
    
    if (error) {
      console.error('Erro ao excluir jogo:', error);
      setError('Erro ao excluir jogo.');
      return;
    }
    
    setGames(games => games.filter(g => g.id !== confirmDeleteGame.id));
  };

  const cancelDelete = () => setConfirmDeleteGame(null);

  const getStatusLabel = (status: string | undefined) => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'in_progress': return 'Em andamento';
      case 'completed': return 'Concluído';
      case 'canceled': return 'Cancelado';
      case 'postponed': return 'Adiado';
      default: return 'Desconhecido';
    }
  };

  const getStatusClass = (status: string | undefined) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      case 'postponed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      {confirmDeleteGame && (
        <ConfirmationDialog
          isOpen={!!confirmDeleteGame}
          title="Confirmar Exclusão"
          message={`Tem certeza que deseja excluir o jogo contra ${confirmDeleteGame.opponent_name}?`}
          confirmButtonText="Excluir"
          cancelButtonText="Cancelar"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          confirmButtonColor="red"
        />
      )}
      
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Gerenciamento de Jogos</h1>
        
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-6 items-center">
          <input
            type="text"
            placeholder="Buscar por time, oponente ou local..."
            className="px-4 py-2 border border-gray-200 rounded-md flex-grow"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          
          <select
            className="min-w-[140px] px-4 py-2 border border-gray-200 rounded-md text-base"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            {GAME_STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          
          <input
            type="date"
            className="px-4 py-2 border border-gray-200 rounded-md"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          />
        </div>
        
        {loading ? (
          <p className="text-center py-8">Carregando jogos...</p>
        ) : error ? (
          <p className="text-red-600 text-sm mb-2">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Oponente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Local
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Placar
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredGames.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      Nenhum jogo encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredGames.map(game => (
                    <tr key={game.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {game.sports_organizations?.logo_url ? (
                              <img 
                                className="h-10 w-10 rounded-full object-cover" 
                                src={game.sports_organizations.logo_url} 
                                alt={game.sports_organizations.name} 
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500">
                                  {game.sports_organizations?.name?.charAt(0) || '?'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {game.sports_organizations?.name || 'Time desconhecido'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {game.opponent_logo_url ? (
                              <img 
                                className="h-10 w-10 rounded-full object-cover" 
                                src={game.opponent_logo_url} 
                                alt={game.opponent_name} 
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500">
                                  {game.opponent_name?.charAt(0) || '?'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {game.opponent_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar size={16} className="text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {formatDate(game.game_date)}
                          </div>
                          <div className="text-sm text-gray-500 ml-2">
                            {game.game_time}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin size={16} className="text-gray-400 mr-2" />
                          <div className="text-sm text-gray-900">
                            {game.location}
                          </div>
                          {(game.city || game.state) && (
                            <div className="text-xs text-gray-500 ml-2">
                              {[game.city, game.state].filter(Boolean).join(', ')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {game.score_team !== null && game.score_team !== undefined && game.score_opponent !== null && game.score_opponent !== undefined ? (
                          <div className="text-sm font-medium">
                            {game.home_game ? (
                              <>
                                <span className={game.score_team > (game.score_opponent || 0) ? 'text-green-600 font-bold' : 
                                  game.score_team < (game.score_opponent || 0) ? 'text-red-600' : 'text-gray-600'}>
                                  {game.score_team}
                                </span>
                                <span className="mx-1">x</span>
                                <span className={game.score_team < (game.score_opponent || 0) ? 'text-green-600 font-bold' : 
                                  game.score_team > (game.score_opponent || 0) ? 'text-red-600' : 'text-gray-600'}>
                                  {game.score_opponent}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className={game.score_opponent > (game.score_team || 0) ? 'text-green-600 font-bold' : 
                                  game.score_opponent < (game.score_team || 0) ? 'text-red-600' : 'text-gray-600'}>
                                  {game.score_opponent}
                                </span>
                                <span className="mx-1">x</span>
                                <span className={game.score_opponent < (game.score_team || 0) ? 'text-green-600 font-bold' : 
                                  game.score_opponent > (game.score_team || 0) ? 'text-red-600' : 'text-gray-600'}>
                                  {game.score_team}
                                </span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(game.game_status)}`}>
                          {getStatusLabel(game.game_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <Link 
                            to={`/equipe/${game.team_id}`} 
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Ver equipe"
                          >
                            <Eye size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(game)}
                            className="text-red-600 hover:text-red-900"
                            disabled={deleteLoadingId === game.id}
                            title="Excluir jogo"
                          >
                            {deleteLoadingId === game.id ? (
                              <span className="text-xs">...</span>
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminGamesManagement;
