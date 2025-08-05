-- Criação da tabela de organizações esportivas
CREATE TABLE public.sports_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR,
  organization_id VARCHAR,
  city VARCHAR,
  state VARCHAR,
  country VARCHAR,
  description TEXT,
  logo_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  capa_url TEXT,
  modalidade_id UUID REFERENCES public.modalidades(id),
  subcategoria_id UUID REFERENCES public.subcategorias(id),
  esporte_id UUID REFERENCES public.esportes(id)
);

-- Comentários da tabela
COMMENT ON TABLE sports_organizations IS 'Tabela para armazenar informações sobre equipes desportivas como clubes, academias, times, federações, etc.';
COMMENT ON COLUMN sports_organizations.id IS 'Identificador único da organização esportiva';
COMMENT ON COLUMN sports_organizations.name IS 'Nome da organização esportiva';
COMMENT ON COLUMN sports_organizations.organization_type IS 'Tipo da organização (clube, academia, time, federação, etc.)';
COMMENT ON COLUMN sports_organizations.city IS 'Cidade onde a organização está localizada';
COMMENT ON COLUMN sports_organizations.state IS 'Estado onde a organização está localizada';
COMMENT ON COLUMN sports_organizations.country IS 'País onde a organização está localizada';
COMMENT ON COLUMN sports_organizations.description IS 'Descrição detalhada da organização';
COMMENT ON COLUMN sports_organizations.logo_url IS 'URL da imagem/logo da organização';
COMMENT ON COLUMN sports_organizations.created_by IS 'Referência ao usuário administrador que cadastrou a organização';
COMMENT ON COLUMN sports_organizations.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN sports_organizations.updated_at IS 'Data e hora da última atualização do registro';

-- Trigger para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sports_organizations_updated_at
BEFORE UPDATE ON sports_organizations
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Políticas de segurança RLS (Row Level Security)
ALTER TABLE sports_organizations ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários autenticados vejam todas as organizações
CREATE POLICY "Usuários autenticados podem visualizar todas as organizações" ON sports_organizations
FOR SELECT
TO authenticated
USING (true);

-- Política para permitir que apenas o criador ou administradores possam inserir novas organizações
CREATE POLICY "Usuários autenticados podem inserir organizações" ON sports_organizations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para permitir que apenas o criador ou administradores possam atualizar organizações
CREATE POLICY "Usuários podem atualizar suas próprias organizações" ON sports_organizations
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Política para permitir que apenas o criador ou administradores possam excluir organizações
CREATE POLICY "Usuários podem excluir suas próprias organizações" ON sports_organizations
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Índices para melhorar a performance das consultas
CREATE INDEX idx_sports_organizations_name ON sports_organizations(name);
CREATE INDEX idx_sports_organizations_type ON sports_organizations(organization_type);
CREATE INDEX idx_sports_organizations_created_by ON sports_organizations(created_by);
