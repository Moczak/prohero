CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES sports_organizations(id) ON DELETE CASCADE,
  opponent_name TEXT NOT NULL,
  game_date DATE NOT NULL,
  game_time TIME NOT NULL,
  location TEXT,
  city TEXT,
  state TEXT,
  home_game BOOLEAN DEFAULT TRUE,
  score_team INTEGER,
  score_opponent INTEGER,
  game_status TEXT DEFAULT 'scheduled' CHECK (game_status IN ('scheduled', 'in_progress', 'completed', 'canceled', 'postponed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX idx_games_team_id ON games(team_id);
CREATE INDEX idx_games_date ON games(game_date);

ALTER TABLE games 
ADD CONSTRAINT game_status_check 
CHECK (game_status IN ('scheduled', 'in_progress', 'completed', 'canceled', 'postponed'));

-- SQL para adicionar a coluna league_tournament_id à tabela games
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS league_tournament_id UUID;

-- Adicionar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_games_league_tournament_id ON games(league_tournament_id);
