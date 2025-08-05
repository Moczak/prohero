import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  BarChart3,
  Shirt,
  Medal,
  Users
} from 'lucide-react';
import Sidebar from '../components/Sidebar/Sidebar';
import Navbar from '../components/Navbar/Navbar';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const { isCollapsed, isMobile } = useSidebar();
  const { user } = useAuth();

  // Estado para dados reais
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tournamentsCount, setTournamentsCount] = useState(0);
  const [leaguesCount, setLeaguesCount] = useState(0);
  const [upcomingGames, setUpcomingGames] = useState<any[]>([]);
  const [recentTournaments, setRecentTournaments] = useState<any[]>([]);

  // Função para buscar dados reais
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        if (!user) return;

        // Buscar ligas
        const { data: leagues, error: leaguesError } = await supabase
          .from('leagues')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (leaguesError) throw leaguesError;
        
        // Buscar torneios
        const { data: tournaments, error: tournamentsError } = await supabase
          .from('tournaments')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (tournamentsError) throw tournamentsError;
        
        // Buscar jogos próximos
        const today = new Date().toISOString().split('T')[0];
        const { data: games, error: gamesError } = await supabase
          .from('games')
          .select('*, sports_organizations(name, logo_url)')
          .gte('game_date', today)
          .order('game_date', { ascending: true })
          .limit(3);
          
        if (gamesError) throw gamesError;
        
        // Atualizar os estados com os dados reais
        setLeaguesCount(leagues?.length || 0);
        setTournamentsCount(tournaments?.length || 0);
        setUpcomingGames(games || []);
        setRecentTournaments(tournaments?.slice(0, 3) || []);
        
      } catch (err: any) {
        console.error('Erro ao buscar dados do dashboard:', err);
        setError('Não foi possível carregar os dados. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Função para formatar a data
  const formatDate = (dateString: string) => {
    // Adicionar 'T00:00:00' para garantir que a data seja interpretada no fuso horário local
    // e não seja afetada pela conversão UTC -> local
    const [year, month, day] = dateString.split('-');
    return new Date(`${year}-${month}-${day}T00:00:00`).toLocaleDateString('pt-BR');
  };

  // Função para calcular dias até o próximo jogo
  const getDaysUntilNextGame = () => {
    if (upcomingGames.length === 0) return '0';
    
    // Usar a mesma abordagem da função formatDate para evitar problemas de fuso horário
    const [year, month, day] = upcomingGames[0].game_date.split('-');
    const nextGameDate = new Date(`${year}-${month}-${day}T00:00:00`);
    
    const today = new Date();
    // Resetar horas para comparar apenas as datas
    today.setHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(nextGameDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays === 0 ? 'Hoje' : `${diffDays} dia${diffDays > 1 ? 's' : ''}`;
  };

  // Mock data para produtos (mantido pois não temos tabela de produtos ainda)
  const popularProducts = [
    { id: 1, name: 'Camisa Oficial 2025', price: 'R$ 199,90', stock: 45 },
    { id: 2, name: 'Shorts de Treino', price: 'R$ 89,90', stock: 30 },
    { id: 3, name: 'Bola ProHero', price: 'R$ 149,90', stock: 15 },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar Component */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Content */}
      <div 
        className={`
          transition-all duration-300
          ${isMobile ? 'ml-0' : (isCollapsed ? 'ml-16' : 'ml-0 md:ml-64')}
        `}
      >
        {/* Navbar Component */}
        <Navbar />
        
        {/* Dashboard Content */}
        <main className="p-6">
         <div className="max-w-6xl mx-auto px-4 py-8">
          {activeTab === 'home' && (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center mb-4 md:mb-0">
                  <BarChart3 className="mr-2" />
                  Dashboard
                </h1>
                <p className="text-gray-600">Bem-vindo de volta, {user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário'}!</p>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-4 flex items-center">
                  <div className="rounded-full bg-green-100 p-3 mr-4">
                    <Trophy className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Torneios</p>
                    <p className="text-2xl font-semibold">
                      {loading ? (
                        <span className="inline-block w-8 h-6 bg-gray-200 animate-pulse rounded"></span>
                      ) : (
                        tournamentsCount
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4 flex items-center">
                  <div className="rounded-full bg-blue-100 p-3 mr-4">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Ligas</p>
                    <p className="text-2xl font-semibold">
                      {loading ? (
                        <span className="inline-block w-8 h-6 bg-gray-200 animate-pulse rounded"></span>
                      ) : (
                        leaguesCount
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4 flex items-center">
                  <div className="rounded-full bg-yellow-100 p-3 mr-4">
                    <Medal className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Próximo Jogo</p>
                    <p className="text-2xl font-semibold">
                      {loading ? (
                        <span className="inline-block w-16 h-6 bg-gray-200 animate-pulse rounded"></span>
                      ) : (
                        getDaysUntilNextGame()
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4 flex items-center">
                  <div className="rounded-full bg-purple-100 p-3 mr-4">
                    <Shirt className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Vendas (Mês)</p>
                    <p className="text-2xl font-semibold">R$ 3.240</p>
                  </div>
                </div>
              </div>
              
              {/* Upcoming Matches */}
              <div className="bg-white rounded-lg shadow mb-6">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">Próximos Jogos</h2>
                  <button 
                    onClick={() => navigate('/calendario')}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    Ver todos
                  </button>
                </div>
                <div className="p-4">
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                      {error}
                    </div>
                  )}
                  
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="h-10 bg-gray-200 rounded mb-4"></div>
                      <div className="h-10 bg-gray-200 rounded mb-4"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  ) : upcomingGames.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Nenhum jogo agendado.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adversário</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horário</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {upcomingGames.map(game => (
                            <tr key={game.id}>
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{game.opponent_name}</td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(game.game_date)}</td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{game.game_time}</td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{game.location}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tournaments */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Torneios</h2>
                    <button 
                      onClick={() => navigate('/ligastorneios')}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Ver todos
                    </button>
                  </div>
                  <div className="p-4">
                    {loading ? (
                      <div className="animate-pulse space-y-4">
                        <div className="h-16 bg-gray-200 rounded"></div>
                        <div className="h-16 bg-gray-200 rounded"></div>
                        <div className="h-16 bg-gray-200 rounded"></div>
                      </div>
                    ) : recentTournaments.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Nenhum torneio encontrado.</p>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {recentTournaments.map(tournament => (
                          <li key={tournament.id} className="py-3">
                            <div className="flex justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{tournament.name}</p>
                                <p className="text-xs text-gray-500">{tournament.format === 'knockout' ? 'Eliminatório' : 
                                                                    tournament.format === 'points' ? 'Pontos Corridos' : 
                                                                    tournament.format === 'group_stage' ? 'Fase de Grupos' : 
                                                                    tournament.format === 'mixed' ? 'Misto' : tournament.format}</p>
                              </div>
                              <div className="text-right">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  tournament.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                                  tournament.status === 'open_registration' ? 'bg-blue-100 text-blue-800' :
                                  tournament.status === 'finished' ? 'bg-gray-100 text-gray-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {tournament.status === 'in_progress' ? 'Em andamento' :
                                   tournament.status === 'open_registration' ? 'Inscrições abertas' :
                                   tournament.status === 'finished' ? 'Finalizado' : tournament.status}
                                </span>
                                <p className="text-xs text-gray-500 mt-1">
                                  {tournament.start_date ? `Início: ${formatDate(tournament.start_date)}` : 'Data não definida'}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                
                {/* Popular Products */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Produtos Populares</h2>
                    <button 
                      onClick={() => navigate('/loja-online')}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Ver loja
                    </button>
                  </div>
                  <div className="p-4">
                    <ul className="divide-y divide-gray-200">
                      {popularProducts.map(product => (
                        <li key={product.id} className="py-3 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">Estoque: {product.stock} unidades</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">{product.price}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'tournaments' && (
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center mb-4 md:mb-0">
                  <Trophy className="mr-2" />
                  Ligas e Torneios
                </h1>
              </div>
              <p className="text-gray-600">Conteúdo da página de torneios será exibido aqui.</p>
            </div>
          )}
          
          {activeTab === 'teams' && (
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center mb-4 md:mb-0">
                  <Users className="mr-2" />
                  Minha Equipe
                </h1>
              </div>
              <p className="text-gray-600">Conteúdo da página de equipes será exibido aqui.</p>
            </div>
          )}
          
          {activeTab === 'store' && (
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center mb-4 md:mb-0">
                  <Shirt className="mr-2" />
                  Loja - Em Breve
                </h1>
              </div>
              <p className="text-gray-600">Conteúdo da loja será exibido aqui.</p>
            </div>
          )}
          
          {activeTab === 'calendar' && (
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center mb-4 md:mb-0">
                  <BarChart3 className="mr-2" />
                  Calendário
                </h1>
              </div>
              <p className="text-gray-600">Conteúdo do calendário será exibido aqui.</p>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center mb-4 md:mb-0">
                  <BarChart3 className="mr-2" />
                  Configurações
                </h1>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Informações da Conta</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nome</label>
                      <p className="mt-1 text-sm text-gray-900">{user?.user_metadata?.name || 'Não informado'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tipo de Login</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {user?.app_metadata?.provider === 'google' ? 'Google' : 'Email e Senha'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
