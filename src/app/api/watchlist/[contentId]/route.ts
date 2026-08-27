import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-helpers";

// DELETE /api/watchlist/[contentId] - quitar de watchlist
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("No autorizado", 401);

    const item = await db.watchlist.findUnique({
      where: { userId_contentId: { userId: user.id, contentId } },
    });

    if (!item) return errorResponse("Recurso no encontrado", 404);

    await db.watchlist.delete({
      where: { userId_contentId: { userId: user.id, contentId } },
    });

    return successResponse({ ok: true });
  } catch (err) {
    console.error("[watchlist/delete] error:", err);
    return errorResponse("Error al quitar de watchlist", 500);
  }
}
