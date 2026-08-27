import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-helpers";

// GET /api/plans - listar planes activos (público)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sp = url.searchParams;
    const includeInactive = sp.get("all") === "true";

    const user = await getUserFromRequest(req);
    const isAdmin = user?.role === "ADMIN";

    const where = includeInactive && isAdmin ? {} : { active: true };
    const plans = await db.plan.findMany({
      where,
      orderBy: { price: "asc" },
    });

    return successResponse({ items: plans });
  } catch (err) {
    console.error("[plans/list] error:", err);
    return errorResponse("Error al obtener planes", 500);
  }
}

// POST /api/plans - crear plan (admin)
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("No autorizado", 401);
    if (user.role !== "ADMIN") return errorResponse("Acceso denegado", 403);

    const body = await req.json().catch(() => ({}));
    const name = String(body?.name || "").trim();
    if (!name) return errorResponse("Nombre requerido", 400);

    const price = Number(body?.price);
    if (!Number.isFinite(price) || price < 0) {
      return errorResponse("Precio inválido", 400);
    }
    const durationDays = Number(body?.durationDays);
    if (!Number.isFinite(durationDays) || durationDays <= 0) {
      return errorResponse("Duración inválida", 400);
    }

    const plan = await db.plan.create({
      data: {
        name,
        price,
        currency: String(body?.currency || "ARS"),
        durationDays,
        description: String(body?.description || ""),
        features: JSON.stringify(body?.features || []),
        quality: String(body?.quality || "HD"),
        screens: Number(body?.screens || 1),
        active: body?.active === undefined ? true : Boolean(body.active),
      },
    });

    return successResponse(plan, 201);
  } catch (err) {
    console.error("[plans/create] error:", err);
    return errorResponse("Error al crear plan", 500);
  }
}

// PUT /api/plans - actualizar múltiples planes (admin)
export async function PUT(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("No autorizado", 401);
    if (user.role !== "ADMIN") return errorResponse("Acceso denegado", 403);

    const body = await req.json().catch(() => ({}));
    const updates: any[] = Array.isArray(body?.plans) ? body.plans : [];

    const results: any[] = [];
    for (const u of updates) {
      if (!u?.id) continue;
      const data: any = {};
      const allowed = [
        "name", "price", "currency", "durationDays", "description",
        "features", "quality", "screens", "active",
      ];
      for (const k of allowed) {
        if (k in u) {
          if (k === "features") {
            data[k] = typeof u[k] === "string" ? u[k] : JSON.stringify(u[k]);
          } else {
            data[k] = u[k];
          }
        }
      }
      const updated = await db.plan.update({
        where: { id: String(u.id) },
        data,
      });
      results.push(updated);
    }

    return successResponse({ updated: results });
  } catch (err) {
    console.error("[plans/update] error:", err);
    return errorResponse("Error al actualizar planes", 500);
  }
}
