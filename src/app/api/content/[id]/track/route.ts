import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-helpers";

// POST /api/content/[id]/track
// Body: { action: 'view' | 'progress', progress?: number (segundos), duration?: number (segundos) }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("No autorizado", 401);

    const content = await db.content.findUnique({ where: { id } });
    if (!content) return errorResponse("Recurso no encontrado", 404);

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "view");
    const progress = body?.progress != null ? Number(body.progress) : 0;
    const duration = body?.duration != null ? Number(body.duration) : null;

    if (action === "view") {
      await db.content.update({
        where: { id },
        data: { views: { increment: 1 } },
      });
      // También registrar en historial (si no existe, lo crea con progress 0)
      await db.watchHistory
        .upsert({
          where: { userId_contentId: { userId: user.id, contentId: id } },
          update: { lastWatched: new Date() },
          create: {
            userId: user.id,
            contentId: id,
            progress: 0,
            lastWatched: new Date(),
          },
        })
        .catch(() => {});
    } else if (action === "progress") {
      await db.watchHistory.upsert({
        where: { userId_contentId: { userId: user.id, contentId: id } },
        update: {
          progress: Number.isFinite(progress) ? progress : 0,
          duration: Number.isFinite(duration as number) ? duration : null,
          lastWatched: new Date(),
        },
        create: {
          userId: user.id,
          contentId: id,
          progress: Number.isFinite(progress) ? progress : 0,
          duration: Number.isFinite(duration as number) ? duration : null,
          lastWatched: new Date(),
        },
      });
    } else {
      return errorResponse("Acción inválida", 400);
    }

    return successResponse({ ok: true });
  } catch (err) {
    console.error("[content/track] error:", err);
    return errorResponse("Error al registrar visualización", 500);
  }
}
