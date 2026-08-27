"use client";
import { useEffect, useState } from "react";
import { useNav } from "@/lib/nav-store";
import { api } from "@/lib/api-client";
import { Content } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Play,
  Info,
  Tv,
  Film,
  Download,
  Users,
  Shield,
  Smartphone,
  Crown,
  Flame,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

export function LandingView() {
  const { navigate } = useNav();
  const [featured, setFeatured] = useState<Content | null>(null);
  const [trending, setTrending] = useState<Content[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [f, t] = await Promise.all([
          api.get<{ content: Content }>("/content/featured"),
          api.get<{ contents: Content[] }>("/content/trending"),
        ]);
        setFeatured(f.content || null);
        setTrending(t.contents || []);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative flex min-h-[90vh] items-center overflow-hidden">
        {/* Fondo */}
        <div className="absolute inset-0">
          {featured?.banner ? (
            <img src={featured.banner} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/30 via-black to-black" />
          )}
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 hero-gradient" />
          <div className="absolute inset-0 hero-gradient-left" />
        </div>

        {/* Header simple */}
        <div className="absolute left-0 right-0 top-0 z-20">
          <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <span className="text-2xl font-black tracking-tighter">
              <span className="text-primary">JOSE</span>
              <span className="text-white">DEMO</span>
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate("login")} className="text-white">
                Iniciar sesión
              </Button>
              <Button onClick={() => navigate("register")} className="bg-primary hover:bg-primary/90">
                Registrarse
              </Button>
            </div>
          </div>
        </div>

        {/* Contenido hero */}
        <div className="relative z-10 mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded bg-primary px-2 py-0.5 text-xs font-bold text-white">
                JOSE DEMO ORIGINAL
              </span>
              <span className="text-sm font-medium text-white/80">ESTRENO</span>
            </div>
            <h1 className="mb-4 text-4xl font-black leading-tight text-white sm:text-6xl md:text-7xl">
              Stream sin límites.
              <br />
              <span className="text-primary">Todo en un lugar.</span>
            </h1>
            <p className="mb-6 max-w-xl text-base text-white/80 sm:text-lg">
              Películas, series, canales en vivo y más. Disfrutá en cualquier dispositivo,
              sin anuncios y en la mejor calidad. Cancelás cuando quieras.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => navigate("register")}
                className="h-12 px-8 text-base"
              >
                <Play className="mr-2 h-5 w-5 fill-white" /> Comenzá gratis
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate("login")}
                className="h-12 px-8 text-base"
              >
                <Info className="mr-2 h-5 w-5" /> Ya tengo cuenta
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-8 flex flex-wrap gap-6">
              {[
                { icon: Film, label: "+1.000 títulos" },
                { icon: Tv, label: "Canales en vivo" },
                { icon: Download, label: "Descargas offline" },
                { icon: Users, label: "Multi-pantalla" },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="flex items-center gap-2 text-sm text-white/70">
                    <Icon className="h-4 w-4 text-primary" />
                    {s.label}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-border bg-card/30 py-16">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black text-white sm:text-4xl">
              Por qué elegir <span className="text-primary">JOSE DEMO</span>
            </h2>
            <p className="mt-2 text-muted-foreground">
              La plataforma de streaming más completa de Argentina
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Film, title: "Películas y series", desc: "Estrenos, clásicos y originales en HD, Full HD y 4K." },
              { icon: Tv, title: "Canales en vivo", desc: "Cargá listas m3u/m3u8 y mirá TV en vivo las 24hs." },
              { icon: Smartphone, title: "En todos lados", desc: "Web, móvil, tablet. Diseño tipo app en celular." },
              { icon: Download, title: "Descargas", desc: "Descargá y mirá sin conexión cuando quieras." },
              { icon: Crown, title: "Planes accesibles", desc: "Pagá con MercadoPago. Cancelás cuando quieras." },
              { icon: Shield, title: "Seguro y privado", desc: "Tu cuenta y tu token de acceso siempre protegidos." },
              { icon: Users, title: "Perfiles múltiples", desc: "Hasta 4 pantallas simultáneas con Premium." },
              { icon: Flame, title: "Contenido +18", desc: "Sección exclusiva para adultos verificados." },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border bg-card/60 p-5 backdrop-blur transition hover:border-primary/50 hover:bg-card"
                >
                  <div className="mb-3 inline-flex rounded-lg bg-primary/15 p-2.5">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mb-1 font-bold text-white">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trending preview */}
      {trending.length > 0 && (
        <section className="py-12">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
            <div className="mb-4 flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <h2 className="text-xl font-bold text-white sm:text-2xl">Lo más visto</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
              {trending.slice(0, 10).map((c, i) => (
                <div
                  key={c.id}
                  className="relative flex w-36 shrink-0 items-center gap-2 sm:w-44"
                >
                  <span className="text-5xl font-black text-transparent [-webkit-text-stroke:2px_primary] sm:text-7xl">
                    {i + 1}
                  </span>
                  <div className="w-28 shrink-0 overflow-hidden rounded-lg sm:w-32">
                    <div className="aspect-[2/3] w-full bg-muted">
                      {c.thumbnail && (
                        <img src={c.thumbnail} alt={c.title} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <p className="truncate p-1.5 text-xs font-medium">{c.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA planes */}
      <section className="bg-gradient-to-b from-card/20 to-background py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <Crown className="mx-auto mb-3 h-10 w-10 text-primary" />
          <h2 className="text-3xl font-black text-white sm:text-4xl">
            Elegí tu plan y empezá a mirar
          </h2>
          <p className="mt-3 text-muted-foreground">
            Sin contratos. Cancelás cuando quieras. Pagá fácil con MercadoPago.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => navigate("register")} className="h-12 px-8">
              Crear cuenta gratis <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            {["Sin tarjeta de crédito", "Cancelás cuando quieras", "Soporte 24/7"].map((t, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-background px-4 py-8 text-center text-xs text-muted-foreground">
        <p className="mb-1 font-semibold text-foreground">JOSE DEMO</p>
        <p>© 2025 JOSE DEMO. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
