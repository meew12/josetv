import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/content/[id]/reaction — estado de reacción del usuario + conteos
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    const { id } = await params;

    const [likes, dislikes, mine] = await Promise.all([
      db.reaction.count({ where: { contentId: id, type: "LIKE" } }),
      db.reaction.count({ where: { contentId: id, type: "DISLIKE" } }),
      user
        ? db.reaction.findUnique({
            where: {
              userId_contentId: { userId: user.id, contentId: id },
            },
          })
        : Promise.resolve(null),
    ]);

    return NextResponse.json({
      likes,
      dislikes,
      mine: mine?.type || null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Error" },
      { status: 500 }
    );
  }
}

// POST /api/content/[id]/reaction — toggle like/dislike
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
    const type = String(body.type).toUpperCase();

    if (type !== "LIKE" && type !== "DISLIKE") {
      return NextResponse.json(
        { error: "Tipo inválido (LIKE o DISLIKE)" },
        { status: 400 }
      );
    }

    const existing = await db.reaction.findUnique({
      where: {
        userId_contentId: { userId: user.id, contentId: id },
      },
    });

    if (existing) {
      if (existing.type === type) {
        // mismo tipo -> quitar
        await db.reaction.delete({
          where: { id: existing.id },
        });
        return NextResponse.json({ mine: null });
      } else {
        // distinto -> actualizar
        const updated = await db.reaction.update({
          where: { id: existing.id },
          data: { type },
        });
        return NextResponse.json({ mine: updated.type });
      }
    } else {
      const created = await db.reaction.create({
        data: { userId: user.id, contentId: id, type },
      });
      return NextResponse.json({ mine: created.type });
    }
  } catch (e: any) {
    console.error("[reaction/toggle] error:", e);
    return NextResponse.json(
      { error: e.message || "Error" },
      { status: 500 }
    );
  }
}
