import React, { useState, useEffect } from 'react';
import { Search, Filter, ShoppingBag, X, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/Store/ProductCard';
import ProductCardSkeleton from '../components/Store/ProductCardSkeleton';
import DashboardLayout from '../components/Layout/DashboardLayout';
import CartSidebar, { CartItem } from '../components/Store/CartSidebar';
import EditProfileModal from '../components/Profile/EditProfileModal';
import { createOrder, updateOrderTransaction } from '../services/orderService';
import { createChargeWithSplit } from '../services/openpixService';
import { v4 as uuidv4 } from 'uuid';
import { getUserByAuthId } from '../services/userService';

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

interface Organization {
  id: string;
  name: string;
}

const LojaOnline: React.FC = () => {
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  // util para checkout
  const navigate = useNavigate();
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [pixQr, setPixQr] = useState<string | null>(null);
  const [orderTotal, setOrderTotal] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // countdown effect
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
      setTimeLeft(diff > 0 ? diff : 0);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleCheckout = async () => {
    if (!user) return;
      // buscar perfil
      const profile = await getUserByAuthId(user.id, true);
      if (!profile) {
        alert('Perfil não encontrado, não foi possível finalizar o pedido');
        return;
      }
    try {
      setIsCheckingOut(true);
      const newOrder = await createOrder(profile.id, cartItems);

    // ----- OpenPix Split -----
    const MAIN_PIX_KEY = import.meta.env.VITE_OPENPIX_MAIN_PIX_KEY as string;
    if (!MAIN_PIX_KEY) {
      console.error('VITE_OPENPIX_MAIN_PIX_KEY não configurado');
    }

    // Cálculo do split (linha 76-78)
    const totalCents = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const adminPart = Math.round(totalCents * 0.15);
    const sellerPart = totalCents - adminPart;

    const sellerPixKey = (profile as any).openpix_pix_key as string | undefined;
    if (!sellerPixKey) {
      console.error('Usuário sem chave Pix para split');
    }

    try {
      const chargeResp = await createChargeWithSplit({
        value: totalCents,
        correlationID: uuidv4(),
        splits: [
          { pixKey: sellerPixKey || MAIN_PIX_KEY, value: sellerPart, splitType: 'SPLIT_SUB_ACCOUNT' } as any,
        ],
      });

      // salva transactionId no pedido
      try {
        const txId = (chargeResp as any)?.charge?.transactionID || (chargeResp as any)?.charge?.identifier;
        if (txId) {
          await updateOrderTransaction(newOrder.id, txId as string);
        }
      } catch (e) {
        console.error('Falha ao salvar id_transacao', e);
      }

      setPixQr(chargeResp.charge.qrCodeImage || null);
      setOrderTotal(totalCents / 100);
      setExpiresAt(new Date(chargeResp.charge.expiresDate));
    } catch (err) {
      console.error('Erro ao criar cobrança Pix', err);
    }

    setCartItems([]);
    setIsCartOpen(false);
    setOrderSuccess(true);
    } catch (err) {
      console.error('Erro no checkout', err);
      alert('Erro ao finalizar o pedido');
    } finally {
      setIsCheckingOut(false);
    }
  };
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{min: number, max: number | null}>({min: 0, max: null});
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  // Auth context is used in the route configuration, not directly in this component
  const { user } = useAuth();

  // Buscar todas as organizações
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const { data, error } = await supabase
          .from('sports_organizations')
          .select('id, name')
          .order('name');
          
        if (error) throw error;
        
        if (data) {
          setOrganizations(data);
        }
      } catch (error) {
        console.error('Erro ao buscar organizações:', error);
      }
    };
    
    fetchOrganizations();
  }, []);

  // Buscar todos os produtos
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        
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
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (data) {
          const typedData = data as unknown as Product[];
          setProducts(typedData);
          setFilteredProducts(typedData);
          
          // Encontrar o preço máximo para o slider
          if (typedData.length > 0) {
            const highestPrice = Math.max(...typedData.map(p => p.price));
            setMaxPrice(Math.ceil(highestPrice / 100) * 100); // Arredondar para cima para o próximo múltiplo de 100
            setPriceRange({min: 0, max: highestPrice});
          }
        }
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...products];
    
    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.organization?.name && product.organization.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filtrar por organizações selecionadas
    if (selectedOrganizations.length > 0) {
      filtered = filtered.filter(product => 
        selectedOrganizations.includes(product.organization_id)
      );
    }
    
    // Filtrar por faixa de preço
    filtered = filtered.filter(product => 
      product.price >= priceRange.min && 
      (priceRange.max === null || product.price <= priceRange.max)
    );
    
    setFilteredProducts(filtered);
  }, [searchTerm, selectedOrganizations, priceRange, products]);

  // Formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Função para remover a organização selecionada
  const removeSelectedOrganization = () => {
    setSelectedOrganizations([]);
  };

  // Limpar todos os filtros
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedOrganizations([]);
    setPriceRange({min: 0, max: maxPrice});
  };
  
  // Funções para gerenciar o carrinho
  const handleAddToCart = (product: Product) => {
    // Verificar se o produto já está no carrinho
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      // Se já estiver no carrinho, aumentar a quantidade
      updateCartItemQuantity(product.id, existingItem.quantity + 1);
    } else {
      // Se não estiver no carrinho, adicionar como novo item
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: 1,
        organization_name: product.organization?.name
      };
      
      setCartItems([...cartItems, newItem]);
    }
    
    // Abrir o carrinho
    setIsCartOpen(true);
  };
  
  const updateCartItemQuantity = (id: string, quantity: number) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };
  
  const removeCartItem = (id: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const [activeTab, setActiveTab] = useState('storeOnline');

  // Calcular o total de itens no carrinho
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {/* Modal de sucesso do pedido */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm text-center">
            <h2 className="text-xl font-semibold mb-4">Pedido realizado com sucesso!</h2>
            {orderTotal !== null && (
              <p className="font-medium mb-2">Pague {formatPrice(orderTotal)} via Pix</p>
            )}
            {pixQr ? (
              <div className="flex flex-col items-center">
                <img src={pixQr.startsWith('http') ? pixQr : `data:image/png;base64,${pixQr}`} alt="QR Code Pix" className="mx-auto w-48 h-48 mb-4 border-4 border-green-500 rounded-lg" />
                <div className="mt-2 mb-4">
                  <p className="text-sm text-gray-700">Prazo de Pagamento</p>
                  {timeLeft > 0 ? (
                    (() => {
                      const h = Math.floor(timeLeft / 3600);
                      const m = Math.floor((timeLeft % 3600) / 60);
                      const s = timeLeft % 60;
                      return (
                        <p className="font-semibold">{`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`}</p>
                      );
                    })()
                  ) : (
                    <p className="font-semibold text-red-500">Expirado</p>
                  )}
                  {expiresAt && (
                    <p className="text-xs text-gray-500">Expira em: {expiresAt.toLocaleString('pt-BR')}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 mb-4">Escaneie o QR Code para pagar.</p>
            )}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setOrderSuccess(false);
                  navigate('/meus-pedidos');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Ver Pedidos
              </button>
              <button
                onClick={() => setOrderSuccess(false)}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto px-4 py-8 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <ShoppingBag className="mr-2 text-green-500" size={24} />
            <h1 className="text-2xl font-bold">Loja Online</h1>
          </div>
          
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            <ShoppingCart size={20} className="mr-2" />
            <span>Carrinho</span>
            {cartItemCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                {cartItemCount}
              </div>
            )}
          </button>
        </div>

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
                    onChange={(e) => setPriceRange(prev => ({...prev, min: Number(e.target.value)}))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="range"
                    min={0}
                    max={maxPrice}
                    value={priceRange.max || maxPrice}
                    onChange={(e) => setPriceRange(prev => ({...prev, max: Number(e.target.value)}))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
                  />
                </div>
                
                {/* Filtro de organizações */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Organizações</h4>
                  <div className="relative">
                    <select
                      value={selectedOrganizations.length > 0 ? selectedOrganizations[0] : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelectedOrganizations([e.target.value]);
                        } else {
                          setSelectedOrganizations([]);
                        }
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
                    >
                      <option value="">Todas as organizações</option>
                      {organizations.length > 0 ? (
                        organizations.map(org => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))
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
              
              {/* Filtros aplicados */}
              {(selectedOrganizations.length > 0 || priceRange.min > 0 || (priceRange.max !== null && priceRange.max < maxPrice)) && (
                <div className="mt-4 pt-3 border-t">
                  <h4 className="text-sm font-medium mb-2">Filtros aplicados:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrganizations.length > 0 && (
                      <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                        <span>
                          {organizations.find(org => org.id === selectedOrganizations[0])?.name || 'Organização'}
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
              )}
            </div>
          )}
        </div>

        {/* Aviso para produtos físicos */}
        <div className="mb-6 flex items-center gap-2 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <span className="text-yellow-800 text-sm font-medium">
            Para produtos físicos, certifique-se de que cadastrou seu endereço no seu{' '}
            <button
              type="button"
              className="underline text-green-700 hover:text-green-900 focus:outline-none"
              onClick={() => setEditProfileOpen(true)}
            >
              Perfil
            </button>.
          </span>
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
                isCoach={false}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <ShoppingBag size={48} className="text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-500 max-w-md">
              {searchTerm || selectedOrganizations.length > 0 || priceRange.min > 0 || (priceRange.max !== null && priceRange.max < maxPrice)
                ? 'Nenhum produto corresponde aos filtros aplicados. Tente outros filtros.'
                : 'Não há produtos disponíveis no momento.'}
            </p>
          </div>
        )}
        
        {/* Cart Sidebar */}
        <CartSidebar
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          updateQuantity={updateCartItemQuantity}
          removeItem={removeCartItem}
          onCheckout={handleCheckout}
          isProcessing={isCheckingOut}
        />

        {/* Modal de edição de perfil */}
        <EditProfileModal isOpen={editProfileOpen} onClose={() => setEditProfileOpen(false)} />
        
        {/* Overlay for when cart is open */}
        {isCartOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsCartOpen(false)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default LojaOnline;
