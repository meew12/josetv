// Script para añadir más contenido demo a JOSE DEMO
import { db } from "../src/lib/db";

async function addMoreContent() {
  console.log("🎬 Añadiendo más contenido demo...");

  const moreMovies = [
    {
      title: "Caza en la Oscuridad",
      description: "Un detective obsesionado persigue a un asesino en serie por las calles de Buenos Aires.",
      type: "MP4",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
      thumbnail: "https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONNoX.jpg",
      banner: "https://image.tmdb.org/t/p/original/q719jXXEzOoYaps6babgKnONNoX.jpg",
      category: "Suspenso",
      genre: "Suspenso",
      year: 2024,
      duration: 128,
      rating: 8.2,
      ageRating: "+16",
      trending: true,
    },
    {
      title: "El Reino Perdido",
      description: "Una épica aventura de fantasía donde un joven héroe debe salvar un reino mágico.",
      type: "MP4",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
      thumbnail: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      category: "Aventura",
      genre: "Aventura",
      year: 2024,
      duration: 132,
      rating: 8.7,
      ageRating: "+7",
      featured: true,
    },
    {
      title: "Risas de Verano",
      description: "Tres amigos deciden pasar el verano más loco de sus vidas en la costa argentina.",
      type: "MP4",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      thumbnail: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      category: "Comedia",
      genre: "Comedia",
      year: 2023,
      duration: 98,
      rating: 7.1,
      ageRating: "ATP",
    },
    {
      title: "Misterio en la Niebla",
      description: "Un pueblo entero desaparece misteriosamente y solo un detective puede resolverlo.",
      type: "MP4",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
      thumbnail: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      category: "Suspenso",
      genre: "Suspenso",
      year: 2024,
      duration: 115,
      rating: 7.9,
      ageRating: "+13",
    },
    {
      title: "Animales Salvajes",
      description: "Documental sobre la vida salvaje en la Patagonia argentina.",
      type: "MP4",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
      thumbnail: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      category: "Documental",
      genre: "Documental",
      year: 2024,
      duration: 85,
      rating: 9.0,
      ageRating: "ATP",
    },
    {
      title: "El Hacker",
      description: "Un joven hacker descubre una conspiración que amenaza a todo el país.",
      type: "MP4",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
      thumbnail: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      category: "Ciencia Ficción",
      genre: "Ciencia Ficción",
      year: 2024,
      duration: 118,
      rating: 8.4,
      ageRating: "+13",
      trending: true,
    },
    {
      title: "Amor Bajo la Lluvia",
      description: "Una historia de amor imposible entre dos personas de mundos diferentes.",
      type: "MP4",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      thumbnail: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      category: "Romance",
      genre: "Romance",
      year: 2023,
      duration: 102,
      rating: 7.6,
      ageRating: "+13",
    },
    {
      title: "La Última Frontera",
      description: "En un futuro distópico, un grupo de rebeldes lucha por la libertad.",
      type: "MP4",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      thumbnail: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      category: "Ciencia Ficción",
      genre: "Ciencia Ficción",
      year: 2024,
      duration: 140,
      rating: 8.9,
      ageRating: "+16",
      featured: true,
      trending: true,
    },
    {
      title: "Pesadilla Final",
      description: "Un grupo de amigos queda atrapado en una pesadilla de la que no pueden despertar.",
      type: "MP4",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      thumbnail: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      category: "Terror",
      genre: "Terror",
      year: 2024,
      duration: 105,
      rating: 7.3,
      ageRating: "+16",
    },
    {
      title: "El Gran Robo",
      description: "Un equipo de ladrones profesionales planea el robo del siglo.",
      type: "MP4",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      thumbnail: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      category: "Acción",
      genre: "Acción",
      year: 2023,
      duration: 125,
      rating: 8.1,
      ageRating: "+13",
    },
  ];

  for (const m of moreMovies) {
    const exists = await db.content.findFirst({ where: { title: m.title } });
    if (!exists) {
      await db.content.create({ data: m as any });
      console.log(`  ✅ ${m.title}`);
    }
  }

  // YouTube content
  const youtubeContent = [
    {
      title: "Lo Mejor de YouTube — Música",
      description: "Recopilación de los mejores videos musicales.",
      type: "YOUTUBE",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      category: "Música",
      genre: "Música",
      year: 2024,
      rating: 8.0,
      ageRating: "ATP",
      trending: true,
    },
    {
      title: "Documental HD — Naturaleza",
      description: "Explora la naturaleza en alta definición.",
      type: "YOUTUBE",
      url: "https://www.youtube.com/watch?v=LXb3EKWsInQ",
      thumbnail: "https://img.youtube.com/vi/LXb3EKWsInQ/maxresdefault.jpg",
      category: "Documental",
      genre: "Documental",
      year: 2024,
      rating: 8.5,
      ageRating: "ATP",
    },
    {
      title: "Tutorial de Cocina",
      description: "Aprendé a cocinar platos deliciosos.",
      type: "YOUTUBE",
      url: "https://www.youtube.com/watch?v=1BdP7Z9PzZ0",
      thumbnail: "https://img.youtube.com/vi/1BdP7Z9PzZ0/maxresdefault.jpg",
      category: "Cocina",
      genre: "Cocina",
      year: 2024,
      rating: 7.5,
      ageRating: "ATP",
    },
    {
      title: "Gaming Highlights",
      description: "Los mejores momentos del mundo gaming.",
      type: "YOUTUBE",
      url: "https://www.youtube.com/watch?v=5qap5aO4i9A",
      thumbnail: "https://img.youtube.com/vi/5qap5aO4i9A/maxresdefault.jpg",
      category: "Gaming",
      genre: "Gaming",
      year: 2024,
      rating: 8.2,
      ageRating: "+7",
    },
  ];

  for (const y of youtubeContent) {
    const exists = await db.content.findFirst({ where: { title: y.title } });
    if (!exists) {
      await db.content.create({ data: y as any });
      console.log(`  ✅ YouTube: ${y.title}`);
    }
  }

  // +18 content
  const adultContent = [
    {
      title: "Noche Caliente",
      description: "Contenido exclusivo para adultos. Solo +18.",
      type: "MP4",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      thumbnail: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      category: "+18 Adultos",
      genre: "Adultos",
      year: 2024,
      duration: 90,
      rating: 7.0,
      ageRating: "+18",
      isAdult: true,
    },
    {
      title: "Pasión Prohibida",
      description: "Drama romántico para adultos.",
      type: "MP4",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
      thumbnail: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      category: "+18 Adultos",
      genre: "Adultos",
      year: 2024,
      duration: 95,
      rating: 7.5,
      ageRating: "+18",
      isAdult: true,
    },
    {
      title: "Deseo Nocturno",
      description: "Película exclusiva +18.",
      type: "MP4",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      thumbnail: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      category: "+18 Adultos",
      genre: "Adultos",
      year: 2024,
      duration: 88,
      rating: 6.8,
      ageRating: "+18",
      isAdult: true,
    },
  ];

  for (const a of adultContent) {
    const exists = await db.content.findFirst({ where: { title: a.title } });
    if (!exists) {
      await db.content.create({ data: a as any });
      console.log(`  ✅ +18: ${a.title}`);
    }
  }

  // More channels
  const moreChannels = [
    { name: "Noticias 24/7", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", logo: "", category: "Noticias" },
    { name: "Deportes Live", url: "https://test-streams.mux.dev/test_001/stream.m3u8", logo: "", category: "Deportes" },
    { name: "Cine Clásico", url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8", logo: "", category: "Películas" },
    { name: "Música Hits", url: "https://stream.mux.com/v69RSHhFelSm4701snP22dYz2j1y4lICRmRdVgQT8g83100.m3u8", logo: "", category: "Música" },
    { name: "Infantil TV", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", logo: "", category: "Infantil" },
    { name: "Documentales HD", url: "https://test-streams.mux.dev/test_001/stream.m3u8", logo: "", category: "Documentales" },
  ];

  for (const c of moreChannels) {
    const exists = await db.channel.findFirst({ where: { name: c.name } });
    if (!exists) {
      await db.channel.create({ data: c });
      console.log(`  ✅ Canal: ${c.name}`);
    }
  }

  // Adult channels
  const adultChannels = [
    { name: "Canal Adulto 1", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", logo: "", category: "+18", isAdult: true },
    { name: "Canal Adulto 2", url: "https://test-streams.mux.dev/test_001/stream.m3u8", logo: "", category: "+18", isAdult: true },
  ];

  for (const c of adultChannels) {
    const exists = await db.channel.findFirst({ where: { name: c.name } });
    if (!exists) {
      await db.channel.create({ data: c });
      console.log(`  ✅ Canal +18: ${c.name}`);
    }
  }

  console.log("\n🎉 Contenido adicional agregado!");
}

addMoreContent()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
