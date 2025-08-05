import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { createUserFromAuth, createUserForService, getUserByAuthId } from '../services/userService';
import { translateError } from '../utils/errorTranslations';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('Processando autenticação...');
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('AuthCallback: Iniciando processamento');
        setStatus('Verificando autenticação...');
        
        // Obter o usuário atual
        const { data, error } = await supabase.auth.getUser();
        console.log('AuthCallback: Dados do usuário:', data);
        
        if (error) {
          console.error('AuthCallback: Erro ao obter usuário:', error);
          setError(`Erro na autenticação: ${translateError(error.message)}`);
          setStatus('Erro na autenticação');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        if (!data?.user) {
          console.error('AuthCallback: Usuário não encontrado');
          setError('Usuário não encontrado');
          setStatus('Usuário não encontrado');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        // Verificar se o usuário já existe no banco de dados
        const existingUser = await getUserByAuthId(data.user.id);
        const isNewRegistration = !existingUser;
        setIsNewUser(isNewRegistration);
        
        // Criar ou atualizar usuário na tabela users
        setStatus('Processando registro de usuário...');
        try {
          // Tenta primeiro com createUserFromAuth
          let userRecord = await createUserFromAuth(data.user);
          
          // Se falhar, tenta com createUserForService como fallback
          if (!userRecord) {
            userRecord = await createUserForService(data.user);
          }

          if (!userRecord) {
            throw new Error('Não foi possível criar o registro do usuário');
          }

          console.log('AuthCallback: Usuário processado com sucesso:', userRecord);

          // Redirecionar com base no status de onboarding
          if (isNewRegistration || userRecord.onboarding === false) {
            setStatus('Redirecionando para completar perfil...');
            navigate('/onboarding');
          } else {
            setStatus('Redirecionando para o dashboard...');
            navigate('/dashboard');
          }
        } catch (userError: any) {
          console.error('AuthCallback: Erro ao processar usuário:', userError);
          setError(`Aviso: ${translateError(userError.message) || 'Erro ao processar seu perfil'}`);
          setStatus('Autenticação concluída com avisos');
        }
      } catch (error: any) {
        console.error('AuthCallback: Erro geral:', error);
        setError(`Erro: ${translateError(error.message) || 'Ocorreu um erro desconhecido'}`);
        setStatus('Erro no processamento');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">{status}</h2>
        {error && (
          <p className="text-red-500 mt-2">{error}</p>
        )}
        <p className="text-gray-500 mt-2">
          {isNewUser 
            ? 'Você será redirecionado para completar seu perfil.' 
            : 'Você será redirecionado em instantes.'}
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
