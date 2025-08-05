import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

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

interface ViewOnlyGameCalendarProps {
  games: Game[];
  teamName: string;
  teamLogo?: string | null;
}

const ViewOnlyGameCalendar: React.FC<ViewOnlyGameCalendarProps> = ({ games, teamName, teamLogo }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [gamesOnSelectedDate, setGamesOnSelectedDate] = useState<Game[]>([]);
  
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
  
  // Update games on selected date when date changes
  useEffect(() => {
    if (!selectedDate) return;
    
    // Format selected date to match game_date format (YYYY-MM-DD)
    const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    
    // Filter games for the selected date
    const gamesOnDate = games.filter(game => {
      // Extract date part from game_date
      const gameDatePart = game.game_date.split('T')[0];
      return gameDatePart === formattedDate;
    });
    
    setGamesOnSelectedDate(gamesOnDate);
  }, [selectedDate, games]);
  
  // Function to navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  // Function to navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  // Function to handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };
  
  // Function to check if a date has games
  const hasGamesOnDate = (date: Date) => {
    // Format date to match game_date format (YYYY-MM-DD)
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    // Check if any games are on this date
    return games.some(game => {
      // Extract date part from game_date
      const gameDatePart = game.game_date.split('T')[0];
      return gameDatePart === formattedDate;
    });
  };
  
  // Function to format date for display
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('pt-BR', options);
  };
  
  // Get month and year for header
  const monthYear = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  
  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };
  
  // Check if a date is in the current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      {/* Calendar header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <CalendarIcon className="mr-2 h-5 w-5 text-gray-500" />
          Calendário de Jogos
        </h3>
        <div className="flex space-x-2">
          <button 
            onClick={goToPreviousMonth}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={goToNextMonth}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      
      {/* Month and year */}
      <h4 className="text-center font-medium mb-4 capitalize">{monthYear}</h4>
      
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
          <div key={index} className="text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          const hasGames = hasGamesOnDate(date);
          const isSelected = selectedDate && 
                            date.getDate() === selectedDate.getDate() && 
                            date.getMonth() === selectedDate.getMonth() && 
                            date.getFullYear() === selectedDate.getFullYear();
          
          return (
            <button
              key={index}
              onClick={() => handleDateClick(date)}
              className={`
                h-10 w-full rounded-md flex items-center justify-center relative
                ${isCurrentMonth(date) ? 'text-gray-700' : 'text-gray-400'}
                ${isToday(date) ? 'bg-green-100' : ''}
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
                      {/* Hora e status */}
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
                      </div>
                      
                      {/* Local */}
                      <p className="text-sm text-gray-600 mb-3">
                        {game.location || (game.city && game.city + (game.state ? `, ${game.state}` : ''))}
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
                      
                      {/* Notas do jogo */}
                      {game.notes && (
                        <p className="text-xs text-gray-600 mt-2 pt-2 border-t">{game.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Nenhum jogo nesta data.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ViewOnlyGameCalendar;
