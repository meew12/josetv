import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-helpers";

// GET /api/content - listar contenido con filtros
// Filtros: type, category, isAdult, search, limit, featured, trending, excludeAdult
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sp = url.searchParams;
    const user = await getUserFromRequest(req);
    const isAdmin = user?.role === "ADMIN";

    const excludeAdultParam = sp.get("excludeAdult"); // null | 'true' | 'false'
    const isAdultFilter = sp.get("isAdult"); // null | 'true' | 'false'

    // Por defecto excluir adulto salvo admin. Si el cliente pasa excludeAdult=false
    // se incluye contenido adulto (pero requiere adultVerified si no es admin).
    const excludeAdult =
      excludeAdultParam === null ? !isAdmin : excludeAdultParam !== "false";

    // Si el cliente pide explícitamente isAdult=true y no es admin, requiere adultVerified
    if (isAdultFilter === "true" && !isAdmin && !user?.adultVerified) {
      return errorResponse(
        "Debes verificar tu edad para ver contenido adulto",
        403
      );
    }

    // Si excludeAdult=false y el usuario no es admin ni adultVerified, denegar
    if (!excludeAdult && !isAdmin && !user?.adultVerified) {
      return errorResponse(
        "Debes verificar tu edad para ver contenido adulto",
        403
      );
    }

    const where: any = {};

    if (excludeAdult) {
      where.isAdult = false;
    } else if (isAdultFilter === "true") {
      where.isAdult = true;
    } else if (isAdultFilter === "false") {
      where.isAdult = false;
    }

    const type = sp.get("type");
    if (type) where.type = type;

    const category = sp.get("category");
    if (category) where.category = category;

    const genre = sp.get("genre");
    if (genre) where.genre = genre;

    const featured = sp.get("featured");
    if (featured === "true") where.featured = true;
    if (featured === "false") where.featured = false;

    const trending = sp.get("trending");
    if (trending === "true") where.trending = true;
    if (trending === "false") where.trending = false;

    // Filtro kids: solo contenido apto para niños (ATP o +7)
    const kids = sp.get("kids");
    if (kids === "true") {
      where.isAdult = false;
      where.ageRating = { in: ["ATP", "+7"] };
    }

    // Filtro por año (yearMin / yearMax)
    const yearMin = sp.get("yearMin");
    const yearMax = sp.get("yearMax");
    if (yearMin || yearMax) {
      const yMin = yearMin ? parseInt(yearMin, 10) : 1900;
      const yMax = yearMax ? parseInt(yearMax, 10) : 2100;
      where.year = { gte: yMin, lte: yMax };
    }

    // Filtro por rating mínimo
    const ratingMin = sp.get("ratingMin");
    if (ratingMin) {
      const rMin = parseFloat(ratingMin);
      if (!isNaN(rMin) && rMin > 0) {
        where.rating = { gte: rMin };
      }
    }

    // Filtro por duración (minutos)
    const durationMax = sp.get("durationMax");
    if (durationMax) {
      const dMax = parseInt(durationMax, 10);
      if (!isNaN(dMax) && dMax > 0) {
        where.duration = { lte: dMax };
      }
    }

    // Filtro por ageRating
    const ageRatings = sp.get("ageRatings");
    if (ageRatings) {
      const ratings = ageRatings.split(",").filter(Boolean);
      if (ratings.length > 0) {
        where.ageRating = { in: ratings };
      }
    }

    const search = sp.get("search")?.trim();
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { genre: { contains: search } },
      ];
    }

    const limit = Math.min(
      100,
      Math.max(1, parseInt(sp.get("limit") || "20", 10) || 20)
    );
    const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
    const orderBy = sp.get("orderBy") || "createdAt";
    const orderDir = sp.get("orderDir") === "asc" ? "asc" : "desc";

    const [items, total] = await Promise.all([
      db.content.findMany({
        where,
        orderBy: { [orderBy]: orderDir },
        take: limit,
        skip: (page - 1) * limit,
      }),
      db.content.count({ where }),
    ]);

    return successResponse({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[content/list] error:", err);
    return errorResponse("Error al obtener contenido", 500);
  }
}

// POST /api/content - crear contenido (admin)
export async function POST(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("No autorizado", 401);
    if (user.role !== "ADMIN") return errorResponse("Acceso denegado", 403);

    const body = await req.json().catch(() => ({}));
    const title = String(body?.title || "").trim();
    const type = String(body?.type || "").trim();

    if (!title) return errorResponse("Título requerido", 400);
    if (!["MOVIE", "SERIES", "YOUTUBE", "MP4"].includes(type)) {
      return errorResponse("Tipo inválido", 400);
    }
    if (!body?.url) return errorResponse("URL requerida", 400);

    const data: any = {
      title,
      type,
      url: String(body.url),
      description: String(body?.description || ""),
      thumbnail: String(body?.thumbnail || ""),
      banner: String(body?.banner || ""),
      logo: String(body?.logo || ""),
      category: String(body?.category || "General"),
      genre: String(body?.genre || ""),
      year: body?.year ? Number(body.year) : null,
      duration: body?.duration ? Number(body.duration) : null,
      rating: body?.rating ? Number(body.rating) : 0,
      ageRating: String(body?.ageRating || "ATP"),
      isAdult: Boolean(body?.isAdult),
      featured: Boolean(body?.featured),
      trending: Boolean(body?.trending),
      trailerUrl: body?.trailerUrl ? String(body.trailerUrl) : null,
    };

    const content = await db.content.create({ data });
    return successResponse(content, 201);
  } catch (err) {
    console.error("[content/create] error:", err);
    return errorResponse("Error al crear contenido", 500);
  }
}
