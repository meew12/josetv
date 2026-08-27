import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-helpers";

// GET /api/payments/[id] - detalle de un pago
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("No autorizado", 401);

    const payment = await db.payment.findUnique({
      where: { id },
      include: { subscription: { include: { plan: true } } },
    });

    if (!payment) return errorResponse("Recurso no encontrado", 404);

    // El usuario solo puede ver sus propios pagos salvo admin
    if (payment.userId !== user.id && user.role !== "ADMIN") {
      return errorResponse("Acceso denegado", 403);
    }

    return successResponse(payment);
  } catch (err) {
    console.error("[payments/get] error:", err);
    return errorResponse("Error al obtener pago", 500);
  }
}
