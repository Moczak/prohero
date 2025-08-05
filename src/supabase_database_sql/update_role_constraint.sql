-- Atualizar a restrição CHECK para incluir 'atleta' como valor válido para o campo role
ALTER TABLE users DROP CONSTRAINT users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'atleta', 'fa', 'tecnico'));
