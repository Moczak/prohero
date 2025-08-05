import React, { useState, useEffect } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

interface Organization {
  id: string;
  name: string;
  logo_url?: string | null;
  description?: string | null;
  esporte_id?: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  price: number;
  stock: number;
  status: boolean;
  organization_id: string;
  organization: {
    name: string;
    logo_url: string | null;
  } | null;
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: (product: Product) => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onProductAdded }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Buscar organizações do usuário
  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!user) return;

      try {
        // Primeiro, buscar o ID do usuário na tabela users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, role')
          .eq('auth_user_id', user.id)
          .single();

        if (userError) throw userError;

        if (!userData) {
          setError('Usuário não encontrado.');
          return;
        }

        let orgs: Organization[] = [];

        // Buscar organizações esportivas do usuário baseado no papel
        if (userData.role === 'admin') {
          // Admins podem ver todas as organizações
          const { data: allOrgs, error: orgsError } = await supabase
            .from('sports_organizations')
            .select('id, name, logo_url, description, esporte_id')
            .order('name');

          if (orgsError) throw orgsError;
          orgs = allOrgs || [];
        } else if (userData.role === 'tecnico') {
          // Técnicos veem apenas as organizações que criaram
          const { data: orgsData, error: orgsError } = await supabase
            .from('sports_organizations')
            .select('id, name, logo_url, description, esporte_id')
            .eq('created_by', user.id) // Usar o auth.uid() diretamente
            .order('name');

          if (orgsError) throw orgsError;
          orgs = orgsData || [];
          
          // Se não encontrar nenhuma organização, tentar buscar usando o ID do usuário da tabela users
          if (orgs.length === 0) {
            const { data: orgsDataByUserId, error: orgsErrorByUserId } = await supabase
              .from('sports_organizations')
              .select('id, name, logo_url, description, esporte_id')
              .eq('created_by', userData.id) // Usar o ID da tabela users
              .order('name');

            if (!orgsErrorByUserId) {
              orgs = orgsDataByUserId || [];
            }
          }
        }

        setOrganizations(orgs);
        
        // Se houver apenas uma organização, seleciona automaticamente
        if (orgs.length === 1) {
          setOrganizationId(orgs[0].id);
        }

        // Se não houver organizações, mostrar mensagem
        if (orgs.length === 0) {
          setError('Você não possui organizações esportivas. Crie uma equipe primeiro para poder adicionar produtos.');
        }
      } catch (error) {
        console.error('Erro ao buscar organizações:', error);
        setError('Não foi possível carregar suas organizações esportivas.');
      }
    };

    fetchOrganizations();
  }, [user]);

  // Lidar com a seleção de imagem
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);

    // Criar preview da imagem
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Validar formulário
  const validateForm = () => {
    if (!name.trim()) return 'Nome do produto é obrigatório';
    if (!description.trim()) return 'Descrição do produto é obrigatória';
    if (!price.trim()) return 'Preço é obrigatório';
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) return 'Preço deve ser um valor positivo';
    if (!stock.trim()) return 'Estoque é obrigatório';
    if (isNaN(parseInt(stock)) || parseInt(stock) < 0) return 'Estoque deve ser um valor não negativo';
    if (!organizationId) return 'Selecione uma organização';
    return null;
  };

  // Enviar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulário
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let imageUrl = null;

      // Fazer upload da imagem se existir
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        // Obter URL pública da imagem
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      // Converter preço para centavos
      const priceInCents = Math.round(parseFloat(price) * 100);

      // Inserir produto no banco de dados
      const { data, error } = await supabase
        .from('products')
        .insert({
          name,
          description,
          price: priceInCents,
          stock: parseInt(stock),
          organization_id: organizationId,
          image_url: imageUrl,
          status: true
        })
        .select(`
          *,
          organization:organization_id (
            name,
            logo_url
          )
        `)
        .single();

      if (error) throw error;

      // Notificar componente pai sobre o novo produto
      if (data) {
        // Ajustar preço para reais antes de enviar ao componente pai
        const adjustedProduct = {
          ...data,
          price: data.price / 100,
        } as any;
        onProductAdded(adjustedProduct);
        onClose();
      }
    } catch (error: any) {
      console.error('Erro ao adicionar produto:', error);
      setError(error.message || 'Ocorreu um erro ao adicionar o produto.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Adicionar Novo Produto</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="text-red-500 mr-2 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Produto *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ex: Camisa Oficial"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organização Esportiva *
              </label>
              <div className="relative">
                <select
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
                  required
                >
                  <option value="">Selecione uma organização</option>
                  {organizations.length > 0 ? (
                    organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      Nenhuma organização encontrada
                    </option>
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
              {organizations.length === 0 && !isLoading && (
                <p className="mt-1 text-sm text-red-500">
                  Você não possui organizações esportivas. Crie uma equipe primeiro para poder adicionar produtos.
                </p>
              )}
              {organizationId && (
                <div className="mt-2">
                  {organizations.find(org => org.id === organizationId)?.logo_url && (
                    <img 
                      src={organizations.find(org => org.id === organizationId)?.logo_url || ''} 
                      alt="Logo da organização"
                      className="h-8 w-8 object-cover rounded-full inline-block mr-2"
                    />
                  )}
                  <span className="text-xs text-gray-500">
                    Os produtos serão associados a esta organização esportiva.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
              placeholder="Descreva o produto em detalhes"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço (R$) *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ex: 99.90"
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estoque Disponível *
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ex: 50"
                min="0"
                step="1"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imagem do Produto
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative border border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer hover:bg-gray-50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center">
                    <Upload className="text-gray-400 mb-2" size={24} />
                    <p className="text-sm text-gray-500">
                      Clique para selecionar ou arraste uma imagem
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG ou JPEG (máx. 5MB)
                    </p>
                  </div>
                </div>
              </div>
              
              {imagePreview && (
                <div className="w-24 h-24 relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Salvando...
                </>
              ) : (
                'Salvar Produto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
