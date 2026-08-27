// Script para buscar las películas faltantes con términos de búsqueda alternativos
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

// Mapeo de títulos en español a búsquedas en inglés
const SEARCH_MAP: Record<string, string[]> = {
  "El Último Viaje": ["The Last Journey", "The Last Trip", "Last Journey"],
  "Risas en la Noche": ["Night Comedy", "Late Night Comedy", "Night Laughs"],
  "Terror Nocturno": ["Nightmare", "Night Terror", "Nightmare on Elm Street"],
  "Amor de Verano": ["Summer Love", "Summer Romance", "Summer Fling"],
  "Documental Naturaleza": ["Nature Documentary", "Planet Earth", "Nature"],
  "Caza en la Oscuridad": ["Hunt in the Dark", "Dark Hunt", "The Hunt"],
  "Risas de Verano": ["Summer Comedy", "Vacation Comedy", "Summer Laughs"],
  "Misterio en la Niebla": ["Mistery in the Fog", "The Fog", "Mistery"],
  "Animales Salvajes": ["Wild Animals", "Wildlife", "Wild Documentary"],
  "Amor Bajo la Lluvia": ["Love in the Rain", "Rain Romance", "Rainy Love"],
  "Lo Mejor de YouTube — Música": ["Music Documentary", "Music Concert", "Music Festival"],
  "Documental HD — Naturaleza": ["Nature HD", "Planet Earth II", "Blue Planet"],
  "Tutorial de Cocina": ["Cooking Tutorial", "Cooking Show", "Food Network"],
  "Gaming Highlights": ["Gaming", "Video Games", "Esports"],
  "Pasión Prohibida": ["Forbidden Love", "Forbidden Passion", "Dangerous Liaisons"],
  "Deseo Nocturno": ["Night Desire", "Nightwish", "Desire"],
  "El Caballero de la Noche": ["The Dark Knight", "Batman Dark Knight", "Batman"],
  "Parásitos": ["Parasite", "Parasite 2019", "Bong Joon Ho"],
  "Gladiador": ["Gladiator", "Gladiator 2000", "Russell Crowe Gladiator"],
  "El Rey León": ["The Lion King", "Lion King 1994", "Lion King"],
};

async function searchTMDB(query: string) {
  try {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: TMDBResult = await res.json();
    if (!data.results || data.results.length === 0) return null;

    const movie = data.results[0];
    if (!movie.poster_path || !movie.backdrop_path) return null;

    return {
      posterUrl: `${TMDB_BASE}/w500${movie.poster_path}`,
      backdropUrl: `${TMDB_BASE}/original${movie.backdrop_path}`,
      overview: movie.overview || "",
      year: movie.release_date ? parseInt(movie.release_date.substring(0, 4)) : 0,
      rating: Math.round((movie.vote_average || 0) * 10) / 10,
    };
  } catch {
    return null;
  }
}

async function verifyUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    return res.ok;
  } catch {
    return false;
  }
}

async function updateRemaining() {
  console.log("🎬 Buscando películas faltantes con términos alternativos...\n");

  const allContent = await db.content.findMany();
  let updated = 0;
  let stillFailed = 0;

  for (const content of allContent) {
    // Solo procesar las que todavía tienen placehold.co
    if (!content.thumbnail.includes("placehold.co")) {
      continue;
    }

    const searchTerms = SEARCH_MAP[content.title] || [content.title];
    let found = false;

    for (const term of searchTerms) {
      if (found) break;
      const result = await searchTMDB(term);
      if (result) {
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
            },
          });
          updated++;
          console.log(`  ✅ ${content.title} → "${term}" → imágenes reales`);
          found = true;
        }
      }
      await new Promise((r) => setTimeout(r, 300));
    }

    if (!found) {
      stillFailed++;
      console.log(`  ❌ ${content.title} → no encontrado`);
    }
  }

  console.log(`\n🎉 ${updated} películas adicionales actualizadas con imágenes reales!`);
  console.log(`❌ ${stillFailed} películas todavía sin imágenes reales`);
}

updateRemaining()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
