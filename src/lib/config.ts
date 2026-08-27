// Configuración central de la plataforma JOSE DEMO
export const APP_NAME = "JOSE DEMO";
export const APP_TAGLINE = "Stream sin límites";
export const APP_VERSION = "1.0.0";

// Colores de marca
export const BRAND_COLOR = "#E50914"; // rojo Netflix-style
export const BRAND_COLOR_DARK = "#B20710";

// Configuración MercadoPago (fallback a env vars, sobreescribible desde DB)
export const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "";
export const MP_PUBLIC_KEY = process.env.MP_PUBLIC_KEY || "";
export const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || "";
export const MP_SANDBOX = process.env.MP_SANDBOX !== "false"; // default true

// Cache de settings de MercadoPago desde DB
let _mpSettingsCache: { token: string; publicKey: string; sandbox: boolean } | null = null;

// Obtener configuración de MercadoPago desde la DB (con cache)
export async function getMercadoPagoConfig() {
  if (_mpSettingsCache) return _mpSettingsCache;
  try {
    const { db } = await import("./db");
    const settings = await db.setting.findMany({
      where: {
        key: { in: ["mpAccessToken", "mpPublicKey", "mpSandbox"] },
      },
    });
    const map: Record<string, string> = {};
    settings.forEach((s) => (map[s.key] = s.value));

    _mpSettingsCache = {
      token: map.mpAccessToken || MP_ACCESS_TOKEN,
      publicKey: map.mpPublicKey || MP_PUBLIC_KEY,
      sandbox: map.mpSandbox ? map.mpSandbox !== "false" : MP_SANDBOX,
    };
    return _mpSettingsCache;
  } catch {
    return {
      token: MP_ACCESS_TOKEN,
      publicKey: MP_PUBLIC_KEY,
      sandbox: MP_SANDBOX,
    };
  }
}

// Limpiar cache (llamar cuando se actualizan los settings desde el admin)
export function clearMercadoPagoConfigCache() {
  _mpSettingsCache = null;
}

// Tipos de contenido
export const CONTENT_TYPES = ["MOVIE", "SERIES", "YOUTUBE", "MP4"] as const;
export const CHANNEL_TYPES = ["m3u", "m3u8"] as const;

// Categorías por defecto
export const DEFAULT_CATEGORIES = [
  "Acción",
  "Comedia",
  "Drama",
  "Terror",
  "Ciencia Ficción",
  "Romance",
  "Documental",
  "Animación",
  "Aventura",
  "Suspenso",
  "Infantil",
  "+18 Adultos",
];

// Calificaciones de edad
export const AGE_RATINGS = ["ATP", "+7", "+13", "+16", "+18"];

// Helper para saber si el usuario tiene suscripción activa
export function hasActiveSubscription(
  sub: { status: string; endDate: Date } | null | undefined
): boolean {
  if (!sub) return false;
  if (sub.status !== "ACTIVE") return false;
  return new Date(sub.endDate).getTime() > Date.now();
}
