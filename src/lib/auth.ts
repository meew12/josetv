import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "jose-demo-secret-key-change-in-production-2025";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// Hashear contraseña
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verificar contraseña
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generar JWT
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

// Verificar JWT
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// Generar token simple legible (formato: JD-XXXX-XXXX-XXXX)
export function generateSimpleToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `JD-${part(4)}-${part(4)}-${part(4)}`;
}

// Obtener usuario desde el header Authorization (Bearer) o token simple
export async function getUserFromRequest(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    let token = auth.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      // fallback: query param token
      const url = new URL(req.url);
      token = url.searchParams.get("token") || "";
    }
    if (!token) return null;

    // 1) Intentar JWT
    const jwtPayload = verifyToken(token);
    if (jwtPayload) {
      const user = await db.user.findUnique({
        where: { id: jwtPayload.userId },
        include: { subscription: { include: { plan: true } } },
      });
      if (user && !user.banned) return user;
      return null;
    }

    // 2) Intentar token simple
    const userByToken = await db.user.findUnique({
      where: { token },
      include: { subscription: { include: { plan: true } } },
    });
    if (userByToken && !userByToken.banned) return userByToken;
    return null;
  } catch {
    return null;
  }
}

export { JWT_SECRET };
