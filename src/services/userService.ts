import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];

export const createUser = async (userData: UserInsert) => {
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Busca um usuário pelo ID de autenticação.
 * Se o usuário não existir e skipCreation for false, tenta criar o usuário automaticamente.
 * 
 * @param authUserId ID de autenticação do usuário
 * @param skipCreation Se true, não tenta criar o usuário automaticamente
 * @returns Usuário encontrado ou null se não encontrado
 */
export const getUserByAuthId = async (authUserId: string, skipCreation = false): Promise<User | null> => {
  try {
    if (!authUserId) {
      console.error('getUserByAuthId: ID de autenticação não fornecido');
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (error) {
      console.error('getUserByAuthId: Erro ao buscar usuário:', error);
      return null;
    }

    if (data) {
      console.log('Dados do usuário recuperados:', data);
      console.log('Role do usuário:', data.role);
      return data;
    } else {
      if (skipCreation) {
        return null;
      }
      
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('getUserByAuthId: Erro ao verificar usuário na auth:', authError);
        return null;
      } 
      
      if (authData?.user && authData.user.id === authUserId) {
        return await createUserFromAuth(authData.user);
      } else {
        return null;
      }
    }
  } catch (error) {
    console.error('getUserByAuthId: Erro inesperado:', error);
    return null;
  }
};

/**
 * Cria um usuário a partir das informações de autenticação.
 * 
 * @param authUser Dados de autenticação do usuário
 * @returns Usuário criado ou null se não criado
 */
export const createUserFromAuth = async (authUser: any): Promise<User | null> => {
  try {
    if (!authUser || !authUser.id) {
      console.error('createUserFromAuth: Dados de usuário inválidos:', authUser);
      return null;
    }

    const existingUser = await getUserByAuthId(authUser.id, true);
    if (existingUser) {
      return existingUser;
    }
    
    if (authUser.email) {
      const userByEmail = await getUserByEmail(authUser.email);
      if (userByEmail) {
        if (userByEmail.auth_user_id !== authUser.id) {
          try {
            const updatedUser = await updateUser(userByEmail.id, {
              auth_user_id: authUser.id
            });
            return updatedUser;
          } catch (error) {
            console.error('createUserFromAuth: Erro ao atualizar auth_user_id:', error);
            return userByEmail;
          }
        }
        
        return userByEmail;
      }
    }
    
    let userName = '';
    
    if (authUser.user_metadata?.name) {
      userName = authUser.user_metadata.name;
    } else if (authUser.user_metadata?.full_name) {
      userName = authUser.user_metadata.full_name;
    } else if (authUser.email) {
      userName = authUser.email.split('@')[0];
    } else {
      userName = 'Usuário';
    }

    let avatarUrl = null;
    if (authUser.user_metadata?.avatar_url) {
      avatarUrl = authUser.user_metadata.avatar_url;
    }

    let retryCount = 0;
    const maxRetries = 3;
    let insertedUser = null;
    
    while (retryCount < maxRetries && !insertedUser) {
      try {
        const retryExistingUser = await getUserByAuthId(authUser.id, true);
        if (retryExistingUser) {
          return retryExistingUser;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
        
        const { data, error } = await supabase
          .from('users')
          .insert({
            auth_user_id: authUser.id,
            email: authUser.email,
            name: userName,
            avatar_url: avatarUrl,
            role: 'atleta', 
            created_at: new Date().toISOString(),
            onboarding: false
          })
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            const duplicateUser = await getUserByAuthId(authUser.id, true);
            if (duplicateUser) {
              return duplicateUser;
            }
            
            if (authUser.email) {
              const emailUser = await getUserByEmail(authUser.email);
              if (emailUser) {
                return emailUser;
              }
            }
            
            retryCount++;
            continue;
          } else {
            console.error('createUserFromAuth: Erro ao criar usuário:', error);
            throw error;
          }
        } else {
          insertedUser = data;
        }
      } catch (error) {
        console.error(`createUserFromAuth: Erro na tentativa #${retryCount}:`, error);
        retryCount++;
        
        if (retryCount >= maxRetries) {
          throw error;
        }
      }
    }

    return insertedUser;
  } catch (error) {
    console.error('createUserFromAuth: Erro inesperado:', error);
    return null;
  }
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User | null> => {
  try {
    if (!userId) {
      console.error('updateUser: ID do usuário não fornecido');
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('updateUser: Erro ao atualizar usuário:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('updateUser: Erro inesperado:', error);
    throw error;
  }
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  if (!email) {
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('getUserByEmail: Erro ao buscar usuário por email:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('getUserByEmail: Erro ao executar busca:', err);
    return null;
  }
};

export const createUserForService = async (userData: any): Promise<User | null> => {
  try {
    const userDataWithDefaults = {
      ...userData,
      role: 'atleta', 
      onboarding: false
    };

    const { data: newUser, error } = await supabase
      .from('users')
      .insert(userDataWithDefaults)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { 
        if (userData.email) {
          const existingUser = await getUserByEmail(userData.email);
          if (existingUser) {
            return existingUser;
          }
        }
        
        if (userData.auth_user_id) {
          const existingUser = await getUserByAuthId(userData.auth_user_id);
          if (existingUser) {
            return existingUser;
          }
        }
      }
      
      return null;
    }

    return newUser;
  } catch (err) {
    console.error('createUserForService: Erro geral:', err);
    return null;
  }
};

export const updateUserRole = async (userId: string, role: string): Promise<User | null> => {
  try {
    const user = await getUserByAuthId(userId);
    
    if (!user) {
      console.error(`updateUserRole: Usuário com auth_user_id ${userId} não encontrado`);
      throw new Error('Usuário não encontrado');
    }
    
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('updateUserRole: Erro ao atualizar perfil:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('updateUserRole: Erro geral:', err);
    throw err;
  }
};

export const updateUserOnboarding = async (userId: string): Promise<User | null> => {
  try {
    const user = await getUserByAuthId(userId);
    
    if (!user) {
      console.error(`updateUserOnboarding: Usuário com auth_user_id ${userId} não encontrado`);
      throw new Error('Usuário não encontrado');
    }
    
    const { data, error } = await supabase
      .from('users')
      .update({ onboarding: true })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('updateUserOnboarding: Erro ao atualizar onboarding:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('updateUserOnboarding: Erro geral:', err);
    throw err;
  }
};
