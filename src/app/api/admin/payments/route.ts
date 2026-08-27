import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-helpers";

// GET /api/admin/payments - listar todos los pagos (con info de usuario)
export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("No autorizado", 401);
    if (user.role !== "ADMIN") return errorResponse("Acceso denegado", 403);

    const url = new URL(req.url);
    const sp = url.searchParams;
    const limit = Math.min(
      200,
      Math.max(1, parseInt(sp.get("limit") || "50", 10) || 50)
    );
    const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);

    const where: any = {};
    const status = sp.get("status");
    if (status) where.status = status.toUpperCase();

    const [items, total] = await Promise.all([
      db.payment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          user: { select: { id: true, email: true, name: true } },
          subscription: { include: { plan: true } },
        },
      }),
      db.payment.count({ where }),
    ]);

    return successResponse({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[admin/payments/list] error:", err);
    return errorResponse("Error al obtener pagos", 500);
  }
}
