import { db } from "@/lib/db";
import { signToken } from "@/lib/auth";
import {
  errorResponse,
  publicUser,
  successResponse,
} from "@/lib/api-helpers";

// POST /api/auth/token
// Body: { token } - login con token simple legible (JD-XXXX-XXXX-XXXX)
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = String(body?.token || "").trim();

    if (!token) {
      return errorResponse("Token requerido", 400);
    }

    const user = await db.user.findUnique({
      where: { token },
      include: { subscription: { include: { plan: true } } },
    });

    if (!user) {
      return errorResponse("Token inválido", 401);
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
    console.error("[auth/token] error:", err);
    return errorResponse("Error al iniciar sesión con token", 500);
  }
}
