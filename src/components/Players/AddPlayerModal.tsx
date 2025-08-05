import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayerAdded: () => void;
  teamId: string;
}

const AddPlayerModal: React.FC<AddPlayerModalProps> = ({ isOpen, onClose, onPlayerAdded, teamId }) => {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [number, setNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: Dados do jogador, 2: Dados de usuário

  // Resetar o formulário
  const resetForm = () => {
    setName('');
    setPosition('');
    setNumber('');
    setEmail('');
    setPassword('');
    setError(null);
    setStep(1);
  };

  // Fechar o modal
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Avançar para o próximo passo
  const handleNextStep = () => {
    // Validar dados do jogador
    if (!name.trim()) {
      setError('Nome do jogador é obrigatório');
      return;
    }
    if (!position.trim()) {
      setError('Posição do jogador é obrigatória');
      return;
    }
    if (!number.trim() || isNaN(Number(number))) {
      setError('Número da camisa deve ser um valor numérico');
      return;
    }

    setError(null);
    setStep(2);
  };

  // Voltar para o passo anterior
  const handlePreviousStep = () => {
    setStep(1);
    setError(null);
  };

  // Adicionar jogador
  const handleAddPlayer = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validar email e senha
      if (!email.trim() || !email.includes('@')) {
        setError('Email inválido');
        return;
      }
      if (!password.trim() || password.length < 6) {
        setError('Senha deve ter pelo menos 6 caracteres');
        return;
      }

      // Obter a sessão atual do administrador
      const { data: currentSession } = await supabase.auth.getSession();
      const adminToken = currentSession?.session?.access_token;
      
      if (!adminToken) {
        throw new Error('Sessão de administrador não encontrada');
      }

      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'atleta',
            onboarding_completed: true
          },
          emailRedirectTo: '' // Evita redirecionamento após confirmação de email
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar usuário');
      
      // Restaurar a sessão do administrador
      await supabase.auth.setSession({
        access_token: adminToken,
        refresh_token: currentSession?.session?.refresh_token || ''
      });

      // 2. Adicionar registro na tabela users com onboarding true
      const { error: userError } = await supabase
        .from('users')
        .insert({
          name,
          email,
          auth_user_id: authData.user.id,
          onboarding: true,
          role: 'atleta', // Valor atualizado conforme a nova restrição
          team_id: teamId
        });

      if (userError) throw userError;

      // 3. Adicionar jogador à tabela de players
      const { error: playerError } = await supabase
        .from('players')
        .insert({
          name,
          position,
          number: Number(number),
          user_id: authData.user.id,
          team_id: teamId,
          profile_type: 'athlete',
          active: true
        });

      if (playerError) throw playerError;

      // Sucesso
      onPlayerAdded();
      handleClose();
    } catch (err: any) {
      console.error('Erro ao adicionar jogador:', err);
      setError(err.message || 'Erro ao adicionar jogador. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">
            {step === 1 ? 'Adicionar Jogador' : 'Criar Conta de Usuário'}
          </h2>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {step === 1 ? (
            // Passo 1: Dados do jogador
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Jogador*
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Posição*
                </label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Selecione uma posição</option>
                  <option value="Goleiro">Goleiro</option>
                  <option value="Zagueiro">Zagueiro</option>
                  <option value="Lateral">Lateral</option>
                  <option value="Meio-campo">Meio-campo</option>
                  <option value="Atacante">Atacante</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número da Camisa*
                </label>
                <input
                  type="number"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Número"
                  min="1"
                  max="99"
                  required
                />
              </div>
            </div>
          ) : (
            // Passo 2: Dados de usuário
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email*
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="email@exemplo.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha*
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Mínimo de 6 caracteres"
                  minLength={6}
                  required
                />
              </div>

              <p className="text-sm text-gray-500 mt-2">
                Estas credenciais serão usadas pelo jogador para acessar o sistema.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between p-4 border-t bg-gray-50 rounded-b-lg">
          {step === 1 ? (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleNextStep}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={loading}
              >
                Próximo
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handlePreviousStep}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
                disabled={loading}
              >
                Voltar
              </button>
              <button
                onClick={handleAddPlayer}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={loading}
              >
                {loading ? 'Adicionando...' : 'Adicionar Jogador'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddPlayerModal;
