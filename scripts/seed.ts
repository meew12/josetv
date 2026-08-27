// Script de seed: crea admin, planes, categorías, ajustes y contenido demo
import { db } from "../src/lib/db";
import { hashPassword, generateSimpleToken } from "../src/lib/auth";

async function seed() {
  console.log("🌱 Iniciando seed de JOSE DEMO...");

  // 1. Admin user
  const adminEmail = "admin@josedemo.com";
  let admin = await db.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await db.user.create({
      data: {
        email: adminEmail,
        name: "Administrador",
        passwordHash: await hashPassword("admin123"),
        role: "ADMIN",
        adultVerified: true,
        token: generateSimpleToken(),
      },
    });
    console.log("✅ Admin creado: admin@josedemo.com / admin123");
    console.log("   Token simple:", admin.token);
  } else {
    console.log("ℹ️  Admin ya existe");
  }

  // 2. Usuario demo
  const demoEmail = "demo@josedemo.com";
  let demo = await db.user.findUnique({ where: { email: demoEmail } });
  if (!demo) {
    demo = await db.user.create({
      data: {
        email: demoEmail,
        name: "Usuario Demo",
        passwordHash: await hashPassword("demo123"),
        role: "USER",
        adultVerified: true,
        token: generateSimpleToken(),
      },
    });
    console.log("✅ Usuario demo creado: demo@josedemo.com / demo123");
  }

  // 3. Planes
  const plans = [
    {
      name: "Básico",
      price: 2500,
      durationDays: 30,
      description: "Calidad HD, 1 pantalla. Ideal para empezar.",
      features: JSON.stringify(["Calidad HD", "1 pantalla", "Películas y series", "Canales en vivo"]),
      quality: "HD",
      screens: 1,
    },
    {
      name: "Estándar",
      price: 4500,
      durationDays: 30,
      description: "Calidad Full HD, 2 pantallas. La mejor opción.",
      features: JSON.stringify(["Calidad Full HD", "2 pantallas", "Películas y series", "Canales en vivo", "Descargas"]),
      quality: "Full HD",
      screens: 2,
    },
    {
      name: "Premium",
      price: 7000,
      durationDays: 30,
      description: "Calidad 4K HDR, 4 pantallas. La experiencia completa.",
      features: JSON.stringify(["Calidad 4K HDR", "4 pantallas", "Todo el contenido", "Canales en vivo", "Descargas", "Sin anuncios"]),
      quality: "4K",
      screens: 4,
    },
  ];
  for (const p of plans) {
    const exists = await db.plan.findFirst({ where: { name: p.name } });
    if (!exists) {
      await db.plan.create({ data: p });
      console.log(`✅ Plan creado: ${p.name} ($${p.price})`);
    }
  }

  // 4. Categorías
  const cats = [
    { name: "Acción", slug: "accion" },
    { name: "Comedia", slug: "comedia" },
    { name: "Drama", slug: "drama" },
    { name: "Terror", slug: "terror" },
    { name: "Ciencia Ficción", slug: "ciencia-ficcion" },
    { name: "Romance", slug: "romance" },
    { name: "Documental", slug: "documental" },
    { name: "Animación", slug: "animacion" },
    { name: "Aventura", slug: "aventura" },
    { name: "Suspenso", slug: "suspenso" },
    { name: "Infantil", slug: "infantil" },
    { name: "+18 Adultos", slug: "adultos" },
  ];
  for (const c of cats) {
    const exists = await db.category.findUnique({ where: { slug: c.slug } });
    if (!exists) await db.category.create({ data: c });
  }
  console.log("✅ Categorías creadas");

  // 5. Ajustes por defecto
  const defaultSettings = [
    { key: "heroTitle", value: "JOSE DEMO" },
    { key: "heroSubtitle", value: "Stream sin límites. Películas, series y canales en vivo." },
    { key: "footerText", value: "© 2025 JOSE DEMO. Todos los derechos reservados." },
    { key: "announcement", value: "¡Bienvenido a JOSE DEMO! Usá el token para acceder." },
    { key: "primaryColor", value: "#E50914" },
  ];
  for (const s of defaultSettings) {
    const exists = await db.setting.findUnique({ where: { key: s.key } });
    if (!exists) await db.setting.create({ data: s });
  }
  console.log("✅ Ajustes creados");

  // 6. Contenido demo
  const demoMovies = [
    {
      title: "Acción Extrema",
      description: "Un héroe solitario enfrenta a una organización criminal en una misión imposible.",
      type: "MP4",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      thumbnail: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      banner: "https://image.tmdb.org/t/p/original/9lUHIg9c9CQ7J3T7L3l9zQc9CQ7.jpg",
      category: "Acción",
      genre: "Acción",
      year: 2024,
      duration: 120,
      rating: 8.5,
      ageRating: "+16",
      featured: true,
      trending: true,
    },
    {
      title: "El Último Viaje",
      description: "Una familia emprende un viaje que cambiará sus vidas para siempre.",
      type: "MP4",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      thumbnail: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      category: "Drama",
      genre: "Drama",
      year: 2023,
      duration: 110,
      rating: 7.8,
      ageRating: "+13",
      trending: true,
    },
    {
      title: "Risas en la Noche",
      description: "Una comedia hilarante sobre amigos que se reúnen después de años.",
      type: "MP4",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnail: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      category: "Comedia",
      genre: "Comedia",
      year: 2024,
      duration: 95,
      rating: 7.2,
      ageRating: "ATP",
    },
    {
      title: "Terror Nocturno",
      description: "Un grupo de amigos descubre un secreto oscuro en una cabaña abandonada.",
      type: "MP4",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      thumbnail: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      category: "Terror",
      genre: "Terror",
      year: 2024,
      duration: 100,
      rating: 6.9,
      ageRating: "+16",
    },
    {
      title: "Universo Infinito",
      description: "Viaje a través del espacio y el tiempo en esta épica ciencia ficción.",
      type: "MP4",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      thumbnail: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      category: "Ciencia Ficción",
      genre: "Ciencia Ficción",
      year: 2024,
      duration: 145,
      rating: 9.1,
      ageRating: "+13",
      trending: true,
    },
    {
      title: "Amor de Verano",
      description: "Una historia de amor que florece durante las vacaciones de verano.",
      type: "MP4",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      thumbnail: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      category: "Romance",
      genre: "Romance",
      year: 2023,
      duration: 105,
      rating: 7.5,
      ageRating: "+13",
    },
    {
      title: "Documental Naturaleza",
      description: "Explora la belleza de la naturaleza salvaje en este documental.",
      type: "MP4",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      thumbnail: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      category: "Documental",
      genre: "Documental",
      year: 2024,
      duration: 90,
      rating: 8.8,
      ageRating: "ATP",
    },
    {
      title: "Aventura Salvaje",
      description: "Una expedición peligrosa a las montañas más altas del mundo.",
      type: "MP4",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      thumbnail: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      category: "Aventura",
      genre: "Aventura",
      year: 2024,
      duration: 115,
      rating: 8.0,
      ageRating: "+7",
    },
  ];

  for (const m of demoMovies) {
    const exists = await db.content.findFirst({ where: { title: m.title } });
    if (!exists) await db.content.create({ data: m as any });
  }
  console.log("✅ Contenido demo creado");

  // 7. Canales en vivo demo
  const demoChannels = [
    { name: "Big Buck Bunny Live", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", logo: "", category: "Películas" },
    { name: "Tears of Steel", url: "https://test-streams.mux.dev/test_001/stream.m3u8", logo: "", category: "Acción" },
    { name: "Sintel Channel", url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8", logo: "", category: "Animación" },
    { name: "Mux Test Live", url: "https://stream.mux.com/v69RSHhFelSm4701snP22dYz2j1y4lICRmRdVgQT8g83100.m3u8", logo: "", category: "General" },
  ];
  for (const c of demoChannels) {
    const exists = await db.channel.findFirst({ where: { name: c.name } });
    if (!exists) await db.channel.create({ data: c });
  }
  console.log("✅ Canales demo creados");

  console.log("\n🎉 Seed completado!");
  console.log("   Admin: admin@josedemo.com / admin123");
  console.log("   Demo:  demo@josedemo.com / demo123");
}

seed()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
