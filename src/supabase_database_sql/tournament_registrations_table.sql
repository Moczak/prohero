
-- Tabela para gerenciar inscrições de equipes em torneios
CREATE TABLE tournament_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES sports_organizations(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tournament_id, team_id)
);

-- Adicionar políticas de segurança para a tabela tournament_registrations
CREATE POLICY "Equipes podem visualizar suas próprias inscrições"
ON tournament_registrations FOR SELECT 
USING (
  auth.uid() IN (
    SELECT created_by FROM sports_organizations WHERE id = team_id
  )
);

CREATE POLICY "Criadores de torneios podem ver todas as inscrições" 
ON tournament_registrations FOR SELECT 
USING (
  auth.uid() IN (
    SELECT created_by FROM tournaments WHERE id = tournament_id
  )
);

CREATE POLICY "Equipes podem se inscrever em torneios abertos" 
ON tournament_registrations FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT created_by FROM sports_organizations WHERE id = team_id
  ) AND
  EXISTS (
    SELECT 1 FROM tournaments 
    WHERE id = tournament_id AND status = 'open_registration'
  )
);

CREATE POLICY "Apenas criadores de torneios podem aprovar/rejeitar inscrições" 
ON tournament_registrations FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT created_by FROM tournaments WHERE id = tournament_id
  )
);

