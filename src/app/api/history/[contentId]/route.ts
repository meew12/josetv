import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-helpers";

// DELETE /api/history/[contentId] — borrar una entrada de historial
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("No autorizado", 401);

    const { contentId } = await params;

    await db.watchHistory.deleteMany({
      where: { userId: user.id, contentId },
    });

    return successResponse({ ok: true });
  } catch (err) {
    console.error("[history/delete] error:", err);
    return errorResponse("Error al borrar historial", 500);
  }
}
