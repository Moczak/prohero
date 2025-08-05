-- Criação da tabela de produtos
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.sports_organizations(id),
  name VARCHAR NOT NULL,
  description TEXT,
  image_url TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  status BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Comentários da tabela
COMMENT ON TABLE products IS 'Tabela para armazenar informações sobre produtos vendidos pelas organizações esportivas';
COMMENT ON COLUMN products.id IS 'Identificador único do produto';
COMMENT ON COLUMN products.organization_id IS 'Referência à organização esportiva associada ao produto';
COMMENT ON COLUMN products.name IS 'Nome do produto';
COMMENT ON COLUMN products.description IS 'Descrição detalhada do produto';
COMMENT ON COLUMN products.image_url IS 'URL da imagem do produto';
COMMENT ON COLUMN products.price IS 'Preço do produto';
COMMENT ON COLUMN products.stock IS 'Quantidade em estoque disponível';
COMMENT ON COLUMN products.status IS 'Status do produto (true = ativo, false = inativo)';
COMMENT ON COLUMN products.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN products.updated_at IS 'Data e hora da última atualização do registro';

-- Trigger para atualizar o campo updated_at automaticamente
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Políticas de segurança RLS (Row Level Security)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários autenticados vejam todos os produtos ativos
CREATE POLICY "Usuários autenticados podem visualizar produtos ativos" ON products
FOR SELECT
TO authenticated
USING (status = true);

-- Política para permitir que apenas técnicos e admins possam inserir novos produtos
CREATE POLICY "Técnicos e admins podem inserir produtos" ON products
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND (users.role = 'tecnico' OR users.role = 'admin')
  )
);

-- Política para permitir que apenas técnicos e admins possam atualizar produtos
CREATE POLICY "Técnicos e admins podem atualizar produtos" ON products
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND (users.role = 'tecnico' OR users.role = 'admin')
  )
);

-- Política para permitir que apenas técnicos e admins possam excluir produtos
CREATE POLICY "Técnicos e admins podem excluir produtos" ON products
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.auth_user_id = auth.uid()
    AND (users.role = 'tecnico' OR users.role = 'admin')
  )
);

-- Índices para melhorar a performance das consultas
CREATE INDEX idx_products_organization_id ON products(organization_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_name ON products(name);
