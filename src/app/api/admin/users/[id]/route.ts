import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-helpers";

// GET /api/admin/users/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await getUserFromRequest(req);
    if (!admin) return errorResponse("No autorizado", 401);
    if (admin.role !== "ADMIN") return errorResponse("Acceso denegado", 403);

    const u = await db.user.findUnique({
      where: { id },
      include: {
        subscription: { include: { plan: true } },
        payments: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    });
    if (!u) return errorResponse("Recurso no encontrado", 404);

    const { passwordHash, ...safe } = u as any;
    return successResponse(safe);
  } catch (err) {
    console.error("[admin/users/get] error:", err);
    return errorResponse("Error al obtener usuario", 500);
  }
}

// PUT /api/admin/users/[id] - actualizar usuario
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await getUserFromRequest(req);
    if (!admin) return errorResponse("No autorizado", 401);
    if (admin.role !== "ADMIN") return errorResponse("Acceso denegado", 403);

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) return errorResponse("Recurso no encontrado", 404);

    const body = await req.json().catch(() => ({}));
    const data: any = {};
    if (typeof body?.role === "string") {
      if (!["USER", "ADMIN"].includes(body.role)) {
        return errorResponse("Rol inválido", 400);
      }
      data.role = body.role;
    }
    if (typeof body?.banned === "boolean") data.banned = body.banned;
    if (typeof body?.adultVerified === "boolean")
      data.adultVerified = body.adultVerified;
    if (typeof body?.name === "string" && body.name.trim())
      data.name = body.name.trim();
    if (typeof body?.avatar === "string") data.avatar = body.avatar || null;
    if (typeof body?.email === "string" && body.email.trim()) {
      data.email = body.email.trim().toLowerCase();
    }

    const updated = await db.user.update({ where: { id }, data });
    const { passwordHash, ...safe } = updated as any;
    return successResponse(safe);
  } catch (err) {
    console.error("[admin/users/update] error:", err);
    return errorResponse("Error al actualizar usuario", 500);
  }
}

// DELETE /api/admin/users/[id]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = await getUserFromRequest(req);
    if (!admin) return errorResponse("No autorizado", 401);
    if (admin.role !== "ADMIN") return errorResponse("Acceso denegado", 403);

    if (admin.id === id) {
      return errorResponse("No podés eliminar tu propia cuenta", 400);
    }

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) return errorResponse("Recurso no encontrado", 404);

    await db.user.delete({ where: { id } });
    return successResponse({ ok: true });
  } catch (err) {
    console.error("[admin/users/delete] error:", err);
    return errorResponse("Error al eliminar usuario", 500);
  }
}
