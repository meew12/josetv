import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-helpers";

// GET /api/content/[id] - detalle de un contenido (incrementa vistas)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(req);
    const isAdmin = user?.role === "ADMIN";

    const content = await db.content.findUnique({
      where: { id },
      include: {
        episodes: {
          orderBy: [{ seasonNumber: "asc" }, { episodeNumber: "asc" }],
        },
      },
    });

    if (!content) return errorResponse("Recurso no encontrado", 404);

    // Verificación de adulto
    if (content.isAdult && !isAdmin && !user?.adultVerified) {
      return errorResponse(
        "Debes verificar tu edad para ver contenido adulto",
        403
      );
    }

    // Incrementar vistas (fire and forget, no bloquea respuesta)
    await db.content
      .update({ where: { id }, data: { views: { increment: 1 } } })
      .catch(() => {});

    return successResponse(content);
  } catch (err) {
    console.error("[content/get] error:", err);
    return errorResponse("Error al obtener contenido", 500);
  }
}

// PUT /api/content/[id] - actualizar contenido (admin)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("No autorizado", 401);
    if (user.role !== "ADMIN") return errorResponse("Acceso denegado", 403);

    const existing = await db.content.findUnique({ where: { id } });
    if (!existing) return errorResponse("Recurso no encontrado", 404);

    const body = await req.json().catch(() => ({}));

    const allowed: string[] = [
      "title", "description", "type", "url", "thumbnail", "banner", "logo",
      "category", "genre", "year", "duration", "rating", "ageRating",
      "isAdult", "featured", "trending", "trailerUrl",
    ];
    const data: any = {};
    for (const k of allowed) {
      if (k in body) data[k] = body[k];
    }

    const updated = await db.content.update({ where: { id }, data });
    return successResponse(updated);
  } catch (err) {
    console.error("[content/update] error:", err);
    return errorResponse("Error al actualizar contenido", 500);
  }
}

// DELETE /api/content/[id] - eliminar contenido (admin)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("No autorizado", 401);
    if (user.role !== "ADMIN") return errorResponse("Acceso denegado", 403);

    const existing = await db.content.findUnique({ where: { id } });
    if (!existing) return errorResponse("Recurso no encontrado", 404);

    await db.content.delete({ where: { id } });
    return successResponse({ ok: true });
  } catch (err) {
    console.error("[content/delete] error:", err);
    return errorResponse("Error al eliminar contenido", 500);
  }
}
