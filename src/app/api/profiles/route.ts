import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/profiles — lista de perfiles del usuario
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const profiles = await db.profile.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ items: profiles });
  } catch (e: any) {
    console.error("[profiles/list] error:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// POST /api/profiles — crear nuevo perfil
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const name = String(body.name || "").trim();
    const avatar = String(body.avatar || "🦊").trim();
    const color = String(body.color || "#E50914").trim();
    const isKids = Boolean(body.isKids);

    if (name.length < 2 || name.length > 30) {
      return NextResponse.json(
        { error: "El nombre debe tener entre 2 y 30 caracteres" },
        { status: 400 }
      );
    }

    // Límite de perfiles según plan
    const maxProfiles = user.subscription?.plan?.screens || 1;
    const count = await db.profile.count({ where: { userId: user.id } });
    if (count >= maxProfiles) {
      return NextResponse.json(
        { error: `Alcanzaste el límite de ${maxProfiles} perfil(es) para tu plan` },
        { status: 400 }
      );
    }

    const profile = await db.profile.create({
      data: {
        userId: user.id,
        name,
        avatar,
        color,
        isKids,
        isDefault: count === 0,
      },
    });

    return NextResponse.json({ profile });
  } catch (e: any) {
    console.error("[profiles/create] error:", e);
    return NextResponse.json(
      { error: e.message || "Error al crear perfil" },
      { status: 500 }
    );
  }
}
