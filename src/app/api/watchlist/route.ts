import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-helpers";

// GET /api/watchlist?profileId=X - lista de watchlist del usuario (opcional por perfil)
export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("No autorizado", 401);

    const url = new URL(req.url);
    const profileId = url.searchParams.get("profileId");

    // Validar que el perfil pertenece al usuario
    let validProfileId: string | undefined;
    if (profileId) {
      const profile = await db.profile.findUnique({
        where: { id: profileId },
      });
      if (profile && profile.userId === user.id) {
        validProfileId = profileId;
      }
    }

    const where: any = { userId: user.id };
    if (validProfileId) {
      where.profileId = validProfileId;
    }

    const items = await db.watchlist.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { content: true },
    });

    return successResponse({ items: items.map((w) => w.content) });
  } catch (err) {
    console.error("[watchlist/list] error:", err);
    return errorResponse("Error al obtener watchlist", 500);
  }
}

// POST /api/watchlist - agregar a watchlist
// Body: { contentId, profileId? }
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("No autorizado", 401);

    const body = await req.json().catch(() => ({}));
    const contentId = String(body?.contentId || "").trim();
    if (!contentId) return errorResponse("contentId requerido", 400);

    const content = await db.content.findUnique({ where: { id: contentId } });
    if (!content) return errorResponse("Recurso no encontrado", 404);

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

    // Upsert (idempotente: si ya existe, no falla)
    const item = await db.watchlist.upsert({
      where: { userId_contentId: { userId: user.id, contentId } },
      update: validProfileId ? { profileId: validProfileId } : {},
      create: {
        userId: user.id,
        contentId,
        profileId: validProfileId,
      },
    });

    return successResponse(item, 201);
  } catch (err) {
    console.error("[watchlist/add] error:", err);
    return errorResponse("Error al agregar a watchlist", 500);
  }
}
