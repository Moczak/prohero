import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, ShoppingBag, X, AlertTriangle, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EditProfileModal from '../components/Profile/EditProfileModal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import AddProductModal from '../components/Store/AddProductModal';
import ProductCard from '../components/Store/ProductCard';
import ProductCardSkeleton from '../components/Store/ProductCardSkeleton';
import DashboardLayout from '../components/Layout/DashboardLayout';
import EditProductModal from '../components/Store/EditProductModal';
import ConfirmationModal from '../components/UI/ConfirmationModal';

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

interface UserData {
  id: string;
  role: string;
  openpix_pix_key?: string | null;
}

const Loja: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPixWarningOpen, setIsPixWarningOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [priceRange, setPriceRange] = useState<{min: number, max: number | null}>({min: 0, max: null});
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<string>('');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Buscar dados do usuário para verificar permissões
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('id, role, openpix_pix_key')
            .eq('auth_user_id', user.id)
            .single();

          if (error) throw error;
          setUserData(data);
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
        }
      }
    };

    fetchUserData();
  }, [user]);
  
  // Buscar organizações do usuário (criadas ou como jogador)
  const [userOrganizations, setUserOrganizations] = useState<string[]>([]);
  const [organizationsLoaded, setOrganizationsLoaded] = useState(false);
  
  useEffect(() => {
    const fetchUserOrganizations = async () => {
      if (!user?.id || !userData) return;
      
      try {
        // Organizações que o usuário criou
        const { data: createdOrgs, error: createdOrgsError } = await supabase
          .from('sports_organizations')
          .select('id')
          .eq('created_by', user.id);
          
        if (createdOrgsError) throw createdOrgsError;
        
        // Organizações onde o usuário é jogador
        const { data: playerOrgs, error: playerOrgsError } = await supabase
          .from('players')
          .select('team_id')
          .eq('user_id', user.id);
          
        if (playerOrgsError) throw playerOrgsError;
        
        // Combinar os IDs das organizações
        const orgIds = [
          ...(createdOrgs?.map(org => org.id) || []),
          ...(playerOrgs?.map(player => player.team_id) || [])
        ];
        
        // Remover duplicatas
        const uniqueOrgIds = [...new Set(orgIds)];
        setUserOrganizations(uniqueOrgIds);
        
        // Se o usuário não tem organizações, não mostrar loading
        if (uniqueOrgIds.length === 0) {
          setIsLoading(false);
          setProducts([]);
          setFilteredProducts([]);
        }
      } catch (error) {
        console.error('Erro ao buscar organizações do usuário:', error);
        // Em caso de erro, também parar o loading
        setIsLoading(false);
      } finally {
        setOrganizationsLoaded(true);
      }
    };
    
    fetchUserOrganizations();
  }, [user, userData]);

  // Função para buscar dados frescos do servidor (definida fora do useEffect para poder ser reutilizada)
  const fetchFreshData = async (updateLoadingState: boolean = true) => {
    try {
      if (!user || userOrganizations.length === 0) {
        setProducts([]);
        setFilteredProducts([]);
        if (updateLoadingState) {
          setIsLoading(false);
        }
        return;
      }
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          image_url,
          price,
          stock,
          status,
          organization_id,
          organization:organization_id (
            name,
            logo_url
          )
        `)
        .eq('status', true)
        .in('organization_id', userOrganizations)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Salvar no cache
      if (data) {
        // Garantir que os dados estão no formato correto
        const typedData = data as unknown as Product[];
        
        localStorage.setItem(`cached_products_${user.id}`, JSON.stringify({
          data: typedData,
          timestamp: Date.now(),
          orgIds: userOrganizations
        }));
        
        setProducts(typedData);
        setFilteredProducts(typedData);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos frescos:', error);
    } finally {
      if (updateLoadingState) {
        setIsLoading(false);
      }
    }
  };

  // Buscar produtos com otimização de desempenho
  useEffect(() => {
    // Não buscar produtos até que tenhamos as organizações do usuário
    if (!user) {
      return;
    }
    
    // Aguardar o carregamento das organizações
    if (!organizationsLoaded) {
      return;
    }
    
    // Se já sabemos que o usuário não tem organizações, não buscar produtos
    if (userOrganizations.length === 0) {
      return;
    }
    
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        
        // Verificar se há dados em cache e se são recentes (menos de 5 minutos)
        const cacheKey = `cached_products_${user.id}`;
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          try {
            const { data, timestamp, orgIds } = JSON.parse(cachedData);
            const isRecent = Date.now() - timestamp < 5 * 60 * 1000; // 5 minutos
            const sameOrgs = JSON.stringify(orgIds.sort()) === JSON.stringify([...userOrganizations].sort());
            
            if (isRecent && sameOrgs && Array.isArray(data) && data.length > 0) {
              setProducts(data);
              setFilteredProducts(data);
              setIsLoading(false);
              
              // Atualizar em segundo plano
              fetchFreshData(false);
              return;
            }
          } catch (e) {
            // Ignorar erros de parsing do cache
            console.warn('Erro ao ler cache de produtos:', e);
          }
        }
        
        // Se não há cache válido, buscar dados frescos
        await fetchFreshData(true);
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [user, userOrganizations, organizationsLoaded]);

  // Função para formatar preço
  // Função util para formatar preço em reais
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(price / 100);
  }; (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(price);
  };

  // Função para remover a organização selecionada
  const removeSelectedOrganization = () => {
    setSelectedOrganization('');
  };

  // Limpar todos os filtros
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedOrganization('');
    setPriceRange({min: 0, max: maxPrice});
  };

  // Atualizar maxPrice quando os produtos forem carregados
  useEffect(() => {
    if (products.length > 0) {
      const highestPrice = Math.max(...products.map(product => product.price));
      setMaxPrice(Math.ceil(highestPrice * 1.1)); // 10% a mais que o preço mais alto
    }
  }, [products]);

  // Filtrar produtos quando o termo de busca, organização ou faixa de preço mudar
  useEffect(() => {
    let filtered = products;
    
    // Filtrar por termo de busca
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(lowercasedSearch) ||
        product.description.toLowerCase().includes(lowercasedSearch) ||
        (product.organization?.name && product.organization.name.toLowerCase().includes(lowercasedSearch))
      );
    }
    
    // Filtrar por organização
    if (selectedOrganization) {
      filtered = filtered.filter(product => product.organization_id === selectedOrganization);
    }
    
    // Filtrar por faixa de preço
    filtered = filtered.filter(product => 
      product.price >= priceRange.min && 
      (priceRange.max === null || product.price <= priceRange.max)
    );
    
    setFilteredProducts(filtered);
  }, [searchTerm, selectedOrganization, priceRange, products]);

  // Atualizar lista de produtos após adicionar um novo
  const handleProductAdded = (newProduct: Product) => {
    setProducts(prevProducts => [newProduct, ...prevProducts]);
    setFilteredProducts(prevProducts => [newProduct, ...prevProducts]);
  };

  // Abrir modal de edição
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  // Atualizar produto
  const handleUpdateProduct = (updatedProduct: Product) => {
    // Atualizar o produto no cache temporariamente
    const updatedProducts = products.map(p => 
      p.id === updatedProduct.id ? updatedProduct : p
    );
    setProducts(updatedProducts);
    setFilteredProducts(updatedProducts);
    
    // Buscar dados frescos do servidor para garantir sincronização
    // Usar setTimeout para permitir que a UI atualize primeiro
    setTimeout(() => {
      // Limpar o cache para forçar uma busca fresca
      localStorage.removeItem(`cached_products_${user?.id}`);
      // Buscar dados frescos
      fetchFreshData(false);
    }, 300);
  };
  
  // Abrir modal de confirmação de exclusão
  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };
  
  // Confirmar exclusão do produto
  const confirmDeleteProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      setIsDeleting(true);
      
      // Excluir produto do banco de dados
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', selectedProduct.id);
      
      if (error) throw error;
      
      // Remover produto do estado local
      const updatedProducts = products.filter(p => p.id !== selectedProduct.id);
      setProducts(updatedProducts);
      setFilteredProducts(updatedProducts);
      
      // Fechar modal
      setIsDeleteModalOpen(false);
      setSelectedProduct(null);
      
      // Limpar cache e buscar dados frescos
      localStorage.removeItem(`cached_products_${user?.id}`);
      fetchFreshData(false);
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasPixKey = !!userData?.openpix_pix_key;
  const isCoach = userData?.role === 'tecnico' || userData?.role === 'admin';

  const [activeTab, setActiveTab] = useState('store');

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <ShoppingBag className="mr-2 text-green-500" size={24} />
            <h1 className="text-2xl font-bold">Minha Loja</h1>
          </div>
          
          {isCoach && (
            <button
              onClick={() => {
                if (userData?.role === 'tecnico' && !hasPixKey) {
                  setIsPixWarningOpen(true);
                  return;
                }
                setIsAddModalOpen(true);
              }}
              className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Adicionar Produto
            </button>
          )}
        </div>

        {/* Alerta para técnicos sem chave Pix */}
        {userData?.role === 'tecnico' && !hasPixKey && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-900 mb-1">
                  Configure sua chave Pix para receber pagamentos
                </h3>
                <p className="text-sm text-yellow-700 mb-3">
                  Você precisa cadastrar uma chave Pix para poder adicionar produtos e receber pagamentos das vendas.
                </p>
                <button
                  onClick={() => navigate('/conta?tab=payment')}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-yellow-900 bg-yellow-100 border border-yellow-300 rounded-md hover:bg-yellow-200 transition-colors"
                >
                  <Settings size={16} className="mr-2" />
                  Configurar Chave Pix
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Buscar produtos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
            <button 
              className={`flex items-center justify-center px-4 py-2 border ${isFilterOpen ? 'border-green-500 bg-green-50' : 'border-gray-300'} rounded-md hover:bg-gray-50`}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter size={20} className={`mr-2 ${isFilterOpen ? 'text-green-500' : 'text-gray-500'}`} />
              <span>Filtros</span>
            </button>
          </div>

          {isFilterOpen && (
            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Filtros</h3>
                <button 
                  onClick={clearFilters}
                  className="text-sm text-green-600 hover:text-green-800"
                >
                  Limpar filtros
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Filtro de preço */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Faixa de Preço</h4>
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm text-gray-600">{formatPrice(priceRange.min)}</span>
                    <span className="text-sm text-gray-600">{formatPrice(priceRange.max || maxPrice)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={maxPrice}
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="range"
                    min={0}
                    max={maxPrice}
                    value={priceRange.max || maxPrice}
                    onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-4"
                  />
                </div>

                {/* Filtro de organizações */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Organizações</h4>
                  <div className="relative">
                    <select
                      value={selectedOrganization}
                      onChange={(e) => setSelectedOrganization(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
                    >
                      <option value="">Todas as organizações</option>
                      {userOrganizations.length > 0 && products.length > 0 ? (
                        // Filtrar organizações únicas dos produtos
                        [...new Set(products.map(p => p.organization_id))].map(orgId => {
                          const org = products.find(p => p.organization_id === orgId)?.organization;
                          return org ? (
                            <option key={orgId} value={orgId}>
                              {org.name}
                            </option>
                          ) : null;
                        })
                      ) : (
                        <option value="" disabled>Nenhuma organização encontrada</option>
                      )}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags de filtros ativos */}
              <div className="mt-4">
                <h4 className="text-xs font-medium text-gray-500 mb-2">Filtros ativos:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedOrganization && (
                    <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                      <span>
                        {products.find(p => p.organization_id === selectedOrganization)?.organization?.name || 'Organização'}
                      </span>
                      <button 
                        onClick={removeSelectedOrganization}
                        className="ml-1 p-0.5 hover:bg-green-200 rounded-full"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  
                  {(priceRange.min > 0 || (priceRange.max !== null && priceRange.max < maxPrice)) && (
                    <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                      <span>Preço: {formatPrice(priceRange.min)} - {formatPrice(priceRange.max || maxPrice)}</span>
                      <button 
                        onClick={() => setPriceRange({min: 0, max: maxPrice})}
                        className="ml-1 p-0.5 hover:bg-green-200 rounded-full"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                isCoach={isCoach}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <ShoppingBag size={48} className="text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-500 max-w-md">
              {searchTerm ? 'Nenhum produto corresponde à sua busca. Tente outros termos.' : 
               userOrganizations.length === 0 ? 
               'Você não tem acesso a nenhuma organização. Crie uma equipe ou peça para ser adicionado a uma equipe existente.' : 
               'Não há produtos disponíveis no momento.'}
            </p>
          </div>
        )}

        {/* Modal de aviso para cadastrar chave Pix */}
        {isPixWarningOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Chave Pix necessária</h2>
                <p className="mb-6">Você precisa cadastrar uma chave Pix para receber pagamentos antes de criar seus produtos.</p>
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsPixWarningOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg mr-2 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => navigate('/conta?tab=payment')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Cadastrar Chave
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal para editar perfil (cadastrar chave Pix) */}
        <EditProfileModal 
          isOpen={isEditProfileModalOpen}
          onClose={() => setIsEditProfileModalOpen(false)}
        />

        {/* Modal para adicionar produto */}
        <AddProductModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          onProductAdded={handleProductAdded} 
        />

        {/* Modal para editar produto */}
        {selectedProduct && (
          <EditProductModal 
            isOpen={isEditModalOpen} 
            onClose={() => setIsEditModalOpen(false)} 
            onProductUpdated={handleUpdateProduct} 
            product={selectedProduct}
          />
        )}
        
        {/* Modal de confirmação de exclusão */}
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          title="Excluir Produto"
          message={`Tem certeza que deseja excluir o produto "${selectedProduct?.name || ''}"? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          onConfirm={confirmDeleteProduct}
          onCancel={() => setIsDeleteModalOpen(false)}
          isLoading={isDeleting}
        />
      </div>
    </DashboardLayout>
  );
};

export default Loja;
