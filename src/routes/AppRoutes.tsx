import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import SignUp from '../pages/SignUp';
import AuthCallback from '../pages/AuthCallback';
import ResetPassword from '../pages/ResetPassword';
import Onboarding from '../pages/Onboarding';
import MinhaEquipe from '../pages/MinhaEquipe';
import AdicionarEquipe from '../pages/AdicionarEquipe';
import EquipeDetalhes from '../pages/EquipeDetalhes';
import VisualizarEquipe from '../pages/VisualizarEquipe';
import Calendario from '../pages/Calendario';
import LigasTorneios from '../pages/LigasTorneios';
import LigaTorneioDetalhes from '../pages/LigaTorneioDetalhes';
import Equipes from '../pages/Equipes';
import Loja from '../pages/Loja';
import LojaOnline from '../pages/LojaOnline';
import MeusPedidos from '../pages/MeusPedidos';
import MinhasVendas from '../pages/MinhasVendas';
import Conta from '../pages/Conta';
import { useAuth } from '../context/AuthContext';
import AdminLogin from '../pages/Admin/AdminLogin';
import AdminDashboard from '../pages/Admin/AdminDashboard';

const AppRoutes: React.FC = () => {
  const { user, loading, checkUserOnboarding } = useAuth();
  const [userOnboarding, setUserOnboarding] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  const checkAttempts = useRef(0);
  const onboardingChecked = useRef(false); // Novo ref para controlar se já verificamos o onboarding
  const navigate = useNavigate();

  useEffect(() => {
    // Reset quando o usuário mudar
    if (!user) {
      setUserOnboarding(null);
      checkAttempts.current = 0;
      onboardingChecked.current = false;
    }
  }, [user]);

  useEffect(() => {
    // Função para verificar o status de onboarding
    const checkOnboardingStatus = async () => {
      // Não verificar se:
      // 1. Não há usuário
      // 2. Já estamos verificando
      // 3. Já verificamos anteriormente
      // 4. Já excedemos o limite de tentativas
      // 5. Usuário está no dashboard ou onboarding
      if (!user || 
          checkingOnboarding || 
          onboardingChecked.current || 
          checkAttempts.current >= 3 ||
          window.location.pathname === '/dashboard' ||
          window.location.pathname === '/onboarding') {
        return;
      }
      
      setCheckingOnboarding(true);
      checkAttempts.current += 1;
      
      try {
        console.log(`AppRoutes: Verificando status de onboarding para ${user.id} (tentativa ${checkAttempts.current})`);
        const { onboarding, error } = await checkUserOnboarding(user.id);
        
        if (error) {
          console.error('AppRoutes: Erro ao verificar status de onboarding:', error);
          if (checkAttempts.current >= 3) {
            console.log('AppRoutes: Assumindo onboarding como true devido a erros persistentes');
            setUserOnboarding(true);
            onboardingChecked.current = true;
          }
        } else {
          setUserOnboarding(onboarding);
          onboardingChecked.current = true;
          
          // Redirecionar apenas se o usuário estiver na rota inicial
          if (onboarding === false && window.location.pathname === '/') {
            console.log('AppRoutes: Redirecionando para onboarding');
            navigate('/onboarding', { replace: true });
          } else if (onboarding === true && window.location.pathname === '/') {
            console.log('AppRoutes: Redirecionando para dashboard');
            navigate('/dashboard', { replace: true });
          }
        }
      } catch (error) {
        console.error('AppRoutes: Erro ao verificar status de onboarding:', error);
        if (checkAttempts.current >= 3) {
          console.log('AppRoutes: Assumindo onboarding como true devido a erros persistentes');
          setUserOnboarding(true);
          onboardingChecked.current = true;
        }
      } finally {
        setCheckingOnboarding(false);
      }
    };

    // Executar a verificação apenas quando necessário
    if (user && !onboardingChecked.current) {
      checkOnboardingStatus();
    }
  }, [user, checkUserOnboarding, navigate]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Carregando...</h2>
        </div>
      </div>
    );
  }

  // Se ainda estamos verificando o onboarding mas já temos o usuário, mostrar um estado de carregamento
  // Não mostrar loading se estiver no dashboard
  if (user && userOnboarding === null && !onboardingChecked.current && checkAttempts.current < 3 && window.location.pathname !== '/dashboard') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Verificando perfil...</h2>
          <p className="text-gray-500 mt-2">Aguarde um momento...</p>
        </div>
      </div>
    );
  }

  // Se após 3 tentativas ainda não temos o status de onboarding, assumir um valor padrão
  // Não assumir valor padrão se estiver no dashboard
  if (user && userOnboarding === null && checkAttempts.current >= 3 && window.location.pathname !== '/dashboard') {
    console.log('AppRoutes: Assumindo onboarding como true após múltiplas tentativas');
    setUserOnboarding(true);
    onboardingChecked.current = true;
  }

  // Se estiver no dashboard e não tiver status de onboarding definido, assumir como true
  if (user && userOnboarding === null && window.location.pathname === '/dashboard') {
    setUserOnboarding(true);
    onboardingChecked.current = true;
  }

  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={user ? <AdminDashboard /> : <Navigate to="/admin/login" replace />} />
      <Route 
        path="/login" 
        element={user ? <Navigate to={userOnboarding === false ? "/onboarding" : "/dashboard"} replace /> : <Login />} 
      />
      <Route 
        path="/signup" 
        element={user ? <Navigate to={userOnboarding === false ? "/onboarding" : "/dashboard"} replace /> : <SignUp />} 
      />
      <Route 
        path="/reset-password" 
        element={<ResetPassword />} 
      />
      <Route 
        path="/auth/callback" 
        element={<AuthCallback />} 
      />
      <Route 
        path="/onboarding" 
        element={
          user 
            ? userOnboarding === true 
              ? <Navigate to="/dashboard" replace /> 
              : <Onboarding />
            : <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/dashboard/*" 
        element={
          user 
            ? userOnboarding === false 
              ? <Navigate to="/onboarding" replace /> 
              : <Dashboard />
            : <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/minhaequipe" 
        element={
          user 
            ? userOnboarding === false 
              ? <Navigate to="/onboarding" replace /> 
              : <MinhaEquipe />
            : <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/minhaequipe/adicionar" 
        element={
          user 
            ? userOnboarding === false 
              ? <Navigate to="/onboarding" replace /> 
              : <AdicionarEquipe />
            : <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/equipe/:id" 
        element={
          user 
            ? userOnboarding === false 
              ? <Navigate to="/onboarding" replace /> 
              : <EquipeDetalhes />
            : <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/visualizar-equipe/:id" 
        element={
          user 
            ? userOnboarding === false 
              ? <Navigate to="/onboarding" replace /> 
              : <VisualizarEquipe />
            : <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/calendario" 
        element={<Calendario />} 
      />
      <Route 
        path="/ligastorneios" 
        element={
          user 
            ? userOnboarding === false 
              ? <Navigate to="/onboarding" replace /> 
              : <LigasTorneios />
            : <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/meus-pedidos" 
        element={user ? <MeusPedidos /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/minhas-vendas" 
        element={user ? <MinhasVendas /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/conta" 
        element={
          user 
            ? userOnboarding === false 
              ? <Navigate to="/onboarding" replace /> 
              : <Conta />
            : <Navigate to="/login" replace />
        } 
      />

      <Route 
        path="/ligastorneios/:id" 
        element={
          user 
            ? userOnboarding === false 
              ? <Navigate to="/onboarding" replace /> 
              : <LigaTorneioDetalhes />
            : <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/equipes" 
        element={
          user 
            ? userOnboarding === false 
              ? <Navigate to="/onboarding" replace /> 
              : <Equipes />
            : <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/loja" 
        element={
          user 
            ? userOnboarding === false 
              ? <Navigate to="/onboarding" replace /> 
              : <Loja />
            : <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/loja-online" 
        element={
          user 
            ? userOnboarding === false 
              ? <Navigate to="/onboarding" replace /> 
              : <LojaOnline />
            : <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/" 
        element={<Navigate to={user ? (userOnboarding === false ? "/onboarding" : "/dashboard") : "/login"} replace />} 
      />
      <Route 
        path="*" 
        element={<Navigate to="/" replace />} 
      />
    </Routes>
  );
};

export default AppRoutes;
