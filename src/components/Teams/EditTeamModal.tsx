import React, { useState, useEffect } from 'react';
import { X, Upload, Image, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import CitySelector from '../UI/CitySelector';

interface SportsOrganization {
  id: string;
  name: string;
  organization_type: string;
  modalidade_id: string | null;      // <--- adicionar este campo
  subcategoria_id: string | null;    // <--- adicionar este campo
  city: string;
  state: string;
  country: string;
  description: string;
  logo_url: string | null;
  capa_url: string | null;
  created_at: string;
  esporte_id: string | null;
}

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: SportsOrganization | null;
  onSuccess: () => void;
}

interface Sport {
  id: string;
  nome: string;
  ativo: boolean;
}

interface Modalidade {
  id: string;
  esporte_id: string;
  nome: string;
  jogadores_por_time: number;
  ativo: boolean;
}

interface Subcategoria {
  id: string;
  modalidade_id: string;
  nome: string;
  descricao?: string;
}

const EditTeamModal: React.FC<EditTeamModalProps> = ({ 
  isOpen, 
  onClose, 
  team, 
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    organization_type: '',
    modalidade_id: '',
    subcategoria_id: '',
    esporte_id: '',
    city: '',
    state: '',
    country: '',
    description: '',
    logo_url: '',
    capa_url: '',
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [sports, setSports] = useState<Sport[]>([]);
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);

  useEffect(() => {
    const fetchSports = async () => {
      const { data, error } = await supabase
        .from('esportes')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      if (!error && data) setSports(data);
    };
    if (team && isOpen) {
      setFormData({
        name: team.name,
        organization_type: team.organization_type,
        modalidade_id: team.modalidade_id || '',
        subcategoria_id: team.subcategoria_id || '',
        esporte_id: team.esporte_id || '',
        city: team.city,
        state: team.state,
        country: team.country,
        description: team.description,
        logo_url: team.logo_url || '',
        capa_url: team.capa_url || '',
      });
      setCoverPreview(team.capa_url);
      setLogoPreview(team.logo_url);
      setCoverFile(null);
      setLogoFile(null);
      setError(null);
      setSuccess(false);
      fetchSports();
    }
  }, [team, isOpen]);

  useEffect(() => {
    const fetchModalidades = async () => {
      if (!formData.organization_type) {
        setModalidades([]);
        return;
      }
      const esporte = sports.find(s => s.nome === formData.organization_type);
      if (!esporte) {
        setModalidades([]);
        return;
      }
      const { data, error } = await supabase
        .from('modalidades')
        .select('*')
        .eq('esporte_id', esporte.id)
        .eq('ativo', true)
        .order('nome');
      if (!error && data) setModalidades(data);
      else setModalidades([]);
    };
    fetchModalidades();
  }, [formData.organization_type, sports]);

  useEffect(() => {
    const fetchSubcategorias = async () => {
      if (!formData.modalidade_id) {
        setSubcategorias([]);
        return;
      }
      const { data, error } = await supabase
        .from('subcategorias')
        .select('*')
        .eq('modalidade_id', formData.modalidade_id)
        .order('nome');
      if (!error && data) setSubcategorias(data);
      else setSubcategorias([]);
    };
    fetchSubcategorias();
  }, [formData.modalidade_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      // Reset modalidade_id e subcategoria_id ao trocar o esporte
      if (name === 'organization_type') {
        return {
          ...prev,
          [name]: value,
          modalidade_id: '',
          subcategoria_id: '',
        };
      }
      // Reset subcategoria_id ao trocar modalidade
      if (name === 'modalidade_id') {
        return {
          ...prev,
          [name]: value,
          subcategoria_id: '',
        };
      }
      return {
        ...prev,
        [name]: value
      };
    });
  };

  const handleCityChange = (city: string, state: string) => {
    setFormData(prev => ({
      ...prev,
      city,
      state
    }));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadCover = async (): Promise<string | null> => {
    if (!coverFile) return null;
    
    try {
      // Fazer upload do arquivo no bucket "image"
      const fileExt = coverFile.name.split('.').pop();
      const fileName = `team-cover-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('image')
        .upload(filePath, coverFile);
        
      if (uploadError) {
        console.error('Erro ao fazer upload da capa:', uploadError);
        throw new Error('Não foi possível fazer upload da imagem de capa.');
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

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return null;
    
    try {
      // Fazer upload do arquivo no bucket "image"
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `team-logo-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('image')
        .upload(filePath, logoFile);
        
      if (uploadError) {
        console.error('Erro ao fazer upload do logo:', uploadError);
        throw new Error('Não foi possível fazer upload da imagem de logo.');
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
    if (!team) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Se tiver um arquivo de capa, fazer upload
      let capaUrl = formData.capa_url;
      if (coverFile) {
        try {
          const newCoverUrl = await uploadCover();
          if (newCoverUrl) {
            capaUrl = newCoverUrl;
          }
        } catch (uploadErr) {
          console.error('Erro no upload da capa:', uploadErr);
          // Continuar mesmo com erro no upload
        }
      }

      // Se tiver um arquivo de logo, fazer upload
      let logoUrl = formData.logo_url;
      if (logoFile) {
        try {
          const newLogoUrl = await uploadLogo();
          if (newLogoUrl) {
            logoUrl = newLogoUrl;
          }
        } catch (uploadErr) {
          console.error('Erro no upload do logo:', uploadErr);
          // Continuar mesmo com erro no upload
        }
      }

      const { error } = await supabase
        .from('sports_organizations')
        .update({
          name: formData.name,
          organization_type: formData.organization_type,
          modalidade_id: formData.modalidade_id || null,
          subcategoria_id: formData.subcategoria_id || null,
          esporte_id: formData.esporte_id || null,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          description: formData.description,
          logo_url: logoUrl,
          capa_url: capaUrl,
        })
        .eq('id', team.id);

      if (error) {
        console.error('Erro ao atualizar equipe:', error);
        throw new Error(error.message);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Erro ao atualizar equipe:', err);
      setError(err.message || 'Não foi possível atualizar a equipe. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !team) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 overflow-y-auto"
      style={{
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-8 max-h-[90vh] flex flex-col"
        style={{
          animation: 'slideDown 0.3s ease-out',
        }}
      >
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10 rounded-t-lg">
          <h2 className="text-xl font-semibold text-gray-800">Editar Equipe</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {loading && !success ? (
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
                  Equipe atualizada com sucesso!
                </div>
              )}

              <div className="mb-6">
                <div className="relative w-full">
                  <div className="w-full h-40 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                    {coverPreview ? (
                      <img 
                        src={coverPreview} 
                        alt="Imagem de capa" 
                        className="w-full h-full object-cover"
                        onError={() => setCoverPreview(null)}
                      />
                    ) : (
                      <div className="flex flex-col items-center text-gray-400">
                        <Image size={40} />
                        <p className="text-sm mt-2">Imagem de capa</p>
                      </div>
                    )}
                  </div>
                  <label 
                    htmlFor="cover-upload-edit" 
                    className="absolute bottom-2 right-2 bg-green-600 text-white p-2 rounded-full cursor-pointer hover:bg-green-700 transition-colors"
                  >
                    <Upload size={18} />
                  </label>
                  <input 
                    type="file" 
                    id="cover-upload-edit" 
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Nome da Equipe*
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Esporte*
                  </label>
                  <select
                    name="esporte_id"
                    value={formData.esporte_id}
                    onChange={e => {
                      const selectedId = e.target.value;
                      const selectedSport = sports.find(s => s.id === selectedId);
                      setFormData(prev => ({
                        ...prev,
                        esporte_id: selectedId,
                        organization_type: selectedSport ? selectedSport.nome : '',
                        modalidade_id: '',
                        subcategoria_id: '',
                      }));
                    }}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Selecione um esporte</option>
                    {sports.map((sport) => (
                      <option key={sport.id} value={sport.id}>{sport.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Modalidade*
                  </label>
                  <select
                    name="modalidade_id"
                    value={formData.modalidade_id || ''}
                    onChange={handleChange}
                    required
                    disabled={!formData.organization_type || modalidades.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white disabled:bg-gray-100"
                  >
                    <option value="">{!formData.organization_type ? 'Selecione o esporte primeiro' : modalidades.length === 0 ? 'Nenhuma modalidade encontrada' : 'Selecione uma modalidade'}</option>
                    {modalidades.map((mod) => (
                      <option key={mod.id} value={mod.id}>{mod.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Subcategoria
                  </label>
                  <select
                    name="subcategoria_id"
                    value={formData.subcategoria_id || ''}
                    onChange={handleChange}
                    disabled={!formData.modalidade_id || subcategorias.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white disabled:bg-gray-100"
                  >
                    <option value="">{!formData.modalidade_id ? 'Selecione a modalidade primeiro' : subcategorias.length === 0 ? 'Nenhuma subcategoria encontrada' : 'Selecione uma subcategoria'}</option>
                    {subcategorias.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Cidade
                  </label>
                  <CitySelector
                    value={formData.city ? `${formData.city}, ${formData.state}` : ''}
                    onChange={handleCityChange}
                    placeholder="Selecione uma cidade"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Estado
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-100"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    País
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-100"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Logo da Equipe
                  </label>
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        {logoPreview ? (
                          <img 
                            src={logoPreview} 
                            alt="Logo" 
                            className="w-full h-full object-cover"
                            onError={() => setLogoPreview(null)}
                          />
                        ) : (
                          <User size={24} className="text-gray-400" />
                        )}
                      </div>
                      <label 
                        htmlFor="logo-upload-edit" 
                        className="absolute bottom-0 right-0 bg-green-600 text-white p-1 rounded-full cursor-pointer hover:bg-green-700 transition-colors"
                      >
                        <Upload size={12} />
                      </label>
                      <input 
                        type="file" 
                        id="logo-upload-edit" 
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500">
                        {logoFile ? "Logo será enviado ao salvar" : "Clique no ícone para fazer upload do logo"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Descrição
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
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
                  disabled={loading}
                  className={`
                    bg-green-600 text-white px-6 py-2 rounded-lg
                    ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}
                    transition-colors
                  `}
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
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

export default EditTeamModal;
