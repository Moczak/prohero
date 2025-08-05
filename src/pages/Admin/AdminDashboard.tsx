import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  LogOut, 
  Settings, 
  Shield,
  Home,
  Trophy,
  Calendar,
  Flag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import AdminUserManagement from './AdminUserManagement.tsx';
import AdminSportsManagement from './AdminSportsManagement.tsx';
import AdminGamesManagement from './AdminGamesManagement.tsx';
import AdminOrganizationsManagement from './AdminOrganizationsManagement.tsx';

interface DashboardStats {
  totalUsers: number;
  totalTeams: number;
  totalAdmins: number;
  isLoading: boolean;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalTeams: 0,
    totalAdmins: 0,
    isLoading: true
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Buscar total de usuários da view user_roles_view
      const { data: usersData, error: usersError } = await supabase
        .from('user_roles_view')
        .select('auth_user_id')
        .order('auth_user_id');

      if (usersError) throw usersError;

      // Buscar total de administradores
      const { data: adminsData, error: adminsError } = await supabase
        .from('user_roles_view')
        .select('auth_user_id')
        .eq('role', 'admin');

      if (adminsError) throw adminsError;

      // Buscar total de equipes
      const { data: teamsData, error: teamsError } = await supabase
        .from('sports_organizations')
        .select('id');

      if (teamsError) throw teamsError;

      // Atualizar estatísticas
      setStats({
        totalUsers: usersData ? usersData.length : 0,
        totalAdmins: adminsData ? adminsData.length : 0,
        totalTeams: teamsData ? teamsData.length : 0,
        isLoading: false
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error);
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Admin Sidebar */}
      <div className="w-64 bg-gray-900 text-white min-h-screen p-4 relative">
        <div className="mb-8">
          <h1 className="text-xl font-bold">ProHero Admin</h1>
          <p className="text-gray-400 text-sm mt-1">Painel de Administração</p>
        </div>

        <nav className="space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center w-full px-4 py-2 rounded-md ${
              activeTab === 'dashboard' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Home size={18} className="mr-3" />
            Dashboard
          </button>

          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center w-full px-4 py-2 rounded-md ${
              activeTab === 'users' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Users size={18} className="mr-3" />
            Usuários
          </button>

          <button 
            onClick={() => setActiveTab('sports')}
            className={`flex items-center w-full px-4 py-2 rounded-md ${
              activeTab === 'sports' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Trophy size={18} className="mr-3" />
            Modalidades
          </button>

          <button 
            onClick={() => setActiveTab('games')}
            className={`flex items-center w-full px-4 py-2 rounded-md ${
              activeTab === 'games' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Calendar size={18} className="mr-3" />
            Jogos
          </button>

          <button 
            onClick={() => setActiveTab('organizations')}
            className={`flex items-center w-full px-4 py-2 rounded-md ${
              activeTab === 'organizations' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Flag size={18} className="mr-3" />
            Equipes
          </button>

          <button 
            onClick={() => setActiveTab('roles')}
            className={`flex items-center w-full px-4 py-2 rounded-md ${
              activeTab === 'roles' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Shield size={18} className="mr-3" />
            Permissões
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center w-full px-4 py-2 rounded-md ${
              activeTab === 'settings' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Settings size={18} className="mr-3" />
            Configurações
          </button>
        </nav>

        <div className="absolute bottom-4 left-0 right-0 px-4">
  <div className="border-t border-gray-700 pt-4 mb-4">
    <div className="flex items-center mb-4">
      <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white mr-2">
        {user?.email?.charAt(0).toUpperCase() || 'A'}
      </div>
      <div className="overflow-hidden">
        <p className="text-sm font-medium truncate">{user?.email}</p>
        <p className="text-xs text-gray-400">Administrador</p>
      </div>
    </div>
    <button
      onClick={handleLogout}
      className="flex items-center w-full px-4 py-2 rounded-md text-gray-300 hover:bg-gray-800"
      style={{ boxSizing: 'border-box' }}
    >
      <LogOut size={18} className="mr-3" />
      Sair
    </button>
  </div>
</div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm">
          <div className="px-6 py-4">
            <h1 className="text-xl font-semibold text-gray-800">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'users' && 'Gerenciamento de Usuários'}
              {activeTab === 'roles' && 'Gerenciamento de Permissões'}
              {activeTab === 'sports' && 'Gerenciamento de Modalidades'}
              {activeTab === 'settings' && 'Configurações'}
            </h1>
          </div>
        </header>

        <main className="p-6">
           {activeTab === 'dashboard' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Bem-vindo ao Painel Administrativo</h2>
              <p className="text-gray-600">
                Use o menu lateral para navegar entre as diferentes seções do painel administrativo.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="font-medium text-blue-700 mb-2">Usuários</h3>
                  {stats.isLoading ? (
                    <div className="animate-pulse h-8 w-16 bg-blue-200 rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold">{stats.totalUsers}</p>
                  )}
                  <p className="text-sm text-blue-600 mt-1">Total de usuários no sistema</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <h3 className="font-medium text-green-700 mb-2">Equipes</h3>
                  {stats.isLoading ? (
                    <div className="animate-pulse h-8 w-16 bg-green-200 rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold">{stats.totalTeams}</p>
                  )}
                  <p className="text-sm text-green-600 mt-1">Total de equipes cadastradas</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <h3 className="font-medium text-purple-700 mb-2">Administradores</h3>
                  {stats.isLoading ? (
                    <div className="animate-pulse h-8 w-16 bg-purple-200 rounded"></div>
                  ) : (
                    <p className="text-3xl font-bold">{stats.totalAdmins}</p>
                  )}
                  <p className="text-sm text-purple-600 mt-1">Usuários com acesso administrativo</p>
                </div>
              </div>
              
              {stats.isLoading && (
                <div className="mt-4 text-center text-sm text-gray-500">
                  Carregando estatísticas...
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && <AdminUserManagement />}

          {activeTab === 'sports' && <AdminSportsManagement />}
          
          {activeTab === 'games' && <AdminGamesManagement />}
          
          {activeTab === 'organizations' && <AdminOrganizationsManagement />}

          {activeTab === 'roles' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Gerenciamento de Permissões</h2>
              <p className="text-gray-600">
                Aqui você pode gerenciar as permissões dos usuários no sistema.
              </p>
              
              <div className="mt-6">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <p className="text-yellow-700">
                    Esta funcionalidade está em desenvolvimento e estará disponível em breve.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Configurações do Sistema</h2>
              <p className="text-gray-600">
                Aqui você pode ajustar as configurações gerais do sistema.
              </p>
              
              <div className="mt-6">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  <p className="text-yellow-700">
                    Esta funcionalidade está em desenvolvimento e estará disponível em breve.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
