import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/user/stats — estadísticas del usuario para el perfil
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const [
      watchlistCount,
      historyCount,
      reviewsCount,
      reactionsCount,
      historyItems,
    ] = await Promise.all([
      db.watchlist.count({ where: { userId: user.id } }),
      db.watchHistory.count({ where: { userId: user.id } }),
      db.review.count({ where: { userId: user.id } }),
      db.reaction.count({ where: { userId: user.id } }),
      db.watchHistory.findMany({
        where: { userId: user.id, duration: { not: null } },
        select: { progress: true, duration: true },
      }),
    ]);

    // Tiempo total mirado (en minutos, aproximado)
    const totalMinutes = historyItems.reduce((sum, h) => {
      return sum + Math.min(h.progress || 0, h.duration || 0);
    }, 0) / 60;

    // Género favorito (más visto)
    const favoriteGenres = await db.watchHistory.findMany({
      where: { userId: user.id },
      include: { content: { select: { genre: true, category: true } } },
      take: 20,
      orderBy: { lastWatched: "desc" },
    });

    const genreCounts: Record<string, number> = {};
    for (const h of favoriteGenres) {
      if (h.content?.genre) {
        genreCounts[h.content.genre] = (genreCounts[h.content.genre] || 0) + 1;
      }
    }
    const favoriteGenre =
      Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return NextResponse.json({
      stats: {
        watchlistCount,
        historyCount,
        reviewsCount,
        reactionsCount,
        totalMinutesWatched: Math.round(totalMinutes),
        favoriteGenre,
        memberSince: user.createdAt,
      },
    });
  } catch (e: any) {
    console.error("[user/stats] error:", e);
    return NextResponse.json(
      { error: "Error al obtener stats" },
      { status: 500 }
    );
  }
}
