import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { getUserOrders, getOrderItems, Order, OrderItem } from '../services/orderService';
import { getUserByAuthId } from '../services/userService';
import { getCharge, GetChargeResponse, getChargeStatus } from '../services/openpixService';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Search, X, CreditCard, Package, MapPin } from 'lucide-react';

const MeusPedidos: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [chargeData, setChargeData] = useState<GetChargeResponse | null>(null);
  const [loadingChargeId, setLoadingChargeId] = useState<string | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [modalActiveTab, setModalActiveTab] = useState('details');
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState<any>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Função para traduzir status do pagamento
  const getPaymentStatusDisplay = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return { label: 'Pendente', color: 'text-yellow-600 bg-yellow-100' };
      case 'COMPLETED':
        return { label: 'Pago', color: 'text-green-600 bg-green-100' };
      case 'EXPIRED':
        return { label: 'Expirado', color: 'text-red-600 bg-red-100' };
      default:
        return { label: status || 'Desconhecido', color: 'text-gray-600 bg-gray-100' };
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        let pid = profileId;
        if (!pid) {
          const profile = await getUserByAuthId(user.id, true);
          if (!profile) {
            console.error('Perfil não encontrado');
            return;
          }
          pid = profile.id;
          setProfileId(pid);
        }
        if (!pid) return; // segurança
        const data = await getUserOrders(pid);
        setOrders(data);
      } catch (err) {
        console.error('Erro ao buscar pedidos', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user, profileId]);

  const formatPrice = (cents: number) => new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL'
  }).format(cents / 100);

  const handlePayment = async (order: Order) => {
    setPaymentOrder(order);
    if (!order.id_transacao) {
      alert('ID da transação não encontrado para este pedido.');
      return;
    }

    setLoadingChargeId(order.id);
    try {
      const charge = await getCharge(order.id_transacao);
      setChargeData(charge);
      setPaymentModalOpen(true);
    } catch (error) {
      console.error('Erro ao buscar dados da cobrança:', error);
      alert('Erro ao carregar dados do pagamento. Tente novamente.');
    } finally {
      setLoadingChargeId(null);
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center mb-4 md:mb-0">
            <ShoppingBag className="mr-2" />
            Meus Pedidos
          </h1>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Pesquisar pedidos..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center text-gray-500 mt-20">
          <ShoppingBag size={48} className="mb-4" />
          <p>Você ainda não realizou nenhum pedido.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders
            .filter(o => {
              if (searchTerm.trim() === '') return true;
              const term = searchTerm.toLowerCase();
              return o.id.toLowerCase().includes(term) || o.status.toLowerCase().includes(term);
            })
            .map((order) => (
            <div key={order.id} onClick={async () => {
              setSelectedOrder(order);
              setModalActiveTab('details');
              setItemsLoading(true);
              setPaymentStatus(null);
              setDeliveryAddress(null);
              
              try {
                // Buscar itens do pedido
                const items = await getOrderItems(order.id);
                setOrderItems(items);
                
                // Buscar status do pagamento se houver transação
                if (order.id_transacao) {
                  setLoadingPayment(true);
                  try {
                    const paymentData = await getChargeStatus(order.id_transacao);
                    setPaymentStatus(paymentData);
                  } catch (paymentError) {
                    console.error('Erro ao buscar status do pagamento:', paymentError);
                  } finally {
                    setLoadingPayment(false);
                  }
                }
                
                // Buscar endereço de entrega
                setLoadingAddress(true);
                try {
                  const { data: addressData, error: addressError } = await supabase
                    .from('users')
                    .select('rua, bairro, cidade, estado, cep, numero, complemento')
                    .eq('id', order.user_id)
                    .single();
                  
                  if (addressError) {
                    console.error('Erro ao buscar endereço:', addressError);
                  } else {
                    setDeliveryAddress(addressData);
                  }
                } catch (addressError) {
                  console.error('Erro ao buscar endereço:', addressError);
                } finally {
                  setLoadingAddress(false);
                }
              } catch (e) { 
                console.error(e);
              } finally { 
                setItemsLoading(false);
              } 
            }}
            className="border rounded-lg p-4 bg-white shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Pedido #{order.id.slice(0, 8)}</span>
                <span className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-green-600 font-semibold">{formatPrice(order.total)}</span>
                  <span className={`text-sm capitalize ${['Aguardando Pagamento','Processando'].includes(order.status) ? 'text-yellow-500' : ['Pagamento Confirmado','Confirmado','Finalizado'].includes(order.status) ? 'text-green-600' : ''}`}>{order.status}</span>
                </div>
                {order.id_transacao && (
                  order.status === 'Aguardando Pagamento' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePayment(order);
                      }}
                      disabled={loadingChargeId === order.id}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors"
                    >
                      <CreditCard size={16} />
                      {loadingChargeId === order.id ? 'Carregando...' : 'PAGAR'}
                    </button>
                  ) : (
                    <div className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                      <CreditCard size={16} />
                      PAGO
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    {/* Modal detalhes com abas */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Detalhes do Pedido #{selectedOrder.id.slice(0, 8)}</h2>
              <button 
                onClick={() => {
                  setSelectedOrder(null);
                  setOrderItems([]);
                  setPaymentStatus(null);
                  setDeliveryAddress(null);
                  setModalActiveTab('details');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Abas */}
            <div className="border-b">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setModalActiveTab('details')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    modalActiveTab === 'details'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Package className="inline-block w-4 h-4 mr-2" />
                  Detalhes do Pedido
                </button>
                <button
                  onClick={() => setModalActiveTab('payment')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    modalActiveTab === 'payment'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <CreditCard className="inline-block w-4 h-4 mr-2" />
                  Status do Pagamento
                </button>
                <button
                  onClick={() => setModalActiveTab('address')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    modalActiveTab === 'address'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MapPin className="inline-block w-4 h-4 mr-2" />
                  Endereço de Entrega
                </button>
              </nav>
            </div>

            {/* Conteúdo das abas */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              {modalActiveTab === 'details' && (
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <span className="text-sm text-gray-600">Data do Pedido:</span>
                      <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleString('pt-BR')}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Status:</span>
                      <p className={`font-medium ${
                        ['Pagamento Confirmado', 'Confirmado', 'Finalizado'].includes(selectedOrder.status) ? 'text-green-600' :
                        ['Aguardando Pagamento', 'Processando'].includes(selectedOrder.status) ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {selectedOrder.status}
                      </p>
                    </div>
                  </div>

                  <h3 className="text-lg font-medium mb-4">Itens do Pedido</h3>
                  {itemsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                      <span className="ml-2">Carregando itens...</span>
                    </div>
                  ) : orderItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Nenhum item encontrado.</p>
                  ) : (
                    <div className="space-y-3">
                      {orderItems.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.product?.name || `Produto ${item.product_id}`}</h4>
                            <p className="text-sm text-gray-600">Quantidade: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatPrice(item.price)}</p>
                            <p className="text-sm text-gray-600">Unitário</p>
                          </div>
                        </div>
                      ))}
                      <div className="border-t pt-3 mt-4">
                        <div className="flex justify-between items-center text-lg font-semibold">
                          <span>Total:</span>
                          <span className="text-green-600">{formatPrice(selectedOrder.total)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {modalActiveTab === 'payment' && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Status do Pagamento</h3>
                  {loadingPayment ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                      <span className="ml-2">Carregando status...</span>
                    </div>
                  ) : !selectedOrder.id_transacao ? (
                    <div className="text-center py-8">
                      <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">Nenhuma transação associada a este pedido.</p>
                    </div>
                  ) : paymentStatus ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-600">ID da Transação:</span>
                          <p className="font-medium">{selectedOrder.id_transacao}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Status do Pagamento:</span>
                          <div className="mt-1">
                            {(() => {
                              const statusDisplay = getPaymentStatusDisplay(paymentStatus.charge?.status);
                              return (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                                  {statusDisplay.label}
                                </span>
                              );
                            })()}
                            <p className="text-xs text-gray-400 mt-1">
                              Status técnico: {paymentStatus.charge?.status || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Valor:</span>
                          <p className="font-medium">{formatPrice(paymentStatus.charge?.value || 0)}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Data de Expiração:</span>
                          <p className="font-medium">
                            {paymentStatus.charge?.expiresDate ? 
                              new Date(paymentStatus.charge.expiresDate).toLocaleDateString('pt-BR') : 
                              'N/A'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Não foi possível carregar o status do pagamento.</p>
                    </div>
                  )}
                </div>
              )}

              {modalActiveTab === 'address' && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Endereço de Entrega</h3>
                  {loadingAddress ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                      <span className="ml-2">Carregando endereço...</span>
                    </div>
                  ) : deliveryAddress && (deliveryAddress.rua || deliveryAddress.bairro || deliveryAddress.cidade) ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Endereço Completo:</span>
                          </div>
                          <div className="ml-6">
                            <p className="font-medium">
                              {(() => {
                                const parts = [];
                                if (deliveryAddress.rua) {
                                  parts.push(`${deliveryAddress.rua}${deliveryAddress.numero ? `, ${deliveryAddress.numero}` : ''}`);
                                }
                                if (deliveryAddress.bairro) parts.push(deliveryAddress.bairro);
                                if (deliveryAddress.cidade) {
                                  parts.push(`${deliveryAddress.cidade}${deliveryAddress.estado ? `/${deliveryAddress.estado}` : ''}`);
                                }
                                if (deliveryAddress.cep) parts.push(`CEP: ${deliveryAddress.cep}`);
                                return parts.join(' - ');
                              })()
                            }
                            </p>
                            {deliveryAddress.complemento && (
                              <p className="text-sm text-gray-600 mt-1">
                                Complemento: {deliveryAddress.complemento}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">Endereço de entrega não disponível.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Pagamento */}
      {paymentModalOpen && chargeData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
            <button 
              className="absolute top-2 right-2" 
              onClick={() => {
                setPaymentModalOpen(false);
                setChargeData(null);
                setPaymentOrder(null);
              }}
            >
              <X size={18}/>
            </button>
            
            <h2 className="text-xl font-semibold mb-4 text-center">Pagamento PIX</h2>
            
            <div className="text-center mb-4">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {formatPrice(chargeData.charge.value)}
              </div>
              <div className="text-sm text-gray-600 mb-1">
                ID da Transação: {paymentOrder?.id_transacao || chargeData.charge.id}
              </div>
              <div className="text-sm text-gray-600 mb-1">
                Expira em: {new Date(chargeData.charge.expiresDate).toLocaleString('pt-BR')}
              </div>
              <div className="mt-2">
                {(() => {
                  const statusDisplay = getPaymentStatusDisplay(chargeData.charge.status);
                  return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                      {statusDisplay.label}
                    </span>
                  );
                })()}
              </div>
            </div>
            
            {chargeData.charge.status === 'EXPIRED' ? (
              <div className="text-center text-red-600 font-semibold mb-4">
                Pagamento expirado.
              </div>
            ) : (
              <>
                {/* QR Code */}
                <div className="flex justify-center mb-4">
                  <img 
                    src={chargeData.charge.qrCodeImage} 
                    alt="QR Code PIX" 
                    className="w-48 h-48 border border-gray-300 rounded"
                  />
                </div>
                {/* Código PIX para copiar */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código PIX (Copiar e Colar):
                  </label>
                  <div className="relative">
                    <textarea 
                      readOnly 
                      value={chargeData.charge.brCode}
                      className="w-full p-2 border border-gray-300 rounded text-xs font-mono resize-none"
                      rows={3}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(chargeData.charge.brCode);
                        alert('Código PIX copiado!');
                      }}
                      className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              </>
            )}
            
            <div className="text-xs text-gray-500 text-center">
              Escaneie o QR Code ou copie e cole o código PIX no seu banco
            </div>
          </div>
        </div>
      )}
      
          </div>
    </DashboardLayout>
  );
};

export default MeusPedidos;
