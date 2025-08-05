import React, { useState } from 'react';
import { 
  Trophy, 
  ShoppingBag, 
  Users, 
  Home, 
  Calendar, 
  Settings, 
  LogOut,
  Bell,
  Search,
  ChevronDown,
  BarChart3,
  Shirt,
  Medal,
  UserPlus
} from 'lucide-react';
import bolaImage from '../public/images/bola1.png';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('home');

  // Mock data for the dashboard
  const upcomingMatches = [
    { id: 1, opponent: 'Flamengo FC', date: '10 Mar, 2025', time: '15:00', location: 'Estádio Municipal' },
    { id: 2, opponent: 'Santos FC', date: '17 Mar, 2025', time: '19:30', location: 'Arena ProHero' },
    { id: 3, opponent: 'Palmeiras', date: '24 Mar, 2025', time: '20:00', location: 'Estádio Allianz' },
  ];

  const tournaments = [
    { id: 1, name: 'Copa Brasil 2025', status: 'Em andamento', teams: 16, nextMatch: '10 Mar' },
    { id: 2, name: 'Liga Regional', status: 'Inscrições abertas', teams: 8, nextMatch: 'N/A' },
    { id: 3, name: 'Torneio Amistoso', status: 'Finalizado', teams: 4, nextMatch: 'N/A' },
  ];

  const popularProducts = [
    { id: 1, name: 'Camisa Oficial 2025', price: 'R$ 199,90', stock: 45 },
    { id: 2, name: 'Shorts de Treino', price: 'R$ 89,90', stock: 30 },
    { id: 3, name: 'Bola ProHero', price: 'R$ 149,90', stock: 15 },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-green-800 text-white">
        <div className="p-4 flex items-center space-x-2">
          <div className="bg-white p-1 rounded-full flex items-center justify-center">
            <img 
              src={bolaImage} 
              alt="ProHero" 
              className="w-8 h-8 animate-spin-slow object-contain" 
              style={{ transformOrigin: 'center' }}
            />
          </div>
          <span className="font-bold text-xl">ProHero Sports</span>
        </div>
        
        <div className="mt-8">
          <div className="px-4 py-2 text-gray-300 uppercase text-xs font-semibold">Menu Principal</div>
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex items-center space-x-3 w-full px-4 py-3 ${activeTab === 'home' ? 'bg-green-700' : 'hover:bg-green-700'}`}
          >
            <Home size={20} />
            <span>Dashboard</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('tournaments')}
            className={`flex items-center space-x-3 w-full px-4 py-3 ${activeTab === 'tournaments' ? 'bg-green-700' : 'hover:bg-green-700'}`}
          >
            <Trophy size={20} />
            <span>Ligas e Torneios</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('teams')}
            className={`flex items-center space-x-3 w-full px-4 py-3 ${activeTab === 'teams' ? 'bg-green-700' : 'hover:bg-green-700'}`}
          >
            <Users size={20} />
            <span>Minha Equipe</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('store')}
            className={`flex items-center space-x-3 w-full px-4 py-3 ${activeTab === 'store' ? 'bg-green-700' : 'hover:bg-green-700'}`}
          >
            <ShoppingBag size={20} />
            <span>Loja (Online)</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center space-x-3 w-full px-4 py-3 ${activeTab === 'calendar' ? 'bg-green-700' : 'hover:bg-green-700'}`}
          >
            <Calendar size={20} />
            <span>Calendário</span>
          </button>
          
          <div className="px-4 py-2 mt-6 text-gray-300 uppercase text-xs font-semibold">Configurações</div>
          
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-3 w-full px-4 py-3 ${activeTab === 'settings' ? 'bg-green-700' : 'hover:bg-green-700'}`}
          >
            <Settings size={20} />
            <span>Configurações</span>
          </button>
          
          <button 
            className="flex items-center space-x-3 w-full px-4 py-3 hover:bg-green-700 mt-6"
            onClick={onLogout}
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-500 hover:text-green-600">
              <Bell size={20} />
              <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">3</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                PS
              </div>
              <span className="font-medium">Pedro Silva</span>
              <ChevronDown size={16} />
            </div>
          </div>
        </header>
        
        {/* Dashboard Content */}
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'home' && (
            <>
              <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
              <p className="text-gray-600 mb-6">Bem-vindo de volta, Pedro!</p>
              
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-4 flex items-center">
                  <div className="rounded-full bg-green-100 p-3 mr-4">
                    <Trophy className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Torneios Ativos</p>
                    <p className="text-2xl font-semibold">2</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4 flex items-center">
                  <div className="rounded-full bg-blue-100 p-3 mr-4">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Jogadores</p>
                    <p className="text-2xl font-semibold">18</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4 flex items-center">
                  <div className="rounded-full bg-yellow-100 p-3 mr-4">
                    <Calendar className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Próximo Jogo</p>
                    <p className="text-2xl font-semibold">3 dias</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4 flex items-center">
                  <div className="rounded-full bg-purple-100 p-3 mr-4">
                    <ShoppingBag className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Vendas (Mês)</p>
                    <p className="text-2xl font-semibold">R$ 3.240</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming Matches */}
                <div className="bg-white rounded-lg shadow col-span-2">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="font-semibold text-lg">Próximos Jogos</h2>
                    <button className="text-green-600 text-sm font-medium">Ver todos</button>
                  </div>
                  <div className="p-4">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-gray-500 text-sm">
                          <th className="pb-3 font-medium">Adversário</th>
                          <th className="pb-3 font-medium">Data</th>
                          <th className="pb-3 font-medium">Horário</th>
                          <th className="pb-3 font-medium">Local</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingMatches.map(match => (
                          <tr key={match.id} className="border-t">
                            <td className="py-3">{match.opponent}</td>
                            <td className="py-3 text-gray-600">{match.date}</td>
                            <td className="py-3 text-gray-600">{match.time}</td>
                            <td className="py-3 text-gray-600">{match.location}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b">
                    <h2 className="font-semibold text-lg">Ações Rápidas</h2>
                  </div>
                  <div className="p-4 space-y-4">
                    <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-green-700 transition-colors">
                      <UserPlus size={18} />
                      <span>Adicionar Jogador</span>
                    </button>
                    
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors">
                      <Calendar size={18} />
                      <span>Agendar Treino</span>
                    </button>
                    
                    <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-purple-700 transition-colors">
                      <Medal size={18} />
                      <span>Inscrever em Torneio</span>
                    </button>
                    
                    <button className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-700 transition-colors">
                      <BarChart3 size={18} />
                      <span>Relatório de Desempenho</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Tournaments */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="font-semibold text-lg">Torneios</h2>
                    <button className="text-green-600 text-sm font-medium">Ver todos</button>
                  </div>
                  <div className="p-4">
                    {tournaments.map(tournament => (
                      <div key={tournament.id} className="border-b last:border-b-0 py-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">{tournament.name}</h3>
                            <p className="text-sm text-gray-500">
                              {tournament.teams} equipes • Próximo jogo: {tournament.nextMatch}
                            </p>
                          </div>
                          <span className={`text-sm px-2 py-1 rounded-full ${
                            tournament.status === 'Em andamento' 
                              ? 'bg-green-100 text-green-800' 
                              : tournament.status === 'Inscrições abertas'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {tournament.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Store */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="font-semibold text-lg">Loja - Em Breve</h2>
                    <button className="text-green-600 text-sm font-medium">Gerenciar</button>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-500 mb-4">Produtos mais vendidos</p>
                    {popularProducts.map(product => (
                      <div key={product.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div className="flex items-center">
                          <div className="bg-gray-100 p-2 rounded-lg mr-3">
                            <Shirt className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-500">Estoque: {product.stock}</p>
                          </div>
                        </div>
                        <p className="font-semibold">{product.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'tournaments' && (
            <div className="text-center py-20">
              <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Ligas e Torneios</h2>
              <p className="text-gray-500">Esta seção está em desenvolvimento.</p>
            </div>
          )}
          
          {activeTab === 'teams' && (
            <div className="text-center py-20">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Minha Equipe</h2>
              <p className="text-gray-500">Esta seção está em desenvolvimento.</p>
            </div>
          )}
          
          {activeTab === 'store' && (
            <div className="text-center py-20">
              <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Loja - Em Breve</h2>
              <p className="text-gray-500">Esta seção está em desenvolvimento.</p>
            </div>
          )}
          
          {activeTab === 'calendar' && (
            <div className="text-center py-20">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Calendário</h2>
              <p className="text-gray-500">Esta seção está em desenvolvimento.</p>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="text-center py-20">
              <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Configurações</h2>
              <p className="text-gray-500">Esta seção está em desenvolvimento.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
