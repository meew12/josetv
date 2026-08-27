import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/content/new — contenido recién agregado (últimos 14 días)
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const isAdmin = user?.role === "ADMIN";
    const adultFilter = !user || (!user.adultVerified && !isAdmin) ? { isAdult: false } : {};

    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const items = await db.content.findMany({
      where: {
        createdAt: { gte: since },
        ...adultFilter,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ items });
  } catch (e: any) {
    console.error("[content/new] error:", e);
    return NextResponse.json(
      { error: "Error al obtener novedades" },
      { status: 500 }
    );
  }
}
