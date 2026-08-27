import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-helpers";

// GET /api/channels - listar canales
// Filtros: category, isAdult, active, search, limit, page
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sp = url.searchParams;
    const user = await getUserFromRequest(req);
    const isAdmin = user?.role === "ADMIN";

    const where: any = {};

    const active = sp.get("active");
    if (active === "true") where.active = true;
    if (active === "false") where.active = false;
    if (!isAdmin) where.active = true; // No-admin solo ve canales activos

    const category = sp.get("category");
    if (category) where.category = category;

    // Filtro de adulto: por defecto excluir salvo admin o adultVerified
    const isAdultParam = sp.get("isAdult");
    const excludeAdult = !isAdmin && !user?.adultVerified;
    if (excludeAdult && isAdultParam !== "true") {
      where.isAdult = false;
    } else if (isAdultParam === "true") {
      where.isAdult = true;
      if (!isAdmin && !user?.adultVerified) {
        return errorResponse(
          "Debes verificar tu edad para ver contenido adulto",
          403
        );
      }
    } else if (isAdultParam === "false") {
      where.isAdult = false;
    }

    const search = sp.get("search")?.trim();
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { category: { contains: search } },
      ];
    }

    const limit = Math.min(
      200,
      Math.max(1, parseInt(sp.get("limit") || "100", 10) || 100)
    );
    const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);

    const [items, total] = await Promise.all([
      db.channel.findMany({
        where,
        orderBy: [{ category: "asc" }, { name: "asc" }],
        take: limit,
        skip: (page - 1) * limit,
      }),
      db.channel.count({ where }),
    ]);

    return successResponse({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[channels/list] error:", err);
    return errorResponse("Error al obtener canales", 500);
  }
}

// Parsea una playlist m3u/m3u8 en canales
function parseM3U(content: string): Array<{
  name: string;
  url: string;
  logo: string;
  category: string;
  isAdult: boolean;
}> {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const channels: Array<{
    name: string;
    url: string;
    logo: string;
    category: string;
    isAdult: boolean;
  }> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.toUpperCase().startsWith("#EXTINF")) continue;

    // Parsear atributos tvg-logo y group-title
    const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
    const groupMatch = line.match(/group-title="([^"]*)"/i);
    const logo = logoMatch ? logoMatch[1] : "";
    const category = groupMatch ? groupMatch[1] : "General";

    // Nombre del canal: después de la última coma
    const commaIdx = line.lastIndexOf(",");
    const name =
      commaIdx >= 0 ? line.slice(commaIdx + 1).trim() : "Canal sin nombre";

    // URL en la siguiente línea no-comment
    let urlLine = "";
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].startsWith("#")) continue;
      urlLine = lines[j];
      break;
    }
    if (!urlLine) continue;

    const lower = (name + " " + category).toLowerCase();
    const isAdult =
      lower.includes("xxx") ||
      lower.includes("adult") ||
      lower.includes("+18") ||
      lower.includes("adultos");

    channels.push({ name, url: urlLine, logo, category, isAdult });
  }

  return channels;
}

// POST /api/channels - crear canal individual o importar playlist m3u
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("No autorizado", 401);
    if (user.role !== "ADMIN") return errorResponse("Acceso denegado", 403);

    const body = await req.json().catch(() => ({}));

    // Modo playlist: { playlistUrl } o { playlistContent }
    if (body?.playlistUrl || body?.playlistContent) {
      let playlistText = "";
      if (body.playlistUrl) {
        const playlistUrl = String(body.playlistUrl);
        const resp = await fetch(playlistUrl, { method: "GET" });
        if (!resp.ok) {
          return errorResponse(
            "No se pudo descargar la playlist",
            400
          );
        }
        playlistText = await resp.text();
      } else {
        playlistText = String(body.playlistContent);
      }

      const parsed = parseM3U(playlistText);
      if (parsed.length === 0) {
        return errorResponse(
          "No se encontraron canales en la playlist (formato inválido)",
          400
        );
      }

      const created: Array<{ id: string; name: string }> = [];
      // Upsert por url (única por canal)
      for (const ch of parsed) {
        const existing = await db.channel.findFirst({
          where: { url: ch.url },
        });
        if (existing) {
          await db.channel.update({
            where: { id: existing.id },
            data: {
              name: ch.name,
              logo: ch.logo,
              category: ch.category,
              isAdult: ch.isAdult,
            },
          });
          created.push({ id: existing.id, name: ch.name });
        } else {
          const c = await db.channel.create({
            data: {
              name: ch.name,
              url: ch.url,
              logo: ch.logo,
              category: ch.category,
              isAdult: ch.isAdult,
            },
          });
          created.push({ id: c.id, name: c.name });
        }
      }

      return successResponse(
        {
          imported: created.length,
          channels: created,
        },
        201
      );
    }

    // Modo canal individual
    const name = String(body?.name || "").trim();
    const url = String(body?.url || "").trim();
    if (!name) return errorResponse("Nombre requerido", 400);
    if (!url) return errorResponse("URL requerida", 400);

    const channel = await db.channel.create({
      data: {
        name,
        url,
        logo: String(body?.logo || ""),
        category: String(body?.category || "General"),
        isAdult: Boolean(body?.isAdult),
        epgId: body?.epgId ? String(body.epgId) : null,
        active: body?.active === undefined ? true : Boolean(body.active),
      },
    });

    return successResponse(channel, 201);
  } catch (err) {
    console.error("[channels/create] error:", err);
    return errorResponse("Error al crear canal", 500);
  }
}
