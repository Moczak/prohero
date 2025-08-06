

/* eslint-disable @typescript-eslint/ban-types */
/**
 * Serviço de integração com a OpenPix.
 * Fornece helpers para:
 *  • Criar subcontas (split sub-account)
 *  • Gerar cobranças Pix com split
 */

// -----------------------------------------------------------------------------
// Tipagens
// -----------------------------------------------------------------------------
export interface Split {
  pixKey: string; // chave Pix que receberá este valor
  value: number;  // valor em centavos
}

export interface CreateChargeParams {
  value: number;              // total em centavos
  correlationID: string;      // uuid v4 único por cobrança
  splits: Split[];            // definição de splits
  additionalInfo?: Record<string, unknown>;
}

export interface CreateChargeResponse {
  charge: {
    id: string;
    correlationID: string;
    value: number;
    status: string;
    expiresDate: string;
    brCode: string;      // código BR Code para copiar e colar
    qrCodeImage: string; // imagem base64 do QR Code
    splits: Split[];
  };
}

export interface CreateSubAccountParams {
  name: string;
  pixKey: string;
}

export interface UpdateSubAccountParams {
  name?: string;
  pixKey?: string;
}

export interface SubAccountResponse {
  subAccount: {
    id: string;
    name: string;
    pixKey: string;
  };
}

export interface GetSubAccountsResponse {
  subAccounts: {
    id: string;
    name: string;
    pixKey: string;
  }[];
}

export interface GetChargeResponse {
  charge: {
    id: string;
    correlationID: string;
    value: number;
    status: string;
    expiresDate: string;
    brCode: string;
    qrCodeImage: string;
    splits?: Split[];
  };
}

export interface GetSubAccountBalanceResponse {
  subAccount: {
    name: string;
    pixKey: string;
    balance: number; // valor em centavos
  };
}

export interface WithdrawSubAccountResponse {
  transaction: {
    status: string;
    value: number; // valor em centavos
    correlationID: string;
    destinationAlias: string;
    comment?: string;
  };
}

export interface Transaction {
  customer?: {
    name: string;
    email: string;
    phone: string;
    taxID: {
      taxID: string;
      type: string;
    };
    correlationID: string;
  };
  payer?: {
    name: string;
    email: string;
    phone: string;
    taxID: {
      taxID: string;
      type: string;
    };
    correlationID: string;
  };
  charge?: {
    status: string;
    customer: string;
    correlationID: string;
    createdAt: string;
    updatedAt: string;
  };
  withdraw?: {
    value: number;
    time: string;
    infoPagador: string;
    endToEndId: string;
  };
  type: 'PAYMENT' | 'WITHDRAW';
  infoPagador: string;
  value: number;
  time: string;
  transactionID: string;
  endToEndId: string;
}

export interface GetTransactionsResponse {
  pageInfo: {
    skip: number;
    limit: number;
    totalCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  transactions: Transaction[];
}

// -----------------------------------------------------------------------------
// Config
// -----------------------------------------------------------------------------
const OPENPIX_BASE_URL =
  (import.meta.env.VITE_OPENPIX_BASE_URL as string) ??
  "https://api.openpix.com.br/api/v1";

const APP_ID = import.meta.env.VITE_OPENPIX_APP_ID as string;

console.log('[OpenPix Config] VITE_OPENPIX_BASE_URL:', import.meta.env.VITE_OPENPIX_BASE_URL);
console.log('[OpenPix Config] OPENPIX_BASE_URL final:', OPENPIX_BASE_URL);
console.log('[OpenPix Config] VITE_OPENPIX_APP_ID:', import.meta.env.VITE_OPENPIX_APP_ID ? 'DEFINIDO' : 'NÃO DEFINIDO');
console.log('[OpenPix Config] APP_ID final:', APP_ID ? 'DEFINIDO' : 'NÃO DEFINIDO');

if (!APP_ID) {
  // eslint-disable-next-line no-console
  console.warn(
    "VITE_OPENPIX_APP_ID não definido nos env. A integração OpenPix pode falhar."
  );
}

const defaultHeaders = {
  Accept: "application/json",
  "Content-Type": "application/json",
  Authorization: APP_ID,
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Normaliza uma chave Pix - apenas remove espaços extras.
 * A chave deve ser mantida exatamente como o usuário preencheu.
 */
export const normalizePixKey = (pixKey: string): string => {
  if (!pixKey) return pixKey;
  
  // Apenas remove espaços no início e fim, mantendo a chave exatamente como digitada
  return pixKey.trim();
};
/**
 * Busca todas as subcontas.
 */
export const getSubAccounts = async (): Promise<GetSubAccountsResponse> => {
  if (!APP_ID) throw new Error("Credenciais OpenPix não configuradas.");

  const res = await fetch(`${OPENPIX_BASE_URL}/subaccount`, {
    method: "GET",
    headers: defaultHeaders,
  });

  if (!res.ok) {
    const body = await res.text();
    console.log(`[getSubAccounts] Status: ${res.status}, Body: ${body}`);
    
    // Tratar todos os casos onde não há subcontas como sucesso com array vazio
    if (
      res.status === 404 || 
      body.includes('Não foram encontradas subcontas') ||
      body.includes('não foram encontradas subcontas') ||
      body.includes('No subaccounts found') ||
      body.includes('subcontas não encontradas') ||
      body.includes('"error":"Não foram encontradas subcontas')
    ) {
      console.log('[getSubAccounts] Nenhuma subconta encontrada, retornando array vazio');
      return { subAccounts: [] };
    }
    
    throw new Error(`Falha ao buscar subcontas: ${res.status} - ${body}`);
  }

  const result = await res.json();
  
  // Garantir que sempre retornamos um array, mesmo se a API retornar formato diferente
  if (!result.subAccounts) {
    return { subAccounts: [] };
  }
  
  return result as GetSubAccountsResponse;
};

/**
 * Atualiza uma subconta existente.
 */
export const updateSubAccount = async (
  subAccountId: string,
  params: UpdateSubAccountParams
): Promise<SubAccountResponse> => {
  if (!APP_ID) throw new Error("Credenciais OpenPix não configuradas.");

  const res = await fetch(`${OPENPIX_BASE_URL}/subaccount/${subAccountId}`, {
    method: "PUT",
    headers: defaultHeaders,
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Falha ao atualizar subconta: ${res.status} - ${body}`);
  }

  return (await res.json()) as SubAccountResponse;
};

/**
 * Deleta uma subconta existente.
 */
export const deleteSubAccount = async (subAccountId: string): Promise<void> => {
  if (!APP_ID) throw new Error("Credenciais OpenPix não configuradas.");

  const res = await fetch(`${OPENPIX_BASE_URL}/subaccount/${subAccountId}`, {
    method: "DELETE",
    headers: defaultHeaders,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Falha ao deletar subconta: ${res.status} - ${body}`);
  }
};

/**
 * Cria uma subconta associada a uma chave Pix.
 */
export const createSubAccount = async (
  params: CreateSubAccountParams
): Promise<SubAccountResponse> => {
  if (!APP_ID) throw new Error("Credenciais OpenPix não configuradas.");

  console.log('[createSubAccount] Iniciando criação de subconta');
  console.log('[createSubAccount] URL:', `${OPENPIX_BASE_URL}/subaccount`);
  console.log('[createSubAccount] Headers:', defaultHeaders);
  console.log('[createSubAccount] Params enviados:', JSON.stringify(params, null, 2));

  const res = await fetch(`${OPENPIX_BASE_URL}/subaccount`, {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify(params),
  });

  console.log('[createSubAccount] Status da resposta:', res.status);
  console.log('[createSubAccount] Headers da resposta:', Object.fromEntries(res.headers.entries()));

  const responseText = await res.text();
  console.log('[createSubAccount] Resposta completa (texto):', responseText);

  if (!res.ok) {
    console.error('[createSubAccount] Erro na criação:', res.status, responseText);
    
    // Tentar extrair mensagem de erro mais amigável
    let errorMessage = responseText;
    try {
      const errorJson = JSON.parse(responseText);
      if (errorJson.error) {
        errorMessage = errorJson.error;
      } else if (errorJson.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      // Se não conseguir fazer parse, usar o texto original
    }
    
    throw new Error(`Falha ao criar subconta: ${res.status} - ${errorMessage}`);
  }

  let responseJson;
  try {
    responseJson = JSON.parse(responseText);
    console.log('[createSubAccount] Resposta JSON:', JSON.stringify(responseJson, null, 2));
  } catch (parseError) {
    console.error('[createSubAccount] Erro ao fazer parse do JSON:', parseError);
    console.error('[createSubAccount] Texto da resposta:', responseText);
    throw new Error(`Resposta inválida da API: ${responseText}`);
  }

  // Verificar se a resposta está vazia ou não contém os dados esperados
  if (!responseJson || Object.keys(responseJson).length === 0) {
    console.error('[createSubAccount] Resposta vazia da API');
    throw new Error('Falha ao cadastrar a chave, Tente novamente mais tarde. Isso pode ser por conta de que já houve registro dessa chave mais de uma vez');
  }

  // Verificar se contém a estrutura esperada
  if (!responseJson.subAccount) {
    console.error('[createSubAccount] Resposta não contém subAccount:', responseJson);
    throw new Error('Falha ao cadastrar a chave, Tente novamente mais tarde. Isso pode ser por conta de que já houve registro dessa chave mais de uma vez');
  }

  return responseJson as SubAccountResponse;
};

/**
 * Cria uma nova subconta sempre. Não busca subcontas existentes.
 * O nome da subconta será sempre o userId.
 */
export const manageUserSubAccount = async (
  userId: string,
  pixKey: string,
  pixKeyType: string = 'EMAIL'
): Promise<SubAccountResponse> => {
  if (!APP_ID) throw new Error("Credenciais OpenPix não configuradas.");

  // Normalizar a chave Pix (apenas remove espaços extras)
  const normalizedPixKey = normalizePixKey(pixKey);
  console.log(`[manageUserSubAccount] Usuário: ${userId}`);
  console.log(`[manageUserSubAccount] Chave Pix original: ${pixKey}, normalizada: ${normalizedPixKey}`);
  console.log(`[manageUserSubAccount] Tipo da chave: ${pixKeyType}`);

  try {
    // Sempre criar uma nova subconta
    console.log(`[manageUserSubAccount] Criando nova subconta para usuário: ${userId}`);
    return await createSubAccount({
      name: userId,
      pixKey: normalizedPixKey
    });
  } catch (createError) {
    console.error('[manageUserSubAccount] Erro ao criar subconta:', createError);
    throw createError;
  }
};

/**
 * Cria uma cobrança Pix com split.
 */
export const createChargeWithSplit = async (
  params: CreateChargeParams
): Promise<CreateChargeResponse> => {
  if (!APP_ID) throw new Error("Credenciais OpenPix não configuradas.");

  // Validação rápida: soma dos splits não deve exceder valor total
  const totalSplits = params.splits.reduce((acc, s) => acc + s.value, 0);
  if (totalSplits > params.value) {
    throw new Error(
      `Soma dos splits (${totalSplits}) maior que o valor total (${params.value}).`
    );
  }

  const body = {
    value: params.value,
    correlationID: params.correlationID,
    splits: params.splits,
    ...(params.additionalInfo ? { additionalInfo: params.additionalInfo } : {}),
  };

  const res = await fetch(`${OPENPIX_BASE_URL}/charge`, {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Falha ao criar cobrança: ${res.status} - ${errorBody}`);
  }

  return (await res.json()) as CreateChargeResponse;
};

/**
 * Busca uma cobrança existente pelo ID da transação.
 */
export const getCharge = async (
  transactionId: string
): Promise<GetChargeResponse> => {
  if (!APP_ID) throw new Error("Credenciais OpenPix não configuradas.");

  const res = await fetch(`${OPENPIX_BASE_URL}/charge/${transactionId}`, {
    method: "GET",
    headers: defaultHeaders,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Falha ao buscar cobrança: ${res.status} - ${errorBody}`);
  }

  return (await res.json()) as GetChargeResponse;
};

/**
 * Busca o status de uma cobrança pelo ID da transação.
 * Alias para getCharge para facilitar o uso.
 */
export const getChargeStatus = async (
  transactionId: string
): Promise<GetChargeResponse> => {
  return await getCharge(transactionId);
};

/**
 * Busca o saldo de uma subconta pela chave Pix.
 */
export const getSubAccountBalance = async (
  pixKey: string
): Promise<GetSubAccountBalanceResponse> => {
  console.log('[OpenPix] Buscando saldo da subconta:', pixKey);
  
  const res = await fetch(`${OPENPIX_BASE_URL}/subaccount/${pixKey}`, {
    method: 'GET',
    headers: defaultHeaders,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error('[OpenPix] Erro ao buscar saldo da subconta:', res.status, errorBody);
    throw new Error(`Falha ao buscar saldo da subconta: ${res.status} - ${errorBody}`);
  }

  const data = await res.json() as GetSubAccountBalanceResponse;
  console.log('[OpenPix] Saldo da subconta obtido:', data);
  return data;
};

/**
 * Realiza o saque de uma subconta pela chave Pix.
 * Se value não for especificado, realiza saque integral.
 */
export const withdrawSubAccount = async (
  pixKey: string,
  value?: number
): Promise<WithdrawSubAccountResponse> => {
  if (!APP_ID) throw new Error("Credenciais OpenPix não configuradas.");
  
  console.log('[OpenPix] Realizando saque da subconta:', pixKey, 'valor:', value);

  const body = value ? { value } : {};

  const res = await fetch(`${OPENPIX_BASE_URL}/subaccount/${pixKey}/withdraw`, {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error('[OpenPix] Erro ao realizar saque da subconta:', res.status, errorBody);
    throw new Error(`Falha ao realizar saque da subconta: ${res.status} - ${errorBody}`);
  }

  const data = await res.json() as WithdrawSubAccountResponse;
  console.log('[OpenPix] Saque realizado com sucesso:', data);
  return data;
};

/**
 * Busca o histórico de transações.
 * @param params - Parâmetros de consulta opcionais
 * @returns Promise com a resposta das transações
 */
export const getTransactions = async (params?: {
  start?: string; // Data início no formato RFC 3339 (ex: 2020-01-01T00:00:00Z)
  end?: string;   // Data fim no formato RFC 3339 (ex: 2020-12-01T17:00:00Z)
  charge?: string; // ID da cobrança para filtrar transações relacionadas
  pixQrCode?: string; // ID do QR Code para filtrar transações relacionadas
  withdrawal?: string; // ID do saque para filtrar transações relacionadas
  skip?: number; // Número de registros para pular (paginação)
  limit?: number; // Limite de registros por página
}): Promise<GetTransactionsResponse> => {
  if (!APP_ID) throw new Error("Credenciais OpenPix não configuradas.");

  // Constrói os parâmetros da query string
  const queryParams = new URLSearchParams();
  if (params?.start) queryParams.append('start', params.start);
  if (params?.end) queryParams.append('end', params.end);
  if (params?.charge) queryParams.append('charge', params.charge);
  if (params?.pixQrCode) queryParams.append('pixQrCode', params.pixQrCode);
  if (params?.withdrawal) queryParams.append('withdrawal', params.withdrawal);
  if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
  if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());

  const queryString = queryParams.toString();
  const url = `${OPENPIX_BASE_URL}/transaction${queryString ? `?${queryString}` : ''}`;

  console.log(`[OpenPix] Buscando transações: ${url}`);

  const res = await fetch(url, {
    method: "GET",
    headers: defaultHeaders,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`[OpenPix] Erro ao buscar transações: ${res.status} - ${errorBody}`);
    throw new Error(`Falha ao buscar transações: ${res.status} - ${errorBody}`);
  }

  const response = (await res.json()) as GetTransactionsResponse;
  console.log(`[OpenPix] Transações encontradas: ${response.transactions?.length || 0}`);
  
  return response;
};

