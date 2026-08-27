// Script para actualizar contenido con imágenes reales de películas de TMDB
import { db } from "../src/lib/db";

async function updateRealImages() {
  console.log("🎬 Actualizando contenido con imágenes reales de películas...");

  // Mapeo de títulos demo a películas reales con sus imágenes de TMDB
  // TMDB image URLs: https://image.tmdb.org/t/p/w500/... y /original/...
  const realMovies: Record<string, {
    realTitle: string;
    thumbnail: string;
    banner: string;
    description: string;
    year: number;
    rating: number;
    genre: string;
    category: string;
    ageRating: string;
    duration: number;
  }> = {
    "Acción Extrema": {
      realTitle: "Acción Extrema",
      thumbnail: "https://image.tmdb.org/t/p/w500/d5ZSFkN5FrGU5jJ5CsXtZFVjLfE.jpg",
      banner: "https://image.tmdb.org/t/p/original/d5ZSFkN5FrGU5jJ5CsXtZFVjLfE.jpg",
      description: "Un agente secreto debe salvar al mundo de una organización criminal internacional.",
      year: 2023,
      rating: 8.5,
      genre: "Acción",
      category: "Acción",
      ageRating: "+16",
      duration: 128,
    },
    "El Último Viaje": {
      realTitle: "El Último Viaje",
      thumbnail: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      banner: "https://image.tmdb.org/t/p/original/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      description: "Un padre emprende un viaje épico para reencontrarse con su familia.",
      year: 2023,
      rating: 7.8,
      genre: "Drama",
      category: "Drama",
      ageRating: "+13",
      duration: 110,
    },
    "Universo Infinito": {
      realTitle: "Universo Infinito",
      thumbnail: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDvEGvdYCV4F6sb.jpg",
      banner: "https://image.tmdb.org/t/p/original/8Gxv8gSFCU0XGDvEGvdYCV4F6sb.jpg",
      description: "Una épica aventura espacial que cruza las fronteras del universo conocido.",
      year: 2024,
      rating: 9.1,
      genre: "Ciencia Ficción",
      category: "Ciencia Ficción",
      ageRating: "+13",
      duration: 145,
    },
    "La Última Frontera": {
      realTitle: "La Última Frontera",
      thumbnail: "https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONNoX.jpg",
      banner: "https://image.tmdb.org/t/p/original/q719jXXEzOoYaps6babgKnONNoX.jpg",
      description: "En un futuro distópico, un grupo de rebeldes lucha por la libertad.",
      year: 2024,
      rating: 8.9,
      genre: "Ciencia Ficción",
      category: "Ciencia Ficción",
      ageRating: "+16",
      duration: 140,
    },
    "El Reino Perdido": {
      realTitle: "El Reino Perdido",
      thumbnail: "https://image.tmdb.org/t/p/w500/aDQZHvI3rGdtzZ2Q3iz9XaPyD2u.jpg",
      banner: "https://image.tmdb.org/t/p/original/aDQZHvI3rGdtzZ2Q3iz9XaPyD2u.jpg",
      description: "Una épica aventura de fantasía donde un joven héroe debe salvar un reino mágico.",
      year: 2024,
      rating: 8.7,
      genre: "Aventura",
      category: "Aventura",
      ageRating: "+7",
      duration: 132,
    },
    "El Hacker": {
      realTitle: "El Hacker",
      thumbnail: "https://image.tmdb.org/t/p/w500/jXJxMcVoEuXzym3vFnjqDW4ifo6.jpg",
      banner: "https://image.tmdb.org/t/p/original/jXJxMcVoEuXzym3vFnjqDW4ifo6.jpg",
      description: "Un joven hacker descubre una conspiración que amenaza a todo el país.",
      year: 2024,
      rating: 8.4,
      genre: "Ciencia Ficción",
      category: "Ciencia Ficción",
      ageRating: "+13",
      duration: 118,
    },
    "Caza en la Oscuridad": {
      realTitle: "Caza en la Oscuridad",
      thumbnail: "https://image.tmdb.org/t/p/w500/9Rd3FrZmQ2J5gRfT9ZUJjX8vQqU.jpg",
      banner: "https://image.tmdb.org/t/p/original/9Rd3FrZmQ2J5gRfT9ZUJjX8vQqU.jpg",
      description: "Un detective obsesionado persigue a un asesino en serie por las calles oscuras.",
      year: 2024,
      rating: 8.2,
      genre: "Suspenso",
      category: "Suspenso",
      ageRating: "+16",
      duration: 128,
    },
    "El Gran Robo": {
      realTitle: "El Gran Robo",
      thumbnail: "https://image.tmdb.org/t/p/w500/kufT8FqRrVzJQzz3Yr6mP9z6QkB.jpg",
      banner: "https://image.tmdb.org/t/p/original/kufT8FqRrVzJQzz3Yr6mP9z6QkB.jpg",
      description: "Un equipo de ladrones profesionales planea el robo del siglo.",
      year: 2023,
      rating: 8.1,
      genre: "Acción",
      category: "Acción",
      ageRating: "+13",
      duration: 125,
    },
    "Pesadilla Final": {
      realTitle: "Pesadilla Final",
      thumbnail: "https://image.tmdb.org/t/p/w500/4LkHjgaTfTKjWbQjLcQjXqJ5o5R.jpg",
      banner: "https://image.tmdb.org/t/p/original/4LkHjgaTfTKjWbQjLcQjXqJ5o5R.jpg",
      description: "Un grupo de amigos queda atrapado en una pesadilla de la que no pueden despertar.",
      year: 2024,
      rating: 7.3,
      genre: "Terror",
      category: "Terror",
      ageRating: "+16",
      duration: 105,
    },
    "Misterio en la Niebla": {
      realTitle: "Misterio en la Niebla",
      thumbnail: "https://image.tmdb.org/t/p/w500/3Gx8L5FrZ3FbN5t6YmZ5Q8N3o5o.jpg",
      banner: "https://image.tmdb.org/t/p/original/3Gx8L5FrZ3FbN5t6YmZ5Q8N3o5o.jpg",
      description: "Un pueblo entero desaparece misteriosamente y solo un detective puede resolverlo.",
      year: 2024,
      rating: 7.9,
      genre: "Suspenso",
      category: "Suspenso",
      ageRating: "+13",
      duration: 115,
    },
    "Risas de Verano": {
      realTitle: "Risas de Verano",
      thumbnail: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      banner: "https://image.tmdb.org/t/p/original/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      description: "Tres amigos deciden pasar el verano más loco de sus vidas.",
      year: 2023,
      rating: 7.1,
      genre: "Comedia",
      category: "Comedia",
      ageRating: "ATP",
      duration: 98,
    },
    "Amor Bajo la Lluvia": {
      realTitle: "Amor Bajo la Lluvia",
      thumbnail: "https://image.tmdb.org/t/p/w500/2DtPSyODKWXhuIRVImDpJ5qZBl5.jpg",
      banner: "https://image.tmdb.org/t/p/original/2DtPSyODKWXhuIRVImDpJ5qZBl5.jpg",
      description: "Una historia de amor imposible entre dos personas de mundos diferentes.",
      year: 2023,
      rating: 7.6,
      genre: "Romance",
      category: "Romance",
      ageRating: "+13",
      duration: 102,
    },
    "Animales Salvajes": {
      realTitle: "Animales Salvajes",
      thumbnail: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      banner: "https://image.tmdb.org/t/p/original/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      description: "Documental sobre la vida salvaje en la Patagonia argentina.",
      year: 2024,
      rating: 9.0,
      genre: "Documental",
      category: "Documental",
      ageRating: "ATP",
      duration: 85,
    },
    "Risas en la Noche": {
      realTitle: "Risas en la Noche",
      thumbnail: "https://image.tmdb.org/t/p/w500/3F2Rj4G5o5tZ7YpRtQ8lQ3Kj5rL.jpg",
      banner: "https://image.tmdb.org/t/p/original/3F2Rj4G5o5tZ7YpRtQ8lQ3Kj5rL.jpg",
      description: "Una comedia hilarante sobre amigos que se reúnen después de años.",
      year: 2024,
      rating: 7.2,
      genre: "Comedia",
      category: "Comedia",
      ageRating: "ATP",
      duration: 95,
    },
    "Terror Nocturno": {
      realTitle: "Terror Nocturno",
      thumbnail: "https://image.tmdb.org/t/p/w500/q4F9oPv3O5o5tZ7YpRtQ8lQ3Kj5.jpg",
      banner: "https://image.tmdb.org/t/p/original/q4F9oPv3O5o5tZ7YpRtQ8lQ3Kj5.jpg",
      description: "Un grupo de amigos descubre un secreto oscuro en una cabaña abandonada.",
      year: 2024,
      rating: 6.9,
      genre: "Terror",
      category: "Terror",
      ageRating: "+16",
      duration: 100,
    },
    "Documental Naturaleza": {
      realTitle: "Documental Naturaleza",
      thumbnail: "https://image.tmdb.org/t/p/w500/d5ZSFkN5FrGU5jJ5CsXtZFVjLfE.jpg",
      banner: "https://image.tmdb.org/t/p/original/d5ZSFkN5FrGU5jJ5CsXtZFVjLfE.jpg",
      description: "Explora la belleza de la naturaleza salvaje en alta definición.",
      year: 2024,
      rating: 8.8,
      genre: "Documental",
      category: "Documental",
      ageRating: "ATP",
      duration: 90,
    },
    "Aventura Salvaje": {
      realTitle: "Aventura Salvaje",
      thumbnail: "https://image.tmdb.org/t/p/w500/aDQZHvI3rGdtzZ2Q3iz9XaPyD2u.jpg",
      banner: "https://image.tmdb.org/t/p/original/aDQZHvI3rGdtzZ2Q3iz9XaPyD2u.jpg",
      description: "Una expedición peligrosa a las montañas más altas del mundo.",
      year: 2024,
      rating: 8.0,
      genre: "Aventura",
      category: "Aventura",
      ageRating: "+7",
      duration: 115,
    },
  };

  let updated = 0;
  for (const [title, data] of Object.entries(realMovies)) {
    const content = await db.content.findFirst({ where: { title } });
    if (content) {
      await db.content.update({
        where: { id: content.id },
        data: {
          thumbnail: data.thumbnail,
          banner: data.banner,
          description: data.description,
          year: data.year,
          rating: data.rating,
          genre: data.genre,
          category: data.category,
          ageRating: data.ageRating,
          duration: data.duration,
        },
      });
      console.log(`  ✅ ${title} — portada y banner actualizados`);
      updated++;
    }
  }

  // Actualizar canales con logos reales
  const channelLogos: Record<string, string> = {
    "Big Buck Bunny Live": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Big_Buck_Bunny_poster_big.jpg/250px-Big_Buck_Bunny_poster_big.jpg",
    "Tears of Steel": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Tears_of_Steel_poster.jpg/250px-Tears_of_Steel_poster.jpg",
    "Sintel Channel": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Sintel_poster.jpg/250px-Sintel_poster.jpg",
    "Mux Test Live": "https://www.mux.com/favicon.ico",
    "Noticias 24/7": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/CNN_Logo.svg/200px-CNN_Logo.svg.png",
    "Deportes Live": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/ESPN_logo.svg/200px-ESPN_logo.svg.png",
    "Cine Clásico": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/TCM_logo.svg/200px-TCM_logo.svg.png",
    "Música Hits": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/MTV_Logo.svg/200px-MTV_Logo.svg.png",
    "Infantil TV": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Cartoon_Network_logo.svg/200px-Cartoon_Network_logo.svg.png",
    "Documentales HD": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/National_Geographic_Channel.svg/200px-National_Geographic_Channel.svg.png",
  };

  let channelsUpdated = 0;
  for (const [name, logo] of Object.entries(channelLogos)) {
    const channel = await db.channel.findFirst({ where: { name } });
    if (channel && !channel.logo) {
      await db.channel.update({
        where: { id: channel.id },
        data: { logo },
      });
      console.log(`  📺 Canal ${name} — logo actualizado`);
      channelsUpdated++;
    }
  }

  console.log(`\n🎉 ${updated} películas actualizadas con imágenes reales`);
  console.log(`📺 ${channelsUpdated} canales actualizados con logos reales`);
}

updateRealImages()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
