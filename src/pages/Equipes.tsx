import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, Users } from 'lucide-react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { SportsOrganization } from "../types/SportsOrganization";

const Equipes: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [organizations, setOrganizations] = useState<(SportsOrganization & { nome?: string })[]>([]);
  const [followedOrganizations, setFollowedOrganizations] = useState<(SportsOrganization & { nome?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [followedLoading, setFollowedLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followedError, setFollowedError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('allteams');
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrganizations, setFilteredOrganizations] = useState<(SportsOrganization & { nome?: string })[]>([]);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  // Função para buscar as equipes que o usuário segue
  const fetchFollowedTeams = async (sportsData: any[] | null) => {
    try {
      setFollowedLoading(true);
      setFollowedError(null);
      
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        setFollowedOrganizations([]);
        return;
      }
      
      // Buscar IDs das equipes que o usuário segue
      const { data: followedData, error: followedError } = await supabase
        .from('team_followers')
        .select('team_id')
        .filter('user_id', 'eq', user.user.id);
      
      if (followedError) throw followedError;
      
      if (!followedData || followedData.length === 0) {
        setFollowedOrganizations([]);
        return;
      }
      
      // Extrair os IDs das equipes seguidas
      const followedTeamIds = followedData.map((item: {team_id: string}) => item.team_id);
      
      // Buscar detalhes das equipes seguidas
      const { data: followedTeamsData, error: teamsError } = await supabase
        .from('sports_organizations')
        .select('*')
        .in('id', followedTeamIds);
      
      if (teamsError) throw teamsError;
      
      // Associar nome do esporte a cada organização seguida
      const followedWithSportName = (followedTeamsData || []).map((org: SportsOrganization) => {
        const esporte = sportsData?.find((s: any) => s.id === org.esporte_id);
        return {
          ...org,
          nome: esporte ? esporte.nome : undefined,
        };
      });
      
      setFollowedOrganizations(followedWithSportName);
    } catch (err: any) {
      console.error('Erro ao buscar equipes seguidas:', err);
      setFollowedError('Não foi possível carregar as equipes que você segue. Por favor, tente novamente.');
    } finally {
      setFollowedLoading(false);
    }
  };

  // Verificar se o usuário acabou de seguir ou deixar de seguir uma equipe
  useEffect(() => {
    const state = location.state as { followStatusChanged?: boolean } | null;
    
    if (state?.followStatusChanged) {
      // Limpar o estado da navegação
      window.history.replaceState({}, document.title);
      
      // Buscar novamente as equipes seguidas
      const fetchSports = async () => {
        const { data: sportsData } = await supabase
          .from('esportes')
          .select('*');
        
        await fetchFollowedTeams(sportsData);
      };
      
      fetchSports();
    }
  }, [location]); // Removido fetchFollowedTeams das dependências para evitar loop infinito
  
  useEffect(() => {
    const fetchSportsAndOrganizations = async () => {
      try {
        setLoading(true);
        // Buscar todos os esportes
        const { data: sportsData, error: sportsError } = await supabase
          .from('esportes')
          .select('*');
        if (sportsError) throw sportsError;

        // Buscar todas as organizações
        const { data: orgsData, error: orgsError } = await supabase
          .from('sports_organizations')
          .select('*')
          .order('created_at', { ascending: false });
        if (orgsError) throw orgsError;

        // Associar nome do esporte a cada organização
        const orgsWithSportName = (orgsData || []).map((org: SportsOrganization) => {
          const esporte = sportsData?.find((s: any) => s.id === org.esporte_id);
          return {
            ...org,
            nome: esporte ? esporte.nome : undefined,
          };
        });
        setOrganizations(orgsWithSportName);
        setFilteredOrganizations(orgsWithSportName);
        
        // Buscar equipes seguidas
        await fetchFollowedTeams(sportsData);
      } catch (err: any) {
        console.error('Erro ao buscar organizações/esportes:', err);
        setError('Não foi possível carregar as equipes. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchSportsAndOrganizations();
  }, []);

  useEffect(() => {
    // Determinar qual lista de organizações usar com base na aba selecionada
    const orgsToFilter = selectedTab === 'all' ? organizations : followedOrganizations;
    
    // Filtrar organizações com base no termo de pesquisa
    if (searchTerm.trim() === '') {
      setFilteredOrganizations(orgsToFilter);
    } else {
      const filtered = orgsToFilter.filter((org: SportsOrganization & { nome?: string }) => 
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (org.nome && org.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (org.city && org.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (org.state && org.state.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (org.country && org.country.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredOrganizations(filtered);
    }
  }, [searchTerm, organizations, followedOrganizations, selectedTab]);

  const handleViewTeamDetails = (id: string) => {
    navigate(`/visualizar-equipe/${id}`);
  };

  const content = (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center mb-4 md:mb-0">
          <Users className="mr-2" />
          Equipes
        </h1>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Pesquisar equipes..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Abas - Estilo igual ao da página LigasTorneios.tsx */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setSelectedTab('all')}
          className={`px-4 py-2 font-medium flex items-center ${
            selectedTab === 'all' 
              ? 'text-green-600 border-b-2 border-green-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users size={18} className="mr-2" />
          Todas as Equipes
        </button>
        <button
          onClick={() => setSelectedTab('followed')}
          className={`px-4 py-2 font-medium flex items-center ${
            selectedTab === 'followed' 
              ? 'text-green-600 border-b-2 border-green-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
          Equipes que Sigo
        </button>
      </div>

      {/* Mensagens de erro */}
      {selectedTab === 'all' && error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {selectedTab === 'followed' && followedError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {followedError}
        </div>
      )}

      {/* Estado de carregamento com base na aba selecionada */}
      {(selectedTab === 'all' && loading) || (selectedTab === 'followed' && followedLoading) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
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
              </div>
            </div>
          ))}
        </div>
      ) : filteredOrganizations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-gray-600 mb-4">
            {searchTerm.trim() !== '' 
              ? 'Nenhuma equipe encontrada para esta pesquisa.' 
              : selectedTab === 'all'
                ? 'Não há equipes cadastradas no sistema.'
                : 'Você ainda não segue nenhuma equipe. Visite a aba "Todas as Equipes" para encontrar equipes para seguir.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map(org => (
            <div
              key={org.id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleViewTeamDetails(org.id)}
            >
              <div className="h-40 bg-gray-200 relative">
                {org.capa_url ? (
                  <div className="w-full h-full relative">
                    <div className={`w-full h-full absolute inset-0 bg-gray-200 ${loadedImages[`capa-${org.id}`] ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}></div>
                    <img
                      src={org.capa_url}
                      alt={`Capa ${org.name}`}
                      className={`w-full h-full object-cover ${loadedImages[`capa-${org.id}`] ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                      onLoad={() => {
                        setLoadedImages(prev => ({
                          ...prev,
                          [`capa-${org.id}`]: true
                        }));
                      }}
                    />
                  </div>
                ) : org.logo_url ? (
                  <div className="w-full h-full relative">
                    <div className={`w-full h-full absolute inset-0 bg-gray-200 ${loadedImages[`main-logo-${org.id}`] ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}></div>
                    <img
                      src={org.logo_url}
                      alt={`Logo ${org.name}`}
                      className={`w-full h-full object-contain p-4 ${loadedImages[`main-logo-${org.id}`] ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                      onLoad={() => {
                        setLoadedImages(prev => ({
                          ...prev,
                          [`main-logo-${org.id}`]: true
                        }));
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                    Sem imagem
                  </div>
                )}
                
                {org.logo_url && (
                  <div className="absolute -bottom-8 left-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white bg-white shadow-md relative">
                      <div className={`w-full h-full absolute inset-0 bg-gray-200 rounded-full ${loadedImages[`small-logo-${org.id}`] ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}></div>
                      <img 
                        src={org.logo_url} 
                        alt={`Logo ${org.name}`}
                        className={`w-full h-full object-cover ${loadedImages[`small-logo-${org.id}`] ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                        onLoad={() => {
                          setLoadedImages(prev => ({
                            ...prev,
                            [`small-logo-${org.id}`]: true
                          }));
                        }}
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
              </div>
            </div>
          ))}
        </div>
      )}
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

export default Equipes;
