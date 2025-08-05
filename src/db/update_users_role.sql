-- Atualizar a restrição de verificação da coluna role na tabela users
-- para incluir o valor 'atleta' como um papel válido

-- Remover a restrição existente
ALTER TABLE users 
DROP CONSTRAINT users_role_check;

-- Adicionar a nova restrição com o valor 'atleta' incluído
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'fa', 'tecnico', 'atleta'));

-- Comentário para documentação
COMMENT ON COLUMN users.role IS 'Papel do usuário: admin, fa, tecnico ou atleta';
