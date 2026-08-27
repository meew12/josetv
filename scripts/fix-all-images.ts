// Script para arreglar TODAS las imágenes con placehold.co que siempre carga
import { db } from "../src/lib/db";

async function fixAllImages() {
  console.log("🎨 Arreglando TODAS las imágenes con placehold.co...");

  const allContent = await db.content.findMany();
  let fixed = 0;

  for (const c of allContent) {
    // Codificar el título para la URL
    const encodedTitle = encodeURIComponent(c.title.replace(/ /g, "+"));
    const thumbUrl = `https://placehold.co/500x750/141414/E50914?text=${encodedTitle}&font=lato`;
    const bannerUrl = `https://placehold.co/1280x720/0a0a0a/E50914?text=${encodedTitle}&font=lato`;

    await db.content.update({
      where: { id: c.id },
      data: {
        thumbnail: thumbUrl,
        banner: bannerUrl,
      },
    });
    fixed++;
    console.log(`  ✅ ${c.title}`);
  }

  console.log(`\n🎉 ${fixed} películas actualizadas con imágenes que SÍ cargan!`);
}

fixAllImages()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
