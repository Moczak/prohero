import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, Trophy, Plus, Edit, MoreVertical, MapPin, UserX, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/Layout/DashboardLayout';
import AddGameModal from '../components/Games/AddGameModal';
import EditGameModal from '../components/Games/EditGameModal';
import GameCalendar from '../components/Games/GameCalendar';
import ConfirmationModal from '../components/UI/ConfirmationModal';
import AddPlayerModal from '../components/Players/AddPlayerModal';
import EditPlayerModal from '../components/Players/EditPlayerModal';
import TogglePlayerActiveModal from '../components/Players/TogglePlayerActiveModal';

import { SportsOrganization } from "../types/SportsOrganization";

interface Player {
  id: string;
  name: string;
  position: string;
  number: number;
  photo_url: string | null;
  user_id: string;
  active: boolean;
  email: string;
  users?: {
    id: string;
    name: string;
    email: string;
  };
}

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

// Interface GameResult removida pois agora usamos os jogos concluídos

const EquipeDetalhes: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('teams');
  const [selectedTab, setSelectedTab] = useState('players');
  const [organization, setOrganization] = useState<SportsOrganization | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [games, setGames] = useState<Game[]>([]);
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
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showEditPlayerModal, setShowEditPlayerModal] = useState(false);
  const [showDeactivatePlayerModal, setShowDeactivatePlayerModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showPlayerOptions, setShowPlayerOptions] = useState<string | null>(null);
  const optionsButtonRef = useRef<HTMLButtonElement>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Buscar o papel do usuário atual
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('auth_user_id', user.id)
          .single();
        
        if (error) throw error;
        if (data) {
          setUserRole(data.role);
        }
      } catch (err) {
        console.error('Erro ao buscar papel do usuário:', err);
      }
    };
    
    fetchUserRole();
  }, [user]);

  // Função para buscar jogos do time
  const fetchGames = async (teamId: string | undefined) => {
    try {
      if (!teamId) return;
      
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('team_id', teamId)
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
              .eq('id', game.league_tournament_id);
            
            if (leagueData && leagueData.length > 0) {
              return { 
                ...game, 
                league_tournament: { 
                  ...leagueData[0], 
                  type: 'league' as const
                } 
              };
            }
            
            // Se não encontrar como liga, tentar como torneio
            const { data: tournamentData } = await supabase
              .from('tournaments')
              .select('id, name, logo_url')
              .eq('id', game.league_tournament_id);
            
            if (tournamentData && tournamentData.length > 0) {
              return { 
                ...game, 
                league_tournament: { 
                  ...tournamentData[0], 
                  type: 'tournament' as const
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
  
  // Função para buscar jogadores do time
  const fetchPlayers = async (teamId: string | undefined) => {
    if (!teamId) return;
    
    setLoadingPlayers(true);
    try {
      // Buscar jogadores
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .order('name');
        
      if (playersError) throw playersError;
      
      // Buscar informações dos usuários associados aos jogadores
      let formattedPlayers = playersData || [];
      
      if (playersData && playersData.length > 0) {
        // Extrair os IDs de usuário dos jogadores
        const userIds = playersData.map(player => player.user_id).filter(Boolean);
        
        // Buscar os usuários correspondentes
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('auth_user_id, name, email')
          .in('auth_user_id', userIds);
        
        if (usersError) {
          console.error('Erro ao buscar usuários:', usersError);
          // Continuar mesmo com erro para mostrar pelo menos os dados dos jogadores
        }
        
        // Criar um mapa de usuários para facilitar o acesso
        const usersMap: Record<string, any> = {};
        if (usersData) {
          usersData.forEach(user => {
            usersMap[user.auth_user_id] = user;
          });
        }
        
        // Formatar os dados para incluir informações do usuário
        formattedPlayers = playersData.map(player => {
          const user = player.user_id ? usersMap[player.user_id] : null;
          return {
            ...player,
            name: user?.name || player.name,
            email: user?.email || '',
            users: user ? {
              id: user.auth_user_id,
              name: user.name,
              email: user.email
            } : undefined
          };
        });
      }
      
      setPlayers(formattedPlayers);
      setFilteredPlayers(formattedPlayers);
    } catch (err: any) {
      console.error('Erro ao buscar jogadores:', err);
      setError('Não foi possível carregar os jogadores.');
    } finally {
      setLoadingPlayers(false);
    }
  };
  
  // Função para filtrar jogadores com base no termo de busca
  const filterPlayers = () => {
    if (!searchTerm.trim()) {
      setFilteredPlayers(players);
      return;
    }
    
    const filtered = players.filter(player => 
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(player.number).includes(searchTerm)
    );
    
    setFilteredPlayers(filtered);
  };
  
  // Efeito para filtrar jogadores quando o termo de busca mudar
  useEffect(() => {
    filterPlayers();
  }, [searchTerm, players]);
  
  // Função para abrir o modal de adição de jogador
  const handleAddPlayer = () => {
    setShowAddPlayerModal(true);
  };
  
  // Função para lidar com a adição de um novo jogador
  const handlePlayerAdded = async () => {
    setShowAddPlayerModal(false);
    if (id) {
      await fetchPlayers(id);
    }
  };
  
  // Função para abrir o modal de edição de jogador
  const handleEditPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setShowEditPlayerModal(true);
    setShowPlayerOptions(null);
  };
  
  // Função para lidar com a atualização de um jogador
  const handlePlayerUpdated = async () => {
    setShowEditPlayerModal(false);
    setSelectedPlayer(null);
    if (id) {
      await fetchPlayers(id);
    }
  };
  
  // Função para abrir o modal de desativação de jogador
  const handleTogglePlayerActive = (player: Player) => {
    setSelectedPlayer(player);
    setShowDeactivatePlayerModal(true);
    setShowPlayerOptions(null);
  };
  
  // Função para lidar com a desativação/ativação de um jogador
  const handlePlayerActiveToggled = async () => {
    setShowDeactivatePlayerModal(false);
    setSelectedPlayer(null);
    if (id) {
      await fetchPlayers(id);
    }
  };
  
  // Função para alternar a exibição do menu de opções do jogador
  const togglePlayerOptions = (playerId: string) => {
    if (showPlayerOptions === playerId) {
      setShowPlayerOptions(null);
    } else {
      setShowPlayerOptions(playerId);
    }
  };

  useEffect(() => {
    const fetchOrganization = async () => {
      if (id) {
        try {
          setLoading(true);
          
          const { data, error } = await supabase
            .from('sports_organizations')
            .select('*')
            .eq('id', id)
            .single();
          
          if (error) throw error;
          
          setOrganization(data);
          
          // Buscar jogos
          fetchGames(id);
          
          // Buscar jogadores
          fetchPlayers(id);
          
        } catch (err: any) {
          console.error('Erro ao buscar organização:', err);
          setError('Não foi possível carregar os dados da equipe.');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchOrganization();
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
            <div className="px-6 py-3 h-12 bg-gray-200 rounded-sm w-32 m-1"></div>
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

  // Função para renderizar o conteúdo da tab selecionada
  const renderTabContent = () => {
    switch (selectedTab) {
      case 'players':
        return (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Jogadores</h3>
              <div className="flex space-x-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar jogador..."
                    className="px-3 py-1 text-sm border rounded-md w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {userRole !== 'atleta' && (
                  <button 
                    onClick={handleAddPlayer}
                    className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center"
                  >
                    <Plus size={16} className="mr-1" />
                    Adicionar Jogador
                  </button>
                )}
              </div>
            </div>
            
            {/* Modal para adicionar jogador */}
            {showAddPlayerModal && (
              <AddPlayerModal 
                teamId={id || ''}
                isOpen={showAddPlayerModal}
                onClose={() => setShowAddPlayerModal(false)}
                onPlayerAdded={handlePlayerAdded}
              />
            )}
            
            {/* Modal para editar jogador */}
            {showEditPlayerModal && selectedPlayer && (
              <EditPlayerModal
                player={selectedPlayer}
                isOpen={showEditPlayerModal}
                onClose={() => setShowEditPlayerModal(false)}
                onPlayerUpdated={handlePlayerUpdated}
              />
            )}
            
            {/* Modal para desativar/ativar jogador */}
            {showDeactivatePlayerModal && selectedPlayer && (
              <TogglePlayerActiveModal
                player={selectedPlayer}
                isOpen={showDeactivatePlayerModal}
                onClose={() => setShowDeactivatePlayerModal(false)}
                onPlayerDeactivated={handlePlayerActiveToggled}
              />
            )}
            
            {loadingPlayers ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-lg shadow p-4 flex items-center animate-pulse">
                    <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredPlayers.length === 0 ? (
              <p className="text-gray-500">
                {searchTerm ? "Nenhum jogador encontrado com este termo de busca." : "Nenhum jogador cadastrado."}
              </p>
            ) : (
              <div className="space-y-4">
                {filteredPlayers.map(player => (
                  <div 
                    key={player.id} 
                    className={`bg-white rounded-lg shadow p-4 flex items-center justify-between ${!player.active ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                        {player.photo_url ? (
                          <img src={player.photo_url} alt={player.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-gray-500 text-xl">{player.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium flex items-center">
                          {player.name}
                          {!player.active && (
                            <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Inativo</span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-600">{player.position} • #{player.number}</p>
                        {player.users && (
                          <p className="text-xs text-gray-500 mt-1">{player.users.email}</p>
                        )}
                      </div>
                    </div>
                    
                    {userRole !== 'atleta' && (
                      <div className="relative">
                        <button 
                          onClick={() => togglePlayerOptions(player.id)}
                          className="p-1 rounded-full hover:bg-gray-100"
                          ref={optionsButtonRef}
                        >
                          <MoreVertical size={18} />
                        </button>
                        
                        {/* Menu de opções do jogador */}
                        {showPlayerOptions === player.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10 border">
                            <ul>
                              <li>
                                <button 
                                  onClick={() => handleEditPlayer(player)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                >
                                  <Edit size={14} className="mr-2" />
                                  Editar
                                </button>
                              </li>
                              <li>
                                <button 
                                  onClick={() => handleTogglePlayerActive(player)}
                                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${player.active ? 'text-red-600' : 'text-green-600'}`}
                                >
                                  <UserX size={14} className="mr-2" />
                                  {player.active ? 'Desativar' : 'Ativar'}
                                </button>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'games':
        return (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Próximos Jogos</h3>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setCalendarView(!calendarView)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md flex items-center"
                >
                  <Calendar size={16} className="mr-1" />
                  {calendarView ? 'Modo Lista' : 'Calendário'}
                </button>
                {userRole !== 'atleta' && (
                  <button 
                    onClick={() => setShowAddGameModal(true)}
                    className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center"
                  >
                    <Plus size={16} className="mr-1" />
                    Adicionar Jogo
                  </button>
                )}
              </div>
            </div>
            
            {/* Modal para adicionar jogo */}
            {showAddGameModal && (
              <AddGameModal 
                teamId={id || ''}
                teamName={organization?.name || ''}
                isOpen={showAddGameModal}
                onClose={() => setShowAddGameModal(false)}
                onGameAdded={handleGameAdded}
              />
            )}
            
            {/* Modal de edição de jogo */}
            {showEditGameModal && selectedGame && (
              <EditGameModal
                game={selectedGame}
                teamName={organization?.name || ''}
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
                teamName={organization?.name || ''}
                teamLogo={organization?.logo_url}
                onEditGame={handleEditGame}
                onDeleteGame={handleDeleteGame}
                userRole={userRole}
              />
            ) : (
              // Visualização de lista
              <div>
                {games.filter(game => game.game_status !== 'completed').length === 0 ? (
                  <p className="text-gray-500">Nenhum jogo agendado.</p>
                ) : (
                  <div className="space-y-4">
                    {games.filter(game => game.game_status !== 'completed').map(game => (
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
                                  {game.game_status === 'scheduled' ? 'Agendado' : 
                                   game.game_status === 'in_progress' ? 'Em andamento' : 
                                   game.game_status === 'completed' ? 'Concluído' : 
                                   game.game_status === 'canceled' ? 'Cancelado' : 
                                   game.game_status === 'postponed' ? 'Adiado' : 'Desconhecido'}
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
                                    organization?.logo_url ? (
                                      <img src={organization.logo_url} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                        <span className="text-gray-500 font-medium">{organization?.name?.charAt(0) || '?'}</span>
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
                                <div className="font-medium">{game.home_game ? organization?.name : game.opponent_name}</div>
                              </div>
                              <div className="text-2xl font-bold">
                                {(game.score_team !== null && game.score_team !== undefined) ? 
                                  (game.home_game ? game.score_team : game.score_opponent) : '-'}
                              </div>
                            </div>
                            
                            {/* Time visitante e placar */}
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center">
                                <div className="mr-2 flex-shrink-0">
                                  {!game.home_game ? (
                                    organization?.logo_url ? (
                                      <img src={organization.logo_url} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                        <span className="text-gray-500 font-medium">{organization?.name?.charAt(0) || '?'}</span>
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
                                <div className="font-medium">{!game.home_game ? organization?.name : game.opponent_name}</div>
                              </div>
                              <div className="text-2xl font-bold">
                                {(game.score_opponent !== null && game.score_opponent !== undefined) ? 
                                  (game.home_game ? game.score_opponent : game.score_team) : '-'}
                              </div>
                            </div>
                            
                            {/* Liga ou Torneio associado */}
                            {game.league_tournament && (
                              <div className="mt-3 pt-2 border-t border-gray-100">
                                <Link 
                                  to={`/ligastorneios/${game.league_tournament.id}`} 
                                  className="flex items-center hover:bg-gray-50 p-1 rounded transition-colors group"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="w-5 h-5 mr-2 flex-shrink-0">
                                    {game.league_tournament.logo_url ? (
                                      <img 
                                        src={game.league_tournament.logo_url} 
                                        alt="Logo" 
                                        className="w-full h-full rounded-full object-cover" 
                                      />
                                    ) : (
                                      <Trophy size={16} className="text-gray-500" />
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500 flex-grow">
                                    {game.league_tournament.type === 'league' ? 'Liga' : 'Torneio'}: {game.league_tournament.name}
                                  </span>
                                  <ExternalLink size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>
                              </div>
                            )}
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
      case 'results':
        // Filtrar apenas jogos com status "completed" e que tenham placar
        const completedGames = games.filter(game => 
          game.game_status === 'completed' && 
          game.score_team !== null && 
          game.score_opponent !== null
        );
        
        return (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Resultados</h3>
            {completedGames.length === 0 ? (
              <p className="text-gray-500">Nenhum jogo concluído registrado.</p>
            ) : (
              <div className="space-y-4">
                {completedGames.map(game => {
                  // Determinar o resultado (vitória, derrota ou empate)
                  const isHomeTeam = game.home_game;
                  const teamScore = isHomeTeam ? game.score_team || 0 : game.score_opponent || 0;
                  const opponentScore = isHomeTeam ? game.score_opponent || 0 : game.score_team || 0;
                  
                  let result = 'draw';
                  if (teamScore > opponentScore) {
                    result = 'win';
                  } else if (teamScore < opponentScore) {
                    result = 'loss';
                  }
                  
                  return (
                    <div 
                      key={game.id} 
                      className={`bg-white rounded-lg shadow p-4 border-l-4 ${
                        result === 'win' ? 'border-green-500' : 
                        result === 'loss' ? 'border-red-500' : 'border-yellow-500'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">
                            {isHomeTeam ? (
                              <>
                                {organization?.name} vs {game.opponent_name}
                              </>
                            ) : (
                              <>
                                {game.opponent_name} vs {organization?.name}
                              </>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600 mb-1">
                            {game.game_date.split('T')[0].split('-').reverse().join('/')} • {game.game_time}
                          </p>
                          {game.location && (
                            <p className="text-sm text-gray-500">
                              <MapPin size={14} className="inline mr-1" />
                              {game.location}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-lg">{teamScore} - {opponentScore}</p>
                          <p className={`text-sm ${
                            result === 'win' ? 'text-green-600' : 
                            result === 'loss' ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {result === 'win' ? 'Vitória' : result === 'loss' ? 'Derrota' : 'Empate'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
      ) : organization ? (
        <div>
          {/* Botão Voltar */}
          <button 
            onClick={() => navigate('/minhaequipe')}
            className="flex items-center text-gray-600 hover:text-green-600 mb-4 transition-colors"
          >
            <ArrowLeft size={18} className="mr-1" />
            <span>Voltar para Minhas Equipes</span>
          </button>

          {/* Cabeçalho com capa e logo */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="h-48 bg-gray-200 relative">
              {organization.capa_url ? (
                <img
                  src={organization.capa_url}
                  alt={`Capa ${organization.name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  Sem imagem de capa
                </div>
              )}
              
              {organization.logo_url && (
                <div className="absolute -bottom-8 left-6">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white bg-white shadow-md">
                    <img 
                      src={organization.logo_url} 
                      alt={`Logo ${organization.name}`}
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
              <h2 className="text-2xl font-bold text-gray-800">{organization.name}</h2>
              <p className="text-gray-600 mt-1">{organization.organization_type}</p>
              <p className="text-gray-500 mt-1">
                <span className="inline-block mr-1">📍</span>{[organization.city, organization.state, organization.country].filter(Boolean).join(', ')}
              </p>
              {organization.description && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">{organization.description}</p>
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
                    selectedTab === 'players'
                      ? 'text-green-600 border-b-2 border-green-600'
                      : 'text-gray-600 hover:text-green-600'
                  }`}
                  onClick={() => setSelectedTab('players')}
                >
                  <Users size={18} className="mr-2" />
                  Jogadores
                </button>
                <button
                  className={`px-6 py-3 font-medium text-sm flex items-center ${
                    selectedTab === 'games'
                      ? 'text-green-600 border-b-2 border-green-600'
                      : 'text-gray-600 hover:text-green-600'
                  }`}
                  onClick={() => setSelectedTab('games')}
                >
                  <Calendar size={18} className="mr-2" />
                  Jogos
                </button>
                <button
                  className={`px-6 py-3 font-medium text-sm flex items-center ${
                    selectedTab === 'results'
                      ? 'text-green-600 border-b-2 border-green-600'
                      : 'text-gray-600 hover:text-green-600'
                  }`}
                  onClick={() => setSelectedTab('results')}
                >
                  <Trophy size={18} className="mr-2" />
                  Resultados
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>Equipe não encontrada.</p>
        </div>
      )}
    </>
  );

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {content}
      </div>
      
      {/* Modais de jogadores */}
      {showAddPlayerModal && (
        <AddPlayerModal 
          teamId={id || ''}
          isOpen={showAddPlayerModal}
          onClose={() => setShowAddPlayerModal(false)}
          onPlayerAdded={handlePlayerAdded}
        />
      )}
      
      {showEditPlayerModal && selectedPlayer && (
        <EditPlayerModal
          player={selectedPlayer}
          isOpen={showEditPlayerModal}
          onClose={() => setShowEditPlayerModal(false)}
          onPlayerUpdated={handlePlayerUpdated}
        />
      )}
      
      {showDeactivatePlayerModal && selectedPlayer && (
        <TogglePlayerActiveModal
          player={selectedPlayer}
          isOpen={showDeactivatePlayerModal}
          onClose={() => setShowDeactivatePlayerModal(false)}
          onPlayerDeactivated={handlePlayerActiveToggled}
        />
      )}
    </DashboardLayout>
  );
};

export default EquipeDetalhes;
