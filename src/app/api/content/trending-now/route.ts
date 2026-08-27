import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/content/trending-now — contenido trending basado en actividad reciente (últimas 24h)
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const isAdmin = user?.role === "ADMIN";
    const adultFilter = !user || (!user.adultVerified && !isAdmin) ? { isAdult: false } : {};

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentActivity = await db.watchHistory.findMany({
      where: { lastWatched: { gte: since } },
      select: { contentId: true },
    });

    const activityCount: Record<string, number> = {};
    for (const h of recentActivity) {
      activityCount[h.contentId] = (activityCount[h.contentId] || 0) + 1;
    }

    const topIds = Object.entries(activityCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);

    let trending: any[] = [];
    if (topIds.length > 0) {
      trending = await db.content.findMany({
        where: { id: { in: topIds }, ...adultFilter },
      });
      trending.sort((a, b) => (activityCount[b.id] || 0) - (activityCount[a.id] || 0));
    }

    if (trending.length < 10) {
      const existingIds = new Set(trending.map((t) => t.id));
      const fallback = await db.content.findMany({
        where: {
          id: { notIn: Array.from(existingIds) },
          ...adultFilter,
        },
        orderBy: { views: "desc" },
        take: 10 - trending.length,
      });
      trending = [...trending, ...fallback];
    }

    return NextResponse.json({
      items: trending.slice(0, 10),
      period: "24h",
    });
  } catch (e: any) {
    console.error("[content/trending-now] error:", e);
    return NextResponse.json(
      { error: "Error al obtener trending ahora" },
      { status: 500 }
    );
  }
}
