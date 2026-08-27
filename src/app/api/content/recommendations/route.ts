import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/content/recommendations — recomendaciones basadas en historial
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Buscar las categorías más vistas del usuario (últimas 5 vistas)
    const recentHistory = await db.watchHistory.findMany({
      where: { userId: user.id },
      orderBy: { lastWatched: "desc" },
      take: 5,
      include: { content: true },
    });

    const watchedIds = new Set(recentHistory.map((h) => h.contentId));
    const categoryCounts: Record<string, number> = {};

    for (const h of recentHistory) {
      if (h.content) {
        const cat = h.content.category;
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }
    }

    // Top categorías del usuario
    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    const adultFilter =
      user.adultVerified || user.role === "ADMIN" ? {} : { isAdult: false };

    let recommendations: any[] = [];

    if (topCategories.length > 0) {
      recommendations = await db.content.findMany({
        where: {
          category: { in: topCategories },
          id: { notIn: Array.from(watchedIds) },
          ...adultFilter,
        },
        orderBy: [{ rating: "desc" }, { views: "desc" }],
        take: 12,
      });
    }

    // Si no hay suficientes, completar con trending
    if (recommendations.length < 8) {
      const trending = await db.content.findMany({
        where: {
          id: { notIn: [...watchedIds, ...recommendations.map((r) => r.id)] },
          trending: true,
          ...adultFilter,
        },
        orderBy: { rating: "desc" },
        take: 12 - recommendations.length,
      });
      recommendations = [...recommendations, ...trending];
    }

    // Si todavía faltan, completar con lo más visto
    if (recommendations.length < 8) {
      const popular = await db.content.findMany({
        where: {
          id: { notIn: [...watchedIds, ...recommendations.map((r) => r.id)] },
          ...adultFilter,
        },
        orderBy: { views: "desc" },
        take: 12 - recommendations.length,
      });
      recommendations = [...recommendations, ...popular];
    }

    return NextResponse.json({ items: recommendations.slice(0, 12) });
  } catch (e: any) {
    console.error("[content/recommendations] error:", e);
    return NextResponse.json(
      { error: "Error al obtener recomendaciones" },
      { status: 500 }
    );
  }
}
