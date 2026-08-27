import { db } from "@/lib/db";
import {
  generateSimpleToken,
  hashPassword,
  signToken,
} from "@/lib/auth";
import { errorResponse, publicUser, successResponse } from "@/lib/api-helpers";

// POST /api/auth/register
// Body: { email, name, password }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const name = String(body?.name || "").trim();
    const password = String(body?.password || "");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse("Email inválido", 400);
    }
    if (!name || name.length < 2) {
      return errorResponse("Nombre inválido", 400);
    }
    if (!password || password.length < 6) {
      return errorResponse("La contraseña debe tener al menos 6 caracteres", 400);
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return errorResponse("Ya existe un usuario con ese email", 409);
    }

    const passwordHash = await hashPassword(password);
    const simpleToken = generateSimpleToken();

    // El primer usuario creado es promovido a ADMIN automáticamente
    // (si no existe ningún admin todavía).
    const adminCount = await db.user.count({ where: { role: "ADMIN" } });
    const role = adminCount === 0 ? "ADMIN" : "USER";

    const user = await db.user.create({
      data: {
        email,
        name,
        passwordHash,
        role,
        token: simpleToken,
      },
      include: { subscription: { include: { plan: true } } },
    });

    const jwt = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return successResponse({
      token: jwt,
      user: publicUser(user),
    }, 201);
  } catch (err) {
    console.error("[auth/register] error:", err);
    return errorResponse("Error al registrar usuario", 500);
  }
}
