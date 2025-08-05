import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Plus, Edit, MoreVertical, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/Layout/DashboardLayout';
import AddGameModal from '../components/Games/AddGameModal';
import EditGameModal from '../components/Games/EditGameModal';
import GameCalendar from '../components/Games/GameCalendar';
import ConfirmationModal from '../components/UI/ConfirmationModal';
import SelectTeamModal from '../components/Games/SelectTeamModal';
import TournamentRegistrationManager from '../components/LeaguesTournaments/TournamentRegistrationManager';

interface League {
  id: string;
  name: string;
  description: string;
  cover_image_url: string | null;
  logo_url: string | null;
  format: string;
  start_date: string;
  end_date: string;
  location: string;
  created_by: string;
  created_at: string;
}

interface Tournament {
  id: string;
  name: string;
  description: string;
  cover_image_url: string | null;
  logo_url: string | null;
  format: string;
  start_date: string;
  end_date: string;
  location: string;
  participants_number: number;
  status: string;
  created_by: string;
  created_at: string;
}

type LeagueOrTournament = (League | Tournament) & { 
  type: 'league' | 'tournament';
  status?: string; // Adicionado para torneios
};

interface Game {
  id: string;
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
  team_id: string;
  league_tournament_id: string;
  team?: {
    name: string;
    logo_url: string | null;
  };
  league_tournament?: {
    id: string;
    name: string;
    logo_url: string | null;
    type: 'league' | 'tournament';
  };
}

const LigaTorneioDetalhes: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('games');
  const [leagueTournament, setLeagueTournament] = useState<LeagueOrTournament | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  // State for sidebar tabs required by DashboardLayout
  const [sidebarActiveTab, setSidebarActiveTab] = useState('ligastorneios');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [showEditGameModal, setShowEditGameModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [calendarView, setCalendarView] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showGameOptions, setShowGameOptions] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [defaultTeamId, setDefaultTeamId] = useState<string>('');
  const [showSelectTeamModal, setShowSelectTeamModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedTeamName, setSelectedTeamName] = useState<string>('');
  
  // Buscar o papel do usuário atual e uma equipe padrão
  useEffect(() => {
    const fetchUserRoleAndDefaultTeam = async () => {
      if (!user) return;
      
      try {
        // Buscar o papel do usuário
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('auth_user_id', user.id)
          .single();
        
        if (userError) throw userError;
        if (userData) {
          setUserRole(userData.role);
        }
        
        // Buscar uma equipe padrão para usar como team_id
        const { data: teamsData, error: teamsError } = await supabase
          .from('sports_organizations')
          .select('id')
          .limit(1);
        
        if (teamsError) throw teamsError;
        if (teamsData && teamsData.length > 0) {
          setDefaultTeamId(teamsData[0].id);
        }
      } catch (err) {
        console.error('Erro ao buscar dados iniciais:', err);
      }
    };
    
    fetchUserRoleAndDefaultTeam();
  }, [user]);

  // Função para buscar jogos da liga/torneio
  const fetchGames = async (leagueTournamentId: string | undefined) => {
    try {
      if (!leagueTournamentId) return;
      
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          team:team_id (
            name,
            logo_url
          )
        `)
        .eq('league_tournament_id', leagueTournamentId)
        .order('game_date', { ascending: true });
        
      if (error) throw error;
      
      if (data) {
        // Para cada jogo, buscar informações da liga ou torneio associado
        const gamesWithLeagueTournament = await Promise.all(data.map(async (game) => {
          if (game.league_tournament_id) {
            // Tentar buscar como liga
            const { data: leagueData } = await supabase
              .from('leagues')
              .select('id, name, logo_url')
              .eq('id', game.league_tournament_id)
              .single();
            
            if (leagueData) {
              return { 
                ...game, 
                league_tournament: { 
                  ...leagueData, 
                  type: 'league' 
                } 
              };
            }
            
            // Se não encontrar como liga, tentar como torneio
            const { data: tournamentData } = await supabase
              .from('tournaments')
              .select('id, name, logo_url')
              .eq('id', game.league_tournament_id)
              .single();
            
            if (tournamentData) {
              return { 
                ...game, 
                league_tournament: { 
                  ...tournamentData, 
                  type: 'tournament' 
                } 
              };
            }
          }
          
          return game;
        }));
        
        setGames(gamesWithLeagueTournament);
      }
    } catch (err: any) {
      console.error('Erro ao buscar jogos:', err);
    }
  };

  // Função para lidar com a adição de um novo jogo
  const handleGameAdded = () => {
    if (id) {
      fetchGames(id);
    }
  };
  
  // Função para lidar com a atualização de um jogo
  const handleGameUpdated = () => {
    if (id) {
      fetchGames(id);
    }
  };
  
  // Função para abrir o modal de edição de jogo
  const handleEditGame = (game: Game) => {
    setSelectedGame(game);
    setShowEditGameModal(true);
    setShowGameOptions(null);
  };
  
  // Função para iniciar o processo de exclusão de um jogo
  const handleDeleteGame = (gameId: string) => {
    setGameToDelete(gameId);
    setShowDeleteModal(true);
    setShowGameOptions(null);
  };
  
  // Função para confirmar a exclusão de um jogo
  const confirmDeleteGame = async () => {
    if (!gameToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameToDelete);
        
      if (error) throw error;
      
      // Atualizar a lista de jogos
      if (id) {
        fetchGames(id);
      }
    } catch (err: any) {
      console.error('Erro ao excluir jogo:', err);
      alert('Não foi possível excluir o jogo. Por favor, tente novamente.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setGameToDelete('');
    }
  };
  
  // Função para alternar a exibição do menu de opções do jogo
  const toggleGameOptions = (gameId: string) => {
    if (showGameOptions === gameId) {
      setShowGameOptions(null);
    } else {
      setShowGameOptions(gameId);
    }
  };

  // Função para obter o texto do formato
  const getFormatText = (format: string, type: 'league' | 'tournament') => {
    if (type === 'league') {
      switch (format) {
        case 'home_away': return 'Ida e Volta';
        case 'single': return 'Turno Único';
        default: return format;
      }
    } else {
      switch (format) {
        case 'knockout': return 'Eliminatório';
        case 'points': return 'Pontos Corridos';
        case 'group_stage': return 'Fase de Grupos';
        case 'mixed': return 'Misto (Grupos + Eliminatórias)';
        default: return format;
      }
    }
  };

  useEffect(() => {
    const fetchLeagueTournament = async () => {
      if (id) {
        try {
          setLoading(true);
          
          // Primeiro, tentar buscar como liga
          const { data: leagueData } = await supabase
            .from('leagues')
            .select('*')
            .eq('id', id)
            .single();
          
          if (leagueData) {
            setLeagueTournament({ ...leagueData, type: 'league' });
          } else {
            // Se não encontrar como liga, tentar como torneio
            const { data: tournamentData, error: tournamentError } = await supabase
              .from('tournaments')
              .select('*')
              .eq('id', id)
              .single();
            
            if (tournamentError) throw tournamentError;
            
            if (tournamentData) {
              setLeagueTournament({ ...tournamentData, type: 'tournament' });
            } else {
              throw new Error('Liga ou torneio não encontrado');
            }
          }
          
          // Buscar jogos
          fetchGames(id);
          
        } catch (err: any) {
          console.error('Erro ao buscar liga/torneio:', err);
          setError('Não foi possível carregar os dados da liga/torneio.');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchLeagueTournament();
  }, [id]);

  // Componente de shimmer para carregamento
  const ShimmerEffect = () => (
    <div className="animate-pulse">
      {/* Botão Voltar (shimmer) */}
      <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
      
      {/* Cabeçalho com capa e logo (shimmer) */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="h-48 bg-gray-200"></div>
        <div className="p-6 pt-12 space-y-3">
          <div className="h-7 bg-gray-200 rounded w-3/4"></div>
          <div className="h-5 bg-gray-200 rounded w-1/2"></div>
          <div className="h-5 bg-gray-200 rounded w-2/3"></div>
          <div className="h-20 bg-gray-200 rounded w-full mt-4"></div>
        </div>
      </div>

      {/* Tabs (shimmer) */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b">
          <div className="flex">
            <div className="px-6 py-3 h-12 bg-gray-200 rounded-sm w-32 m-1"></div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-gray-100 rounded-lg p-4 h-24"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Função para atualizar o status do torneio
  const handleTournamentStatusChange = (newStatus: string) => {
    if (leagueTournament && leagueTournament.type === 'tournament') {
      setLeagueTournament({
        ...leagueTournament,
        status: newStatus
      });
    }
  };

  // Renderizar conteúdo da aba
  const renderTabContent = () => {
    switch (activeTab) {
      case 'participants':
        // Aba de participantes (apenas para torneios)
        return (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Participantes do Torneio</h3>
            {leagueTournament?.type === 'tournament' ? (
              <TournamentRegistrationManager
                tournamentId={leagueTournament.id}
                tournamentStatus={leagueTournament.status || 'open_registration'}
                isCreator={leagueTournament.created_by === user?.id}
                onStatusChange={handleTournamentStatusChange}
              />
            ) : (
              <p className="text-gray-500">Esta funcionalidade está disponível apenas para torneios.</p>
            )}
          </div>
        );
      case 'games':
        return (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Jogos</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCalendarView(!calendarView)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md flex items-center"
                >
                  <Calendar size={16} className="mr-1" />
                  {calendarView ? 'Modo Lista' : 'Calendário'}
                </button>
                {userRole !== 'atleta' && leagueTournament?.created_by === user?.id && (
                  <button
                    onClick={() => setShowSelectTeamModal(true)}
                    className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center"
                  >
                    <Plus size={16} className="mr-1" />
                    Adicionar Jogo
                  </button>
                )}
              </div>
            </div>
            
            {/* Modal para selecionar equipe */}
            {showSelectTeamModal && (
              <SelectTeamModal
                isOpen={showSelectTeamModal}
                onClose={() => setShowSelectTeamModal(false)}
                onTeamSelected={(teamId, teamName) => {
                  setSelectedTeamId(teamId);
                  setSelectedTeamName(teamName);
                  setShowSelectTeamModal(false);
                  setShowAddGameModal(true);
                }}
              />
            )}
            
            {/* Modal para adicionar jogo */}
            {showAddGameModal && (
              <AddGameModal 
                teamId={selectedTeamId || defaultTeamId}
                teamName={selectedTeamName || leagueTournament?.name || ''}
                isOpen={showAddGameModal}
                onClose={() => {
                  setShowAddGameModal(false);
                  setSelectedTeamId('');
                  setSelectedTeamName('');
                }}
                onGameAdded={handleGameAdded}
                leagueTournamentId={leagueTournament?.id}
              />
            )}
            
            {/* Modal de edição de jogo */}
            {showEditGameModal && selectedGame && (
              <EditGameModal
                game={selectedGame}
                teamName={selectedGame.team?.name || ''}
                isOpen={showEditGameModal}
                onClose={() => setShowEditGameModal(false)}
                onGameUpdated={handleGameUpdated}
              />
            )}
            
            {/* Modal de confirmação de exclusão */}
            <ConfirmationModal
              isOpen={showDeleteModal}
              title="Confirmar Exclusão"
              message="Tem certeza que deseja excluir este jogo? Esta ação não pode ser desfeita."
              confirmText="Excluir"
              cancelText="Cancelar"
              onConfirm={confirmDeleteGame}
              onCancel={() => {
                setShowDeleteModal(false);
                setGameToDelete('');
              }}
              isLoading={isDeleting}
            />
            
            {/* Visualização de calendário */}
            {calendarView ? (
              <GameCalendar 
                games={games} 
                teamName={leagueTournament?.name || ''}
                teamLogo={leagueTournament?.logo_url}
                onEditGame={handleEditGame}
                onDeleteGame={handleDeleteGame}
                userRole={userRole}
              />
            ) : (
              // Visualização de lista
              <div>
                {loading ? (
                  // Shimmer loading effect para os jogos
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
                        <div className="flex justify-between items-start">
                          <div className="flex-grow">
                            {/* Data, hora e status (shimmer) */}
                            <div className="flex items-center mb-2">
                              <div className="h-4 bg-gray-200 rounded w-32"></div>
                              <div className="ml-2 h-5 bg-gray-200 rounded-full w-20"></div>
                            </div>
                            
                            {/* Local do jogo (shimmer) */}
                            <div className="h-4 bg-gray-200 rounded w-48 mb-3"></div>

                            {/* Time da casa e placar (shimmer) */}
                            <div className="flex items-center justify-between mb-2 w-full">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-200 rounded-full mr-2"></div>
                                <div className="h-5 bg-gray-200 rounded w-24"></div>
                              </div>
                              <div className="h-8 w-8 bg-gray-200 rounded"></div>
                            </div>
                            
                            {/* Time visitante e placar (shimmer) */}
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-200 rounded-full mr-2"></div>
                                <div className="h-5 bg-gray-200 rounded w-24"></div>
                              </div>
                              <div className="h-8 w-8 bg-gray-200 rounded"></div>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : games.length === 0 ? (
                  <p className="text-gray-500">Nenhum jogo agendado para esta {leagueTournament?.type === 'league' ? 'liga' : 'torneio'}.</p>
                ) : (
                  <div className="space-y-4">
                    {games.map((game) => (
                      <div key={game.id} className={`bg-white rounded-lg shadow p-4 relative ${game.game_status === 'canceled' ? 'border-l-4 border-red-500' : game.game_status === 'postponed' ? 'border-l-4 border-yellow-500' : game.game_status === 'completed' ? 'border-l-4 border-green-500' : ''}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-grow">
                            {/* Data, hora e status */}
                            <div className="flex items-center mb-2">
                              <span className="text-sm font-medium text-gray-500">
                                {game.game_date.split('T')[0].split('-').reverse().join('/')} • {game.game_time}
                              </span>
                              {game.game_status && (
                                <span className={`ml-2 text-xs px-2 py-1 rounded-full ${game.game_status === 'scheduled' ? 'bg-blue-100 text-blue-800' : game.game_status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : game.game_status === 'completed' ? 'bg-green-100 text-green-800' : game.game_status === 'canceled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {game.game_status === 'scheduled' ? 'Agendado' : game.game_status === 'in_progress' ? 'Em andamento' : game.game_status === 'completed' ? 'Concluído' : game.game_status === 'canceled' ? 'Cancelado' : game.game_status === 'postponed' ? 'Adiado' : 'Desconhecido'}
                                </span>
                              )}
                            </div>

                            {/* Local do jogo */}
                            <p className="text-sm text-gray-600 mb-3">
                              <span className="inline-block mr-1">📍</span>
                              {game.location}
                              {game.city && game.state && ` - ${game.city}, ${game.state}`}
                            </p>

                            {/* Time da casa e placar */}
                            <div className="flex items-center justify-between mb-2 w-full">
                              <div className="flex items-center">
                                <div className="mr-2 flex-shrink-0">
                                  {game.home_game ? (
                                    game.team?.logo_url ? (
                                      <img src={game.team.logo_url} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                        <span className="text-gray-500 font-medium">{game.team?.name?.charAt(0) || '?'}</span>
                                      </div>
                                    )
                                  ) : (
                                    game.opponent_logo_url ? (
                                      <img src={game.opponent_logo_url} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                        <span className="text-gray-500 font-medium">{game.opponent_name?.charAt(0) || '?'}</span>
                                      </div>
                                    )
                                  )}
                                </div>
                                <div className="font-medium">{game.home_game ? game.team?.name : game.opponent_name}</div>
                              </div>
                              <div className="text-2xl font-bold">
                                {(game.score_team !== null && game.score_team !== undefined) ? (game.home_game ? game.score_team : game.score_opponent) : '-'}
                              </div>
                            </div>

                            {/* Time visitante e placar */}
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center">
                                <div className="mr-2 flex-shrink-0">
                                  {!game.home_game ? (
                                    game.team?.logo_url ? (
                                      <img src={game.team.logo_url} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                        <span className="text-gray-500 font-medium">{game.team?.name?.charAt(0) || '?'}</span>
                                      </div>
                                    )
                                  ) : (
                                    game.opponent_logo_url ? (
                                      <img src={game.opponent_logo_url} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                        <span className="text-gray-500 font-medium">{game.opponent_name?.charAt(0) || '?'}</span>
                                      </div>
                                    )
                                  )}
                                </div>
                                <div className="font-medium">{!game.home_game ? game.team?.name : game.opponent_name}</div>
                              </div>
                              <div className="text-2xl font-bold">
                                {(game.score_opponent !== null && game.score_opponent !== undefined) ? (game.home_game ? game.score_opponent : game.score_team) : '-'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center">
                            {userRole !== 'atleta' && (
                              <div className="relative">
                                <button
                                  onClick={() => toggleGameOptions(game.id)}
                                  className="p-1 rounded-full hover:bg-gray-100"
                                >
                                  <MoreVertical size={18} />
                                </button>

                                {/* Menu de opções do jogo */}
                                {showGameOptions === game.id && (
                                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10 border">
                                    <ul>
                                      <li>
                                        <button
                                          onClick={() => handleEditGame(game)}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                        >
                                          <Edit size={14} className="mr-2" />
                                          Editar
                                        </button>
                                      </li>
                                      <li>
                                        <button
                                          onClick={() => handleDeleteGame(game.id)}
                                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                            <path d="M3 6h18"></path>
                                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                          </svg>
                                          Excluir
                                        </button>
                                      </li>
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Liga ou Torneio associado */}
                        {game.league_tournament && (
                          <div 
                            className="mt-2 pt-2 border-t flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded"
                            onClick={() => navigate(`/ligastorneios/${game.league_tournament_id}`)}
                          >
                            <div className="mr-2 flex-shrink-0">
                              {game.league_tournament.logo_url ? (
                                <img src={game.league_tournament.logo_url} alt="Logo" className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-500 font-medium text-xs">{game.league_tournament.name?.charAt(0) || '?'}</span>
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">{game.league_tournament.type === 'league' ? 'Liga' : 'Torneio'}:</span> {game.league_tournament.name}
                            </div>
                          </div>
                        )}
                        
                        {/* Notas do jogo */}
                        {game.notes && (
                          <p className="text-sm text-gray-600 mt-2 pt-2 border-t">{game.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const content = (
    <>
      {loading ? (
        <ShimmerEffect />
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      ) : leagueTournament ? (
        <div>
          {/* Botão Voltar */}
          <button
            onClick={() => navigate('/ligastorneios')}
            className="flex items-center text-gray-600 hover:text-green-600 mb-4 transition-colors"
          >
            <ArrowLeft size={18} className="mr-1" />
            <span>Voltar para Ligas e Torneios</span>
          </button>

          {/* Cabeçalho com capa e logo */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="h-48 bg-gray-200 relative">
              {leagueTournament.cover_image_url ? (
                <img
                  src={leagueTournament.cover_image_url}
                  alt={`Capa ${leagueTournament.name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  Sem imagem de capa
                </div>
              )}

              {leagueTournament.logo_url && (
                <div className="absolute -bottom-8 left-6">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white bg-white shadow-md">
                    <img
                      src={leagueTournament.logo_url}
                      alt={`Logo ${leagueTournament.name}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback em caso de erro no carregamento da imagem
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 pt-12">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-800">{leagueTournament.name}</h1>
                <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {leagueTournament.type === 'league' ? 'Liga' : 'Torneio'}
                </span>
              </div>
              
              <div className="mt-2 text-gray-600">
                <p className="mb-1">
                  <span className="font-medium">Formato:</span> {getFormatText(leagueTournament.format, leagueTournament.type)}
                </p>
                <p className="mb-1">
                  <span className="font-medium">Período:</span> {new Date(leagueTournament.start_date).toLocaleDateString('pt-BR')} a {new Date(leagueTournament.end_date).toLocaleDateString('pt-BR')}
                </p>
                <p className="mb-1">
                  <span className="font-medium">Local:</span> {leagueTournament.location}
                </p>
                {leagueTournament.type === 'tournament' && (
                  <p className="mb-1">
                    <span className="font-medium">Participantes:</span> {(leagueTournament as Tournament).participants_number}
                  </p>
                )}
              </div>
              
              {leagueTournament.description && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">{leagueTournament.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b">
              <div className="flex">
                <button
                  className={`px-6 py-3 font-medium text-sm flex items-center ${
                    activeTab === 'games'
                      ? 'text-green-600 border-b-2 border-green-600'
                      : 'text-gray-600 hover:text-green-600'
                  }`}
                  onClick={() => setActiveTab('games')}
                >
                  <Calendar size={18} className="mr-2" />
                  Jogos
                </button>
                {leagueTournament?.type === 'tournament' && (
                  <button
                    className={`px-6 py-3 font-medium text-sm flex items-center ${
                      activeTab === 'participants'
                        ? 'text-green-600 border-b-2 border-green-600'
                        : 'text-gray-600 hover:text-green-600'
                    }`}
                    onClick={() => setActiveTab('participants')}
                  >
                    <Users size={18} className="mr-2" />
                    Participantes
                  </button>
                )}
              </div>
            </div>
            
            <div className="p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>Liga ou torneio não encontrado.</p>
        </div>
      )}
    </>
  );

  return (
    <DashboardLayout activeTab={sidebarActiveTab} setActiveTab={setSidebarActiveTab}>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {content}
      </div>
    </DashboardLayout>
  );
};

export default LigaTorneioDetalhes;
