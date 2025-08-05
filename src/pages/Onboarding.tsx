import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserByAuthId, createUserFromAuth } from '../services/userService';
import { User, Trophy, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Onboarding: React.FC = () => {
  const { user, updateOnboardingCache } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const userChecked = useRef(false);

  useEffect(() => {
    const checkAndCreateUser = async () => {
      if (user && !userChecked.current) {
        try {
          setInitialLoading(true);
          const userRecord = await getUserByAuthId(user.id);
          
          if (!userRecord) {
            console.log('Usuário não encontrado na tabela users, criando...');
            await createUserFromAuth(user);
          }
          userChecked.current = true;
        } catch (err) {
          console.error('Erro ao verificar/criar usuário:', err);
          setError('Ocorreu um erro ao carregar seu perfil. Por favor, recarregue a página.');
        } finally {
          setInitialLoading(false);
        }
      }
    };
    
    // Reset o estado quando o usuário mudar
    if (!user) {
      userChecked.current = false;
      setSelectedRole(null);
      setError(null);
    }
    
    checkAndCreateUser();
  }, [user]);

  const handleRoleSelection = async () => {
    if (!selectedRole || !user) {
      setError('Por favor, selecione um tipo de perfil para continuar.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let roleValue: 'admin' | 'atleta' | 'fa' | 'tecnico';
      
      switch (selectedRole) {
        case 'atleta':
          roleValue = 'atleta';
          break;
        case 'tecnico':
          roleValue = 'tecnico';
          break;
        case 'fa':
          roleValue = 'fa';
          break;
        default:
          roleValue = 'fa'; 
      }

      const userRecord = await getUserByAuthId(user.id);
      let updatedUser;

      if (!userRecord) {
        console.log('Criando novo usuário...');
        const { data, error } = await supabase
          .from('users')
          .insert({
            auth_user_id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
            role: roleValue,
            onboarding: true,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (error) throw error;
        updatedUser = data;
        console.log('Usuário criado com sucesso:', updatedUser);
      } else {
        console.log('Atualizando usuário existente...');
        const { data, error } = await supabase
          .from('users')
          .update({ 
            role: roleValue,
            onboarding: true 
          })
          .eq('id', userRecord.id)
          .select()
          .single();
          
        if (error) throw error;
        updatedUser = data;
        console.log('Usuário atualizado com sucesso:', updatedUser);
      }

      // Garantir que o usuário foi atualizado antes de prosseguir
      if (!updatedUser) {
        throw new Error('Falha ao atualizar usuário');
      }

      // Atualizar o cache e redirecionar em sequência
      console.log('Atualizando cache e redirecionando...');
      updateOnboardingCache(user.id, true);
      
      // Aguardar um momento para garantir que o estado foi atualizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Forçar o redirecionamento
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      setError('Ocorreu um erro ao salvar seu perfil. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    {
      id: 'atleta',
      title: 'Atleta',
      description: 'Participe de torneios e acompanhe suas estatísticas',
      icon: <User size={40} />
    },
    {
      id: 'tecnico',
      title: 'Técnico',
      description: 'Gerencie sua equipe e acompanhe o desempenho dos atletas',
      icon: <Trophy size={40} />
    },
    {
      id: 'fa',
      title: 'Fã',
      description: 'Acompanhe seus atletas e equipes favoritas',
      icon: <Heart size={40} />
    }
  ];

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Carregando...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-8">
          Bem-vindo ao ProHero Sports!
        </h1>
        
        <p className="text-center text-gray-600 mb-8">
          Para personalizar sua experiência, por favor selecione o tipo de perfil que melhor descreve você:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {roleOptions.map((option) => (
            <div 
              key={option.id}
              className={`
                border-2 rounded-lg p-6 flex flex-col items-center text-center cursor-pointer transition-all duration-200
                ${selectedRole === option.id 
                  ? 'border-green-500 bg-green-50 transform scale-105' 
                  : 'border-gray-200 hover:border-green-300 hover:bg-green-50'}
              `}
              onClick={() => setSelectedRole(option.id)}
            >
              <div className={`mb-4 ${selectedRole === option.id ? 'text-green-500' : 'text-gray-700'}`}>
                {option.icon}
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${selectedRole === option.id ? 'text-green-600' : 'text-gray-800'}`}>
                {option.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {option.description}
              </p>
            </div>
          ))}
        </div>

        {error && (
          <div className="text-red-500 text-center mb-4">
            {error}
          </div>
        )}

        <div className="flex justify-center">
          <button
            className={`
              px-8 py-3 rounded-lg font-medium text-white transition-all duration-200
              ${loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : selectedRole 
                  ? 'bg-green-600 hover:bg-green-700 transform hover:scale-105' 
                  : 'bg-gray-400 cursor-not-allowed'}
            `}
            onClick={handleRoleSelection}
            disabled={loading || !selectedRole}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processando...
              </span>
            ) : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
