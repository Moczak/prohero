import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { MapPin, Trash2, Eye, Calendar, Users } from 'lucide-react';
import ConfirmationDialog from '../../components/UI/ConfirmationDialog';
import { Link } from 'react-router-dom';

interface Organization {
  id: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  description?: string;
  logo_url?: string | null;
  capa_url?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  modalidade_id?: string;
  subcategoria_id?: string;
  esporte_id?: string;
  esporte?: {
    id: string;
    nome: string;
  };
  modalidade?: {
    id: string;
    nome: string;
  };
  subcategoria?: {
    id: string;
    nome: string;
  };
  _count?: {
    players?: number;
    games?: number;
  };
}

const AdminOrganizationsManagement: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [esporteFilter, setEsporteFilter] = useState('');
  const [esportes, setEsportes] = useState<{id: string, nome: string}[]>([]);
  const [confirmDeleteOrg, setConfirmDeleteOrg] = useState<Organization | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEsportes = async () => {
      const { data, error } = await supabase
        .from('esportes')
        .select('id, nome')
        .order('nome');
        
      if (error) {
        console.error('Erro ao buscar esportes:', error);
        return;
      }
      
      setEsportes(data || []);
    };
    
    fetchEsportes();
  }, []);

  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(true);
      setError('');
      
      // Buscar organizações com contagem de jogadores e jogos
      const { data, error } = await supabase
        .from('sports_organizations')
        .select(`
          *,
          esporte:esporte_id (id, nome),
          modalidade:modalidade_id (id, nome),
          subcategoria:subcategoria_id (id, nome)
        `)
        .order('name');
        
      if (error) {
        console.error('Erro ao buscar organizações:', error);
        setError('Erro ao carregar organizações esportivas.');
        setLoading(false);
        return;
      }

      // Buscar contagem de jogadores para cada organização
      const orgsWithCounts = await Promise.all(
        (data || []).map(async (org) => {
          // Contagem de jogadores
          const { count: playersCount, error: playersError } = await supabase
            .from('players')
            .select('id', { count: 'exact', head: true })
            .eq('team_id', org.id);
            
          if (playersError) {
            console.error('Erro ao contar jogadores:', playersError);
          }
          
          // Contagem de jogos
          const { count: gamesCount, error: gamesError } = await supabase
            .from('games')
            .select('id', { count: 'exact', head: true })
            .eq('team_id', org.id);
            
          if (gamesError) {
            console.error('Erro ao contar jogos:', gamesError);
          }
          
          return {
            ...org,
            _count: {
              players: playersCount || 0,
              games: gamesCount || 0
            }
          };
        })
      );
      
      setOrganizations(orgsWithCounts || []);
      setLoading(false);
    };
    
    fetchOrganizations();
  }, []);

  useEffect(() => {
    let filtered = organizations;
    
    // Filtro por texto (nome ou cidade)
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(org => 
        (org.name?.toLowerCase().includes(searchLower)) || 
        (org.city?.toLowerCase().includes(searchLower)) ||
        (org.state?.toLowerCase().includes(searchLower))
      );
    }
    
    // Filtro por esporte
    if (esporteFilter) {
      filtered = filtered.filter(org => org.esporte_id === esporteFilter);
    }
    
    setFilteredOrganizations(filtered);
  }, [organizations, search, esporteFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleDelete = (org: Organization) => {
    setConfirmDeleteOrg(org);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteOrg) return;
    
    setDeleteLoadingId(confirmDeleteOrg.id);
    
    const { error } = await supabase
      .from('sports_organizations')
      .delete()
      .eq('id', confirmDeleteOrg.id);
      
    setDeleteLoadingId(null);
    setConfirmDeleteOrg(null);
    
    if (error) {
      console.error('Erro ao excluir organização:', error);
      setError('Erro ao excluir organização. Verifique se não há jogadores ou jogos associados.');
      return;
    }
    
    setOrganizations(orgs => orgs.filter(o => o.id !== confirmDeleteOrg.id));
  };

  const cancelDelete = () => setConfirmDeleteOrg(null);

  return (
    <>
      {confirmDeleteOrg && (
        <ConfirmationDialog
          isOpen={!!confirmDeleteOrg}
          title="Confirmar Exclusão"
          message={`Tem certeza que deseja excluir a organização "${confirmDeleteOrg.name}"? Esta ação excluirá também todos os jogadores e jogos associados.`}
          confirmButtonText="Excluir"
          cancelButtonText="Cancelar"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          confirmButtonColor="red"
        />
      )}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6">Gerenciamento de Organizações Esportivas</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-6 items-center">
          <input
            type="text"
            placeholder="Buscar por nome ou cidade..."
            className="px-4 py-2 border rounded-md flex-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          
          <select
            className="px-4 py-2 border rounded-md w-full md:w-auto"
            value={esporteFilter}
            onChange={(e) => setEsporteFilter(e.target.value)}
          >
            <option value="">Todos os esportes</option>
            {esportes.map(esporte => (
              <option key={esporte.id} value={esporte.id}>
                {esporte.nome}
              </option>
            ))}
          </select>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : filteredOrganizations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma organização encontrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organização
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Localização
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Esporte
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Users size={16} className="inline mr-1" />
                    Jogadores
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Calendar size={16} className="inline mr-1" />
                    Jogos
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criado em
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrganizations.map(org => (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 relative">
                          {org.logo_url ? (
                            <img 
                              src={org.logo_url} 
                              alt={org.name} 
                              className="h-10 w-10 rounded-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.style.display = 'none';
                                const fallbackElement = target.nextElementSibling;
                                if (fallbackElement) {
                                  (fallbackElement as HTMLElement).style.display = 'flex';
                                }
                              }}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                              {org.name?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {org.name}
                          </div>
                          {org.modalidade && (
                            <div className="text-xs text-gray-500">
                              {org.modalidade.nome}
                              {org.subcategoria && ` / ${org.subcategoria.nome}`}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin size={16} className="mr-1 text-gray-400" />
                        <span>
                          {[org.city, org.state, org.country].filter(Boolean).join(', ') || 'Não informado'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {org.esporte?.nome || 'Não informado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {org._count?.players || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {org._count?.games || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(org.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <Link 
                          to={`/equipe/${org.id}`} 
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Ver equipe"
                        >
                          <Eye size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(org)}
                          className="text-red-600 hover:text-red-900"
                          disabled={deleteLoadingId === org.id}
                          title="Excluir organização"
                        >
                          {deleteLoadingId === org.id ? (
                            <span className="text-xs">...</span>
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminOrganizationsManagement;
