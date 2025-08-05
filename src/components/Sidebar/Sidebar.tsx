import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  ShoppingBag, 
  Users, 
  Home, 
  Calendar, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Search,
  Truck,
  DollarSign,
  Settings
} from 'lucide-react';
import logo from '../../public/images/logo.jpg';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';
import { getUserByAuthId } from '../../services/userService';
import EditProfileModal from '../Profile/EditProfileModal';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const { isCollapsed, toggleSidebar, isMobile, isOpen, toggleMobileSidebar, closeMobileSidebar } = useSidebar();
  const { logout, user } = useAuth();
  const [userName, setUserName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Função para lidar com o clique nos itens do menu
  const handleMenuItemClick = (tab: string) => {
    setActiveTab(tab);
    if (isMobile) {
      closeMobileSidebar();
    }

    // Redirecionar para a página correta baseado no tab
    switch (tab) {
      case 'home':
        navigate('/dashboard');
        break;
      case 'teams':
        navigate('/minhaequipe');
        break;
      case 'allteams':
        navigate('/equipes');
        break;
      case 'tournaments':
        navigate('/ligastorneios');
        break;
      case 'store':
        navigate('/loja');
        break;
      case 'storeOnline':
        navigate('/loja-online');
        break;
      case 'orders':
        navigate('/meus-pedidos');
        break;
      case 'sales':
        navigate('/minhas-vendas');
        break;
      case 'calendar':
      case 'calendario':
        navigate('/calendario');
        break;
      case 'settings':
        navigate('/configuracoes');
        break;
      case 'account':
        navigate('/conta');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Buscar dados do usuário, incluindo o avatar
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.id) {
        try {
          // Verificar se temos dados em cache
          const cachedUserData = localStorage.getItem(`user_data_${user.id}`);
          
          if (cachedUserData) {
            const userData = JSON.parse(cachedUserData);
            const cacheTime = userData.cacheTime || 0;
            const now = Date.now();
            
            // Se o cache for válido (menos de 10 minutos), usar os dados em cache
            if (now - cacheTime < 10 * 60 * 1000) {
              console.log('Usando dados de usuário em cache');
              setUserName(userData.name || '');
              setAvatarUrl(userData.avatar_url || null);
              
              // Definir o papel do usuário do cache
              if (userData.role) {
                console.log('Role do usuário (do cache):', userData.role);
                setUserRole(userData.role);
              }
              return;
            }
          }
          
          // Se não tiver cache ou estiver expirado, buscar do servidor
          console.log('Buscando dados de usuário do servidor');
          const userData = await getUserByAuthId(user.id);
          console.log('Dados do usuário recebidos:', userData);
          
          if (userData?.name) {
            setUserName(userData.name);
          }
          
          // Definir a URL do avatar se disponível
          if (userData?.avatar_url) {
            setAvatarUrl(userData.avatar_url);
          }
          
          // Armazenar o papel do usuário
          if (userData?.role) {
            console.log('Role do usuário (do servidor):', userData.role);
            setUserRole(userData.role);
          }
          
          // Salvar no cache
          if (userData) {
            // Garantir que o papel do usuário seja salvo corretamente
            const cacheData = {
              ...userData,
              role: userData.role, // Garantir que o papel seja explicitamente incluído
              cacheTime: Date.now()
            };
            console.log('Salvando no cache com papel:', cacheData.role);
            localStorage.setItem(`user_data_${user.id}`, JSON.stringify(cacheData));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [user]);

  if (isMobile && !isOpen) {
    return null;
  }

  // Debug para verificar o papel do usuário no momento da renderização
  console.log('Renderizando Sidebar, userRole:', userRole);
  
  return (
    <>
      {/* Modal de edição de perfil */}
      <EditProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />

      {/* Overlay para fechar o menu em dispositivos móveis */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 animate-fadeIn"
          onClick={toggleMobileSidebar}
        />
      )}

      <div 
        className={`
          bg-black text-white h-screen fixed z-30 top-0 overflow-y-auto 
          transition-all duration-300 ease-in-out transform
          ${isCollapsed && !isMobile ? 'w-16' : 'w-64'} 
          ${isMobile 
            ? (isOpen 
                ? 'translate-x-0 shadow-lg animate-slideIn' 
                : '-translate-x-full animate-slideOut') 
            : 'left-0'
          }
        `}
      >
        <div className={`${isCollapsed && !isMobile ? 'py-4 px-2' : 'p-4'} flex ${isCollapsed && !isMobile ? 'justify-center' : 'flex-col items-center'} space-y-2`}>
          {(!isCollapsed || isMobile) && <img src={logo} alt="Logo" className="h-16 w-auto" />}
          
          {/* Botão para expandir/recolher em desktop */}
          {!isMobile && (
            <button 
              onClick={toggleSidebar} 
              className="absolute right-2 top-4 p-1 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          )}

          {/* Botão para fechar em mobile */}
          {isMobile && (
            <button 
              onClick={toggleMobileSidebar} 
              className="absolute right-2 top-4 p-1 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        <div className={`${isCollapsed && !isMobile ? 'mt-14' : 'mt-2'}`}>
          {/* Perfil do usuário */}
          <div className={`absolute bottom-0 left-0 right-0 border-t border-gray-800`}>
            <div className={`p-4 ${isCollapsed && !isMobile ? 'justify-center' : ''} flex items-center space-x-3`}>
              {(!isCollapsed || isMobile) && (
                <div className="flex-1 min-w-0">
                  <div 
                    className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setIsProfileModalOpen(true)}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={userName} className="w-8 h-8 rounded-full" />
                    ) : (
                      <User size={20} className="text-gray-400" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{userName || 'Usuário'}</p>
                      <p className="text-xs text-gray-400">Editar perfil</p>
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                disabled={isLoggingOut}
                title="Sair"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          
          {/* Menu para perfil 'fa' - apenas Calendário, Equipes, Loja Online e Ligas e Torneios */}
          {userRole && userRole === 'fa' ? (
            <>
              {/* Calendário - visível para 'fa' */}
              <button 
                onClick={() => handleMenuItemClick('calendar')}
                className={`flex ${isCollapsed && !isMobile ? 'justify-center' : 'items-center space-x-3'} w-full px-4 py-3 ${activeTab === 'calendar' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-colors duration-200`}
                title="Calendário"
              >
                <Calendar size={20} className={`${activeTab === 'calendar' || activeTab === 'calendario' ? 'text-green-400' : ''} transition-colors duration-200`} />
                {(!isCollapsed || isMobile) && <span className={`${activeTab === 'calendar' || activeTab === 'calendario' ? 'text-green-400' : ''} transition-colors duration-200`}>Calendário</span>}
              </button>
              
              {/* Equipes - visível para 'fa' */}
              <button 
                onClick={() => handleMenuItemClick('allteams')}
                className={`flex ${isCollapsed && !isMobile ? 'justify-center' : 'items-center space-x-3'} w-full px-4 py-3 ${activeTab === 'allteams' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-colors duration-200`}
                title="Equipes"
              >
                <Search size={20} className={`${activeTab === 'allteams' ? 'text-green-400' : ''} transition-colors duration-200`} />
                {(!isCollapsed || isMobile) && <span className={`${activeTab === 'allteams' ? 'text-green-400' : ''} transition-colors duration-200`}>Equipes</span>}
              </button>
              
              {/* Loja Online - visível para 'fa' */}
              <button 
                onClick={() => handleMenuItemClick('storeOnline')}
                className={`flex ${isCollapsed && !isMobile ? 'justify-center' : 'items-center space-x-3'} w-full px-4 py-3 ${activeTab === 'storeOnline' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-colors duration-200`}
                title="Loja Online"
              >
                <ShoppingBag size={20} className={`${activeTab === 'storeOnline' ? 'text-green-400' : ''} transition-colors duration-200`} />
                {(!isCollapsed || isMobile) && <span className={`${activeTab === 'storeOnline' ? 'text-green-400' : ''} transition-colors duration-200`}>Loja Online</span>}
              </button>
              
              {/* Meus Pedidos - visível para 'fa' */}
              <button 
                onClick={() => handleMenuItemClick('orders')}
                className={`flex ${isCollapsed && !isMobile ? 'justify-center' : 'items-center space-x-3'} w-full px-4 py-3 ${activeTab === 'orders' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-colors duration-200`}
                title="Meus Pedidos"
              >
                <Truck size={20} className={`${activeTab === 'orders' ? 'text-green-400' : ''} transition-colors duration-200`} />
                {(!isCollapsed || isMobile) && <span className={`${activeTab === 'orders' ? 'text-green-400' : ''} transition-colors duration-200`}>Meus Pedidos</span>}
              </button>
              
              {/* Ligas e Torneios - visível para 'fa' */}
              <button 
                onClick={() => handleMenuItemClick('tournaments')}
                className={`flex ${isCollapsed && !isMobile ? 'justify-center' : 'items-center space-x-3'} w-full px-4 py-3 ${activeTab === 'tournaments' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-colors duration-200`}
                title="Ligas e Torneios"
              >
                <Trophy size={20} className={`${activeTab === 'tournaments' ? 'text-green-400' : ''} transition-colors duration-200`} />
                {(!isCollapsed || isMobile) && <span className={`${activeTab === 'tournaments' ? 'text-green-400' : ''} transition-colors duration-200`}>Ligas e Torneios</span>}
              </button>
            </>
          ) : (
            <>
              {/* Menu para outros perfis (admin, tecnico, etc.) - todos os itens */}
              <button 
                onClick={() => handleMenuItemClick('home')}
                className={`flex ${isCollapsed && !isMobile ? 'justify-center' : 'items-center space-x-3'} w-full px-4 py-3 ${activeTab === 'home' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-colors duration-200`}
                title="Dashboard"
              >
                <Home size={20} className={`${activeTab === 'home' ? 'text-green-400' : ''} transition-colors duration-200`} />
                {(!isCollapsed || isMobile) && <span className={`${activeTab === 'home' ? 'text-green-400' : ''} transition-colors duration-200`}>Dashboard</span>}
              </button>
              
              <button 
                onClick={() => handleMenuItemClick('calendar')}
                className={`flex ${isCollapsed && !isMobile ? 'justify-center' : 'items-center space-x-3'} w-full px-4 py-3 ${activeTab === 'calendar' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-colors duration-200`}
                title="Calendário"
              >
                <Calendar size={20} className={`${activeTab === 'calendar' || activeTab === 'calendario' ? 'text-green-400' : ''} transition-colors duration-200`} />
                {(!isCollapsed || isMobile) && <span className={`${activeTab === 'calendar' || activeTab === 'calendario' ? 'text-green-400' : ''} transition-colors duration-200`}>Calendário</span>}
              </button>
              
              <button 
                onClick={() => handleMenuItemClick('allteams')}
                className={`flex ${isCollapsed && !isMobile ? 'justify-center' : 'items-center space-x-3'} w-full px-4 py-3 ${activeTab === 'allteams' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-colors duration-200`}
                title="Equipes"
              >
                <Search size={20} className={`${activeTab === 'allteams' ? 'text-green-400' : ''} transition-colors duration-200`} />
                {(!isCollapsed || isMobile) && <span className={`${activeTab === 'allteams' ? 'text-green-400' : ''} transition-colors duration-200`}>Equipes</span>}
              </button>
              
              <button 
                onClick={() => handleMenuItemClick('storeOnline')}
                className={`flex ${isCollapsed && !isMobile ? 'justify-center' : 'items-center space-x-3'} w-full px-4 py-3 ${activeTab === 'storeOnline' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-colors duration-200`}
                title="Loja Online"
              >
                <ShoppingBag size={20} className={`${activeTab === 'storeOnline' ? 'text-green-400' : ''} transition-colors duration-200`} />
                {(!isCollapsed || isMobile) && <span className={`${activeTab === 'storeOnline' ? 'text-green-400' : ''} transition-colors duration-200`}>Loja Online</span>}
              </button>

               {/* Meus Pedidos */}
               <button 
                 onClick={() => handleMenuItemClick('orders')}
                 className={`flex ${isCollapsed && !isMobile ? 'justify-center' : 'items-center space-x-3'} w-full px-4 py-3 ${activeTab === 'orders' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-colors duration-200`}
                 title="Meus Pedidos"
               >
                 <Truck size={20} className={`${activeTab === 'orders' ? 'text-green-400' : ''} transition-colors duration-200`} />
                 {(!isCollapsed || isMobile) && <span className={`${activeTab === 'orders' ? 'text-green-400' : ''} transition-colors duration-200`}>Meus Pedidos</span>}
               </button>

              <button 
                onClick={() => handleMenuItemClick('tournaments')}
                className={`flex ${isCollapsed && !isMobile ? 'justify-center' : 'items-center space-x-3'} w-full px-4 py-3 ${activeTab === 'tournaments' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-colors duration-200`}
                title="Ligas e Torneios"
              >
                <Trophy size={20} className={`${activeTab === 'tournaments' ? 'text-green-400' : ''} transition-colors duration-200`} />
                {(!isCollapsed || isMobile) && <span className={`${activeTab === 'tournaments' ? 'text-green-400' : ''} transition-colors duration-200`}>Ligas e Torneios</span>}
              </button>
              
              {(!isCollapsed || isMobile) && <div className="px-4 py-2 mt-6 text-gray-400 uppercase text-xs font-semibold">Configurações</div>}
              {isCollapsed && !isMobile && <div className="mt-6"></div>}
              
              <button 
                onClick={() => handleMenuItemClick('store')}
                className={`flex ${isCollapsed && !isMobile ? 'justify-center' : 'items-center space-x-3'} w-full px-4 py-3 ${activeTab === 'store' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-colors duration-200`}
                title="Minha Loja"
              >
                <ShoppingBag size={20} className={`${activeTab === 'store' ? 'text-green-400' : ''} transition-colors duration-200`} />
                {(!isCollapsed || isMobile) && <span className={`${activeTab === 'store' ? 'text-green-400' : ''} transition-colors duration-200`}>Minha Loja</span>}
              </button>



               {/* Minhas Vendas */}
               <button 
                 onClick={() => handleMenuItemClick('sales')}
                 className={`flex ${isCollapsed && !isMobile ? 'justify-center' : 'items-center space-x-3'} w-full px-4 py-3 ${activeTab === 'sales' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-colors duration-200`}
                 title="Minhas Vendas"
               >
                 <DollarSign size={20} className={`${activeTab === 'sales' ? 'text-green-400' : ''} transition-colors duration-200`} />
                 {(!isCollapsed || isMobile) && <span className={`${activeTab === 'sales' ? 'text-green-400' : ''} transition-colors duration-200`}>Minhas Vendas</span>}
               </button>

               <button 
                 onClick={() => handleMenuItemClick('teams')}
                 className={`flex ${isCollapsed && !isMobile ? 'justify-center' : 'items-center space-x-3'} w-full px-4 py-3 ${activeTab === 'teams' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-colors duration-200`}
                 title="Minha Equipe"
               >
                 <Users size={20} className={`${activeTab === 'teams' ? 'text-green-400' : ''} transition-colors duration-200`} />
                 {(!isCollapsed || isMobile) && <span className={`${activeTab === 'teams' ? 'text-green-400' : ''} transition-colors duration-200`}>Minha Equipe</span>}
               </button>

               <button 
                 onClick={() => handleMenuItemClick('account')}
                 className={`flex ${isCollapsed && !isMobile ? 'justify-center' : 'items-center space-x-3'} w-full px-4 py-3 ${activeTab === 'account' ? 'bg-gray-800' : 'hover:bg-gray-800'} transition-colors duration-200`}
                 title="Minha Conta"
               >
                 <Settings size={20} className={`${activeTab === 'account' ? 'text-green-400' : ''} transition-colors duration-200`} />
                 {(!isCollapsed || isMobile) && <span className={`${activeTab === 'account' ? 'text-green-400' : ''} transition-colors duration-200`}>Minha Conta</span>}
               </button>
            </>
          )}


        </div>
      </div>
    </>
  );
};

export default Sidebar;
