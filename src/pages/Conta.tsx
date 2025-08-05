import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, CreditCard, User } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { getUserByAuthId, updateUser } from '../services/userService';
import { manageUserSubAccount } from '../services/openpixService';

interface FormData {
  name: string;
  email: string;
  openpix_pix_key: string;
  openpix_pix_key_type: 'EMAIL' | 'CPF' | 'CNPJ' | 'PHONE' | 'RANDOM';
}

const Conta: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('account');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    openpix_pix_key: '',
    openpix_pix_key_type: 'EMAIL',
  });

  // Detectar parâmetro tab da URL e definir aba ativa
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'payment') {
      setActiveTab('payment');
    } else if (tabParam === 'account') {
      setActiveTab('account');
    }
  }, [searchParams]);

  // Carregar dados do usuário
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const data = await getUserByAuthId(user.id);
        
        if (data) {
          setUserData(data);
          setFormData({
            name: data.name || '',
            email: data.email || '',
            openpix_pix_key: (data as any).openpix_pix_key || '',
            openpix_pix_key_type: (data as any).openpix_pix_key_type || 'EMAIL',
          });
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        setMessage({ type: 'error', text: 'Erro ao carregar dados do usuário' });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validatePixKey = (key: string, type: string): boolean => {
    if (!key.trim()) return false;

    switch (type) {
      case 'EMAIL':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key);
      case 'CPF':
        // Aceita CPF com ou sem formatação
        const cpfNumbers = key.replace(/\D/g, '');
        return cpfNumbers.length === 11;
      case 'CNPJ':
        // Aceita CNPJ com ou sem formatação
        const cnpjNumbers = key.replace(/\D/g, '');
        return cnpjNumbers.length === 14;
      case 'PHONE':
        // Aceita telefone com ou sem formatação, com ou sem +55
        const phoneNumbers = key.replace(/\D/g, '');
        return phoneNumbers.length >= 10 && phoneNumbers.length <= 13;
      case 'RANDOM':
        return key.length >= 32;
      default:
        return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userData?.id) {
      setMessage({ type: 'error', text: 'Dados do usuário não encontrados' });
      return;
    }

    // Validar chave Pix apenas se for técnico e tiver chave informada
    if (userData.role === 'tecnico' && formData.openpix_pix_key) {
      if (!validatePixKey(formData.openpix_pix_key, formData.openpix_pix_key_type)) {
        setMessage({ 
          type: 'error', 
          text: `Chave Pix inválida para o tipo ${formData.openpix_pix_key_type}` 
        });
        return;
      }
    }

    try {
      setSaving(true);
      setMessage(null);

      // Preparar dados básicos para atualização (sem chave Pix ainda)
      const basicUpdates: any = {
        name: formData.name,
      };

      // Se for técnico e tiver chave Pix, PRIMEIRO criar subconta OpenPix
      if (userData.role === 'tecnico' && formData.openpix_pix_key) {
        try {
          console.log('[Conta] Iniciando criação de subconta OpenPix...');
          const result = await manageUserSubAccount(
            userData.id, // Usar o ID do usuário como nome da subconta
            formData.openpix_pix_key,
            formData.openpix_pix_key_type
          );
          console.log('[Conta] Subconta OpenPix criada com sucesso:', result);
          
          // SÓ AGORA adicionar os campos Pix aos dados para salvar no banco
          basicUpdates.openpix_pix_key = formData.openpix_pix_key;
          basicUpdates.openpix_pix_key_type = formData.openpix_pix_key_type;
        } catch (err) {
          console.error('[Conta] Erro ao gerenciar subconta OpenPix:', err);
          
          // Extrair mensagem de erro da API OpenPix
          let errorMessage = 'Erro ao configurar chave Pix';
          
          if (err instanceof Error) {
            const errorText = err.message;
            
            // Verificar se é um erro de chave Pix inválida
            if (errorText.includes('Chave Pix Inválida') || errorText.includes('Invalid Pix Key')) {
              errorMessage = 'Chave Pix inválida. Verifique o formato da chave.';
            }
            // Verificar se é erro de resposta vazia (chave duplicada)
            else if (errorText.includes('Falha ao cadastrar a chave, Tente novamente mais tarde')) {
              errorMessage = 'Falha ao cadastrar a chave, Tente novamente mais tarde. Isso pode ser por conta de que já houve registro dessa chave mais de uma vez';
            }
            // Verificar outros erros comuns da OpenPix
            else if (errorText.includes('400')) {
              if (errorText.includes('error')) {
                try {
                  // Tentar extrair a mensagem de erro do JSON
                  const match = errorText.match(/\{"error":"([^"]+)"\}/);
                  if (match && match[1]) {
                    errorMessage = match[1];
                  }
                } catch {
                  errorMessage = 'Dados inválidos para a chave Pix';
                }
              } else {
                errorMessage = 'Dados inválidos para a chave Pix';
              }
            }
            else if (errorText.includes('401') || errorText.includes('403')) {
              errorMessage = 'Erro de autenticação com OpenPix. Verifique as configurações.';
            }
            else if (errorText.includes('500')) {
              errorMessage = 'Erro interno do servidor OpenPix. Tente novamente mais tarde.';
            }
            else {
              // Usar a mensagem original se não conseguir categorizar
              errorMessage = errorText;
            }
          }
          
          // Mostrar erro específico da subconta OpenPix
          setMessage({ 
            type: 'error', 
            text: `Erro na configuração de pagamento: ${errorMessage}` 
          });
          setSaving(false);
          return; // Parar execução se houver erro na subconta
        }
      }

      // AGORA sim, atualizar dados do usuário no banco (com ou sem chave Pix)
      const updatedUser = await updateUser(userData.id, basicUpdates);

      if (!updatedUser) {
        throw new Error('Não foi possível atualizar os dados');
      }

      // Atualizar dados locais
      setUserData((prev: any) => ({ ...prev, ...basicUpdates }));
      
      // Atualizar cache
      const cachedUserData = localStorage.getItem(`user_data_${user?.id}`);
      if (cachedUserData && user?.id) {
        const userData = JSON.parse(cachedUserData);
        const updatedCacheData = {
          ...userData,
          ...basicUpdates,
          cacheTime: Date.now()
        };
        localStorage.setItem(`user_data_${user.id}`, JSON.stringify(updatedCacheData));
      }

      setMessage({ type: 'success', text: 'Dados atualizados com sucesso!' });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Erro ao salvar dados' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Minha Conta</h1>
          <p className="text-gray-600">Gerencie suas informações pessoais e configurações de pagamento</p>
        </div>

        {/* Mensagem de feedback */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('account')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'account'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User size={18} />
                  Informações Pessoais
                </div>
              </button>
              {userData?.role === 'tecnico' && (
                <button
                  onClick={() => setActiveTab('payment')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'payment'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard size={18} />
                    Configurações de Pagamento
                  </div>
                </button>
              )}
            </nav>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="Digite seu nome completo"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                        placeholder="Email não pode ser alterado"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        O email não pode ser alterado após o cadastro
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-medium text-blue-900">Informações do Perfil</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            <strong>Tipo de Usuário:</strong> {userData?.role === 'tecnico' ? 'Técnico' : userData?.role === 'admin' ? 'Administrador' : 'Usuário'}
                          </p>
                          {userData?.role === 'tecnico' && (
                            <p className="text-sm text-blue-700 mt-1">
                              Como técnico, você pode configurar suas informações de pagamento na aba "Configurações de Pagamento".
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payment' && userData?.role === 'tecnico' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações OpenPix</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Configure sua chave Pix para receber pagamentos das vendas em sua loja.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="openpix_pix_key_type" className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo da Chave Pix *
                      </label>
                      <select
                        id="openpix_pix_key_type"
                        name="openpix_pix_key_type"
                        value={formData.openpix_pix_key_type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="EMAIL">Email</option>
                        <option value="CPF">CPF</option>
                        <option value="CNPJ">CNPJ</option>
                        <option value="PHONE">Telefone</option>
                        <option value="RANDOM">Chave Aleatória</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="openpix_pix_key" className="block text-sm font-medium text-gray-700 mb-2">
                        Chave Pix *
                      </label>
                      <input
                        type="text"
                        id="openpix_pix_key"
                        name="openpix_pix_key"
                        value={formData.openpix_pix_key}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder={
                          formData.openpix_pix_key_type === 'EMAIL' ? 'exemplo@email.com' :
                          formData.openpix_pix_key_type === 'CPF' ? '000.000.000-00' :
                          formData.openpix_pix_key_type === 'CNPJ' ? '00.000.000/0000-00' :
                          formData.openpix_pix_key_type === 'PHONE' ? '(11) 99999-9999' :
                          'Chave aleatória de 32 caracteres'
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-medium text-yellow-900">Importante sobre a Chave Pix</h4>
                          <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                            <li>• A chave Pix será usada para receber pagamentos das vendas em sua loja</li>
                            <li>• Ao salvar, uma subconta será criada automaticamente no sistema OpenPix</li>
                            <li>• Certifique-se de que a chave Pix está correta e ativa em sua conta bancária</li>
                            <li>• Você pode alterar a chave Pix a qualquer momento</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex justify-end pt-6 border-t border-gray-200 mt-8">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Conta;
