-- Tabela de pedidos
create table orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete set null,
  total integer not null,  -- em centavos
  status text not null default 'pending',
  created_at timestamptz default now(),
  id_transacao text
);

-- Itens do pedido
create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity integer not null,
  price integer not null  -- preço do produto (centavos) no momento da compra
);

-- Habilitar RLS
alter table orders enable row level security;
alter table order_items enable row level security;

-- Políticas para tabela orders
create policy "orders_select_own" on orders
  for select using ( auth.uid() = user_id );

create policy "orders_insert_own" on orders
  for insert with check ( auth.uid() = user_id );

-- Políticas para tabela order_items
create policy "order_items_select_via_order" on order_items
  for select using (
    exists (
      select 1 from orders o where o.id = order_id and o.user_id = auth.uid()
    )
  );

create policy "order_items_insert_via_order" on order_items
  for insert with check (
    exists (
      select 1 from orders o where o.id = order_id and o.user_id = auth.uid()
    )
  );

-- Índices úteis
create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_order_items_order_id on order_items(order_id);

-- Política: usuário vê apenas seus pedidos
create policy "Only owner can select orders"
  on orders for select
  using ( auth.uid() = user_id );