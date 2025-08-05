import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, Check, Image, Loader2, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import CitySelector from '../UI/CitySelector';
import '../../styles/scrollbar.css';

interface AddLeagueTournamentModalProps {
  type: 'league' | 'tournament';
  onClose: () => void;
  onSuccess: () => void;
}

const AddLeagueTournamentModal: React.FC<AddLeagueTournamentModalProps> = ({ 
  type, 
  onClose, 
  onSuccess 
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState(type === 'league' ? 'home_away' : 'knockout');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [participantsNumber, setParticipantsNumber] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState('open_registration');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Estado para controlar o progresso de upload
  const [uploadProgress, setUploadProgress] = useState<{cover: number, logo: number}>({ cover: 0, logo: 0 });
  
  // Componente de barra de progresso
  const ProgressBar = ({ progress }: { progress: number }) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
      <div 
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Opções de formato
  const leagueFormats = [
    { value: 'home_away', label: 'Ida e Volta' },
    { value: 'single', label: 'Turno Único' }
  ];
  
  const tournamentFormats = [
    { value: 'knockout', label: 'Eliminatório' },
    { value: 'points', label: 'Pontos Corridos' },
    { value: 'group_stage', label: 'Fase de Grupos' },
    { value: 'mixed', label: 'Misto (Grupos + Eliminatórias)' }
  ];
  
  // Opções de status (apenas para torneios)
  const statusOptions = [
    { value: 'open_registration', label: 'Inscrições Abertas' },
    { value: 'in_progress', label: 'Em Andamento' },
    { value: 'finished', label: 'Finalizado' }
  ];
  
  // Efeito para limpar mensagens de sucesso após 5 segundos
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);
  
  // Função para validar o formulário
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!name.trim()) {
      errors.name = 'O nome é obrigatório';
    }
    
    if (!startDate) {
      errors.startDate = 'A data de início é obrigatória';
    }
    
    if (!endDate) {
      errors.endDate = 'A data de término é obrigatória';
    } else if (startDate && new Date(startDate) > new Date(endDate)) {
      errors.endDate = 'A data de término deve ser posterior à data de início';
    }
    
    if (type === 'tournament' && !participantsNumber) {
      errors.participantsNumber = 'O número de participantes é obrigatório';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Função para lidar com o upload de imagem de capa
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImage(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para lidar com o upload de logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogo(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para fazer upload de uma imagem para o Supabase Storage
  const uploadImage = async (file: File, folder: string): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;
      
      // Fazer upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('league-tournament-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) {
        console.error('Erro no upload de imagem:', uploadError);
        throw new Error(`Falha no upload: ${uploadError.message}`);
      }
      
      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('league-tournament-images')
        .getPublicUrl(filePath);
        
      return publicUrl;
    } catch (error) {
      console.error('Erro no upload de imagem:', error);
      throw error;
    }
  };

  // Função para salvar a liga ou torneio
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validar formulário
      if (!validateForm()) {
        return;
      }
      
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      if (!user) {
        setError('Você precisa estar logado para criar uma liga ou torneio.');
        return;
      }
      
      // Upload de imagens (se fornecidas)
      let coverImageUrl = null;
      let logoUrl = null;
      
      try {
        if (coverImage) {
          console.log('Fazendo upload da imagem de capa...');
          setUploadProgress(prev => ({ ...prev, cover: 10 }));
          try {
            coverImageUrl = await uploadImage(coverImage, 'covers');
            setUploadProgress(prev => ({ ...prev, cover: 100 }));
            console.log('Upload da imagem de capa concluído:', coverImageUrl);
          } catch (coverError: any) {
            console.error('Erro no upload da imagem de capa:', coverError);
            setError(`Erro no upload da imagem de capa: Verifique se você tem permissão para acessar o bucket de armazenamento.`);
            setUploadProgress(prev => ({ ...prev, cover: 0 }));
            setLoading(false);
            return;
          }
        }
        
        if (logo) {
          console.log('Fazendo upload do logo...');
          setUploadProgress(prev => ({ ...prev, logo: 10 }));
          try {
            logoUrl = await uploadImage(logo, 'logos');
            setUploadProgress(prev => ({ ...prev, logo: 100 }));
            console.log('Upload do logo concluído:', logoUrl);
          } catch (logoError: any) {
            console.error('Erro no upload do logo:', logoError);
            setError(`Erro no upload do logo: Verifique se você tem permissão para acessar o bucket de armazenamento.`);
            setUploadProgress(prev => ({ ...prev, logo: 0 }));
            setLoading(false);
            return;
          }
        }
      } catch (uploadError: any) {
        console.error('Erro durante o upload de imagens:', uploadError);
        setError(`Erro ao fazer upload das imagens: Verifique se você tem permissão para acessar o bucket de armazenamento.`);
        setUploadProgress({ cover: 0, logo: 0 });
        setLoading(false);
        return;
      }
      
      // Dados comuns para ligas e torneios
      const commonData = {
        name,
        description,
        format,
        start_date: startDate,
        end_date: endDate,
        location,
        city,
        state,
        cover_image_url: coverImageUrl,
        logo_url: logoUrl,
        created_by: user.id
      };
      
      console.log(`Salvando ${type === 'league' ? 'liga' : 'torneio'} no banco de dados:`, commonData);
      
      // Salvar no banco de dados
      if (type === 'league') {
        const { error: insertError, data: insertedData } = await supabase
          .from('leagues')
          .insert([commonData])
          .select();
          
        if (insertError) {
          console.error('Erro ao inserir liga:', insertError);
          throw insertError;
        }
        
        console.log('Liga criada com sucesso:', insertedData);
      } else {
        const { error: insertError, data: insertedData } = await supabase
          .from('tournaments')
          .insert([{
            ...commonData,
            participants_number: participantsNumber,
            status
          }])
          .select();
          
        if (insertError) {
          console.error('Erro ao inserir torneio:', insertError);
          throw insertError;
        }
        
        console.log('Torneio criado com sucesso:', insertedData);
      }
      
      // Exibir mensagem de sucesso
      setSuccess(`${type === 'league' ? 'Liga' : 'Torneio'} criado com sucesso!`);
      
      // Limpar formulário
      setName('');
      setDescription('');
      setFormat(type === 'league' ? 'home_away' : 'knockout');
      setStartDate('');
      setEndDate('');
      setLocation('');
      setParticipantsNumber(undefined);
      setCoverImage(null);
      setCoverImagePreview(null);
      setLogo(null);
      setLogoPreview(null);
      setUploadProgress({ cover: 0, logo: 0 });
      
      // Notificar sucesso
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      console.error(`Erro ao criar ${type === 'league' ? 'liga' : 'torneio'}:`, err);
      
      // Mensagem de erro mais detalhada
      let errorMessage = `Não foi possível criar ${type === 'league' ? 'a liga' : 'o torneio'}.`;
      
      if (err.message) {
        if (err.message.includes('duplicate key')) {
          errorMessage = 'Já existe uma ' + (type === 'league' ? 'liga' : 'torneio') + ' com este nome.';
        } else if (err.message.includes('permission denied')) {
          errorMessage = 'Você não tem permissão para criar ' + (type === 'league' ? 'ligas' : 'torneios') + '.';
        } else {
          errorMessage += ' ' + err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col h-[70vh] max-h-[70vh] bg-white rounded-xl overflow-hidden">
      {/* Cabeçalho fixo */}
      <div className="sticky top-0 bg-white z-10 pb-2 border-b border-gray-200 rounded-t-xl">
        <div className="flex items-center justify-between mb-2 px-6 pt-4">
          <h2 className="text-xl font-bold">
            {type === 'league' ? 'Adicionar Nova Liga' : 'Adicionar Novo Torneio'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-6 mb-4 flex items-start">
            <AlertCircle className="mr-2 mt-0.5 flex-shrink-0" size={18} />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mx-6 mb-4 flex items-start">
            <Check className="mr-2 mt-0.5 flex-shrink-0" size={18} />
            <span>{success}</span>
          </div>
        )}
      </div>
      
      {/* Conteúdo scrollable */}
      <div className="overflow-y-auto flex-grow custom-scrollbar">
        <form id="leagueTournamentForm" onSubmit={handleSubmit}>
        <div className="space-y-6 px-6 py-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome*
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (formErrors.name) {
                  setFormErrors(prev => ({ ...prev, name: '' }));
                }
              }}
              className={`w-full px-3 py-2 border ${formErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder={`Nome ${type === 'league' ? 'da liga' : 'do torneio'}`}
              required
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
            )}
          </div>
          
          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descrição detalhada"
              rows={3}
            />
          </div>
          
          {/* Imagem de Capa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imagem de Capa
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              {coverImagePreview ? (
                <div className="relative w-full">
                  <img 
                    src={coverImagePreview} 
                    alt="Preview" 
                    className="mx-auto h-32 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverImage(null);
                      setCoverImagePreview(null);
                      setUploadProgress(prev => ({ ...prev, cover: 0 }));
                    }}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={16} />
                  </button>
                  {uploadProgress.cover > 0 && uploadProgress.cover < 100 && (
                    <ProgressBar progress={uploadProgress.cover} />
                  )}
                </div>
              ) : (
                <div className="space-y-1 text-center">
                  <div className="flex flex-col items-center text-sm text-gray-600">
                    <Image className="mb-2 text-gray-400" size={32} />
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                      <span>Carregar imagem</span>
                      <input 
                        type="file" 
                        className="sr-only" 
                        accept="image/*"
                        onChange={handleCoverImageChange}
                      />
                    </label>
                    <p className="pl-1 mt-1">ou arraste e solte</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF até 10MB</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              {logoPreview ? (
                <div className="relative">
                  <img 
                    src={logoPreview} 
                    alt="Preview" 
                    className="mx-auto h-24 w-24 object-cover rounded-full"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setLogo(null);
                      setLogoPreview(null);
                      setUploadProgress(prev => ({ ...prev, logo: 0 }));
                    }}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={16} />
                  </button>
                  {uploadProgress.logo > 0 && uploadProgress.logo < 100 && (
                    <ProgressBar progress={uploadProgress.logo} />
                  )}
                </div>
              ) : (
                <div className="space-y-1 text-center">
                  <div className="flex flex-col items-center text-sm text-gray-600">
                    <Image className="mb-2 text-gray-400" size={24} />
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                      <span>Carregar logo</span>
                      <input 
                        type="file" 
                        className="sr-only" 
                        accept="image/*"
                        onChange={handleLogoChange}
                      />
                    </label>
                    <p className="pl-1 mt-1">ou arraste e solte</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF até 5MB</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Formato */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Formato*
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {(type === 'league' ? leagueFormats : tournamentFormats).map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Início*
              </label>
              <div className="relative">
                <div className="flex items-center">
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (formErrors.startDate) {
                        setFormErrors(prev => ({ ...prev, startDate: '' }));
                      }
                    }}
                    className={`w-full px-3 py-2 border ${formErrors.startDate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                    onClick={(e) => {
                      // Garantir que o clique abra o seletor de data
                      const input = e.currentTarget;
                      input.showPicker();
                    }}
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-2.5 cursor-pointer bg-transparent border-none"
                    onClick={() => {
                      const input = document.getElementById('startDate') as HTMLInputElement;
                      if (input) input.showPicker();
                    }}
                  >
                    <Calendar className="text-gray-400" size={18} />
                  </button>
                </div>
              </div>
              {formErrors.startDate && (
                <p className="mt-1 text-sm text-red-600">{formErrors.startDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Término*
              </label>
              <div className="relative">
                <div className="flex items-center">
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      if (formErrors.endDate) {
                        setFormErrors(prev => ({ ...prev, endDate: '' }));
                      }
                    }}
                    className={`w-full px-3 py-2 border ${formErrors.endDate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                    onClick={(e) => {
                      // Garantir que o clique abra o seletor de data
                      const input = e.currentTarget;
                      input.showPicker();
                    }}
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-2.5 cursor-pointer bg-transparent border-none"
                    onClick={() => {
                      const input = document.getElementById('endDate') as HTMLInputElement;
                      if (input) input.showPicker();
                    }}
                  >
                    <Calendar className="text-gray-400" size={18} />
                  </button>
                </div>
              </div>
              {formErrors.endDate && (
                <p className="mt-1 text-sm text-red-600">{formErrors.endDate}</p>
              )}
            </div>
          </div>
          
          {/* Localização */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Localização
            </label>
            <div className="relative">
              <CitySelector
                value={location}
                onChange={(cityName, stateAbbr) => {
                  setCity(cityName);
                  setState(stateAbbr);
                  setLocation(cityName && stateAbbr ? `${cityName}, ${stateAbbr}` : '');
                }}
                className="w-full"
                placeholder="Selecione uma cidade"
              />
              <MapPin className="absolute left-3 top-2.5 text-gray-400 pointer-events-none hidden" size={18} />
            </div>
            <p className="mt-1 text-xs text-gray-500">Selecione a cidade onde a liga/torneio será realizado</p>
          </div>
          
          {/* Campos específicos para torneios */}
          {type === 'tournament' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Participantes*
                </label>
                <input
                  type="number"
                  value={participantsNumber || ''}
                  onChange={(e) => {
                    setParticipantsNumber(parseInt(e.target.value) || undefined);
                    if (formErrors.participantsNumber) {
                      setFormErrors(prev => ({ ...prev, participantsNumber: '' }));
                    }
                  }}
                  className={`w-full px-3 py-2 border ${formErrors.participantsNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Ex: 16"
                  min={2}
                  required
                />
                {formErrors.participantsNumber && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.participantsNumber}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status*
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
        
        </form>
      </div>
      
      {/* Botões fixos na parte inferior */}
      <div className="sticky bottom-0 bg-white pt-3 pb-3 border-t border-gray-200 z-10 rounded-b-xl">
        <div className="flex justify-end space-x-3 px-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="leagueTournamentForm"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                Salvando...
              </>
            ) : (
              <>
                <Check size={18} className="mr-2" />
                Salvar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddLeagueTournamentModal;
