-- Adiciona colunas relacionadas à integração OpenPix
ALTER TABLE users
ADD COLUMN IF NOT EXISTS openpix_pix_key TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS openpix_pix_key_type TEXT;

-- Índice auxiliar para buscas por chave Pix
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'users' AND indexname = 'users_openpix_pix_key_idx'
  ) THEN
    CREATE INDEX users_openpix_pix_key_idx ON users(openpix_pix_key);
  END IF;
END
$$;
