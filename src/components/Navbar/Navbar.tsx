import React, { useEffect, useState, useRef } from 'react';
import { Bell, ChevronDown, Menu, User, LogOut } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';
import { getUserByAuthId } from '../../services/userService';
import EditProfileModal from '../Profile/EditProfileModal';

interface NavbarProps {
  // Add any props you need for the Navbar
}

const Navbar: React.FC<NavbarProps> = () => {
  const { isMobile, toggleMobileSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const [userName, setUserName] = useState<string>('');
  const [userInitials, setUserInitials] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
              console.log('Navbar: Usando dados de usuário em cache');
              if (userData.name) {
                setUserName(userData.name);
                // Get initials from name (first letter of first and last name)
                const nameParts = userData.name.split(' ');
                const initials = nameParts.length > 1 
                  ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}` 
                  : nameParts[0][0];
                setUserInitials(initials.toUpperCase());
              }
              
              // Definir a URL do avatar se disponível
              if (userData.avatar_url) {
                setAvatarUrl(userData.avatar_url);
              }
              return;
            }
          }
          
          // Se não tiver cache ou estiver expirado, buscar do servidor
          console.log('Navbar: Buscando dados de usuário do servidor');
          const userData = await getUserByAuthId(user.id);
          
          if (userData?.name) {
            setUserName(userData.name);
            // Get initials from name (first letter of first and last name)
            const nameParts = userData.name.split(' ');
            const initials = nameParts.length > 1 
              ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}` 
              : nameParts[0][0];
            setUserInitials(initials.toUpperCase());
          }
          
          // Definir a URL do avatar se disponível
          if (userData?.avatar_url) {
            setAvatarUrl(userData.avatar_url);
          }
          
          // Salvar no cache
          if (userData) {
            localStorage.setItem(`user_data_${user.id}`, JSON.stringify({
              ...userData,
              cacheTime: Date.now()
            }));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleEditProfile = () => {
    setIsProfileDropdownOpen(false);
    setIsProfileModalOpen(true);
  };

  return (
    <>
      {/* Modal de edição de perfil */}
      <EditProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />

      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {isMobile && (
            <button 
              onClick={toggleMobileSidebar}
              className="p-2 rounded-md hover:bg-gray-100 text-gray-700"
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-gray-500 hover:text-green-600">
            <Bell size={20} />
            <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">3</span>
          </button>
          
          <div className="relative" ref={dropdownRef}>
            <div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={toggleProfileDropdown}
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar do usuário" 
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                  onError={() => setAvatarUrl(null)} // Fallback para iniciais se a imagem falhar
                />
              ) : (
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {userInitials || '?'}
                </div>
              )}
              <span className="font-medium hidden sm:inline">{userName || 'Usuário'}</span>
              <ChevronDown size={16} className={`transition-transform ${isProfileDropdownOpen ? 'transform rotate-180' : ''}`} />
            </div>
            
            {/* Dropdown menu */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                <button
                  onClick={handleEditProfile}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <User size={16} className="mr-2" />
                  Editar Perfil
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut size={16} className="mr-2" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
