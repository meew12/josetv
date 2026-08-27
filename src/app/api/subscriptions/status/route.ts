import { getUserFromRequest } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-helpers";
import { hasActiveSubscription } from "@/lib/config";

// GET /api/subscriptions/status - estado de la suscripción del usuario
export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("No autorizado", 401);

    const sub = user.subscription;
    const active = hasActiveSubscription(sub);

    // Si la suscripción expiró pero está marcada como ACTIVE, sincronizar
    if (sub && sub.status === "ACTIVE" && !active) {
      // No modificamos acá para no hacer writes en GET; el helper lo reporta bien.
    }

    return successResponse({
      hasSubscription: !!sub,
      active,
      subscription: sub
        ? {
            id: sub.id,
            status: sub.status,
            startDate: sub.startDate,
            endDate: sub.endDate,
            autoRenew: sub.autoRenew,
            plan: sub.plan,
            daysLeft: Math.max(
              0,
              Math.ceil(
                (new Date(sub.endDate).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              )
            ),
          }
        : null,
    });
  } catch (err) {
    console.error("[subscriptions/status] error:", err);
    return errorResponse("Error al obtener estado de suscripción", 500);
  }
}
