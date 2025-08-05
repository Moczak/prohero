import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MoreVertical, Edit } from 'lucide-react';

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
}

interface GameCalendarProps {
  games: Game[];
  teamName: string;
  teamLogo?: string | null;
  onEditGame?: (game: Game) => void;
  onDeleteGame?: (gameId: string) => void;
  userRole?: string | null;
}

const GameCalendar: React.FC<GameCalendarProps> = ({ games, teamName, teamLogo, onEditGame, onDeleteGame, userRole }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [gamesOnSelectedDate, setGamesOnSelectedDate] = useState<Game[]>([]);
  const [showGameOptions, setShowGameOptions] = useState<string | null>(null);
  
  // Função para alternar a exibição do menu de opções do jogo
  const toggleGameOptions = (gameId: string) => {
    if (showGameOptions === gameId) {
      setShowGameOptions(null);
    } else {
      setShowGameOptions(gameId);
    }
  };
  
  // Função para editar um jogo
  const handleEditGame = (game: Game) => {
    if (onEditGame) {
      onEditGame(game);
    }
    setShowGameOptions(null);
  };
  
  // Função para excluir um jogo
  const handleDeleteGame = (gameId: string) => {
    if (onDeleteGame) {
      onDeleteGame(gameId);
    }
    setShowGameOptions(null);
  };

  // Generate calendar days for the current month
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Calculate days from previous month to show
    const daysFromPrevMonth = firstDayOfWeek;
    
    // Calculate total days to show (previous month days + current month days)
    const totalDays = daysFromPrevMonth + lastDay.getDate();
    
    // Calculate rows needed (7 days per row)
    const rows = Math.ceil(totalDays / 7);
    
    // Calculate total calendar days (rows * 7)
    const totalCalendarDays = rows * 7;
    
    // Generate calendar days array
    const days: Date[] = [];
    
    // Add days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLastDay - i));
    }
    
    // Add days from current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add days from next month
    const remainingDays = totalCalendarDays - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    setCalendarDays(days);
  }, [currentDate]);

  // Check if a date has games
  const hasGamesOnDate = (date: Date): boolean => {
    const dateString = date.toISOString().split('T')[0];
    return games.some(game => game.game_date === dateString);
  };

  // Get games for a specific date
  const getGamesForDate = (date: Date): Game[] => {
    const dateString = date.toISOString().split('T')[0];
    return games.filter(game => game.game_date === dateString);
  };

  // Handle date selection
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setGamesOnSelectedDate(getGamesForDate(date));
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Get month and year for header
  const monthYear = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Day names
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        {/* Calendar header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <CalendarIcon size={18} className="mr-2" />
            Calendário de Jogos
          </h3>
          <div className="flex items-center">
            <button 
              onClick={goToPreviousMonth}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="mx-2 font-medium text-gray-700 capitalize">
              {monthYear}
            </span>
            <button 
              onClick={goToNextMonth}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day names */}
          {dayNames.map((day, index) => (
            <div 
              key={index} 
              className="text-center text-sm font-medium text-gray-500 py-2"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const isToday = new Date().toDateString() === date.toDateString();
            const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
            const hasGames = hasGamesOnDate(date);

            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                className={`
                  h-10 w-full rounded-md flex items-center justify-center relative
                  ${isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}
                  ${isToday ? 'bg-green-100' : ''}
                  ${isSelected ? 'bg-green-500 text-white' : 'hover:bg-gray-100'}
                `}
              >
                {date.getDate()}
                {hasGames && (
                  <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-green-500'}`}></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected date games */}
        {selectedDate && (
          <div className="mt-4 border-t pt-4">
            <h4 className="font-medium mb-2 capitalize">
              {formatDate(selectedDate)}
            </h4>
            
            {gamesOnSelectedDate.length > 0 ? (
              <div className="space-y-2">
                {gamesOnSelectedDate.map(game => (
                  <div key={game.id} className={`p-3 rounded-md ${game.game_status === 'canceled' ? 'bg-red-50 border-l-2 border-red-500' : game.game_status === 'postponed' ? 'bg-yellow-50 border-l-2 border-yellow-500' : game.game_status === 'completed' ? 'bg-green-50 border-l-2 border-green-500' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        {/* Hora, status e botão de opções */}
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
                          
                          {/* Botão de opções - apenas visível para não atletas */}
                          {userRole !== 'atleta' && (
                            <div className="relative">
                              <button 
                                onClick={() => toggleGameOptions(game.id)}
                                className="p-1 rounded-full hover:bg-gray-100"
                              >
                                <MoreVertical size={16} />
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
                                teamLogo ? (
                                  <img src={teamLogo} alt="Logo" className="w-5 h-5 rounded-full object-cover" />
                                ) : (
                                  <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-gray-500">{teamName.charAt(0)}</span>
                                  </div>
                                )
                              ) : (
                                game.opponent_logo_url ? (
                                  <img src={game.opponent_logo_url} alt="Logo Oponente" className="w-5 h-5 rounded-full object-cover" />
                                ) : (
                                  <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-gray-500">{game.opponent_name.charAt(0)}</span>
                                  </div>
                                )
                              )}
                            </div>
                            <span className="font-medium">{game.home_game ? teamName : game.opponent_name}</span>
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
                                teamLogo ? (
                                  <img src={teamLogo} alt="Logo" className="w-5 h-5 rounded-full object-cover" />
                                ) : (
                                  <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-gray-500">{teamName.charAt(0)}</span>
                                  </div>
                                )
                              ) : (
                                game.opponent_logo_url ? (
                                  <img src={game.opponent_logo_url} alt="Logo Oponente" className="w-5 h-5 rounded-full object-cover" />
                                ) : (
                                  <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-gray-500">{game.opponent_name.charAt(0)}</span>
                                  </div>
                                )
                              )}
                            </div>
                            <span className="font-medium">{!game.home_game ? teamName : game.opponent_name}</span>
                          </div>
                          <div className="text-xl font-bold">
                            {(game.score_opponent !== null && game.score_opponent !== undefined) ? 
                              (game.home_game ? game.score_opponent : game.score_team) : '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Notas */}
                    {game.notes && (
                      <p className="text-sm text-gray-600 mt-1 border-t pt-1">{game.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Nenhum jogo agendado para esta data.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameCalendar;
