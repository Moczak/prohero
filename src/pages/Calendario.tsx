import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/Layout/DashboardLayout';

interface Game {
  id: string;
  team_id: string;
  team_name?: string;
  team_logo_url?: string;
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
  league_tournament_id?: string;
  league_tournament?: {
    id: string;
    name: string;
    logo_url: string | null;
    type: 'league' | 'tournament';
  };
}

interface Team {
  id: string;
  name: string;
  logo_url?: string | null;
}

const CalendarioPage: React.FC = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [gamesOnSelectedDate, setGamesOnSelectedDate] = useState<Game[]>([]);
  
  // Buscar todos os jogos e equipes
  useEffect(() => {
    const fetchGamesAndTeams = async () => {
      try {
        setLoading(true);
        
        // Buscar todas as equipes
        const { data: teamsData, error: teamsError } = await supabase
          .from('sports_organizations')
          .select('id, name, logo_url');
          
        if (teamsError) throw teamsError;
        
        // Buscar todos os jogos (sem filtro por usuário)
        const { data: gamesData, error: gamesError } = await supabase
          .from('games')
          .select('*')
          .order('game_date', { ascending: true });
          
        if (gamesError) throw gamesError;
        
        if (teamsData && gamesData) {
          // Adicionar informações da equipe aos jogos
          let gamesWithTeamInfo = gamesData.map((game: Game) => {
            const team = teamsData.find((t: Team) => t.id === game.team_id);
            return {
              ...game,
              team_name: team?.name || 'Equipe desconhecida',
              team_logo_url: team?.logo_url || null
            };
          });
          
          // Para cada jogo, buscar informações da liga ou torneio associado
          const gamesWithLeagueTournament = await Promise.all(gamesWithTeamInfo.map(async (game: Game) => {
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
                    type: 'league' as 'league' 
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
                    type: 'tournament' as 'tournament' 
                  } 
                };
              }
            }
            
            return game;
          }));
          
          setGames(gamesWithLeagueTournament);
        }
      } catch (err: any) {
        console.error('Erro ao buscar dados:', err);
        setError('Não foi possível carregar os jogos. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGamesAndTeams();
  }, []);
  
  // Gerar dias do calendário para o mês atual
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    // Último dia do mês
    const lastDay = new Date(year, month + 1, 0);
    
    // Ajustar para começar da semana que contém o primeiro dia
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    // Ajustar para terminar na semana que contém o último dia
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    
    const days: Date[] = [];
    let currentDay = new Date(startDate);
    
    while (currentDay <= endDate) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    setCalendarDays(days);
    
    // Selecionar a data atual por padrão
    const today = new Date();
    if (today.getMonth() === month && today.getFullYear() === year) {
      handleDateSelect(today);
    } else {
      // Ou selecionar o primeiro dia do mês
      handleDateSelect(firstDay);
    }
  }, [currentDate]);
  
  // Função para selecionar uma data e filtrar jogos
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    
    // Filtrar jogos para a data selecionada
    const formattedDate = date.toISOString().split('T')[0];
    const filteredGames = games.filter(game => game.game_date === formattedDate);
    setGamesOnSelectedDate(filteredGames);
  };
  
  // Navegar para o mês anterior
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };
  
  // Navegar para o próximo mês
  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };
  
  // Formatar o nome do mês
  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };
  
  // Verificar se uma data tem jogos
  const hasGamesOnDate = (date: Date) => {
    const formattedDate = date.toISOString().split('T')[0];
    return games.some(game => game.game_date === formattedDate);
  };
  
  // Verificar se é o mês atual
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth() && 
           date.getFullYear() === currentDate.getFullYear();
  };
  
  // Verificar se é a data selecionada
  const isSelectedDate = (date: Date) => {
    return selectedDate && 
           date.getDate() === selectedDate.getDate() && 
           date.getMonth() === selectedDate.getMonth() && 
           date.getFullYear() === selectedDate.getFullYear();
  };
  
  // Verificar se é hoje
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };
  
  return (
    <DashboardLayout activeTab="calendario" setActiveTab={() => {}}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <Calendar className="mr-2" />
            Calendário de Jogos
          </h1>
        </div>
        
        {loading ? (
          <div className="bg-white rounded-lg shadow p-6">
            {/* Shimmer para o cabeçalho do calendário */}
            <div className="flex items-center justify-between mb-6">
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="h-7 w-40 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
            </div>
            
            {/* Shimmer para os dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {[...Array(7)].map((_, index) => (
                <div key={index} className="text-center h-6 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
            
            {/* Shimmer para os dias do mês */}
            <div className="grid grid-cols-7 gap-1 mb-6">
              {[...Array(35)].map((_, index) => (
                <div key={index} className="h-12 rounded-md bg-gray-200 animate-pulse"></div>
              ))}
            </div>
            
            {/* Shimmer para a lista de jogos */}
            <div className="border-t pt-4">
              <div className="h-7 w-64 bg-gray-200 rounded animate-pulse mb-4"></div>
              
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="p-4 rounded-md bg-gray-100">
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        {/* Shimmer para hora e status */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
                            <div className="ml-2 h-5 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                          </div>
                          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        
                        {/* Shimmer para local */}
                        <div className="h-5 w-full bg-gray-200 rounded animate-pulse mb-3"></div>
                        
                        {/* Shimmer para times e placar */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse mr-2"></div>
                            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                          <div className="flex items-center">
                            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse ml-2"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            {/* Cabeçalho do calendário */}
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={goToPreviousMonth}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <ChevronLeft />
              </button>
              <h2 className="text-xl font-semibold capitalize">
                {formatMonth(currentDate)}
              </h2>
              <button 
                onClick={goToNextMonth}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <ChevronRight />
              </button>
            </div>
            
            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
                <div key={index} className="text-center font-medium text-gray-500 text-sm py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Dias do mês */}
            <div className="grid grid-cols-7 gap-1 mb-6">
              {calendarDays.map((date, index) => (
                <button
                  key={index}
                  onClick={() => handleDateSelect(date)}
                  className={`
                    h-12 rounded-md flex items-center justify-center relative
                    ${isCurrentMonth(date) ? 'text-gray-800' : 'text-gray-400'}
                    ${isSelectedDate(date) ? 'bg-green-500 text-white' : ''}
                    ${isToday(date) && !isSelectedDate(date) ? 'border border-green-500' : ''}
                    ${hasGamesOnDate(date) && !isSelectedDate(date) ? 'font-bold' : ''}
                    hover:bg-gray-100 ${isSelectedDate(date) ? 'hover:bg-green-600' : ''}
                  `}
                >
                  {date.getDate()}
                  {hasGamesOnDate(date) && !isSelectedDate(date) && (
                    <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"></span>
                  )}
                </button>
              ))}
            </div>
            
            {/* Jogos da data selecionada */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-4">
                {selectedDate && selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              
              {gamesOnSelectedDate.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum jogo agendado para esta data.</p>
              ) : (
                <div className="space-y-4">
                  {gamesOnSelectedDate.map(game => (
                    <div key={game.id} className={`p-4 rounded-md ${game.game_status === 'canceled' ? 'bg-red-50 border-l-2 border-red-500' : game.game_status === 'postponed' ? 'bg-yellow-50 border-l-2 border-yellow-500' : game.game_status === 'completed' ? 'bg-green-50 border-l-2 border-green-500' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-grow">
                          {/* Hora, status e equipe */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <p className="text-sm font-medium">{game.game_time}</p>
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
                            
                            {/* Nome da equipe principal */}
                            <div className="text-sm font-medium text-gray-600">
                              {game.team_name}
                            </div>
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
                                  game.team_logo_url ? (
                                    <img src={game.team_logo_url} alt="Logo" className="w-6 h-6 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                      <span className="text-xs text-gray-500">{game.team_name?.charAt(0)}</span>
                                    </div>
                                  )
                                ) : (
                                  game.opponent_logo_url ? (
                                    <img src={game.opponent_logo_url} alt="Logo Oponente" className="w-6 h-6 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                      <span className="text-xs text-gray-500">{game.opponent_name?.charAt(0)}</span>
                                    </div>
                                  )
                                )}
                              </div>
                              <div className="font-medium">{game.home_game ? game.team_name : game.opponent_name}</div>
                            </div>
                            <div className="text-xl font-bold">
                              {(game.score_team !== null && game.score_team !== undefined) ? 
                                (game.home_game ? game.score_team : game.score_opponent) : '-'}
                            </div>
                          </div>
                          
                          {/* Time visitante e placar */}
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center">
                              <div className="mr-2 flex-shrink-0">
                                {!game.home_game ? (
                                  game.team_logo_url ? (
                                    <img src={game.team_logo_url} alt="Logo" className="w-6 h-6 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                      <span className="text-xs text-gray-500">{game.team_name?.charAt(0)}</span>
                                    </div>
                                  )
                                ) : (
                                  game.opponent_logo_url ? (
                                    <img src={game.opponent_logo_url} alt="Logo Oponente" className="w-6 h-6 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                      <span className="text-xs text-gray-500">{game.opponent_name?.charAt(0)}</span>
                                    </div>
                                  )
                                )}
                              </div>
                              <div className="font-medium">{!game.home_game ? game.team_name : game.opponent_name}</div>
                            </div>
                            <div className="text-xl font-bold">
                              {(game.score_opponent !== null && game.score_opponent !== undefined) ? 
                                (game.home_game ? game.score_opponent : game.score_team) : '-'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Liga ou Torneio associado */}
                      {game.league_tournament && (
                        <div 
                          className="mt-2 pt-2 border-t flex items-center cursor-pointer hover:bg-gray-100 p-1 rounded"
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
                      
                      {/* Notas */}
                      {game.notes && (
                        <p className="text-sm text-gray-600 mt-2 pt-2 border-t">{game.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CalendarioPage;
