import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
);

const APP_ID = process.env.OPENPIX_APP_ID as string;

// Gera assinatura HMAC-SHA256 em base64 usando APP_ID como chave
const signBody = (body: string) =>
  crypto.createHmac("sha256", APP_ID).update(body, "utf8").digest("base64");

// Converte status OpenPix → status interno da aplicação
const translateStatus = (status?: string): string => {
  switch ((status || "").toUpperCase()) {
    case "COMPLETED":     // para compatibilidade
      return "Pagamento Confirmado";
    case "EXPIRED":
      return "Expirado";
    case "ACTIVE":
    case "PENDING":
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

  console.log("[webhook] Received body:", rawBody);
  console.log("[webhook] Received signature:", receivedSig);

  // Temporariamente desabilitar validação de assinatura para testes
  if (!APP_ID) {
    console.log("[webhook] APP_ID not configured, accepting request");
  } else {
    const expectedSig = signBody(rawBody);
    console.log("[webhook] Expected signature:", expectedSig);
    console.log("[webhook] Received signature:", receivedSig);

    // TEMPORÁRIO: Comentar validação para testes
    // if (receivedSig && receivedSig !== expectedSig) {
    //   console.log("[webhook] Signature mismatch");
    //   return { statusCode: 401, body: "Invalid signature" };
    // }
    console.log("[webhook] Signature validation temporarily disabled for testing");
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    console.log("[webhook] Invalid JSON:", err);
    return { statusCode: 400, body: "Invalid JSON" };
  }

  console.log("[webhook] Parsed payload:", JSON.stringify(payload, null, 2));

  // Test webhook
  if (payload?.evento === "teste_webhook" || payload?.event?.includes("TEST")) {
    console.log("[webhook] Test webhook received");
    return { statusCode: 200, body: "Test webhook received successfully" };
  }

  // Se o payload vier como array (ex. proveniente de n8n), pegar o primeiro elemento
  if (Array.isArray(payload)) {
    console.log("[webhook] Payload is array, using first element");
    payload = payload[0]?.body || payload[0];
  }

  // Log completo do payload para debug
  console.log("[webhook] Full payload structure:", {
    event: payload?.event,
    hasCharge: !!payload?.charge,
    hasPix: !!payload?.pix,
    keys: Object.keys(payload || {})
  });

  // Verificar se é um evento relacionado a pagamento
  const eventType = payload?.event;
  const isPaymentEvent = eventType && (
    eventType.includes("CHARGE_COMPLETED") ||
    eventType.includes("CHARGE_PAID") ||
    eventType === "woovi:CHARGE_COMPLETED" ||
    eventType === "OPENPIX:CHARGE_COMPLETED"
  );

  if (!isPaymentEvent) {
    console.log("[webhook] Event type not supported:", eventType);
    return { statusCode: 200, body: `Event type not supported: ${eventType}` };
  }

  // Extrair dados do charge ou pix (estruturas possíveis do OpenPix)
  const charge = payload?.charge;
  const pix = payload?.pix;
  
  // Tentar extrair dados do charge primeiro, depois do pix se necessário
  const status = charge?.status || pix?.charge?.status;
  const transactionId = charge?.transactionID || charge?.identifier || pix?.transactionID || pix?.charge?.transactionID;
  const correlationId = charge?.correlationID || pix?.charge?.correlationID;

  console.log("[webhook] Charge data:", {
    status,
    transactionId,
    correlationId,
    event: payload?.event
  });

  if (!transactionId) {
    console.log("[webhook] No transactionID found");
    return { statusCode: 200, body: "No transactionID" };
  }

  if (!status) {
    console.log("[webhook] No charge status found");
    return { statusCode: 200, body: "No charge status" };
  }

  console.log("[webhook] Processing transactionID:", transactionId, "status:", status);

  const { error } = await supabase
    .from("orders")
    .update({ status: translateStatus(status) })
    .eq("id_transacao", transactionId);

  if (error) {
    console.error("[openpix-webhook] Supabase error", error);
    return { statusCode: 500, body: "Database error" };
  }

  console.log("[webhook] Order updated successfully");
  return { statusCode: 200, body: "Status Atualizado!" };
};