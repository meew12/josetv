import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-helpers";

// GET /api/content/featured - contenido destacado para hero carousel
export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    const isAdmin = user?.role === "ADMIN";
    const url = new URL(req.url);
    const kids = url.searchParams.get("kids") === "true";

    const where: any = { featured: true };
    // Excluir adulto por defecto salvo admin o usuario verificado
    if (!isAdmin && !user?.adultVerified) {
      where.isAdult = false;
    }
    // Filtro kids: solo ATP y +7
    if (kids) {
      where.isAdult = false;
      where.ageRating = { in: ["ATP", "+7"] };
    }

    const items = await db.content.findMany({
      where,
      orderBy: [{ views: "desc" }, { createdAt: "desc" }],
      take: 10,
    });

    return successResponse({ items });
  } catch (err) {
    console.error("[content/featured] error:", err);
    return errorResponse("Error al obtener destacados", 500);
  }
}
