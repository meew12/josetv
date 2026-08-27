import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import {
  createPreference,
  isMercadoPagoConfigured,
} from "@/lib/mercadopago";
import { MP_SANDBOX } from "@/lib/config";
import { errorResponse, successResponse } from "@/lib/api-helpers";

// POST /api/payments/mercadopago/create
// Body: { planId }
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("No autorizado", 401);

    const body = await req.json().catch(() => ({}));
    const planId = String(body?.planId || "").trim();
    if (!planId) return errorResponse("planId requerido", 400);

    const plan = await db.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.active) {
      return errorResponse("Plan no encontrado", 404);
    }

    // Crear Payment pendiente
    const payment = await db.payment.create({
      data: {
        userId: user.id,
        amount: plan.price,
        currency: plan.currency,
        status: "PENDING",
        method: "MERCADOPAGO",
      },
    });

    // Modo demo: sin credenciales MP, auto-aprobar
    if (!isMercadoPagoConfigured()) {
      // Auto-aprobar pago en modo demo
      await activateSubscriptionDemo(payment.id, plan.id);
      const demoInitPoint = `/api/payments/mercadopago/success?demo=true&paymentId=${payment.id}`;
      return successResponse({
        init_point: demoInitPoint,
        preferenceId: `demo-${payment.id}`,
        paymentId: payment.id,
        demo: true,
        sandbox: true,
      });
    }

    // Modo real: crear preferencia en MercadoPago
    const externalRef = payment.id;
    const backUrls = {
      success: `/api/payments/mercadopago/success?paymentId=${payment.id}`,
      pending: `/api/payments/mercadopago/pending?paymentId=${payment.id}`,
      failure: `/api/payments/mercadopago/failure?paymentId=${payment.id}`,
    };

    const pref = await createPreference({
      items: [
        {
          id: plan.id,
          title: `${plan.name} - JOSE DEMO`,
          description: plan.description || `Suscripción ${plan.name}`,
          quantity: 1,
          unit_price: plan.price,
          currency_id: plan.currency,
        },
      ],
      payer: {
        name: user.name,
        email: user.email,
      },
      externalReference: externalRef,
      backUrls,
      metadata: {
        paymentId: payment.id,
        userId: user.id,
        planId: plan.id,
        sandbox: MP_SANDBOX,
      },
    });

    // Guardar preferenceId en Payment
    await db.payment.update({
      where: { id: payment.id },
      data: { preferenceId: pref.preferenceId },
    });

    return successResponse({
      init_point: pref.initPoint,
      preferenceId: pref.preferenceId,
      paymentId: payment.id,
      sandbox: MP_SANDBOX,
    });
  } catch (err) {
    console.error("[payments/mp/create] error:", err);
    return errorResponse("Error al crear preferencia de pago", 500);
  }
}

// Helper local para activar suscripción en modo demo
async function activateSubscriptionDemo(paymentId: string, planId: string) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { user: { include: { subscription: true } } },
  });
  if (!payment) return;
  if (payment.status === "APPROVED") return;

  const plan = await db.plan.findUnique({ where: { id: planId } });
  if (!plan) return;

  const user = payment.user;
  const now = new Date();
  const durationMs = plan.durationDays * 24 * 60 * 60 * 1000;

  if (user.subscription && user.subscription.status === "ACTIVE" && new Date(user.subscription.endDate).getTime() > now.getTime()) {
    const newEnd = new Date(user.subscription.endDate.getTime() + durationMs);
    const updatedSub = await db.subscription.update({
      where: { id: user.subscription.id },
      data: { status: "ACTIVE", endDate: newEnd },
    });
    await db.payment.update({
      where: { id: payment.id },
      data: { status: "APPROVED", subscriptionId: updatedSub.id },
    });
    return;
  }

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
