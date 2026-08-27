// Script para actualizar TODOS los canales con logos que SÍ cargan
// Usa icon.horse (carga logos reales de los sitios web) con fallback a placehold.co
import { db } from "../src/lib/db";

async function fixChannelLogos() {
  console.log("📺 Actualizando logos de TODOS los canales...\n");

  // Mapeo de canal -> dominio web real para obtener logo via icon.horse
  const channelDomains: Record<string, string> = {
    // Argentinos
    "El Trece": "eltrecetv.com.ar",
    "Telefe": "telefe.com",
    "Canal 9": "canal9.com.ar",
    "TV Pública": "tvpublica.com.ar",
    "América TV": "americatv.com.ar",
    // Deportes
    "ESPN Argentina": "espn.com",
    "TyC Sports": "tycsports.com",
    "Fox Sports Argentina": "foxsports.com",
    "TNT Sports": "tntsports.com.ar",
    "DeporTV": "deportv.gov.ar",
    // Noticias
    "TN Todo Noticias": "tn.com.ar",
    "C5N": "c5n.com",
    "A24": "a24.com",
    "Crónica TV": "cronica.com.ar",
    "La Nación+": "lanacion.com.ar",
    // Películas
    "HBO": "hbo.com",
    "Cinemax": "cinemax.com",
    "Space": "space.com",
    "Cine AR": "cinear.tv",
    // Infantil
    "Cartoon Network": "cartoonnetwork.com",
    "Disney Channel": "disney.com",
    "Nickelodeon": "nick.com",
    "Pakapaka": "pakapaka.gob.ar",
    // Música
    "MTV": "mtv.com",
    "Much Music": "muchmusic.com",
    // Documentales
    "National Geographic": "nationalgeographic.com",
    "Discovery Channel": "discovery.com",
    "History Channel": "history.com",
    "Animal Planet": "animalplanet.com",
    // Series
    "Sony Channel": "sony.com",
    "Warner Channel": "warner.com",
    "Universal TV": "nbc.com",
    "FX": "fxnetworks.com",
    "Comedy Central": "comedycentral.com",
    "Food Network": "foodnetwork.com",
    // Canales de prueba (mantener con placehold.co)
    "Big Buck Bunny Live": "",
    "Tears of Steel": "",
    "Sintel Channel": "",
    "Mux Test Live": "",
    "Noticias 24/7": "",
    "Deportes Live": "",
    "Cine Clásico": "",
    "Documentales HD": "",
    "Infantil TV": "",
    "Música Hits": "",
    "Canal Adulto 1": "",
    "Canal Adulto 2": "",
  };

  const allChannels = await db.channel.findMany();
  let updated = 0;

  for (const channel of allChannels) {
    const domain = channelDomains[channel.name];
    let logoUrl: string;

    if (domain) {
      // Usar icon.horse para logos reales
      logoUrl = `https://icon.horse/icon/${domain}`;
    } else {
      // Fallback: placehold.co con el nombre del canal
      const encodedName = encodeURIComponent(channel.name.replace(/ /g, "+"));
      logoUrl = `https://placehold.co/200x200/141414/E50914?text=${encodedName}&font=lato`;
    }

    await db.channel.update({
      where: { id: channel.id },
      data: { logo: logoUrl },
    });
    updated++;
    console.log(`  ✅ ${channel.name} → ${domain ? "icon.horse" : "placehold.co"}`);
  }

  console.log(`\n🎉 ${updated} canales actualizados con logos que SÍ cargan!`);
}

fixChannelLogos()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
