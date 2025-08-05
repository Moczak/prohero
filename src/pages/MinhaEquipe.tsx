import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardLayout from '../components/Layout/DashboardLayout';
import ConfirmationDialog from '../components/UI/ConfirmationDialog';
import EditTeamModal from '../components/Teams/EditTeamModal';
import AddTeamModal from '../components/Teams/AddTeamModal';
import { useNavigate } from 'react-router-dom';

import { SportsOrganization } from "../types/SportsOrganization";

interface Esporte {
  id: string;
  nome: string;
  ativo: boolean;
}

const MinhaEquipe: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<(SportsOrganization & { nome?: string })[]>([]);
  const [sports, setSports] = useState<Esporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('teams');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; teamId: string; teamName: string }>({
    isOpen: false,
    teamId: '',
    teamName: ''
  });
  const [editModal, setEditModal] = useState<{ isOpen: boolean; team: SportsOrganization | null }>({
    isOpen: false,
    team: null
  });
  const [addModal, setAddModal] = useState(false);

  // Estado para armazenar o papel (role) do usuário atual
  const [userRole, setUserRole] = useState<string | null>(null);

  // Buscar o papel do usuário atual
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('auth_user_id', user.id)
          .single();
        
        if (error) throw error;
        if (data) {
          setUserRole(data.role);
        }
      } catch (err) {
        console.error('Erro ao buscar papel do usuário:', err);
      }
    };
    
    fetchUserRole();
  }, [user]);

  useEffect(() => {
    const fetchSportsAndOrganizations = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        // Buscar todos os esportes
        const { data: sportsData, error: sportsError } = await supabase
          .from('esportes')
          .select('*');
        if (sportsError) throw sportsError;
        setSports(sportsData || []);

        let orgsData;
        
        // Lógica diferente baseada no papel do usuário
        if (userRole === 'atleta') {
          // Para atletas: buscar equipes das quais o usuário faz parte como jogador ativo
          const { data: playerTeams, error: playerError } = await supabase
            .from('players')
            .select('team_id')
            .eq('user_id', user.id)
            .eq('active', true); // Garantir que apenas jogadores ativos vejam suas equipes
            
          if (playerError) throw playerError;
          
          if (playerTeams && playerTeams.length > 0) {
            const teamIds = playerTeams.map(pt => pt.team_id);
            
            const { data: teams, error: teamsError } = await supabase
              .from('sports_organizations')
              .select('*')
              .in('id', teamIds)
              .order('created_at', { ascending: false });
              
            if (teamsError) throw teamsError;
            orgsData = teams;
          } else {
            orgsData = [];
          }
        } else {
          // Para técnicos/admin: buscar equipes criadas pelo usuário
          const { data: teams, error: orgsError } = await supabase
            .from('sports_organizations')
            .select('*')
            .eq('created_by', user.id)
            .order('created_at', { ascending: false });
          if (orgsError) throw orgsError;
          orgsData = teams;
        }

        // Associar nome do esporte a cada organização
        const orgsWithSportName = (orgsData || []).map(org => {
          const esporte = sportsData?.find((s: Esporte) => s.id === org.esporte_id);
          return {
            ...org,
            nome: esporte ? esporte.nome : undefined,
          };
        });
        setOrganizations(orgsWithSportName);
      } catch (err: any) {
        console.error('Erro ao buscar organizações/esportes:', err);
        setError('Não foi possível carregar as equipes. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    if (user && userRole) {
      fetchSportsAndOrganizations();
    }
  }, [user, userRole]);

  const handleAddTeam = () => {
    setAddModal(true);
  };

  const handleEditTeam = (id: string) => {
    const teamToEdit = organizations.find(org => org.id === id);
    if (teamToEdit) {
      setEditModal({
        isOpen: true,
        team: teamToEdit
      });
    }
  };

  const handleDeleteTeam = async (id: string) => {
    const teamToDelete = organizations.find(org => org.id === id);
    if (teamToDelete) {
      setDeleteConfirmation({
        isOpen: true,
        teamId: id,
        teamName: teamToDelete.name
      });
    }
  };

  const handleViewTeamDetails = (id: string) => {
    navigate(`/equipe/${id}`);
  };

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from('sports_organizations')
        .delete()
        .eq('id', deleteConfirmation.teamId);

      if (error) throw error;

      setOrganizations(orgs => orgs.filter(org => org.id !== deleteConfirmation.teamId));
      setDeleteConfirmation({ isOpen: false, teamId: '', teamName: '' });
    } catch (err: any) {
      console.error('Erro ao excluir organização:', err);
      setError('Não foi possível excluir a equipe. Por favor, tente novamente.');
      setDeleteConfirmation({ isOpen: false, teamId: '', teamName: '' });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, teamId: '', teamName: '' });
  };

  const handleTeamSuccess = () => {
    // Recarregar a lista de organizações após uma edição ou adição bem-sucedida
    if (user) {
      setLoading(true);
      supabase
        .from('sports_organizations')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            console.error('Erro ao buscar organizações:', error);
            setError('Não foi possível carregar as equipes. Por favor, tente novamente.');
          } else {
            // Associar nome do esporte a cada organização
            const orgsWithSportName = (data || []).map(org => {
              const esporte = sports.find((s) => s.id === org.esporte_id);
              return {
                ...org,
                nome: esporte ? esporte.nome : undefined,
              };
            });
            setOrganizations(orgsWithSportName);
          }
          setLoading(false);
        });
    }
  };

  const content = (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center mb-4 md:mb-0">
          <Users className="mr-2" />
          {userRole === 'atleta' ? 'Minhas Equipes' : 'Minha Equipe'}
        </h1>
        {userRole !== 'atleta' && (
          <button
            onClick={handleAddTeam}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
          >
            <Plus size={20} />
            <span>Adicionar Equipe</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              {/* Shimmer para a imagem */}
              <div className="h-40 bg-gray-200 animate-pulse"></div>
              
              <div className="p-4">
                {/* Shimmer para o título */}
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-2 w-3/4"></div>
                
                {/* Shimmer para o subtítulo */}
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-1/2"></div>
                
                {/* Shimmer para o texto */}
                <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                
                {/* Shimmer para os botões */}
                <div className="mt-4 flex justify-end space-x-2">
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : organizations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          {userRole === 'atleta' ? (
            <p className="text-gray-600 mb-4">Você ainda não faz parte de nenhuma equipe.</p>
          ) : (
            <>
              <p className="text-gray-600 mb-4">Você ainda não tem nenhuma equipe cadastrada.</p>
              <button
                onClick={handleAddTeam}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Clique aqui para adicionar sua primeira equipe
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map(org => (
            <div
              key={org.id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleViewTeamDetails(org.id)}
            >
              <div className="h-40 bg-gray-200 relative">
                {org.capa_url ? (
                  <img
                    src={org.capa_url}
                    alt={`Capa ${org.name}`}
                    className="w-full h-full object-cover"
                  />
                ) : org.logo_url ? (
                  <img
                    src={org.logo_url}
                    alt={`Logo ${org.name}`}
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                    Sem imagem
                  </div>
                )}
                
                {org.logo_url && (
                  <div className="absolute -bottom-8 left-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white bg-white shadow-md">
                      <img 
                        src={org.logo_url} 
                        alt={`Logo ${org.name}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback em caso de erro no carregamento da imagem
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 pt-10">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{org.name}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {org.nome ? org.nome : 'Esporte não definido'}
                </p>
                <p className="text-sm text-gray-500">
                  {[org.city, org.state, org.country].filter(Boolean).join(', ')}
                </p>
                
                {userRole !== 'atleta' && (
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTeam(org.id);
                      }}
                      className="p-2 text-gray-600 hover:text-green-600 transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTeam(org.id);
                      }}
                      className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        title="Confirmar exclusão"
        message={`Tem certeza que deseja excluir a equipe "${deleteConfirmation.teamName}"? Esta ação não pode ser desfeita.`}
        confirmButtonText="Excluir"
        cancelButtonText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmButtonColor="red"
      />

      <EditTeamModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, team: null })}
        team={editModal.team}
        onSuccess={handleTeamSuccess}
      />

      <AddTeamModal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        onSuccess={handleTeamSuccess}
      />
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

export default MinhaEquipe;
