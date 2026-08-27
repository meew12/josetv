import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// PUT /api/profiles/[id] — actualizar perfil
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const profile = await db.profile.findUnique({ where: { id } });
    if (!profile || profile.userId !== user.id) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const data: any = {};

    if (typeof body.name === "string" && body.name.trim().length >= 2) {
      data.name = body.name.trim().slice(0, 30);
    }
    if (typeof body.avatar === "string") {
      data.avatar = body.avatar.trim().slice(0, 10);
    }
    if (typeof body.color === "string") {
      data.color = body.color.trim().slice(0, 20);
    }
    if (typeof body.isKids === "boolean") {
      data.isKids = body.isKids;
    }

    const updated = await db.profile.update({ where: { id }, data });
    return NextResponse.json({ profile: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/profiles/[id] — borrar perfil
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
    const profile = await db.profile.findUnique({ where: { id } });
    if (!profile || profile.userId !== user.id) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    await db.profile.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
