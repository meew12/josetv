// Script para arreglar la última película sin imagen real
import { db } from "../src/lib/db";

async function fixLastMovie() {
  console.log("🎬 Arreglando última película sin imagen real...");

  // Ratatouille para "Tutorial de Cocina"
  const content = await db.content.findFirst({ where: { title: "Tutorial de Cocina" } });
  if (content) {
    await db.content.update({
      where: { id: content.id },
      data: {
        thumbnail: "https://image.tmdb.org/t/p/w500/t3vaWRPSf6WjDSamIkKDs1iQWna.jpg",
        banner: "https://image.tmdb.org/t/p/original/jQ6Vuxe1CEPMXTF7d0fZgdIBY8U.jpg",
      },
    });
    console.log("  ✅ Tutorial de Cocina → Ratatouille");
  }

  // Verificación final
  const all = await db.content.findMany();
  const withPlaceholder = all.filter((c) => c.thumbnail.includes("placehold.co"));
  const withRealImages = all.filter((c) => !c.thumbnail.includes("placehold.co"));

  console.log(`\n📊 Resultado final:`);
  console.log(`   Total películas: ${all.length}`);
  console.log(`   Con imágenes reales de TMDB: ${withRealImages.length}`);
  console.log(`   Con placehold.co: ${withPlaceholder.length}`);

  if (withPlaceholder.length === 0) {
    console.log("\n🎉 ¡TODAS las películas tienen imágenes reales de TMDB!");
  } else {
    console.log("\n⚠️ Películas todavía con placehold.co:");
    withPlaceholder.forEach((c) => console.log(`   - ${c.title}`));
  }
}

fixLastMovie()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
