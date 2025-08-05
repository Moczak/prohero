import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle, Loader, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Team {
  id: string;
  name: string;
  logo_url: string | null;
}

interface Registration {
  id: string;
  tournament_id: string;
  team_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at?: string;
  team?: Team;
}

interface TournamentRegistrationManagerProps {
  tournamentId: string;
  tournamentStatus: string;
  isCreator: boolean;
  onStatusChange: (newStatus: string) => void;
}

const TournamentRegistrationManager: React.FC<TournamentRegistrationManagerProps> = ({
  tournamentId,
  tournamentStatus,
  isCreator,
  onStatusChange
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  // Buscar inscrições do torneio
  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoading(true);
        
        // Buscar inscrições
        const { data: registrationsData, error: registrationsError } = await supabase
          .from('tournament_registrations')
          .select(`
            *,
            team:team_id (
              id,
              name,
              logo_url
            )
          `)
          .eq('tournament_id', tournamentId);
          
        if (registrationsError) throw registrationsError;
        
        setRegistrations(registrationsData || []);
      } catch (err) {
        console.error('Erro ao buscar inscrições:', err);
        setError('Não foi possível carregar as inscrições.');
      } finally {
        setLoading(false);
      }
    };
    
    if (tournamentId) {
      fetchRegistrations();
    }
  }, [tournamentId]);

  // Buscar equipes do usuário atual
  useEffect(() => {
    const fetchUserTeams = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('sports_organizations')
          .select('id, name, logo_url')
          .eq('created_by', user.id);
          
        if (error) throw error;
        
        setUserTeams(data || []);
        
        // Se o usuário tiver apenas uma equipe, selecionar automaticamente
        if (data && data.length === 1) {
          setSelectedTeamId(data[0].id);
        }
      } catch (err) {
        console.error('Erro ao buscar equipes do usuário:', err);
      }
    };
    
    fetchUserTeams();
  }, [user]);

  // Verificar se o usuário já se inscreveu
  const hasRegistered = () => {
    return registrations.some(reg => 
      userTeams.some(team => team.id === reg.team_id)
    );
  };

  // Função para inscrever uma equipe
  const registerTeam = async () => {
    if (!selectedTeamId) {
      setError('Selecione uma equipe para se inscrever.');
      return;
    }
    
    try {
      setRegistrationLoading(true);
      setError(null);
      
      // Verificar se o torneio está com inscrições abertas
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('status')
        .eq('id', tournamentId)
        .single();
        
      if (tournamentError) throw tournamentError;
      
      if (tournamentData.status !== 'open_registration') {
        throw new Error('Este torneio não está aceitando inscrições no momento.');
      }
      
      // Inserir inscrição
      const { error: registrationError } = await supabase
        .from('tournament_registrations')
        .insert({
          tournament_id: tournamentId,
          team_id: selectedTeamId,
          status: 'pending'
        });
        
      if (registrationError) throw registrationError;
      
      // Atualizar lista de inscrições
      const { data: updatedRegistrations, error: fetchError } = await supabase
        .from('tournament_registrations')
        .select(`
          *,
          team:team_id (
            id,
            name,
            logo_url
          )
        `)
        .eq('tournament_id', tournamentId);
        
      if (fetchError) throw fetchError;
      
      setRegistrations(updatedRegistrations || []);
      setSuccess('Inscrição realizada com sucesso! Aguarde a aprovação.');
      
      // Limpar mensagem de sucesso após 5 segundos
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Erro ao inscrever equipe:', err);
      setError(err.message || 'Não foi possível realizar a inscrição.');
    } finally {
      setRegistrationLoading(false);
    }
  };

  // Função para aprovar ou rejeitar uma inscrição
  const updateRegistrationStatus = async (registrationId: string, status: 'approved' | 'rejected') => {
    try {
      // Atualizar status da inscrição
      const { error } = await supabase
        .from('tournament_registrations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', registrationId);
        
      if (error) throw error;
      
      // Atualizar lista de inscrições
      setRegistrations(prevRegistrations => 
        prevRegistrations.map(reg => 
          reg.id === registrationId ? { ...reg, status } : reg
        )
      );
      
      setSuccess(`Inscrição ${status === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso!`);
      
      // Limpar mensagem de sucesso após 5 segundos
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Erro ao atualizar inscrição:', err);
      setError('Não foi possível atualizar a inscrição.');
    }
  };
  
  // Função para excluir uma inscrição
  const deleteRegistration = async (registrationId: string) => {
    if (!confirm('Tem certeza que deseja remover esta equipe do torneio? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .delete()
        .eq('id', registrationId);
        
      if (error) throw error;
      
      // Remover da lista local
      setRegistrations(prevRegistrations => 
        prevRegistrations.filter(reg => reg.id !== registrationId)
      );
      
      setSuccess('Equipe removida do torneio com sucesso!');
      
      // Limpar mensagem de sucesso após 5 segundos
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Erro ao excluir inscrição:', err);
      setError('Não foi possível remover a equipe do torneio.');
    }
  };

  // Função para atualizar o status do torneio
  const updateTournamentStatus = async (status: string) => {
    try {
      setStatusUpdateLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('tournaments')
        .update({ status })
        .eq('id', tournamentId);
        
      if (error) throw error;
      
      onStatusChange(status);
      setSuccess(`Status do torneio atualizado para "${
        status === 'open_registration' ? 'Inscrições Abertas' : 
        status === 'in_progress' ? 'Em Andamento' : 'Finalizado'
      }"`);
      
      // Limpar mensagem de sucesso após 5 segundos
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Erro ao atualizar status do torneio:', err);
      setError('Não foi possível atualizar o status do torneio.');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Renderizar mensagem de erro ou sucesso
  const renderMessage = () => {
    if (error) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center mb-4">
          <AlertCircle size={18} className="mr-2" />
          {error}
        </div>
      );
    }
    
    if (success) {
      return (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center mb-4">
          <Check size={18} className="mr-2" />
          {success}
        </div>
      );
    }
    
    return null;
  };

  // Renderizar botão de status para o criador do torneio
  const renderStatusButtons = () => {
    if (!isCreator) return null;
    
    // Função para obter o texto do status atual
    const getStatusText = () => {
      switch(tournamentStatus) {
        case 'open_registration': return 'Inscrições Abertas';
        case 'in_progress': return 'Em Andamento';
        case 'finished': return 'Finalizado';
        default: return 'Status Desconhecido';
      }
    };
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Gerenciar Status do Torneio</h3>
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-600">Status atual: 
            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
              tournamentStatus === 'open_registration' ? 'bg-blue-100 text-blue-800' :
              tournamentStatus === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {getStatusText()}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateTournamentStatus('open_registration')}
            disabled={tournamentStatus === 'open_registration' || statusUpdateLoading}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
              tournamentStatus === 'open_registration'
                ? 'bg-blue-200 text-blue-800 border-2 border-blue-500 shadow-md'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {tournamentStatus === 'open_registration' && (
              <Check size={16} className="mr-1" />
            )}
            {statusUpdateLoading && tournamentStatus !== 'open_registration' ? (
              <Loader size={16} className="animate-spin mr-1" />
            ) : null}
            Inscrições Abertas
          </button>
          
          <button
            onClick={() => updateTournamentStatus('in_progress')}
            disabled={tournamentStatus === 'in_progress' || statusUpdateLoading}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
              tournamentStatus === 'in_progress'
                ? 'bg-yellow-200 text-yellow-800 border-2 border-yellow-500 shadow-md'
                : 'bg-yellow-600 text-white hover:bg-yellow-700'
            }`}
          >
            {tournamentStatus === 'in_progress' && (
              <Check size={16} className="mr-1" />
            )}
            {statusUpdateLoading && tournamentStatus !== 'in_progress' ? (
              <Loader size={16} className="animate-spin mr-1" />
            ) : null}
            Em Andamento
          </button>
          
          <button
            onClick={() => updateTournamentStatus('finished')}
            disabled={tournamentStatus === 'finished' || statusUpdateLoading}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
              tournamentStatus === 'finished'
                ? 'bg-green-200 text-green-800 border-2 border-green-500 shadow-md'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {tournamentStatus === 'finished' && (
              <Check size={16} className="mr-1" />
            )}
            {statusUpdateLoading && tournamentStatus !== 'finished' ? (
              <Loader size={16} className="animate-spin mr-1" />
            ) : null}
            Finalizado
          </button>
        </div>
      </div>
    );
  };

  // Renderizar formulário de inscrição
  const renderRegistrationForm = () => {
    // Não mostrar formulário para o criador do torneio
    if (isCreator) {
      return null;
    }
    
    // Não mostrar formulário se não for torneio com inscrições abertas
    if (tournamentStatus !== 'open_registration') {
      return (
        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <p className="text-gray-700">
            {tournamentStatus === 'in_progress' 
              ? 'Este torneio já está em andamento. Não é possível realizar novas inscrições.'
              : 'Este torneio está finalizado. Não é possível realizar novas inscrições.'}
          </p>
        </div>
      );
    }
    
    // Verificar se o usuário já se inscreveu
    if (hasRegistered()) {
      const registration = registrations.find(reg => 
        userTeams.some(team => team.id === reg.team_id)
      );
      
      if (!registration) return null;
      
      const teamName = userTeams.find(team => team.id === registration.team_id)?.name;
      
      return (
        <div className={`bg-${registration.status === 'pending' ? 'yellow' : registration.status === 'approved' ? 'green' : 'red'}-100 p-4 rounded-lg mb-6`}>
          <p className={`text-${registration.status === 'pending' ? 'yellow' : registration.status === 'approved' ? 'green' : 'red'}-700`}>
            {registration.status === 'pending' 
              ? `Sua equipe "${teamName}" está inscrita e aguardando aprovação.`
              : registration.status === 'approved'
              ? `Sua equipe "${teamName}" foi aprovada para participar deste torneio.`
              : `A inscrição da sua equipe "${teamName}" foi rejeitada.`}
          </p>
        </div>
      );
    }
    
    // Mostrar formulário de inscrição
    return (
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-2">Inscrever Equipe</h3>
        
        {userTeams.length === 0 ? (
          <p className="text-gray-700">Você não possui nenhuma equipe para inscrever.</p>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Selecione sua equipe:
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={registrationLoading}
              >
                <option value="">Selecione uma equipe</option>
                {userTeams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={registerTeam}
              disabled={registrationLoading || !selectedTeamId}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registrationLoading ? (
                <>
                  <Loader size={16} className="animate-spin inline mr-1" />
                  Inscrevendo...
                </>
              ) : (
                'Inscrever-se no Torneio'
              )}
            </button>
          </>
        )}
      </div>
    );
  };

  // Renderizar lista de inscrições aprovadas para todos os usuários
  const renderApprovedTeams = () => {
    const approvedRegistrations = registrations.filter(reg => reg.status === 'approved');
    
    if (approvedRegistrations.length === 0) {
      return (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Participantes do Torneio</h3>
          <p className="text-gray-500 py-4">Nenhuma equipe aprovada neste torneio ainda.</p>
        </div>
      );
    }
    
    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Participantes do Torneio</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {approvedRegistrations.map(reg => (
            <div 
              key={reg.id} 
              className="bg-white border border-gray-200 p-4 rounded-lg flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/visualizar-equipe/${reg.team_id}`)}
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center mr-3">
                  {reg.team?.logo_url ? (
                    <img 
                      src={reg.team.logo_url} 
                      alt={reg.team?.name} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-500 font-medium">{reg.team?.name?.charAt(0) || '?'}</span>
                  )}
                </div>
                <div>
                  <p className="font-medium">{reg.team?.name}</p>
                </div>
              </div>
              <ExternalLink size={16} className="text-gray-400" />
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Renderizar lista de inscrições (apenas para o criador)
  const renderRegistrationsList = () => {
    if (!isCreator) return null;
    
    const pendingRegistrations = registrations.filter(reg => reg.status === 'pending');
    const approvedRegistrations = registrations.filter(reg => reg.status === 'approved');
    const rejectedRegistrations = registrations.filter(reg => reg.status === 'rejected');
    
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">Gerenciar Inscrições</h3>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader size={24} className="animate-spin text-blue-600" />
          </div>
        ) : registrations.length === 0 ? (
          <p className="text-gray-500 py-4">Nenhuma equipe inscrita neste torneio.</p>
        ) : (
          <div className="space-y-6">
            {/* Inscrições pendentes */}
            {pendingRegistrations.length > 0 && (
              <div>
                <h4 className="text-md font-medium mb-2 text-yellow-700">Inscrições Pendentes</h4>
                <div className="space-y-2">
                  {pendingRegistrations.map(reg => (
                    <div key={reg.id} className="bg-yellow-50 p-3 rounded-lg flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center mr-3">
                          {reg.team?.logo_url ? (
                            <img 
                              src={reg.team.logo_url} 
                              alt={reg.team?.name} 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-500 font-medium">{reg.team?.name?.charAt(0) || '?'}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{reg.team?.name}</p>
                          <p className="text-xs text-gray-500">
                            Inscrito em: {new Date(reg.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateRegistrationStatus(reg.id, 'approved')}
                          className="p-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200"
                          title="Aprovar"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => updateRegistrationStatus(reg.id, 'rejected')}
                          className="p-1.5 bg-red-100 text-red-700 rounded-full hover:bg-red-200"
                          title="Rejeitar"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Inscrições aprovadas */}
            {approvedRegistrations.length > 0 && (
              <div>
                <h4 className="text-md font-medium mb-2 text-green-700">Equipes Aprovadas</h4>
                <div className="space-y-2">
                  {approvedRegistrations.map(reg => (
                    <div key={reg.id} className="bg-green-50 p-3 rounded-lg flex items-center justify-between">
                      <div 
                        className="flex items-center cursor-pointer flex-grow"
                        onClick={() => navigate(`/visualizar-equipe/${reg.team_id}`)}
                      >
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center mr-3">
                          {reg.team?.logo_url ? (
                            <img 
                              src={reg.team.logo_url} 
                              alt={reg.team?.name} 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-500 font-medium">{reg.team?.name?.charAt(0) || '?'}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{reg.team?.name}</p>
                          <p className="text-xs text-gray-500">
                            Aprovado em: {reg.updated_at ? new Date(reg.updated_at).toLocaleDateString('pt-BR') : 'Não informado'}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateRegistrationStatus(reg.id, 'rejected')}
                          className="p-1.5 bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200"
                          title="Desativar equipe"
                        >
                          <X size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRegistration(reg.id);
                          }}
                          className="p-1.5 bg-red-100 text-red-700 rounded-full hover:bg-red-200"
                          title="Remover equipe do torneio"
                        >
                          <AlertCircle size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Inscrições rejeitadas */}
            {rejectedRegistrations.length > 0 && (
              <div>
                <h4 className="text-md font-medium mb-2 text-red-700">Inscrições Rejeitadas</h4>
                <div className="space-y-2">
                  {rejectedRegistrations.map(reg => (
                    <div key={reg.id} className="bg-red-50 p-3 rounded-lg flex items-center justify-between">
                      <div 
                        className="flex items-center cursor-pointer flex-grow"
                        onClick={() => navigate(`/visualizar-equipe/${reg.team_id}`)}
                      >
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center mr-3">
                          {reg.team?.logo_url ? (
                            <img 
                              src={reg.team.logo_url} 
                              alt={reg.team?.name} 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-500 font-medium">{reg.team?.name?.charAt(0) || '?'}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{reg.team?.name}</p>
                          <p className="text-xs text-gray-500">
                            Rejeitado em: {reg.updated_at ? new Date(reg.updated_at).toLocaleDateString('pt-BR') : 'Não informado'}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateRegistrationStatus(reg.id, 'approved')}
                          className="p-1.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200"
                          title="Aprovar equipe"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRegistration(reg.id);
                          }}
                          className="p-1.5 bg-red-100 text-red-700 rounded-full hover:bg-red-200"
                          title="Remover inscrição"
                        >
                          <AlertCircle size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {renderMessage()}
      {renderStatusButtons()}
      {renderRegistrationForm()}
      {isCreator ? renderRegistrationsList() : null}
      {renderApprovedTeams()}
    </div>
  );
};

export default TournamentRegistrationManager;
