import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-helpers";

// GET /api/admin/users - listar usuarios con paginación y búsqueda
export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("No autorizado", 401);
    if (user.role !== "ADMIN") return errorResponse("Acceso denegado", 403);

    const url = new URL(req.url);
    const sp = url.searchParams;
    const limit = Math.min(
      100,
      Math.max(1, parseInt(sp.get("limit") || "20", 10) || 20)
    );
    const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
    const search = sp.get("search")?.trim();

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        include: { subscription: { include: { plan: true } } },
      }),
      db.user.count({ where }),
    ]);

    // No devolver passwordHash
    const safe = items.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      avatar: u.avatar,
      banned: u.banned,
      adultVerified: u.adultVerified,
      token: u.token,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      subscription: u.subscription,
    }));

    return successResponse({
      items: safe,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[admin/users/list] error:", err);
    return errorResponse("Error al obtener usuarios", 500);
  }
}
