import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-helpers";

// GET /api/content/trending - contenido trending
export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    const isAdmin = user?.role === "ADMIN";
    const url = new URL(req.url);
    const kids = url.searchParams.get("kids") === "true";

    const where: any = { trending: true };
    if (!isAdmin && !user?.adultVerified) {
      where.isAdult = false;
    }
    if (kids) {
      where.isAdult = false;
      where.ageRating = { in: ["ATP", "+7"] };
    }

    const items = await db.content.findMany({
      where,
      orderBy: [{ views: "desc" }, { createdAt: "desc" }],
      take: 20,
    });

    return successResponse({ items });
  } catch (err) {
    console.error("[content/trending] error:", err);
    return errorResponse("Error al obtener tendencia", 500);
  }
}
