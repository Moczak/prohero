-- Criar a função set_updated_at se ela não existir
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criação da tabela players
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  position TEXT,
  number INTEGER,
  photo_url TEXT,
  team_id UUID REFERENCES public.sports_organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  profile_type TEXT DEFAULT 'athlete',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar comentários à tabela
COMMENT ON TABLE public.players IS 'Tabela para armazenar informações de jogadores das equipes';

-- Adicionar comentários às colunas
COMMENT ON COLUMN public.players.id IS 'ID único do jogador';
COMMENT ON COLUMN public.players.name IS 'Nome do jogador';
COMMENT ON COLUMN public.players.position IS 'Posição do jogador na equipe';
COMMENT ON COLUMN public.players.number IS 'Número da camisa do jogador';
COMMENT ON COLUMN public.players.photo_url IS 'URL da foto do jogador';
COMMENT ON COLUMN public.players.team_id IS 'ID da equipe à qual o jogador pertence';
COMMENT ON COLUMN public.players.user_id IS 'ID do usuário associado ao jogador';
COMMENT ON COLUMN public.players.profile_type IS 'Tipo de perfil do jogador (atleta, técnico, etc.)';
COMMENT ON COLUMN public.players.active IS 'Indica se o jogador está ativo na equipe';
COMMENT ON COLUMN public.players.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN public.players.updated_at IS 'Data da última atualização do registro';

-- Criar políticas de segurança RLS (Row Level Security)
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura por qualquer usuário autenticado
CREATE POLICY "Permitir leitura para todos os usuários autenticados"
  ON public.players
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir inserção apenas para usuários autenticados
CREATE POLICY "Permitir inserção para usuários autenticados"
  ON public.players
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para permitir atualização apenas para o próprio jogador ou administradores da equipe
CREATE POLICY "Permitir atualização para o próprio jogador ou administradores"
  ON public.players
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.sports_organizations
      WHERE id = team_id AND created_by = auth.uid()
    )
  );

-- Política para permitir exclusão apenas para administradores da equipe
CREATE POLICY "Permitir exclusão apenas para administradores da equipe"
  ON public.players
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sports_organizations
      WHERE id = team_id AND created_by = auth.uid()
    )
  );

-- Adicionar trigger para atualizar o campo updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
