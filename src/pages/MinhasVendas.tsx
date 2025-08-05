import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { getSalesOrders, getOrderItems, Order, OrderItem, updateOrderStatus } from '../services/orderService';
import { DollarSign, Search, X, Package, CreditCard, User, MapPin, Phone, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getChargeStatus } from '../services/openpixService';

const MinhasVendas: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sales');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [modalActiveTab, setModalActiveTab] = useState('details');
  const [customerData, setCustomerData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

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

  // Soma apenas pedidos com status "Pagamento Confirmado"
  const totalSales = orders
    .filter((o) => ['Pagamento Confirmado','Processando','Finalizado','Confirmado'].includes(o.status))
    .reduce((acc, o) => acc + o.total, 0);

  const pendingSales = orders
    .filter((o) => o.status === 'Aguardando Pagamento')
    .reduce((acc, o) => acc + o.total, 0);

  // Total recebido líquido (após taxa de 10%)
  const receivedSales = Math.round(totalSales * 0.9);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatusId(orderId);
      await updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error('Erro ao atualizar status', err);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const data = await getSalesOrders(user.id);
        setOrders(data);
      } catch (err) {
        console.error('Erro ao buscar vendas', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  const formatPrice = (cents: number) => new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL'
  }).format(cents / 100);

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center mb-4 md:mb-0">
            <DollarSign className="mr-2" />
            Minhas Vendas
          </h1>
          <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Pesquisar vendas..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
        </div>
        {/* Cards de Resumo */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Vendas Confirmadas */}
          <div className="bg-green-100 border border-green-300 rounded-lg p-4 flex items-center">
            <DollarSign className="mr-3 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Total de Vendas (Confirmado)</p>
              <p className="text-2xl font-bold text-green-700">{formatPrice(totalSales)}</p>
            </div>
          </div>
          {/* Total Recebido */}
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 flex items-center">
            <DollarSign className="mr-3 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Recebido</p>
              <p className="text-2xl font-bold text-blue-700">{formatPrice(receivedSales)}</p>
            </div>
          </div>
          {/* Total Aguardando Pagamento */}
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 flex items-center">
            <DollarSign className="mr-3 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Aguardando Pagamento</p>
              <p className="text-2xl font-bold text-yellow-700">{formatPrice(pendingSales)}</p>
            </div>
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
          <DollarSign size={48} className="mb-4" />
          <p>Você ainda não realizou nenhuma venda.</p>
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
              setCustomerData(null);
              setPaymentStatus(null);
              
              try {
                // Buscar itens do pedido
                const items = await getOrderItems(order.id);
                setOrderItems(items);
                
                // Buscar dados do cliente
                setLoadingCustomer(true);
                const { data: userData, error: userError } = await supabase
                  .from('users')
                  .select('id, name, email, phone, rua, bairro, cidade, estado, cep, numero, complemento')
                  .eq('id', order.user_id)
                  .single();
                
                if (!userError && userData) {
                  setCustomerData(userData);
                }
                setLoadingCustomer(false);
                
                // Buscar status do pagamento se tiver ID da transação
                if (order.id_transacao) {
                  setLoadingPayment(true);
                  try {
                    const paymentData = await getChargeStatus(order.id_transacao);
                    setPaymentStatus(paymentData);
                  } catch (paymentError) {
                    console.error('Erro ao buscar status do pagamento:', paymentError);
                  }
                  setLoadingPayment(false);
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
                <span className="text-green-600 font-semibold">{formatPrice(order.total)}</span>
                <select
                    className="border border-gray-300 rounded px-2 py-1 text-sm capitalize focus:outline-none"
                    value={order.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => { e.stopPropagation(); handleStatusChange(order.id, e.target.value); }}
                    disabled={updatingStatusId === order.id}
                  >
                    <option value="Aguardando Pagamento">Aguardando Pagamento</option>
                    <option value="Pagamento Confirmado">Pagamento Confirmado</option>
                    <option value="Processando">Processando</option>
                    <option value="Confirmado">Confirmado</option>
                    <option value="Finalizado">Finalizado</option>
                  </select>
              </div>
            </div>
          ))}
        </div>
      )}
    {/* Modal detalhes melhorado */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Pedido #{selectedOrder.id.slice(0,8)}</h2>
              <button 
                onClick={() => {
                  setSelectedOrder(null); 
                  setOrderItems([]);
                  setCustomerData(null);
                  setPaymentStatus(null);
                  setModalActiveTab('details');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24}/>
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setModalActiveTab('details')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    modalActiveTab === 'details'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Package size={18} />
                    Detalhes do Pedido
                  </div>
                </button>
                <button
                  onClick={() => setModalActiveTab('payment')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    modalActiveTab === 'payment'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard size={18} />
                    Status do Pagamento
                  </div>
                </button>
                <button
                  onClick={() => setModalActiveTab('customer')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    modalActiveTab === 'customer'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User size={18} />
                    Dados do Cliente
                  </div>
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-96">
              {modalActiveTab === 'details' && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-4">Informações do Pedido</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-gray-600">Data do Pedido:</span>
                        <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Status:</span>
                        <p className={`font-medium ${
                          selectedOrder.status === 'Finalizado' ? 'text-green-600' :
                          selectedOrder.status === 'Pagamento Confirmado' ? 'text-blue-600' :
                          selectedOrder.status === 'Aguardando Pagamento' ? 'text-yellow-600' :
                          'text-gray-600'
                        }`}>{selectedOrder.status}</p>
                      </div>
                    </div>
                  </div>
                  
                  <h4 className="text-md font-medium mb-3">Itens do Pedido</h4>
                  {itemsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                      <span className="ml-2">Carregando itens...</span>
                    </div>
                  ) : orderItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Nenhum item encontrado.</p>
                  ) : (
                    <div className="space-y-3">
                      {orderItems.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h5 className="font-medium">{item.product?.name || `Produto ${item.product_id}`}</h5>
                            <p className="text-sm text-gray-600">Quantidade: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatPrice(item.price)}</p>
                            <p className="text-sm text-gray-600">unitário</p>
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

              {modalActiveTab === 'customer' && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Dados do Cliente</h3>
                  {loadingCustomer ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                      <span className="ml-2">Carregando dados...</span>
                    </div>
                  ) : customerData ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <User size={20} className="text-gray-400" />
                          <div>
                            <span className="text-sm text-gray-600">Nome:</span>
                            <p className="font-medium">{customerData.name || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Mail size={20} className="text-gray-400" />
                          <div>
                            <span className="text-sm text-gray-600">Email:</span>
                            <p className="font-medium">{customerData.email || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone size={20} className="text-gray-400" />
                          <div>
                            <span className="text-sm text-gray-600">Telefone:</span>
                            <p className="font-medium">{customerData.phone || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Endereço:</span>
                          <span className="text-sm font-medium">
                            {customerData && (customerData.rua || customerData.bairro || customerData.cidade) 
                              ? (() => {
                                  const parts = [];
                                  if (customerData.rua) {
                                    parts.push(`${customerData.rua}${customerData.numero ? `, ${customerData.numero}` : ''}`);
                                  }
                                  if (customerData.bairro) parts.push(customerData.bairro);
                                  if (customerData.cidade) {
                                    parts.push(`${customerData.cidade}${customerData.estado ? `/${customerData.estado}` : ''}`);
                                  }
                                  if (customerData.cep) parts.push(`CEP: ${customerData.cep}`);
                                  return parts.join(' - ');
                                })()
                              : 'N/A'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <User size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">Não foi possível carregar os dados do cliente.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
          </div>
    </DashboardLayout>
  );
};

export default MinhasVendas;
