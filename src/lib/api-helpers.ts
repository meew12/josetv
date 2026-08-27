// Helpers comunes para API routes
import { NextResponse } from "next/server";
import { db } from "./db";
import { getUserFromRequest } from "./auth";

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

// Requiere usuario autenticado. Si no, responde 401.
export async function requireUser(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return null;
  return user;
}

// Requiere usuario con rol ADMIN. Si no, responde 401/403.
export async function requireAdmin(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return { user: null, response: errorResponse("No autorizado", 401) };
  if (user.role !== "ADMIN") {
    return { user: null, response: errorResponse("Acceso denegado", 403) };
  }
  return { user, response: null };
}

// Convierte un User de Prisma (con subscription+plan) en el formato público
// que devuelven las rutas de auth.
export function publicUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string | null;
  banned: boolean;
  adultVerified: boolean;
  token: string | null;
  subscription?: any;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    adultVerified: user.adultVerified,
    token: user.token, // token simple legible
    subscription: user.subscription
      ? {
          id: user.subscription.id,
          status: user.subscription.status,
          startDate: user.subscription.startDate,
          endDate: user.subscription.endDate,
          autoRenew: user.subscription.autoRenew,
          plan: user.subscription.plan,
        }
      : null,
  };
}

// Refresca el usuario desde DB con subscription+plan (para respuestas frescas)
export async function refreshUser(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    include: { subscription: { include: { plan: true } } },
  });
}
