import { supabase } from '../lib/supabase';
import { CartItem } from '../components/Store/CartSidebar';

export interface Order {
  id: string;
  user_id: string;
  total: number; // cents
  status: string;
  created_at: string;
  id_transacao?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: {
    id: string;
    name: string;
    image_url?: string | null;
  } | null;
}

export const getOrderItems = async (orderId: string): Promise<OrderItem[]> => {
  const { data, error } = await supabase
    .from('order_items')
    // join product to show name and img
    .select('id, order_id, product_id, quantity, price, product:products(id,name,image_url)')
    .eq('order_id', orderId);

  if (error) throw error;
  return data as unknown as OrderItem[];
};

export const createOrder = async (userId: string, items: CartItem[]): Promise<Order> => {
  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // 1. cria o pedido
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({ user_id: userId, total, status: 'Aguardando Pagamento' })
    .select('*')
    .single();

  if (orderError) {
    throw orderError;
  }

  // 2. cria itens
  const orderItemsPayload = items.map((i) => ({
    order_id: order.id,
    product_id: i.id,
    quantity: i.quantity,
    price: i.price,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload);
  if (itemsError) {
    // ideal: rollback, mas supabase não suporta transação simples client side -> log
    console.error('Erro ao inserir itens do pedido, pedido criado: ', order.id);
    throw itemsError;
  }

  return order as Order;
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Order[];
};

// Busca pedidos que contenham produtos de uma organização criada pelo usuário logado
export const getSalesOrders = async (authUserId: string): Promise<Order[]> => {
  if (!authUserId) return [];

  // 1. Descobre todas as organizações criadas pelo usuário
  const { data: orgs, error: orgError } = await supabase
    .from('sports_organizations')
    .select('id')
    .eq('created_by', authUserId);

  if (orgError) throw orgError;
  if (!orgs || orgs.length === 0) return [];

  const orgIds = orgs.map((o: any) => o.id);

  // 2. Obtém os produtos dessas organizações
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id')
    .in('organization_id', orgIds);

  if (prodError) throw prodError;
  const productIds = (products || []).map((p: any) => p.id);
  if (productIds.length === 0) return [];

  // 3. Encontra os order_items que referenciam esses produtos
  const { data: orderItems, error: oiError } = await supabase
    .from('order_items')
    .select('order_id')
    .in('product_id', productIds);

  if (oiError) throw oiError;
  const orderIds = Array.from(new Set((orderItems || []).map((oi: any) => oi.order_id)));
  if (orderIds.length === 0) return [];

  // 4. Busca os pedidos correspondentes
  const { data: orders, error: ordersErr } = await supabase
    .from('orders')
    .select('*')
    .in('id', orderIds)
    .order('created_at', { ascending: false });

  if (ordersErr) throw ordersErr;
  return orders as Order[];
};

// Atualiza o status de um pedido
// Atualiza id_transacao do pedido
export const updateOrderTransaction = async (orderId: string, transactionId: string): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .update({ id_transacao: transactionId })
    .eq('id', orderId);
  if (error) throw error;
};

export const updateOrderStatus = async (orderId: string, status: string): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);
  if (error) throw error;
};
