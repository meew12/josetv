// Helper de integración con MercadoPago
// Usa REST API directamente con fetch (sin SDK externo)
// Lee el token desde la DB (configurado desde el panel admin) con fallback a env vars
import { getMercadoPagoConfig } from "./config";

const MP_API_BASE = "https://api.mercadopago.com";

export interface MPItem {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  unit_price: number;
  currency_id?: string; // default ARS
  picture_url?: string;
}

export interface MPPayer {
  name?: string;
  surname?: string;
  email?: string;
  phone?: { area_code?: string; number?: string };
  identification?: { type?: string; number?: string };
}

export interface MPBackUrls {
  success?: string;
  pending?: string;
  failure?: string;
}

export interface CreatePreferenceInput {
  items: MPItem[];
  payer?: MPPayer;
  externalReference: string;
  backUrls?: MPBackUrls;
  notificationUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface PreferenceResult {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint?: string;
  raw?: unknown;
}

// Crear preferencia de pago en MercadoPago
export async function createPreference(
  input: CreatePreferenceInput
): Promise<PreferenceResult> {
  const config = await getMercadoPagoConfig();
  if (!config.token) {
    throw new Error("MP_ACCESS_TOKEN no configurado. Configuralo desde el panel admin en Ajustes.");
  }

  const body = {
    items: input.items.map((it) => ({
      id: it.id,
      title: it.title,
      description: it.description || "",
      quantity: it.quantity,
      unit_price: it.unit_price,
      currency_id: it.currency_id || "ARS",
      picture_url: it.picture_url || "",
    })),
    payer: input.payer
      ? {
          name: input.payer.name,
          surname: input.payer.surname,
          email: input.payer.email,
          phone: input.payer.phone,
          identification: input.payer.identification,
        }
      : undefined,
    external_reference: input.externalReference,
    back_urls: input.backUrls || {
      success: "/api/payments/mercadopago/success",
      pending: "/api/payments/mercadopago/pending",
      failure: "/api/payments/mercadopago/failure",
    },
    notification_url: input.notificationUrl,
    auto_return: "approved",
    metadata: input.metadata || {},
    statement_descriptor: "JOSE DEMO",
  };

  const res = await fetch(`${MP_API_BASE}/checkout/preferences`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.token}`,
      "X-Idempotency-Key": input.externalReference,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      `MercadoPago create preference failed: ${data?.message || res.status}`
    );
  }

  const sandboxInitPoint = data?.sandbox_init_point as string | undefined;
  const initPoint = (config.sandbox && sandboxInitPoint) ||
    (data?.init_point as string) ||
    "";

  return {
    preferenceId: data?.id as string,
    initPoint,
    sandboxInitPoint,
    raw: data,
  };
}

// Obtener info de un pago desde MercadoPago
export async function getPayment(mpId: string): Promise<{
  id: number;
  status: string;
  status_detail: string;
  transaction_amount: number;
  currency_id: string;
  external_reference?: string;
  payer_id?: number;
  payment_method_id?: string;
  date_approved?: string | null;
  raw: unknown;
}> {
  const config = await getMercadoPagoConfig();
  if (!config.token) {
    throw new Error("MP_ACCESS_TOKEN no configurado");
  }

  const res = await fetch(`${MP_API_BASE}/v1/payments/${mpId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.token}`,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `MercadoPago get payment failed: ${data?.message || res.status}`
    );
  }

  return {
    id: data?.id,
    status: data?.status,
    status_detail: data?.status_detail,
    transaction_amount: data?.transaction_amount,
    currency_id: data?.currency_id,
    external_reference: data?.external_reference,
    payer_id: data?.payer_id,
    payment_method_id: data?.payment_method_id,
    date_approved: data?.date_approved,
    raw: data,
  };
}

// Obtener merchant_order desde MercadoPago
export async function getMerchantOrder(orderId: string): Promise<{
  id: number;
  status: string;
  external_reference?: string;
  payments: Array<{ id: number; status: string; transaction_amount: number }>;
  raw: unknown;
}> {
  const config = await getMercadoPagoConfig();
  if (!config.token) {
    throw new Error("MP_ACCESS_TOKEN no configurado");
  }

  const res = await fetch(`${MP_API_BASE}/merchant_orders/${orderId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${config.token}` },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `MercadoPago get merchant order failed: ${data?.message || res.status}`
    );
  }

  return {
    id: data?.id,
    status: data?.status,
    external_reference: data?.external_reference,
    payments: data?.payments || [],
    raw: data,
  };
}

export async function isMercadoPagoConfigured(): Promise<boolean> {
  const config = await getMercadoPagoConfig();
  return Boolean(config.token);
}
