/**
 * Tradução de mensagens de erro comuns do Supabase
 */

type ErrorTranslations = {
  [key: string]: string;
};

const errorTranslations: ErrorTranslations = {
  // Erros de autenticação
  'Invalid login credentials': 'Credenciais de login inválidas',
  'User already registered': 'Usuário já cadastrado',
  'Email not confirmed': 'Email não confirmado',
  'Invalid email or password': 'Email ou senha inválidos',
  'Email link is invalid or has expired': 'O link de email é inválido ou expirou',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
  'User already exists': 'Usuário já existe',
  'Email already in use': 'Email já está em uso',
  'Email not found': 'Email não encontrado',
  'Invalid token': 'Token inválido',
  'Token expired': 'Token expirado',
  'Invalid credentials': 'Credenciais inválidas',
  'Invalid email': 'Email inválido',
  'Invalid password': 'Senha inválida',
  'Invalid phone': 'Telefone inválido',
  'Password recovery email sent': 'Email de recuperação de senha enviado',
  'Password recovery failed': 'Falha na recuperação de senha',
  'Password update failed': 'Falha na atualização da senha',
  'Password update successful': 'Senha atualizada com sucesso',
  'Email confirmation successful': 'Email confirmado com sucesso',
  'Email confirmation failed': 'Falha na confirmação do email',
  
  // Erros de banco de dados
  'Duplicate key value violates unique constraint': 'Valor duplicado viola restrição única',
  'Foreign key violation': 'Violação de chave estrangeira',
  'Not found': 'Não encontrado',
  'Permission denied': 'Permissão negada',
};

/**
 * Traduz uma mensagem de erro do inglês para o português
 * @param errorMessage Mensagem de erro em inglês
 * @returns Mensagem traduzida ou a mensagem original se não houver tradução
 */
export const translateError = (errorMessage: string): string => {
  // Verificar correspondência exata
  if (errorTranslations[errorMessage]) {
    return errorTranslations[errorMessage];
  }
  
  // Verificar correspondência parcial
  for (const key in errorTranslations) {
    if (errorMessage.includes(key)) {
      return errorTranslations[key];
    }
  }
  
  // Retornar a mensagem original se não houver tradução
  return errorMessage;
};
