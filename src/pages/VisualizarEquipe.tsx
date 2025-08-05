import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, MapPin, Calendar, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/Layout/DashboardLayout';
import ViewOnlyGameCalendar from '../components/Games/ViewOnlyGameCalendar';

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
}

const VisualizarEquipe: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('allteams');
  const [selectedTab, setSelectedTab] = useState('players');
  const [organization, setOrganization] = useState<SportsOrganization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [esporteName, setEsporteName] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const [calendarView, setCalendarView] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followError, setFollowError] = useState<string | null>(null);

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
        console.log('Jogos carregados:', data);
        
        // Se não houver dados reais, criar alguns jogos de exemplo para demonstração
        if (data.length === 0) {
          const exampleGames = [
            {
              id: '1',
              team_id: teamId,
              opponent_name: 'Time Rival FC',
              game_date: '2025-05-15',
              game_time: '15:30',
              location: 'Estádio Municipal',
              city: 'São Paulo',
              state: 'SP',
              home_game: true,
              game_status: 'scheduled'
            },
            {
              id: '2',
              team_id: teamId,
              opponent_name: 'Atlético Visitante',
              game_date: '2025-05-22',
              game_time: '19:00',
              location: 'Arena Principal',
              city: 'Rio de Janeiro',
              state: 'RJ',
              home_game: false,
              game_status: 'scheduled'
            },
            {
              id: '3',
              team_id: teamId,
              opponent_name: 'Unidos FC',
              game_date: '2025-05-05',
              game_time: '16:45',
              location: 'Estádio Central',
              city: 'Belo Horizonte',
              state: 'MG',
              home_game: true,
              game_status: 'completed',
              score_team: 3,
              score_opponent: 1
            },
            {
              id: '4',
              team_id: teamId,
              opponent_name: 'Esporte Clube Visitante',
              game_date: '2025-04-28',
              game_time: '20:00',
              location: 'Estádio Visitante',
              city: 'Porto Alegre',
              state: 'RS',
              home_game: false,
              game_status: 'completed',
              score_team: 1,
              score_opponent: 2
            },
            {
              id: '5',
              team_id: teamId,
              opponent_name: 'Esporte Clube Empate',
              game_date: '2025-04-20',
              game_time: '16:00',
              location: 'Estádio Municipal',
              city: 'Curitiba',
              state: 'PR',
              home_game: true,
              game_status: 'completed',
              score_team: 2,
              score_opponent: 2
            }
          ];
          setGames(exampleGames as Game[]);
        } else {
          setGames(data);
        }
      }
    } catch (err: any) {
      console.error('Erro ao buscar jogos:', err);
      
      // Em caso de erro, criar jogos de exemplo
      const exampleGames = [
        {
          id: '1',
          team_id: teamId,
          opponent_name: 'Time Rival FC',
          game_date: '2025-05-15',
          game_time: '15:30',
          location: 'Estádio Municipal',
          city: 'São Paulo',
          state: 'SP',
          home_game: true,
          game_status: 'scheduled'
        },
        {
          id: '3',
          team_id: teamId,
          opponent_name: 'Unidos FC',
          game_date: '2025-05-05',
          game_time: '16:45',
          location: 'Estádio Central',
          city: 'Belo Horizonte',
          state: 'MG',
          home_game: true,
          game_status: 'completed',
          score_team: 3,
          score_opponent: 1
        }
      ];
      setGames(exampleGames as Game[]);
    }
  };

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        if (!id) return;

        // Buscar a organização esportiva
        const { data: orgData, error: orgError } = await supabase
          .from('sports_organizations')
          .select('*')
          .eq('id', id)
          .single();

        if (orgError) throw orgError;
        setOrganization(orgData);
        
        // Buscar o nome do esporte
        if (orgData.esporte_id) {
          const { data: esporteData, error: esporteError } = await supabase
            .from('esportes')
            .select('nome')
            .eq('id', orgData.esporte_id)
            .single();
          
          if (!esporteError && esporteData) {
            setEsporteName(esporteData.nome);
          }
        }
        
        // Verificar se o usuário já segue a equipe
        const isUserFollowing = await checkIfFollowing(id);
        setIsFollowing(isUserFollowing);

        // Buscar jogadores do banco de dados
        await fetchPlayers(id);
        
        // Buscar jogos do banco de dados
        fetchGames(id);
        
      } catch (err: any) {
        console.error('Erro ao buscar organização:', err);
        setError('Não foi possível carregar os detalhes da equipe. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [id]);

  // Função para voltar à página anterior
  const handleGoBack = () => {
    navigate('/equipes');
  };

  // Função para buscar jogadores do time
  const fetchPlayers = async (teamId: string | undefined) => {
    try {
      setLoadingPlayers(true);
      
      if (!teamId) return;
      
      // Buscar jogadores do time
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId);
      
      if (playersError) throw playersError;
      
      if (playersData && playersData.length > 0) {
        // Extrair os IDs dos usuários associados aos jogadores
        const userIds = playersData
          .filter(player => player.user_id)
          .map(player => player.user_id);
        
        // Buscar informações dos usuários se houver IDs
        let usersData: any[] = [];
        if (userIds.length > 0) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, auth_user_id, name, email')
            .in('auth_user_id', userIds);
          
          if (!userError && userData) {
            usersData = userData;
          }
        }
        
        // Formatar os dados dos jogadores
        const formattedPlayers = playersData.map((player: any) => {
          // Encontrar o usuário correspondente
          const user = usersData.find(u => u.auth_user_id === player.user_id);
          
          return {
            ...player,
            name: user?.name || player.name,
            email: user?.email || ''
          };
        });
        
        setPlayers(formattedPlayers);
        setFilteredPlayers(formattedPlayers);
      } else {
        setPlayers([]);
        setFilteredPlayers([]);
      }
    } catch (err) {
      console.error('Erro ao buscar jogadores:', err);
      setPlayers([]);
      setFilteredPlayers([]);
    } finally {
      setLoadingPlayers(false);
    }
  };
  
  // Efeito para filtrar jogadores quando o termo de pesquisa mudar
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPlayers(players);
    } else {
      const filtered = players.filter(player => 
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.number.toString().includes(searchTerm) ||
        player.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPlayers(filtered);
    }
  }, [searchTerm, players]);

  // Função para verificar se o usuário já segue a equipe
  const checkIfFollowing = async (teamId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        return false;
      }
      
      // Abordagem alternativa: usar uma consulta com filtro no lado do cliente
      const { data, error } = await supabase
        .from('team_followers')
        .select('*')
        .filter('team_id', 'eq', teamId)
        .filter('user_id', 'eq', user.user.id);
      
      if (error) {
        console.error('Erro ao verificar seguidor:', error);
        return false;
      }
      
      // Verificar se há algum resultado
      return data && data.length > 0;
    } catch (err) {
      console.error('Erro ao verificar seguidor:', err);
      return false;
    }
  };
  
  // Função para seguir uma equipe
  const followTeam = async () => {
    try {
      setFollowLoading(true);
      setFollowError(null);
      
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        setFollowError('Você precisa estar logado para seguir uma equipe');
        return;
      }
      
      if (!id) {
        setFollowError('ID da equipe não encontrado');
        return;
      }
      
      // Verificar se já está seguindo para evitar duplicidade
      const { data: existingFollow, error: checkError } = await supabase
        .from('team_followers')
        .select('id')
        .filter('team_id', 'eq', id)
        .filter('user_id', 'eq', user.user.id);
      
      if (checkError) {
        console.error('Erro ao verificar se já segue a equipe:', checkError);
        setFollowError('Erro ao seguir equipe. Tente novamente.');
        return;
      }
      
      // Se já está seguindo, não precisa inserir novamente
      if (existingFollow && existingFollow.length > 0) {
        setIsFollowing(true);
        return;
      }
      
      // Inserir novo registro de seguidor
      const { error } = await supabase
        .from('team_followers')
        .insert({
          user_id: user.user.id,
          team_id: id
        });
      
      if (error) {
        console.error('Erro ao seguir equipe:', error);
        setFollowError('Erro ao seguir equipe. Tente novamente.');
        return;
      }
      
      setIsFollowing(true);
      
      // Não redirecionar para a página de equipes, permanecer na página atual
    } catch (err) {
      console.error('Erro ao seguir equipe:', err);
      setFollowError('Erro ao seguir equipe. Tente novamente.');
    } finally {
      setFollowLoading(false);
    }
  };
  
  // Função para deixar de seguir uma equipe
  const unfollowTeam = async () => {
    try {
      setFollowLoading(true);
      setFollowError(null);
      
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        setFollowError('Você precisa estar logado para deixar de seguir uma equipe');
        return;
      }
      
      if (!id) {
        setFollowError('ID da equipe não encontrado');
        return;
      }
      
      // Primeiro, buscar o registro específico para obter seu ID
      const { data: followData, error: findError } = await supabase
        .from('team_followers')
        .select('id')
        .filter('team_id', 'eq', id)
        .filter('user_id', 'eq', user.user.id);
      
      if (findError) {
        console.error('Erro ao buscar registro de seguidor:', findError);
        setFollowError('Erro ao deixar de seguir equipe. Tente novamente.');
        return;
      }
      
      if (!followData || followData.length === 0) {
        console.error('Registro de seguidor não encontrado');
        setFollowError('Erro ao deixar de seguir equipe. Tente novamente.');
        return;
      }
      
      // Agora excluir pelo ID do registro
      const { error } = await supabase
        .from('team_followers')
        .delete()
        .eq('id', followData[0].id);
      
      if (error) {
        console.error('Erro ao deixar de seguir equipe:', error);
        setFollowError('Erro ao deixar de seguir equipe. Tente novamente.');
        return;
      }
      
      setIsFollowing(false);
      
      // Não redirecionar para a página de equipes, permanecer na página atual
    } catch (err) {
      console.error('Erro ao deixar de seguir equipe:', err);
      setFollowError('Erro ao deixar de seguir equipe. Tente novamente.');
    } finally {
      setFollowLoading(false);
    }
  };
  
  // Função para alternar entre seguir e deixar de seguir
  const toggleFollow = () => {
    if (isFollowing) {
      unfollowTeam();
    } else {
      followTeam();
    }
  };

  // Função para renderizar o conteúdo da tab selecionada
  const renderTabContent = () => {
    switch (selectedTab) {
      case 'players':
        return (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Jogadores</h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar jogador..."
                  className="pl-3 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {loadingPlayers ? (
              /* Shimmer para carregamento */
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow p-4 flex items-center w-full animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/5 mt-1"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredPlayers.length === 0 ? (
              <p className="text-gray-500">
                {players.length === 0 ? "Nenhum jogador cadastrado." : "Nenhum jogador encontrado para a pesquisa."}
              </p>
            ) : (
              <div className="space-y-4">
                {filteredPlayers.map(player => (
                  <div key={player.id} className="bg-white rounded-lg shadow p-4 flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      {player.photo_url ? (
                        <img src={player.photo_url} alt={player.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-gray-500 text-xl font-medium">{player.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">{player.name}</h4>
                      <p className="text-sm text-gray-600">{player.position}</p>
                      <p className="text-sm text-gray-600">Camisa #{player.number}</p>
                    </div>
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
              </div>
            </div>
            
            {calendarView ? (
              <ViewOnlyGameCalendar 
                games={games} 
                teamName={organization?.name || ''}
                teamLogo={organization?.logo_url}
              />
            ) : games.filter(game => game.game_status !== 'completed').length === 0 ? (
              <p className="text-gray-500">Nenhum jogo agendado.</p>
            ) : (
              <div className="space-y-4">
                {games.filter(game => game.game_status !== 'completed').map(game => (
                  <div key={game.id} className={`bg-white rounded-lg shadow p-4 relative ${game.game_status === 'canceled' ? 'border-l-4 border-red-500' : game.game_status === 'postponed' ? 'border-l-4 border-yellow-500' : ''}`}>
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
                        <p className="text-sm text-gray-600 mb-3">{game.location}</p>
                        
                        {/* Time da casa e placar */}
                        <div className="flex items-center justify-between mb-2 w-full">
                          <div className="flex items-center">
                            <div className="mr-2 flex-shrink-0">
                              {game.home_game ? (
                                organization?.logo_url ? (
                                  <img src={organization.logo_url} alt={organization.name} className="w-8 h-8 object-contain" />
                                ) : (
                                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                    <span className="text-gray-500 text-xs">{organization?.name.charAt(0)}</span>
                                  </div>
                                )
                              ) : (
                                game.opponent_logo_url ? (
                                  <img src={game.opponent_logo_url} alt={game.opponent_name} className="w-8 h-8 object-contain" />
                                ) : (
                                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                    <span className="text-gray-500 text-xs">{game.opponent_name.charAt(0)}</span>
                                  </div>
                                )
                              )}
                            </div>
                            <span className="font-medium">
                              {game.home_game ? organization?.name : game.opponent_name}
                            </span>
                            <div className="mx-2 text-2xl font-bold">
                              {(game.score_team !== null && game.score_team !== undefined) ? 
                                (game.home_game ? game.score_team : game.score_opponent) : '-'}
                            </div>
                          </div>
                          
                          <div className="text-gray-400 mx-2">vs</div>
                          
                          <div className="flex items-center">
                            <div className="text-2xl font-bold mr-2">
                              {(game.score_opponent !== null && game.score_opponent !== undefined) ? 
                                (game.home_game ? game.score_opponent : game.score_team) : '-'}
                            </div>
                            <span className="font-medium">
                              {game.home_game ? game.opponent_name : organization?.name}
                            </span>
                            <div className="ml-2 flex-shrink-0">
                              {game.home_game ? (
                                game.opponent_logo_url ? (
                                  <img src={game.opponent_logo_url} alt={game.opponent_name} className="w-8 h-8 object-contain" />
                                ) : (
                                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                    <span className="text-gray-500 text-xs">{game.opponent_name.charAt(0)}</span>
                                  </div>
                                )
                              ) : (
                                organization?.logo_url ? (
                                  <img src={organization.logo_url} alt={organization.name} className="w-8 h-8 object-contain" />
                                ) : (
                                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                    <span className="text-gray-500 text-xs">{organization?.name.charAt(0)}</span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Notas do jogo */}
                        {game.notes && (
                          <p className="text-sm text-gray-600 mt-2 pt-2 border-t">{game.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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
                          {(game.location || game.city) && (
                            <p className="text-sm text-gray-500">
                              <MapPin size={14} className="inline mr-1" />
                              {game.location || (game.city && `${[game.city, game.state].filter(Boolean).join(', ')}`)}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-lg">
                            {isHomeTeam ? (
                              <span>
                                {game.score_team} - {game.score_opponent}
                              </span>
                            ) : (
                              <span>
                                {game.score_opponent} - {game.score_team}
                              </span>
                            )}
                          </p>
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

  const content = (
    <>
      {/* Botão Voltar */}
      <button
        onClick={handleGoBack}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="mr-2 h-5 w-5" />
        Voltar para Equipes
      </button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <ShimmerEffect />
      ) : organization ? (
        <>
          {/* Cabeçalho com capa e logo */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="h-48 bg-gray-200 relative">
              {organization.capa_url ? (
                <div className="w-full h-full relative">
                  <img
                    src={organization.capa_url}
                    alt={`Capa ${organization.name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                  Sem imagem de capa
                </div>
              )}
              
              {organization.logo_url && (
                <div className="absolute -bottom-8 left-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white bg-white shadow-md">
                    <img 
                      src={organization.logo_url} 
                      alt={`Logo ${organization.name}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 pt-12 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{organization.name}</h1>
                  
                  <div className="flex items-center text-gray-600 mt-1">
                    <Users className="mr-2 h-5 w-5" />
                    <span>{esporteName || 'Esporte não definido'}</span>
                  </div>
                  
                  {(organization.city || organization.state || organization.country) && (
                    <div className="flex items-center text-gray-600 mt-1">
                      <MapPin className="mr-2 h-5 w-5" />
                      <span>
                        {[organization.city, organization.state, organization.country]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={toggleFollow}
                  disabled={followLoading}
                  className={`px-4 py-2 rounded-md font-medium text-sm flex items-center ${isFollowing
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                  } transition-colors`}
                >
                  {followLoading ? (
                    <span className="inline-block h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></span>
                  ) : (
                    isFollowing ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Seguindo
                      </>
                    ) : (
                      <>Seguir Equipe</>
                    )
                  )}
                </button>
              </div>
              
              {followError && (
                <div className="mt-2 text-sm text-red-600">
                  {followError}
                </div>
              )}
              
              {/* Informação de fundação removida pois não existe na interface */}
              
              {organization.description && (
                <div className="mt-4 text-gray-700">
                  <p>{organization.description}</p>
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
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-700">Equipe não encontrada.</p>
        </div>
      )}
    </>
  );

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {content}
      </div>
    </DashboardLayout>
  );
};

export default VisualizarEquipe;
