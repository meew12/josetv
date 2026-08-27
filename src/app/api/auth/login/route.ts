// FORCE REBUILD 999
import { db } from "@/lib/db";
import { signToken, verifyPassword } from "@/lib/auth";
import {
  errorResponse,
  publicUser,
  successResponse,
} from "@/lib/api-helpers";

// POST /api/auth/login
// Body: { email, password }
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!email || !password) {
      return errorResponse("Datos inválidos", 400);
    }

    const user = await db.user.findUnique({
      where: { email },
      include: { subscription: { include: { plan: true } } },
    });

    if (!user) {
      return errorResponse("Credenciales inválidas", 401);
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return errorResponse("Credenciales inválidas", 401);
    }

    if (user.banned) {
      return errorResponse("Usuario suspendido", 403);
    }

    const jwt = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return successResponse({
      token: jwt,
      user: publicUser(user),
    });
  } catch (err) {
    console.error("[auth/login] error:", err);
    return errorResponse("Error al iniciar sesión", 500);
  }
}
