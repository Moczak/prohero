import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Plus, Search, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/Layout/DashboardLayout';
import AddLeagueTournamentModal from '../components/LeaguesTournaments/AddLeagueTournamentModal';
import ConfirmationModal from '../components/UI/ConfirmationModal';

// Interfaces para Ligas e Torneios
interface League {
  id: string;
  name: string;
  description: string;
  cover_image_url: string | null;
  logo_url: string | null;
  format: string;
  start_date: string;
  end_date: string;
  location: string;
  created_by: string;
  created_at: string;
}

interface Tournament {
  id: string;
  name: string;
  description: string;
  cover_image_url: string | null;
  logo_url: string | null;
  format: string;
  start_date: string;
  end_date: string;
  location: string;
  participants_number: number;
  status: string;
  created_by: string;
  created_at: string;
}

type LeagueOrTournament = (League | Tournament) & { type: 'league' | 'tournament' };

const LigasTorneios: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('all');
  const [myItems, setMyItems] = useState<LeagueOrTournament[]>([]);
  const [allItems, setAllItems] = useState<LeagueOrTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'league' | 'tournament' | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<LeagueOrTournament | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Função para buscar ligas e torneios
  const fetchLeaguesAndTournaments = async () => {
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
      
      // Marcar o tipo de cada item
      const leaguesWithType = leagues.map((league: League) => ({ 
        ...league, 
        type: 'league' as const
      }));
      
      const tournamentsWithType = tournaments.map((tournament: Tournament) => ({ 
        ...tournament, 
        type: 'tournament' as const
      }));
      
      // Combinar ligas e torneios
      const allItemsData = [...leaguesWithType, ...tournamentsWithType] as LeagueOrTournament[];
      
      // Filtrar apenas os itens criados pelo usuário atual
      const myItemsData = allItemsData.filter(item => item.created_by === user.id);
      
      setMyItems(myItemsData);
      setAllItems(allItemsData);
    } catch (err: any) {
      console.error('Erro ao buscar ligas e torneios:', err);
      setError('Não foi possível carregar as ligas e torneios. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Buscar o papel do usuário e os dados de ligas e torneios
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user?.id) {
        try {
          // Verificar se temos dados em cache
          const cachedUserData = localStorage.getItem(`user_data_${user.id}`);
          
          if (cachedUserData) {
            const userData = JSON.parse(cachedUserData);
            if (userData.role) {
              console.log('Role do usuário (do cache):', userData.role);
              setUserRole(userData.role);
              return;
            }
          }
          
          // Se não tiver cache, buscar do servidor
          const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('auth_user_id', user.id)
            .single();
            
          if (error) {
            console.error('Erro ao buscar papel do usuário:', error);
            return;
          }
          
          if (data?.role) {
            console.log('Role do usuário (do servidor):', data.role);
            setUserRole(data.role);
          }
        } catch (error) {
          console.error('Erro ao buscar papel do usuário:', error);
        }
      }
    };
    
    fetchUserRole();
    fetchLeaguesAndTournaments();
  }, [user]);

  // Filtrar itens com base na busca
  const filteredMyItems = myItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredAllItems = allItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Função para abrir o modal de adicionar
  const handleAddClick = () => {
    setAddType(null);
    setShowAddModal(true);
  };
  
  // Função para selecionar o tipo (liga ou torneio)
  const handleTypeSelect = (type: 'league' | 'tournament') => {
    setAddType(type);
  };

  // Função para lidar com a adição de uma nova liga ou torneio
  const handleItemAdded = () => {
    fetchLeaguesAndTournaments();
    setShowAddModal(false);
    setAddType(null);
  };
  
  // Função para abrir o modal de confirmação de exclusão
  const handleDeleteClick = (e: React.MouseEvent, item: LeagueOrTournament) => {
    e.stopPropagation(); // Impedir a navegação para a página de detalhes
    setItemToDelete(item);
    setShowDeleteModal(true);
  };
  
  // Função para excluir uma liga ou torneio
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    try {
      // Excluir do banco de dados
      const { error } = await supabase
        .from(itemToDelete.type === 'league' ? 'leagues' : 'tournaments')
        .delete()
        .eq('id', itemToDelete.id);
        
      if (error) throw error;
      
      // Atualizar a lista após a exclusão
      fetchLeaguesAndTournaments();
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir o item. Por favor, tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Função para fechar o modal e limpar o estado
  const handleCloseModal = () => {
    setShowAddModal(false);
    setAddType(null);
  };

  // Função para formatar a data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Função para obter o texto do formato
  const getFormatText = (format: string, type: 'league' | 'tournament') => {
    if (type === 'league') {
      switch (format) {
        case 'home_away': return 'Ida e Volta';
        case 'single': return 'Turno Único';
        default: return format;
      }
    } else {
      switch (format) {
        case 'knockout': return 'Eliminatório';
        case 'points': return 'Pontos Corridos';
        case 'group_stage': return 'Fase de Grupos';
        case 'mixed': return 'Misto (Grupos + Eliminatórias)';
        default: return format;
      }
    }
  };

  // Função para obter o texto do status (apenas para torneios)
  const getStatusText = (status: string) => {
    switch (status) {
      case 'open_registration': return 'Inscrições Abertas';
      case 'in_progress': return 'Em Andamento';
      case 'finished': return 'Finalizado';
      default: return status;
    }
  };

  // Função para obter a cor do status (apenas para torneios)
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open_registration': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'finished': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout activeTab="tournaments" setActiveTab={() => {}}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center mb-4 md:mb-0">
            <Trophy className="mr-2" />
            Ligas e Torneios
          </h1>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
            
            {userRole !== 'atleta' && userRole !== 'fa' && (
              <button
                onClick={handleAddClick}
                className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus size={18} className="mr-1" />
                Adicionar
              </button>
            )}
          </div>
        </div>
        
        {/* Abas */}
        <div className="flex border-b mb-6">
          {userRole !== 'atleta' && userRole !== 'fa' && (
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'my' 
                  ? 'text-green-600 border-b-2 border-green-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Minhas Ligas e Torneios
            </button>
          )}
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'all' 
                ? 'text-green-600 border-b-2 border-green-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Todas as Ligas e Torneios
          </button>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Shimmer para a imagem de capa */}
                <div className="h-32 bg-gray-200 animate-pulse relative"></div>
                
                {/* Shimmer para o logo */}
                <div className="relative">
                  <div className="absolute -top-8 left-4">
                    <div className="w-16 h-16 rounded-full border-4 border-white bg-gray-200 animate-pulse"></div>
                  </div>
                </div>
                
                <div className="pt-10 px-4 pb-4">
                  {/* Shimmer para o título e tipo */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-3/4">
                      <div className="h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    </div>
                    <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  
                  {/* Shimmer para a descrição */}
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-full"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-3 w-2/3"></div>
                  
                  {/* Shimmer para as tags */}
                  <div className="flex flex-wrap gap-2">
                    <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-5 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <div>
            {activeTab === 'my' ? (
              filteredMyItems.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">Nenhuma Liga ou Torneio</h3>
                  <p className="text-gray-500 mb-6">Você ainda não criou nenhuma liga ou torneio.</p>
                  <button
                    onClick={handleAddClick}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus size={18} className="inline mr-1" />
                    Adicionar Liga ou Torneio
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMyItems.map(item => (
                    <div 
                      key={item.id} 
                      className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-md transition-shadow relative group"
                      onClick={() => navigate(`/ligastorneios/${item.id}`)}
                    >
                      {item.created_by === user?.id && (
                        <button
                          onClick={(e) => handleDeleteClick(e, item)}
                          className="absolute top-2 right-2 p-1.5 bg-white text-gray-400 rounded-full hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10 shadow-sm"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      <div className="h-32 bg-gray-200 relative">
                        {item.cover_image_url ? (
                          <img 
                            src={item.cover_image_url} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <Trophy size={48} className="text-gray-400" />
                          </div>
                        )}
                        
                        {/* Logo */}
                        <div className="absolute -bottom-8 left-4">
                          <div className="w-16 h-16 rounded-full border-4 border-white bg-white overflow-hidden">
                            {item.logo_url ? (
                              <img 
                                src={item.logo_url} 
                                alt={`Logo ${item.name}`} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <Trophy size={24} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-10 px-4 pb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg truncate">{item.name}</h3>
                            <p className="text-sm text-gray-500 mb-2">
                              {formatDate(item.start_date)} - {formatDate(item.end_date)}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                            {item.type === 'league' ? 'Liga' : 'Torneio'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {item.description || 'Sem descrição'}
                        </p>
                        
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                            {getFormatText(item.format, item.type as 'league' | 'tournament')}
                          </span>
                          
                          {item.type === 'tournament' && (
                            <>
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                                {(item as Tournament).participants_number} participantes
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor((item as Tournament).status)}`}>
                                {getStatusText((item as Tournament).status)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              filteredAllItems.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium text-gray-700 mb-2">Nenhuma Liga ou Torneio Encontrado</h3>
                  <p className="text-gray-500">Não há ligas ou torneios que correspondam à sua busca.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAllItems.map(item => (
                    <div 
                      key={item.id} 
                      className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/ligastorneios/${item.id}`)}
                    >
                      <div className="h-32 bg-gray-200 relative">
                        {item.cover_image_url ? (
                          <img 
                            src={item.cover_image_url} 
                            alt={item.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <Trophy size={48} className="text-gray-400" />
                          </div>
                        )}
                        
                        {/* Logo */}
                        <div className="absolute -bottom-8 left-4">
                          <div className="w-16 h-16 rounded-full border-4 border-white bg-white overflow-hidden">
                            {item.logo_url ? (
                              <img 
                                src={item.logo_url} 
                                alt={`Logo ${item.name}`} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <Trophy size={24} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-10 px-4 pb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg truncate">{item.name}</h3>
                            <p className="text-sm text-gray-500 mb-2">
                              {formatDate(item.start_date)} - {formatDate(item.end_date)}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                            {item.type === 'league' ? 'Liga' : 'Torneio'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {item.description || 'Sem descrição'}
                        </p>
                        
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                            {getFormatText(item.format, item.type as 'league' | 'tournament')}
                          </span>
                          
                          {item.type === 'tournament' && (
                            <>
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                                {(item as Tournament).participants_number} participantes
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor((item as Tournament).status)}`}>
                                {getStatusText((item as Tournament).status)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>
      
      {/* Modal para adicionar liga ou torneio */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
            {!addType ? (
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">O que você deseja criar?</h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => handleTypeSelect('league')}
                    className="p-4 border rounded-lg hover:bg-gray-50 flex flex-col items-center transition-colors"
                  >
                    <Trophy size={32} className="mb-2 text-green-600" />
                    <span className="font-medium">Liga</span>
                    <span className="text-xs text-gray-500 mt-1">Formato de ida e volta</span>
                  </button>
                  <button
                    onClick={() => handleTypeSelect('tournament')}
                    className="p-4 border rounded-lg hover:bg-gray-50 flex flex-col items-center transition-colors"
                  >
                    <Trophy size={32} className="mb-2 text-blue-600" />
                    <span className="font-medium">Torneio</span>
                    <span className="text-xs text-gray-500 mt-1">Diversos formatos</span>
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <AddLeagueTournamentModal 
                type={addType}
                onClose={handleCloseModal}
                onSuccess={handleItemAdded}
              />
            )}
          </div>
        </div>
      )}
      
      {/* Modal de confirmação de exclusão */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir ${itemToDelete?.type === 'league' ? 'a liga' : 'o torneio'} "${itemToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
};

export default LigasTorneios;
