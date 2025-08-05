import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// -----------------------------------------------------------------------------
// Variáveis de ambiente necessárias (Configurar em Netlify > Site settings):
// -----------------------------------------------------------------------------
// SUPABASE_URL                – URL do seu projeto Supabase
// SUPABASE_SERVICE_ROLE_KEY   – chave Service Role (acesso de escrita)
// OPENPIX_APP_ID              – App ID fornecido pela OpenPix (usado na assinatura)
// -----------------------------------------------------------------------------

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
);

const APP_ID = process.env.OPENPIX_APP_ID as string;

// Gera assinatura HMAC-SHA256 em HEX usando APP_ID como chave
const signBody = (body: string) =>
  crypto.createHmac("sha256", APP_ID).update(body, "utf8").digest("hex");

// Converte status OpenPix → status interno da aplicação
const translateStatus = (status?: string): string => {
  switch ((status || "").toUpperCase()) {
    case "COMPLETED":
      return "Pagamento Confirmado";
    case "EXPIRED":
      return "Expirado";
    case "ACTIVE":
      return "Aguardando Pagamento";
    default:
      return "Aguardando Pagamento";
  }
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const rawBody = event.body || "";
  const receivedSig = event.headers["x-openpix-signature"] || "";
  
  // Log para debug
  console.log("[webhook] Received body:", rawBody);
  console.log("[webhook] Received signature:", receivedSig);
  
  // Se não há APP_ID configurado, aceita qualquer requisição (modo desenvolvimento)
  if (!APP_ID) {
    console.log("[webhook] APP_ID not configured, accepting request");
  } else {
    const expectedSig = signBody(rawBody);
    console.log("[webhook] Expected signature:", expectedSig);
    
    if (receivedSig && receivedSig !== expectedSig) {
      console.log("[webhook] Signature mismatch");
      return { statusCode: 401, body: "Invalid signature" };
    }
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    console.log("[webhook] Invalid JSON:", err);
    return { statusCode: 400, body: "Invalid JSON" };
  }

  console.log("[webhook] Parsed payload:", JSON.stringify(payload, null, 2));

  // Se é um teste da OpenPix, retorna sucesso
  if (payload?.evento === "teste_webhook" || payload?.event?.includes("TEST")) {
    console.log("[webhook] Test webhook received");
    return { statusCode: 200, body: "Test webhook received successfully" };
  }

  const charge = payload?.charge;
  if (!charge) {
    console.log("[webhook] No charge found in payload");
    return { statusCode: 200, body: "No charge to process" };
  }

  // transactionID ou identifier são enviados, fallback para id
  const transactionId = charge.transactionID || charge.identifier || charge.id;
  if (!transactionId) {
    console.log("[webhook] No transactionID found");
    return { statusCode: 200, body: "No transactionID" };
  }

  console.log("[webhook] Processing transaction:", transactionId, "status:", charge.status);

  // Atualiza pedido no Supabase
  const { error } = await supabase
    .from("orders")
    .update({ status: translateStatus(charge.status) })
    .eq("id_transacao", transactionId);

  if (error) {
    console.error("[openpix-webhook] Supabase error", error);
    return { statusCode: 500, body: "Database error" };
  }

  console.log("[webhook] Order updated successfully");
  return { statusCode: 200, body: "ok" };
};
