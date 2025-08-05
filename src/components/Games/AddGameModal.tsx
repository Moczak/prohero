import React, { useState } from 'react';
import { X, MapPin, Image, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import CitySelector from '../UI/CitySelector';
import '../../styles/scrollbar.css';

interface AddGameModalProps {
  teamId: string;
  teamName: string;
  isOpen: boolean;
  onClose: () => void;
  onGameAdded: () => void;
  leagueTournamentId?: string;
}

const AddGameModal: React.FC<AddGameModalProps> = ({ 
  teamId, 
  teamName, 
  isOpen, 
  onClose, 
  onGameAdded,
  leagueTournamentId
}) => {
  const [formData, setFormData] = useState({
    opponent_name: '',
    game_date: '',
    game_time: '',
    location: '',
    city: '',
    state: '',
    home_game: true,
    score_team: '',
    score_opponent: '',
    game_status: 'scheduled',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Função para lidar com a seleção de cidade
  const handleCityChange = (city: string, state: string) => {
    setFormData(prev => ({
      ...prev,
      city,
      state,
      location: city ? `${city}, ${state}` : ''
    }));
  };

  // Função para lidar com a seleção de arquivo de logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para remover o logo selecionado
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  // Função para fazer upload do logo para o Supabase Storage
  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return null;
    
    try {
      setLoading(true);
      
      // Gerar um nome único para o arquivo usando timestamp
      const fileExt = logoFile.name.split('.').pop();
      const timestamp = new Date().getTime();
      const fileName = `opponent_${timestamp}.${fileExt}`;
      const filePath = `opponent-logos/${fileName}`;
      
      // Fazer upload do arquivo para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('game-images')
        .upload(filePath, logoFile);
        
      if (uploadError) throw uploadError;
      
      // Obter a URL pública do arquivo
      const { data } = supabase.storage
        .from('game-images')
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload do logo:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Fazer upload do logo se houver um arquivo selecionado
      let opponentLogoUrl = null;
      if (logoFile) {
        opponentLogoUrl = await uploadLogo();
      }

      // Combine date and time for database
      // Converter valores de placar para números inteiros se preenchidos
      const scoreTeam = formData.score_team ? parseInt(formData.score_team) : null;
      const scoreOpponent = formData.score_opponent ? parseInt(formData.score_opponent) : null;
      
      // Prepare the game data object
      const gameData: any = {
        opponent_name: formData.opponent_name,
        game_date: formData.game_date,
        game_time: formData.game_time,
        location: formData.location,
        city: formData.city,
        state: formData.state,
        home_game: formData.home_game,
        score_team: scoreTeam,
        score_opponent: scoreOpponent,
        game_status: formData.game_status,
        opponent_logo_url: opponentLogoUrl,
        notes: formData.notes
      };

      // Only add team_id if it's not empty
      if (teamId && teamId.trim() !== '') {
        gameData.team_id = teamId;
      }

      // Only add league_tournament_id if it's not empty
      if (leagueTournamentId && leagueTournamentId.trim() !== '') {
        gameData.league_tournament_id = leagueTournamentId;
      }
      
      const { error } = await supabase
        .from('games')
        .insert(gameData);

      if (error) throw error;

      // Clear form and notify parent
      setFormData({
        opponent_name: '',
        game_date: '',
        game_time: '',
        location: '',
        city: '',
        state: '',
        home_game: true,
        score_team: '',
        score_opponent: '',
        game_status: 'scheduled',
        notes: ''
      });
      
      onGameAdded();
      onClose();
    } catch (err: any) {
      console.error('Erro ao adicionar jogo:', err);
      setError('Não foi possível adicionar o jogo. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md flex flex-col h-[80vh] max-h-[80vh] overflow-hidden">
        {/* Cabeçalho fixo */}
        <div className="sticky top-0 z-10 bg-white border-b rounded-t-xl">
          <div className="flex justify-between items-center p-4">
            <h2 className="text-xl font-semibold">Adicionar Novo Jogo para {teamName}</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              type="button"
            >
              <X size={20} />
            </button>
          </div>
          
          {error && (
            <div className="mx-4 mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
              <AlertCircle className="mr-2 mt-0.5 flex-shrink-0" size={18} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Conteúdo scrollable */}
        <div className="overflow-y-auto flex-grow custom-scrollbar">
          <form id="addGameForm" onSubmit={handleSubmit} className="p-4">
            <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adversário
              </label>
              <input
                type="text"
                name="opponent_name"
                value={formData.opponent_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Nome do adversário"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data
                </label>
                <input
                  type="date"
                  name="game_date"
                  value={formData.game_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horário
                </label>
                <input
                  type="time"
                  name="game_time"
                  value={formData.game_time}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Local
              </label>
              <div className="flex items-center">
                <div className="flex-1">
                  <CitySelector
                    value={formData.city}
                    onChange={handleCityChange}
                    placeholder="Selecione a cidade do jogo"
                  />
                </div>
              </div>
              {formData.city && (
                <div className="mt-2 text-sm text-gray-600 flex items-center">
                  <MapPin size={14} className="mr-1" />
                  {formData.city}, {formData.state}
                </div>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="home_game"
                name="home_game"
                checked={formData.home_game}
                onChange={handleChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="home_game" className="ml-2 block text-sm text-gray-700">
                Jogo em casa
              </label>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placar (deixe em branco para jogos futuros)
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">
                    {teamName}
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="score_team"
                    value={formData.score_team}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                  />
                </div>
                <div className="text-xl font-bold text-gray-400">×</div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">
                    {formData.opponent_name || 'Adversário'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="score_opponent"
                    value={formData.score_opponent}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status do Jogo
              </label>
              <select
                name="game_status"
                value={formData.game_status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="scheduled">Agendado</option>
                <option value="in_progress">Em andamento</option>
                <option value="completed">Concluído</option>
                <option value="canceled">Cancelado</option>
                <option value="postponed">Adiado</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo do Oponente
              </label>
              <div className="mt-1 flex items-center">
                {logoPreview ? (
                  <div className="relative">
                    <img 
                      src={logoPreview} 
                      alt="Preview do logo" 
                      className="h-20 w-20 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      title="Remover logo"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-20 w-20 border-2 border-dashed border-gray-300 rounded-md">
                    <label htmlFor="logo-upload" className="cursor-pointer text-center p-2">
                      <Image className="mx-auto h-8 w-8 text-gray-400" />
                      <span className="mt-1 block text-xs text-gray-500">Logo</span>
                      <input
                        id="logo-upload"
                        name="logo"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleLogoChange}
                      />
                    </label>
                  </div>
                )}
                <div className="ml-4">
                  <div className="text-sm text-gray-500">
                    {!logoPreview ? (
                      <label htmlFor="logo-upload" className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 hover:text-blue-500">
                        <span>Carregar logo</span>
                      </label>
                    ) : (
                      <p>Logo carregado com sucesso!</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF até 5MB
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Observações adicionais sobre o jogo"
              />
            </div>

            </div>
          </form>
        </div>
        
        {/* Botões fixos na parte inferior */}
        <div className="sticky bottom-0 bg-white pt-3 pb-3 px-4 border-t border-gray-200 z-10 rounded-b-xl">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="addGameForm"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin mr-2" size={16} />
                  Salvando...
                </>
              ) : (
                'Salvar Jogo'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddGameModal;
