import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-helpers";

// GET /api/channels/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const channel = await db.channel.findUnique({ where: { id } });
    if (!channel) return errorResponse("Recurso no encontrado", 404);
    if (!channel.active) {
      const user = await getUserFromRequest(req);
      const isAdmin = user?.role === "ADMIN";
      if (!isAdmin) return errorResponse("Recurso no encontrado", 404);
    }
    return successResponse(channel);
  } catch (err) {
    console.error("[channels/get] error:", err);
    return errorResponse("Error al obtener canal", 500);
  }
}

// PUT /api/channels/[id] (admin)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("No autorizado", 401);
    if (user.role !== "ADMIN") return errorResponse("Acceso denegado", 403);

    const existing = await db.channel.findUnique({ where: { id } });
    if (!existing) return errorResponse("Recurso no encontrado", 404);

    const body = await req.json().catch(() => ({}));
    const allowed = [
      "name", "url", "logo", "category", "isAdult", "epgId", "active",
    ];
    const data: any = {};
    for (const k of allowed) {
      if (k in body) data[k] = body[k];
    }

    const updated = await db.channel.update({ where: { id }, data });
    return successResponse(updated);
  } catch (err) {
    console.error("[channels/update] error:", err);
    return errorResponse("Error al actualizar canal", 500);
  }
}

// DELETE /api/channels/[id] (admin)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("No autorizado", 401);
    if (user.role !== "ADMIN") return errorResponse("Acceso denegado", 403);

    const existing = await db.channel.findUnique({ where: { id } });
    if (!existing) return errorResponse("Recurso no encontrado", 404);

    await db.channel.delete({ where: { id } });
    return successResponse({ ok: true });
  } catch (err) {
    console.error("[channels/delete] error:", err);
    return errorResponse("Error al eliminar canal", 500);
  }
}
