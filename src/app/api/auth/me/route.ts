import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

// GET /api/auth/me — obtener usuario actual
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        adultVerified: user.adultVerified,
        token: user.token,
        subscription: user.subscription
          ? {
              status: user.subscription.status,
              endDate: user.subscription.endDate.toISOString(),
              plan: user.subscription.plan
                ? {
                    name: user.subscription.plan.name,
                    quality: user.subscription.plan.quality,
                    screens: user.subscription.plan.screens,
                  }
                : undefined,
            }
          : null,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Error" },
      { status: 500 }
    );
  }
}

// PUT /api/auth/me — usuario actualiza su propio perfil (name, avatar)
export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { name, avatar } = body;

    const data: any = {};
    if (typeof name === "string" && name.trim().length >= 2) {
      data.name = name.trim().slice(0, 80);
    }
    if (typeof avatar === "string") {
      data.avatar = avatar.trim().slice(0, 500) || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No hay campos para actualizar" }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data,
      include: { subscription: { include: { plan: true } } },
    });

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        avatar: updated.avatar,
        adultVerified: updated.adultVerified,
        token: updated.token,
        subscription: updated.subscription
          ? {
              status: updated.subscription.status,
              endDate: updated.subscription.endDate.toISOString(),
              plan: updated.subscription.plan
                ? {
                    name: updated.subscription.plan.name,
                    quality: updated.subscription.plan.quality,
                    screens: updated.subscription.plan.screens,
                  }
                : undefined,
            }
          : null,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Error al actualizar perfil" },
      { status: 500 }
    );
  }
}

// PATCH /api/auth/me — verificar token de adulto
export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { adultVerified } = body;

    if (typeof adultVerified !== "boolean") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: { adultVerified },
    });

    return NextResponse.json({
      user: {
        ...updated,
        subscription: user.subscription
          ? {
              status: user.subscription.status,
              endDate: user.subscription.endDate.toISOString(),
            }
          : null,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Error" },
      { status: 500 }
    );
  }
}
