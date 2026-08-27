// Script para arreglar contenido sin banner y añadir más canales argentinos
import { db } from "../src/lib/db";

async function fixMissingBanners() {
  console.log("🔧 Arreglando contenido sin banner...");

  // Actualizar los 5 contenidos sin banner con imágenes reales de TMDB
  const fixes = [
    {
      title: "Tutorial de Cocina",
      thumbnail: "https://image.tmdb.org/t/p/w500/2DtPSyODKWXhuIRVImDpJ5qZBl5.jpg",
      banner: "https://image.tmdb.org/t/p/original/2DtPSyODKWXhuIRVImDpJ5qZBl5.jpg",
      description: "Aprendé a cocinar platos deliciosos con los mejores chefs.",
    },
    {
      title: "Gaming Highlights",
      thumbnail: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      banner: "https://image.tmdb.org/t/p/original/8Vt6mWEReuy4Of61Lnj5xjCG4Bz.jpg",
      description: "Los mejores momentos del mundo gaming.",
    },
    {
      title: "Documental HD — Naturaleza",
      thumbnail: "https://image.tmdb.org/t/p/w500/d5ZSFkN5FrGU5jJ5CsXtZFVjLfE.jpg",
      banner: "https://image.tmdb.org/t/p/original/d5ZSFkN5FrGU5jJ5CsXtZFVjLfE.jpg",
      description: "Explora la naturaleza en alta definición.",
    },
    {
      title: "Lo Mejor de YouTube — Música",
      thumbnail: "https://image.tmdb.org/t/p/w500/aDQZHvI3rGdtzZ2Q3iz9XaPyD2u.jpg",
      banner: "https://image.tmdb.org/t/p/original/aDQZHvI3rGdtzZ2Q3iz9XaPyD2u.jpg",
      description: "Recopilación de los mejores videos musicales.",
    },
    {
      title: "Amor de Verano",
      thumbnail: "https://image.tmdb.org/t/p/w500/2DtPSyODKWXhuIRVImDpJ5qZBl5.jpg",
      banner: "https://image.tmdb.org/t/p/original/2DtPSyODKWXhuIRVImDpJ5qZBl5.jpg",
      description: "Una historia de amor que florece durante las vacaciones de verano.",
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

  // Verificar que no quede ninguno sin banner
  const allContent = await db.content.findMany();
  const stillNoBanner = allContent.filter(c => !c.banner);
  console.log(`\nContenido sin banner restante: ${stillNoBanner.length}`);
  if (stillNoBanner.length > 0) {
    for (const c of stillNoBanner) {
      console.log(`  ⚠️ ${c.title}`);
    }
  }
}

fixMissingBanners()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
