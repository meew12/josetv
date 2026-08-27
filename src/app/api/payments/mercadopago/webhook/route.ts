import { db } from "@/lib/db";
import { getPayment, getMerchantOrder } from "@/lib/mercadopago";
import { isMercadoPagoConfigured } from "@/lib/mercadopago";
import { NextResponse } from "next/server";

// Helper: activar o extender suscripción del usuario tras pago aprobado.
async function activateSubscription(paymentId: string) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { user: { include: { subscription: true } } },
  });
  if (!payment) return;
  if (payment.status === "APPROVED") return; // idempotencia

  // Buscar el plan: si ya hay subscriptionId, usar su plan; si no, buscar por
  // mapeo amount/currency -> falla si no coincide. Preferimos usar metadata
  // external_reference = paymentId y plan guardado en subscription si existe.
  let planId: string | null = null;

  if (payment.subscriptionId) {
    const sub = await db.subscription.findUnique({
      where: { id: payment.subscriptionId },
    });
    if (sub) planId = sub.planId;
  }

  // Si no tenemos planId vía subscription, lo inferimos del monto buscando
  // planes activos con ese precio (best-effort, no es ideal pero útil en demo).
  if (!planId) {
    const candidate = await db.plan.findFirst({
      where: { price: payment.amount, currency: payment.currency },
    });
    if (candidate) planId = candidate.id;
  }

  if (!planId) {
    console.warn("[webhook] no se pudo determinar plan para payment", payment.id);
    await db.payment.update({
      where: { id: payment.id },
      data: { status: "APPROVED" },
    });
    return;
  }

  const plan = await db.plan.findUnique({ where: { id: planId } });
  if (!plan) return;

  const user = payment.user;
  const now = new Date();
  const durationMs = plan.durationDays * 24 * 60 * 60 * 1000;

  if (
    user.subscription &&
    user.subscription.status === "ACTIVE" &&
    new Date(user.subscription.endDate).getTime() > now.getTime()
  ) {
    const newEnd = new Date(user.subscription.endDate.getTime() + durationMs);
    const updatedSub = await db.subscription.update({
      where: { id: user.subscription.id },
      data: { status: "ACTIVE", endDate: newEnd, planId: plan.id },
    });
    await db.payment.update({
      where: { id: payment.id },
      data: { status: "APPROVED", subscriptionId: updatedSub.id },
    });
    return;
  }

  // Crear nueva suscripción
  const newSub = await db.subscription.create({
    data: {
      userId: user.id,
      planId: plan.id,
      status: "ACTIVE",
      startDate: now,
      endDate: new Date(now.getTime() + durationMs),
    },
  });

  await db.payment.update({
    where: { id: payment.id },
    data: { status: "APPROVED", subscriptionId: newSub.id },
  });
}

// POST /api/payments/mercadopago/webhook
// Recibe notificaciones de MercadoPago
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const sp = url.searchParams;
    const topic = sp.get("topic") || sp.get("type");
    const idParam = sp.get("id") || sp.get("data_id");

    let body: any = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }

    // Tolerar body con { type, data: { id } } (formato oficial MP)
    const type = topic || body?.type;
    const mpId =
      idParam || body?.data?.id || body?.resource?.split("/").pop() || null;

    // Siempre responder 200 rápido a MP
    if (!type || !mpId) {
      return NextResponse.json({ received: true, ignored: true });
    }

    if (!isMercadoPagoConfigured()) {
      // Sin MP configurado: no hacemos nada (modo demo no usa webhook)
      return NextResponse.json({ received: true, demo: true });
    }

    if (type === "payment") {
      // Obtener info del pago desde MP
      try {
        const mp = await getPayment(String(mpId));
        // Buscar Payment local por mercadopagoId
        const local = await db.payment.findFirst({
          where: { mercadopagoId: String(mpId) },
        });

        if (local) {
          // Idempotencia: si ya está APPROVED, no reprocesar
          if (local.status === "APPROVED") {
            return NextResponse.json({ received: true, duplicate: true });
          }

          if (mp.status === "approved") {
            await activateSubscription(local.id);
          } else if (mp.status === "rejected" || mp.status === "cancelled") {
            await db.payment.update({
              where: { id: local.id },
              data: { status: mp.status === "rejected" ? "REJECTED" : "CANCELLED" },
            });
          }
        } else if (mp.external_reference) {
          // Buscar por external_reference (debería ser el paymentId local)
          const byExtRef = await db.payment.findUnique({
            where: { id: String(mp.external_reference) },
          });
          if (byExtRef) {
            await db.payment.update({
              where: { id: byExtRef.id },
              data: {
                mercadopagoId: String(mpId),
                preferenceId: byExtRef.preferenceId,
              },
            });
            if (mp.status === "approved") {
              if (byExtRef.status !== "APPROVED") {
                await activateSubscription(byExtRef.id);
              }
            } else if (mp.status === "rejected") {
              await db.payment.update({
                where: { id: byExtRef.id },
                data: { status: "REJECTED" },
              });
            } else if (mp.status === "cancelled") {
              await db.payment.update({
                where: { id: byExtRef.id },
                data: { status: "CANCELLED" },
              });
            }
          }
        }
      } catch (e) {
        console.error("[webhook] getPayment error:", e);
      }
    } else if (type === "merchant_order") {
      try {
        const order = await getMerchantOrder(String(mpId));
        // Para merchant_orders, procesar el primer pago approved asociado
        const approved = order.payments.find((p) => p.status === "approved");
        if (approved && order.external_reference) {
          const local = await db.payment.findUnique({
            where: { id: String(order.external_reference) },
          });
          if (local && local.status !== "APPROVED") {
            await db.payment.update({
              where: { id: local.id },
              data: { mercadopagoId: String(approved.id) },
            });
            await activateSubscription(local.id);
          }
        }
      } catch (e) {
        console.error("[webhook] getMerchantOrder error:", e);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook] error:", err);
    return NextResponse.json(
      { error: "Error procesando webhook" },
      { status: 500 }
    );
  }
}
