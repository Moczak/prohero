-- SQL para adicionar as novas colunas à tabela games existente
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS score_team INTEGER,
ADD COLUMN IF NOT EXISTS score_opponent INTEGER,
ADD COLUMN IF NOT EXISTS game_status TEXT DEFAULT 'scheduled';

-- Adicionar a restrição CHECK após as colunas serem criadas
ALTER TABLE games 
ADD CONSTRAINT game_status_check 
CHECK (game_status IN ('scheduled', 'in_progress', 'completed', 'canceled', 'postponed'));

-- SQL para adicionar a coluna league_tournament_id à tabela games
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS league_tournament_id UUID;

-- Adicionar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_games_league_tournament_id ON games(league_tournament_id);
