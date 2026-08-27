import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-helpers";

// GET /api/history?profileId=X - historial de visualización del usuario (opcional por perfil)
export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("No autorizado", 401);

    const url = new URL(req.url);
    const sp = url.searchParams;
    const limit = Math.min(
      100,
      Math.max(1, parseInt(sp.get("limit") || "50", 10) || 50)
    );

    const profileId = sp.get("profileId");
    let validProfileId: string | undefined;
    if (profileId) {
      const profile = await db.profile.findUnique({ where: { id: profileId } });
      if (profile && profile.userId === user.id) {
        validProfileId = profileId;
      }
    }

    const where: any = { userId: user.id };
    if (validProfileId) {
      where.profileId = validProfileId;
    }

    const items = await db.watchHistory.findMany({
      where,
      orderBy: { lastWatched: "desc" },
      take: limit,
      include: { content: true },
    });

    return successResponse({
      items: items.map((h) => ({
        ...h,
        content: h.content,
      })),
    });
  } catch (err) {
    console.error("[history/list] error:", err);
    return errorResponse("Error al obtener historial", 500);
  }
}

// POST /api/history - upsert entrada de historial
// Body: { contentId, progress, duration, profileId? }
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("No autorizado", 401);

    const body = await req.json().catch(() => ({}));
    const contentId = String(body?.contentId || "").trim();
    if (!contentId) return errorResponse("contentId requerido", 400);

    const content = await db.content.findUnique({ where: { id: contentId } });
    if (!content) return errorResponse("Recurso no encontrado", 404);

    const progress =
      body?.progress != null && Number.isFinite(Number(body.progress))
        ? Number(body.progress)
        : 0;
    const duration =
      body?.duration != null && Number.isFinite(Number(body.duration))
        ? Number(body.duration)
        : null;

    // Validar profileId si viene
    let validProfileId: string | undefined;
    if (body?.profileId) {
      const profile = await db.profile.findUnique({
        where: { id: body.profileId },
      });
      if (profile && profile.userId === user.id) {
        validProfileId = body.profileId;
      }
    }

    const item = await db.watchHistory.upsert({
      where: { userId_contentId: { userId: user.id, contentId } },
      update: {
        progress,
        duration,
        lastWatched: new Date(),
        ...(validProfileId ? { profileId: validProfileId } : {}),
      },
      create: {
        userId: user.id,
        contentId,
        progress,
        duration,
        profileId: validProfileId,
        lastWatched: new Date(),
      },
    });

    return successResponse(item, 201);
  } catch (err) {
    console.error("[history/upsert] error:", err);
    return errorResponse("Error al actualizar historial", 500);
  }
}
