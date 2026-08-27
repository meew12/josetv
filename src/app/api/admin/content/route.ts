import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-helpers";

// GET /api/admin/content - listar todo el contenido (incluido adulto) para admin
export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("No autorizado", 401);
    if (user.role !== "ADMIN") return errorResponse("Acceso denegado", 403);

    const url = new URL(req.url);
    const sp = url.searchParams;
    const limit = Math.min(
      200,
      Math.max(1, parseInt(sp.get("limit") || "100", 10) || 100)
    );
    const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);

    const where: any = {};
    const type = sp.get("type");
    if (type) where.type = type;
    const category = sp.get("category");
    if (category) where.category = category;
    const isAdult = sp.get("isAdult");
    if (isAdult === "true") where.isAdult = true;
    if (isAdult === "false") where.isAdult = false;
    const search = sp.get("search")?.trim();
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      db.content.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      db.content.count({ where }),
    ]);

    return successResponse({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[admin/content/list] error:", err);
    return errorResponse("Error al obtener contenido admin", 500);
  }
}
