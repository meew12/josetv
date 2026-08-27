// Script para migrar items existentes de watchlist/history al perfil "Principal"
import { db } from "../src/lib/db";

async function migrate() {
  console.log("🔄 Migrando items existentes al perfil Principal...");

  // Obtener todos los usuarios con perfiles
  const users = await db.user.findMany({
    include: {
      profiles: true,
      watchlist: true,
      history: true,
    },
  });

  let migratedWatchlist = 0;
  let migratedHistory = 0;

  for (const user of users) {
    if (user.profiles.length === 0) continue;

    // Perfil principal = el primero (o el que tiene isDefault=true)
    const defaultProfile =
      user.profiles.find((p) => p.isDefault) || user.profiles[0];

    // Migrar watchlist items sin profileId
    for (const item of user.watchlist) {
      if (!item.profileId) {
        await db.watchlist.update({
          where: { id: item.id },
          data: { profileId: defaultProfile.id },
        });
        migratedWatchlist++;
      }
    }

    // Migrar history items sin profileId
    for (const item of user.history) {
      if (!item.profileId) {
        await db.watchHistory.update({
          where: { id: item.id },
          data: { profileId: defaultProfile.id },
        });
        migratedHistory++;
      }
    }
  }

  console.log(`✅ Migración completada:`);
  console.log(`   Watchlist items migrados: ${migratedWatchlist}`);
  console.log(`   History items migrados: ${migratedHistory}`);
}

migrate()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
