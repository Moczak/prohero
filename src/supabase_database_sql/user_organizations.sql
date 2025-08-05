-- Criação da tabela de relacionamento entre usuários e organizações
CREATE TABLE user_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    organization_id UUID REFERENCES sports_organizations(id) NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

-- Comentários da tabela
COMMENT ON TABLE user_organizations IS 'Tabela para armazenar o relacionamento entre usuários e organizações esportivas';
COMMENT ON COLUMN user_organizations.id IS 'Identificador único do relacionamento';
COMMENT ON COLUMN user_organizations.user_id IS 'ID do usuário';
COMMENT ON COLUMN user_organizations.organization_id IS 'ID da organização esportiva';
COMMENT ON COLUMN user_organizations.role IS 'Papel do usuário na organização (owner, admin, coach, athlete, member)';
COMMENT ON COLUMN user_organizations.is_active IS 'Se o usuário está ativo na organização';
COMMENT ON COLUMN user_organizations.joined_at IS 'Data e hora que o usuário se juntou à organização';
COMMENT ON COLUMN user_organizations.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN user_organizations.updated_at IS 'Data e hora da última atualização do registro';

-- Trigger para atualizar o campo updated_at automaticamente
CREATE TRIGGER update_user_organizations_updated_at
BEFORE UPDATE ON user_organizations
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Políticas de segurança RLS (Row Level Security)
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários autenticados vejam suas próprias associações
CREATE POLICY "Usuários podem ver suas próprias associações" ON user_organizations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Política para permitir que usuários autenticados criem associações
CREATE POLICY "Usuários podem criar associações" ON user_organizations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários atualizem suas próprias associações
CREATE POLICY "Usuários podem atualizar suas próprias associações" ON user_organizations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários excluam suas próprias associações
CREATE POLICY "Usuários podem excluir suas próprias associações" ON user_organizations
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Índices para melhorar a performance das consultas
CREATE INDEX idx_user_organizations_user ON user_organizations(user_id);
CREATE INDEX idx_user_organizations_org ON user_organizations(organization_id);
CREATE INDEX idx_user_organizations_role ON user_organizations(role);
