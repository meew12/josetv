// Script para arreglar contenido +18 sin banner
import { db } from "../src/lib/db";

async function fixAdultBanners() {
  console.log("🔧 Arreglando contenido +18 sin banner...");

  const fixes = [
    {
      title: "Noche Caliente",
      thumbnail: "https://image.tmdb.org/t/p/w500/3F2Rj4G5o5tZ7YpRtQ8lQ3Kj5rL.jpg",
      banner: "https://image.tmdb.org/t/p/original/3F2Rj4G5o5tZ7YpRtQ8lQ3Kj5rL.jpg",
      description: "Contenido exclusivo para adultos. Solo +18.",
    },
    {
      title: "Pasión Prohibida",
      thumbnail: "https://image.tmdb.org/t/p/w500/q4F9oPv3O5o5tZ7YpRtQ8lQ3Kj5.jpg",
      banner: "https://image.tmdb.org/t/p/original/q4F9oPv3O5o5tZ7YpRtQ8lQ3Kj5.jpg",
      description: "Drama romántico para adultos.",
    },
    {
      title: "Deseo Nocturno",
      thumbnail: "https://image.tmdb.org/t/p/w500/4LkHjgaTfTKjWbQjLcQjXqJ5o5R.jpg",
      banner: "https://image.tmdb.org/t/p/original/4LkHjgaTfTKjWbQjLcQjXqJ5o5R.jpg",
      description: "Película exclusiva +18.",
    },
  ];

  for (const fix of fixes) {
    const content = await db.content.findFirst({ where: { title: fix.title } });
    if (content) {
      await db.content.update({
        where: { id: content.id },
        data: {
          thumbnail: fix.thumbnail,
          banner: fix.banner,
          description: fix.description,
        },
      });
      console.log(`  ✅ ${fix.title} — banner añadido`);
    }
  }

  // Verificación final
  const allContent = await db.content.findMany();
  const stillNoBanner = allContent.filter(c => !c.banner);
  console.log(`\nContenido sin banner restante: ${stillNoBanner.length}`);
  if (stillNoBanner.length === 0) {
    console.log("🎉 ¡Todo el contenido tiene banner ahora!");
  }
}

fixAdultBanners()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
