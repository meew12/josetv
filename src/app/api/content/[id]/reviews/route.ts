import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/content/[id]/reviews — lista de reseñas del contenido
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const reviews = await db.review.findMany({
      where: { contentId: id },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
      take: 50,
    });

    const stats = {
      total: reviews.length,
      average:
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0,
    };

    return NextResponse.json({ items: reviews, stats });
  } catch (e: any) {
    console.error("[reviews/list] error:", e);
    return NextResponse.json(
      { error: "Error al obtener reseñas" },
      { status: 500 }
    );
  }
}

// POST /api/content/[id]/reviews — crear o actualizar reseña
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const rating = Number(body.rating);
    const comment = String(body.comment || "").trim();

    if (!Number.isFinite(rating) || rating < 1 || rating > 10) {
      return NextResponse.json(
        { error: "La calificación debe ser entre 1 y 10" },
        { status: 400 }
      );
    }

    // Verificar que existe el contenido
    const content = await db.content.findUnique({ where: { id } });
    if (!content) {
      return NextResponse.json({ error: "Recurso no encontrado" }, { status: 404 });
    }

    const review = await db.review.upsert({
      where: {
        userId_contentId: { userId: user.id, contentId: id },
      },
      update: {
        rating: Math.floor(rating),
        comment: comment.slice(0, 500),
      },
      create: {
        userId: user.id,
        contentId: id,
        rating: Math.floor(rating),
        comment: comment.slice(0, 500),
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json({ review });
  } catch (e: any) {
    console.error("[reviews/create] error:", e);
    return NextResponse.json(
      { error: e.message || "Error al crear reseña" },
      { status: 500 }
    );
  }
}

// DELETE /api/content/[id]/reviews — borrar propia reseña
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    await db.review.deleteMany({
      where: { userId: user.id, contentId: id },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Error" },
      { status: 500 }
    );
  }
}
