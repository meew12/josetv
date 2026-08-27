import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { clearMercadoPagoConfigCache } from "@/lib/config";
import { errorResponse, successResponse } from "@/lib/api-helpers";

// GET /api/settings - obtener todas las settings como objeto key-value
export async function GET() {
  try {
    const settings = await db.setting.findMany();
    const obj: Record<string, string> = {};
    for (const s of settings) obj[s.key] = s.value;
    return successResponse({ settings: obj });
  } catch (err) {
    console.error("[settings/get] error:", err);
    return errorResponse("Error al obtener configuración", 500);
  }
}

// PUT /api/settings - actualizar múltiples settings (admin)
// Body: { settings: { key: value, ... } }
export async function PUT(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("No autorizado", 401);
    if (user.role !== "ADMIN") return errorResponse("Acceso denegado", 403);

    const body = await req.json().catch(() => ({}));
    const input: Record<string, unknown> = body?.settings || body || {};
    if (typeof input !== "object" || Object.keys(input).length === 0) {
      return errorResponse("Datos inválidos", 400);
    }

    const updated: Array<{ key: string; value: string }> = [];
    for (const [k, v] of Object.entries(input)) {
      const value = v == null ? "" : String(v);
      const s = await db.setting.upsert({
        where: { key: k },
        update: { value },
        create: { key: k, value },
      });
      updated.push({ key: s.key, value: s.value });
    }

    // Limpiar cache de MercadoPago si se actualizaron campos relacionados
    const keys = Object.keys(input);
    if (keys.some((k) => k.startsWith("mp"))) {
      clearMercadoPagoConfigCache();
    }

    return successResponse({ updated });
  } catch (err) {
    console.error("[settings/update] error:", err);
    return errorResponse("Error al actualizar configuración", 500);
  }
}
