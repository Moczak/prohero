-- Tabela para armazenar os seguidores de equipes
CREATE TABLE IF NOT EXISTS team_followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES sports_organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que um usuário só possa seguir uma equipe uma vez
  CONSTRAINT unique_user_team UNIQUE (user_id, team_id)
);

-- Adicionar políticas de segurança RLS (Row Level Security)
ALTER TABLE team_followers ENABLE ROW LEVEL SECURITY;

-- Política para inserção: qualquer usuário autenticado pode seguir uma equipe
CREATE POLICY "Usuários podem seguir equipes" ON team_followers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política para leitura: usuários podem ver quem segue as equipes
CREATE POLICY "Usuários podem ver seguidores" ON team_followers
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para exclusão: usuários só podem deixar de seguir suas próprias relações
CREATE POLICY "Usuários podem deixar de seguir equipes" ON team_followers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Índices para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_team_followers_user_id ON team_followers(user_id);
CREATE INDEX IF NOT EXISTS idx_team_followers_team_id ON team_followers(team_id);
