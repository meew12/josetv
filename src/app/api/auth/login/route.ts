import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña requeridos" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
      include: { subscription: { include: { plan: true } } },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      token,
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
    console.error("[auth/login] error:", e);
    return NextResponse.json(
      { error: e.message || "Error al iniciar sesión" },
      { status: 500 }
    );
  }
}
