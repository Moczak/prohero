import React, { useState, useEffect } from 'react';
import { X, Upload, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { getUserByAuthId, updateUser } from '../../services/userService';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar_url: '',
    role: '',
    openpix_pix_key: '',
    openpix_pix_key_type: 'EMAIL',
    rua: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    numero: '',
    complemento: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'perfil' | 'endereco'>('perfil');

  // Função para formatar o tipo de perfil para exibição
  const formatRole = (role: string): string => {
    switch (role) {
      case 'tecnico':
        return 'Técnico';
      case 'atleta':
        return 'Atleta';
      case 'fa':
        return 'Fã';
      case 'admin':
        return 'Administrador';
      default:
        return role || 'Não definido';
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.id) {
        try {
          setLoading(true);
          const userData = await getUserByAuthId(user.id);
          
          if (userData) {
            setFormData({
              name: userData.name || '',
              email: userData.email || '',
              avatar_url: userData.avatar_url || '',
              role: userData.role || '',
              openpix_pix_key: (userData as any).openpix_pix_key || '',
              openpix_pix_key_type: (userData as any).openpix_pix_key_type || 'EMAIL',
              rua: (userData as any).rua || '',
              bairro: (userData as any).bairro || '',
              cidade: (userData as any).cidade || '',
              estado: (userData as any).estado || '',
              cep: (userData as any).cep || '',
              numero: (userData as any).numero || '',
              complemento: (userData as any).complemento || '',
            });
            
            if (userData.avatar_url) {
              setAvatarPreview(userData.avatar_url);
            }
          }
        } catch (err) {
          console.error('Erro ao buscar dados do usuário:', err);
          setError('Não foi possível carregar seus dados. Por favor, tente novamente.');
        } finally {
          setLoading(false);
        }
      }
    };

    if (isOpen) {
      fetchUserData();
    }
  }, [user, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null;
    
    try {
      // Fazer upload do arquivo no bucket "image"
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('image')
        .upload(filePath, avatarFile);
        
      if (uploadError) {
        console.error('Erro ao fazer upload do avatar:', uploadError);
        throw new Error('Não foi possível fazer upload da imagem.');
      }
      
      // Obter URL pública
      const { data } = supabase.storage
        .from('image')
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (error) {
      console.error('Erro no processo de upload:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      if (!user) throw new Error('Usuário não autenticado');
      
      const userData = await getUserByAuthId(user.id);
      if (!userData) throw new Error('Usuário não encontrado');
      
      let avatarUrl = formData.avatar_url;
      
      // Se tiver um novo avatar, fazer upload
      if (avatarFile) {
        try {
          const newAvatarUrl = await uploadAvatar();
          if (newAvatarUrl) {
            avatarUrl = newAvatarUrl;
          }
        } catch (uploadErr) {
          console.error('Erro no upload do avatar:', uploadErr);
          // Continuar mesmo com erro no upload
        }
      }
      
      // Validação dos campos de subconta
      if (formData.role === 'tecnico' && !formData.openpix_pix_key) {
        setError('Informe a chave Pix da subconta.');
        setLoading(false);
        return;
      }

      // Build updates object
      const updates: any = {
        name: formData.name,
        avatar_url: avatarUrl,
        rua: formData.rua,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado,
        cep: formData.cep,
        numero: formData.numero,
        complemento: formData.complemento,
      };
      if (formData.role === 'tecnico') {
        updates.openpix_pix_key = formData.openpix_pix_key;
        updates.openpix_pix_key_type = formData.openpix_pix_key_type;
      }
      // Atualizar dados do usuário usando o serviço
      const updatedUser = await updateUser(userData.id, updates);

      // Nota: A criação/atualização da subconta OpenPix agora é feita na página Conta
      
      if (!updatedUser) {
        throw new Error('Não foi possível atualizar o usuário');
      }
      
      // Atualizar cache
      const updatedUserData = {
        ...userData,
        name: formData.name,
        avatar_url: avatarUrl,
        cacheTime: Date.now()
      };
      
      localStorage.setItem(`user_data_${user.id}`, JSON.stringify(updatedUserData));
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        // Forçar recarregamento da página para atualizar os dados em todos os componentes
        window.location.reload();
      }, 1500);
      
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      setError(err.message || 'Não foi possível atualizar seu perfil. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      style={{
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        style={{
          animation: 'slideDown 0.3s ease-out',
        }}
      >
        <div className="flex justify-between items-center p-4 border-b rounded-t-lg">
          <h2 className="text-xl font-semibold text-gray-800">Editar Perfil</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {/* Tabs */}
          <div className="flex mb-6 border-b">
            <button
              type="button"
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'perfil' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'}`}
              onClick={() => setActiveTab('perfil')}
            >
              Perfil
            </button>
            <button
              type="button"
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'endereco' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'}`}
              onClick={() => setActiveTab('endereco')}
            >
              Endereço
            </button>
          </div>

          {loading && !error ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                  Perfil atualizado com sucesso!
                </div>
              )}

              {/* Conteúdo das abas */}
              {activeTab === 'perfil' && (
                <>
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        {avatarPreview ? (
                          <img 
                            src={avatarPreview} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                            onError={() => setAvatarPreview(null)}
                          />
                        ) : (
                          <User size={40} className="text-gray-400" />
                        )}
                      </div>
                      <label 
                        htmlFor="avatar-upload" 
                        className="absolute bottom-0 right-0 bg-green-600 text-white p-1 rounded-full cursor-pointer hover:bg-green-700 transition-colors"
                      >
                        <Upload size={16} />
                      </label>
                      <input 
                        type="file" 
                        id="avatar-upload" 
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Nome
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado.</p>
                  </div>
                  
                  {formData.role === 'tecnico' && (
                    <>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Tipo da Chave Pix (Subconta)
                        </label>
                        <select
                          name="openpix_pix_key_type"
                          value={formData.openpix_pix_key_type}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="EMAIL">Email</option>
                          <option value="PHONE">Telefone</option>
                          <option value="RANDOM_KEY">Chave Aleatória</option>
                          <option value="CPF">CPF</option>
                          <option value="CNPJ">CNPJ</option>
                        </select>
                      </div>

                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                          Chave Pix da Subconta
                        </label>
                        <input
                          type="text"
                          name="openpix_pix_key"
                          value={formData.openpix_pix_key}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="ex: email@dominio.com"
                        />
                      </div>
                    </>
                  )}

                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Tipo de Perfil
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600">
                      {formatRole(formData.role)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">O tipo de perfil foi definido durante o onboarding e não pode ser alterado.</p>
                  </div>
                </>
              )}

              {activeTab === 'endereco' && (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">Rua</label>
                    <input
                      type="text"
                      name="rua"
                      value={formData.rua}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">Número</label>
                    <input
                      type="text"
                      name="numero"
                      value={formData.numero}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">Bairro</label>
                    <input
                      type="text"
                      name="bairro"
                      value={formData.bairro}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">Cidade</label>
                    <input
                      type="text"
                      name="cidade"
                      value={formData.cidade}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">Estado</label>
                    <input
                      type="text"
                      name="estado"
                      value={formData.estado}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">CEP</label>
                    <input
                      type="text"
                      name="cep"
                      value={formData.cep}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-medium mb-2">Complemento</label>
                    <input
                      type="text"
                      name="complemento"
                      value={formData.complemento}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg mr-2 hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`
                    px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors
                    ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0;
            transform: translateY(-50px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}} />
    </div>
  );
};

export default EditProfileModal;
