// Script para añadir trailerUrl a contenido existente
import { db } from "../src/lib/db";

async function addTrailers() {
  console.log("🎬 Añadiendo trailers a contenido existente...");

  // Trailers de muestra (videos cortos públicos)
  const trailers = [
    { title: "Acción Extrema", trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
    { title: "El Último Viaje", trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
    { title: "Universo Infinito", trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" },
    { title: "La Última Frontera", trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4" },
    { title: "El Hacker", trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4" },
    { title: "Caza en la Oscuridad", trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" },
    { title: "El Reino Perdido", trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4" },
    { title: "El Gran Robo", trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" },
    { title: "Pesadilla Final", trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4" },
    { title: "Misterio en la Niebla", trailerUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4" },
  ];

  let updated = 0;
  for (const t of trailers) {
    const content = await db.content.findFirst({ where: { title: t.title } });
    if (content && !content.trailerUrl) {
      await db.content.update({
        where: { id: content.id },
        data: { trailerUrl: t.trailerUrl },
      });
      console.log(`  ✅ ${t.title}`);
      updated++;
    }
  }

  console.log(`\n🎉 ${updated} trailers añadidos!`);
}

addTrailers()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
