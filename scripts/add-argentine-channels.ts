// Script para añadir canales argentinos y internacionales con logos reales
import { db } from "../src/lib/db";

async function addArgentineChannels() {
  console.log("📺 Añadiendo canales argentinos e internacionales con logos reales...");

  // URLs de streams de prueba (m3u8 públicos) y logos reales de canales
  // Logos de Wikipedia Commons (públicos)
  const channels = [
    // === CANALES ARGENTINOS ===
    {
      name: "El Trece",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Logo_Eltrece.png/200px-Logo_Eltrece.png",
      category: "General",
      isAdult: false,
    },
    {
      name: "Telefe",
      url: "https://test-streams.mux.dev/test_001/stream.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Telefe_%282018%29.svg/200px-Telefe_%282018%29.svg.png",
      category: "General",
      isAdult: false,
    },
    {
      name: "Canal 9",
      url: "https://stream.mux.com/v69RSHhFelSm4701snP22dYz2j1y4lICRmRdVgQT8g83100.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Canal_9_2024.svg/200px-Canal_9_2024.svg.png",
      category: "General",
      isAdult: false,
    },
    {
      name: "TV Pública",
      url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/TV_Publica_Argentina.svg/200px-TV_Publica_Argentina.svg.png",
      category: "General",
      isAdult: false,
    },
    {
      name: "América TV",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/America_TV_2024.svg/200px-America_TV_2024.svg.png",
      category: "General",
      isAdult: false,
    },
    // === DEPORTES ARGENTINOS ===
    {
      name: "ESPN Argentina",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/ESPN_logo.svg/200px-ESPN_logo.svg.png",
      category: "Deportes",
      isAdult: false,
    },
    {
      name: "TyC Sports",
      url: "https://test-streams.mux.dev/test_001/stream.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/TyC_Sports_logo.svg/200px-TyC_Sports_logo.svg.png",
      category: "Deportes",
      isAdult: false,
    },
    {
      name: "Fox Sports Argentina",
      url: "https://stream.mux.com/v69RSHhFelSm4701snP22dYz2j1y4lICRmRdVgQT8g83100.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Fox_Sports_logo.svg/200px-Fox_Sports_logo.svg.png",
      category: "Deportes",
      isAdult: false,
    },
    {
      name: "TNT Sports",
      url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/TNT_Sports_2021.svg/200px-TNT_Sports_2021.svg.png",
      category: "Deportes",
      isAdult: false,
    },
    {
      name: "DeporTV",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Deportv.svg/200px-Deportv.svg.png",
      category: "Deportes",
      isAdult: false,
    },
    // === NOTICIAS ARGENTINAS ===
    {
      name: "TN Todo Noticias",
      url: "https://test-streams.mux.dev/test_001/stream.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/TN_Todo_Noticias_2016.svg/200px-TN_Todo_Noticias_2016.svg.png",
      category: "Noticias",
      isAdult: false,
    },
    {
      name: "C5N",
      url: "https://stream.mux.com/v69RSHhFelSm4701snP22dYz2j1y4lICRmRdVgQT8g83100.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/C5N_2016.svg/200px-C5N_2016.svg.png",
      category: "Noticias",
      isAdult: false,
    },
    {
      name: "A24",
      url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/A24_2024.svg/200px-A24_2024.svg.png",
      category: "Noticias",
      isAdult: false,
    },
    {
      name: "Crónica TV",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Cronica_TV_2018.svg/200px-Cronica_TV_2018.svg.png",
      category: "Noticias",
      isAdult: false,
    },
    {
      name: "La Nación+",
      url: "https://test-streams.mux.dev/test_001/stream.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/La_Nacion_Plus.svg/200px-La_Nacion_Plus.svg.png",
      category: "Noticias",
      isAdult: false,
    },
    // === PELÍCULAS Y SERIES ===
    {
      name: "HBO",
      url: "https://stream.mux.com/v69RSHhFelSm4701snP22dYz2j1y4lICRmRdVgQT8g83100.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/HBO_logo.svg/200px-HBO_logo.svg.png",
      category: "Películas",
      isAdult: false,
    },
    {
      name: "Cinemax",
      url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Cinemax_logo.svg/200px-Cinemax_logo.svg.png",
      category: "Películas",
      isAdult: false,
    },
    {
      name: "Space",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Space_TV_logo.svg/200px-Space_TV_logo.svg.png",
      category: "Películas",
      isAdult: false,
    },
    {
      name: "Cine AR",
      url: "https://test-streams.mux.dev/test_001/stream.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Cine.AR_Logo.svg/200px-Cine.AR_Logo.svg.png",
      category: "Películas",
      isAdult: false,
    },
    // === INFANTIL ===
    {
      name: "Cartoon Network",
      url: "https://stream.mux.com/v69RSHhFelSm4701snP22dYz2j1y4lICRmRdVgQT8g83100.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Cartoon_Network_logo.svg/200px-Cartoon_Network_logo.svg.png",
      category: "Infantil",
      isAdult: false,
    },
    {
      name: "Disney Channel",
      url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Disney_Channel_logo_2017.svg/200px-Disney_Channel_logo_2017.svg.png",
      category: "Infantil",
      isAdult: false,
    },
    {
      name: "Nickelodeon",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Nickelodeon_2023_logo.svg/200px-Nickelodeon_2023_logo.svg.png",
      category: "Infantil",
      isAdult: false,
    },
    {
      name: "Pakapaka",
      url: "https://test-streams.mux.dev/test_001/stream.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Pakapaka_logo.svg/200px-Pakapaka_logo.svg.png",
      category: "Infantil",
      isAdult: false,
    },
    // === MÚSICA ===
    {
      name: "MTV",
      url: "https://stream.mux.com/v69RSHhFelSm4701snP22dYz2j1y4lICRmRdVgQT8g83100.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/MTV_Logo.svg/200px-MTV_Logo.svg.png",
      category: "Música",
      isAdult: false,
    },
    {
      name: "Much Music",
      url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Much_Music_2017.svg/200px-Much_Music_2017.svg.png",
      category: "Música",
      isAdult: false,
    },
    // === DOCUMENTALES ===
    {
      name: "National Geographic",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/National_Geographic_Channel.svg/200px-National_Geographic_Channel.svg.png",
      category: "Documentales",
      isAdult: false,
    },
    {
      name: "Discovery Channel",
      url: "https://test-streams.mux.dev/test_001/stream.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Discovery_Channel_Logo.svg/200px-Discovery_Channel_Logo.svg.png",
      category: "Documentales",
      isAdult: false,
    },
    {
      name: "History Channel",
      url: "https://stream.mux.com/v69RSHhFelSm4701snP22dYz2j1y4lICRmRdVgQT8g83100.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/History_Logo.svg/200px-History_Logo.svg.png",
      category: "Documentales",
      isAdult: false,
    },
    {
      name: "Animal Planet",
      url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Animal_Planet_logo.svg/200px-Animal_Planet_logo.svg.png",
      category: "Documentales",
      isAdult: false,
    },
    // === VARIEDADES ===
    {
      name: "Sony Channel",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Sony_Channel_logo.svg/200px-Sony_Channel_logo.svg.png",
      category: "Series",
      isAdult: false,
    },
    {
      name: "Warner Channel",
      url: "https://test-streams.mux.dev/test_001/stream.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Warner_Channel_Logo.svg/200px-Warner_Channel_Logo.svg.png",
      category: "Series",
      isAdult: false,
    },
    {
      name: "Universal TV",
      url: "https://stream.mux.com/v69RSHhFelSm4701snP22dYz2j1y4lICRmRdVgQT8g83100.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Universal_TV_2017.svg/200px-Universal_TV_2017.svg.png",
      category: "Series",
      isAdult: false,
    },
    {
      name: "FX",
      url: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/FX_Logo.svg/200px-FX_Logo.svg.png",
      category: "Series",
      isAdult: false,
    },
    {
      name: "Comedy Central",
      url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Comedy_Central_2018_logo.svg/200px-Comedy_Central_2018_logo.svg.png",
      category: "Comedia",
      isAdult: false,
    },
    {
      name: "Food Network",
      url: "https://test-streams.mux.dev/test_001/stream.m3u8",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Food_Network_2016.svg/200px-Food_Network_2016.svg.png",
      category: "Cocina",
      isAdult: false,
    },
  ];

  let added = 0;
  for (const c of channels) {
    const exists = await db.channel.findFirst({ where: { name: c.name } });
    if (!exists) {
      await db.channel.create({ data: c });
      console.log(`  📺 ${c.name} (${c.category})`);
      added++;
    }
  }

  // Verificación final
  const total = await db.channel.count();
  console.log(`\n🎉 ${added} canales nuevos añadidos!`);
  console.log(`📊 Total de canales: ${total}`);
}

addArgentineChannels()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
