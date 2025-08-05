CREATE TABLE esportes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true
);
CREATE TABLE modalidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  esporte_id UUID NOT NULL REFERENCES esportes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  jogadores_por_time INTEGER,
  ativo BOOLEAN DEFAULT true
);
CREATE TABLE subcategorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  modalidade_id UUID NOT NULL REFERENCES modalidades(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT  -- Ex: 'Até 7 anos'
);
