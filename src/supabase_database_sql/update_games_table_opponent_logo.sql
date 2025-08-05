-- SQL para adicionar a coluna de logotipo do oponente à tabela games
ALTER TABLE games 
ADD COLUMN IF NOT EXISTS opponent_logo_url TEXT;
