// Script para buscar y actualizar TODAS las películas con imágenes reales de TMDB
import { db } from "../src/lib/db";

const TMDB_API_KEY = "8265bd1679663a7ea12ac168da84d2e8";
const TMDB_BASE = "https://image.tmdb.org/t/p";

interface TMDBResult {
  results: Array<{
    id: number;
    title: string;
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string;
    release_date: string;
    vote_average: number;
  }>;
}

async function searchTMDB(query: string): Promise<{
  posterUrl: string;
  backdropUrl: string;
  overview: string;
  year: number;
  rating: number;
} | null> {
  try {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: TMDBResult = await res.json();
    if (!data.results || data.results.length === 0) return null;

    const movie = data.results[0];
    if (!movie.poster_path || !movie.backdrop_path) return null;

    const posterUrl = `${TMDB_BASE}/w500${movie.poster_path}`;
    const backdropUrl = `${TMDB_BASE}/original${movie.backdrop_path}`;
    const year = movie.release_date
      ? parseInt(movie.release_date.substring(0, 4))
      : 0;
    const rating = Math.round((movie.vote_average || 0) * 10) / 10;

    return {
      posterUrl,
      backdropUrl,
      overview: movie.overview || "",
      year,
      rating,
    };
  } catch {
    return null;
  }
}

// Verificar que una URL carga
async function verifyUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    return res.ok;
  } catch {
    return false;
  }
}

async function updateAllImages() {
  console.log("🎬 Buscando imágenes reales de TMDB para todas las películas...\n");

  const allContent = await db.content.findMany();
  let updated = 0;
  let failed = 0;

  for (const content of allContent) {
    // Buscar en TMDB
    const result = await searchTMDB(content.title);

    if (result) {
      // Verificar que las URLs carguen
      const [posterOk, backdropOk] = await Promise.all([
        verifyUrl(result.posterUrl),
        verifyUrl(result.backdropUrl),
      ]);

      if (posterOk && backdropOk) {
        await db.content.update({
          where: { id: content.id },
          data: {
            thumbnail: result.posterUrl,
            banner: result.backdropUrl,
            ...(result.overview ? { description: result.overview.slice(0, 500) } : {}),
            ...(result.year ? { year: result.year } : {}),
            ...(result.rating ? { rating: result.rating } : {}),
          },
        });
        updated++;
        console.log(`  ✅ ${content.title} → imágenes reales de TMDB`);
      } else {
        console.log(`  ⚠️ ${content.title} → URLs no cargan, manteniendo placehold.co`);
        failed++;
      }
    } else {
      console.log(`  ❌ ${content.title} → no encontrado en TMDB, manteniendo placehold.co`);
      failed++;
    }

    // Pausa para no saturar la API
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n🎉 ${updated} películas actualizadas con imágenes reales de TMDB!`);
  console.log(`⚠️ ${failed} películas mantienen placehold.co como fallback`);
}

updateAllImages()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
