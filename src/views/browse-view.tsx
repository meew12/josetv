"use client";
import { useEffect, useState } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { useNav } from "@/lib/nav-store";
import { useAuth } from "@/lib/auth-store";
import { useProfile } from "@/lib/profile-store";
import { api } from "@/lib/api-client";
import { Content } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { ContentRow } from "@/components/content-row";
import { ContinueWatchingRow } from "@/components/continue-watching";
import { Top10Row } from "@/components/top10-row";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Play,
  Plus,
  Check,
  Info,
  Flame,
  Film,
  Tv,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Grid3x3,
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface FeaturedResponse {
  items: Content[];
}
interface ListResponse {
  items: Content[];
}

const CATEGORY_ROWS = [
  { title: "Acción", category: "Acción" },
  { title: "Comedia", category: "Comedia" },
  { title: "Terror", category: "Terror" },
  { title: "Documentales", category: "Documentales" },
  { title: "Drama", category: "Drama" },
  { title: "Ciencia Ficción", category: "Ciencia Ficción" },
];

// Staggered entrance for hero content (badge -> title -> metadata -> desc -> buttons)
const heroContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};
const heroItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function BrowseView() {
  const { navigate } = useNav();
  const { user } = useAuth();
  const { toast } = useToast();
  const [heroIndex, setHeroIndex] = useState(0);
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());
  // Track which hero had its description expanded; auto-collapses when hero rotates.
  const [expandedHeroId, setExpandedHeroId] = useState<string | null>(null);

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!user) {
      const t = setTimeout(() => navigate("landing"), 50);
      return () => clearTimeout(t);
    }
  }, [user, navigate]);

  // Perfil activo: si es infantil, filtrar contenido
  const { activeProfile } = useProfile();
  const isKidsMode = activeProfile?.isKids ?? false;

  // Fetch featured for hero carousel
  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ["content", "featured", isKidsMode],
    queryFn: () =>
      api.get<FeaturedResponse>(
        isKidsMode ? "/content/featured?kids=true" : "/content/featured"
      ),
    enabled: !!user,
  });
  const featured = featuredData?.items ?? [];

  // Auto-rotate hero
  useEffect(() => {
    if (featured.length <= 1) return;
    const t = setInterval(() => {
      setHeroIndex((i) => (i + 1) % featured.length);
    }, 8000);
    return () => clearInterval(t);
  }, [featured.length]);

  // Fetch watchlist state for hero toggle (filtrado por perfil activo)
  useEffect(() => {
    if (!user) return;
    const profileQuery = activeProfile ? `?profileId=${activeProfile.id}` : "";
    api
      .get<ListResponse>(`/watchlist${profileQuery}`)
      .then((r) => setWatchlistIds(new Set(r.items.map((c) => c.id))))
      .catch(() => {});
  }, [user, activeProfile]);

  // Content rows (parallel queries)
  const trendingQ = useQuery({
    queryKey: ["content", "trending", isKidsMode],
    queryFn: () =>
      api.get<ListResponse>(
        isKidsMode ? "/content/trending?kids=true" : "/content/trending"
      ),
    enabled: !!user,
  });
  const moviesQ = useQuery({
    queryKey: ["content", "list", "MOVIE", isKidsMode],
    queryFn: () =>
      api.get<ListResponse>(
        `/content?type=MOVIE&limit=24${isKidsMode ? "&kids=true" : ""}`
      ),
    enabled: !!user,
  });
  const seriesQ = useQuery({
    queryKey: ["content", "list", "SERIES", isKidsMode],
    queryFn: () => api.get<ListResponse>(`/content?type=SERIES&limit=24${isKidsMode ? "&kids=true" : ""}`),
    enabled: !!user,
  });
  const youtubeQ = useQuery({
    queryKey: ["content", "list", "YOUTUBE", isKidsMode],
    queryFn: () => api.get<ListResponse>(`/content?type=YOUTUBE&limit=24${isKidsMode ? "&kids=true" : ""}`),
    enabled: !!user,
  });

  // Continue watching (historial reciente, filtrado por perfil activo)
  const historyQ = useQuery({
    queryKey: ["history", "continue", activeProfile?.id],
    queryFn: () => {
      const profileQuery = activeProfile ? `&profileId=${activeProfile.id}` : "";
      return api.get<{ items: any[] }>(`/history?limit=12${profileQuery}`);
    },
    enabled: !!user,
  });
  const continueItems = (historyQ.data?.items ?? [])
    .filter((h) => h.content && h.progress > 5 && h.duration > 30)
    .slice(0, 8);

  // Recomendaciones personalizadas
  const recommendQ = useQuery({
    queryKey: ["content", "recommendations"],
    queryFn: () => api.get<ListResponse>("/content/recommendations"),
    enabled: !!user,
  });

  // Top 10 trending ahora (actividad reciente)
  const top10Q = useQuery({
    queryKey: ["content", "trending-now"],
    queryFn: () => api.get<ListResponse>("/content/trending-now"),
    enabled: !!user,
  });

  // Novedades (contenido recién agregado)
  const newQ = useQuery({
    queryKey: ["content", "new"],
    queryFn: () => api.get<ListResponse>("/content/new"),
    enabled: !!user,
  });

  const categoryQueries = useQueries({
    queries: CATEGORY_ROWS.map((row) => ({
      queryKey: ["content", "category", row.category, isKidsMode],
      queryFn: () =>
        api.get<ListResponse>(
          `/content?category=${encodeURIComponent(row.category)}&limit=24${isKidsMode ? "&kids=true" : ""}`
        ),
      enabled: !!user,
    })),
  });

  if (!user) return null;

  const hero = featured[heroIndex];
  const showFullDesc = !!hero && expandedHeroId === hero.id;

  const toggleWatchlist = async (content: Content) => {
    try {
      const inList = watchlistIds.has(content.id);
      if (inList) {
        await api.delete(`/watchlist/${content.id}`);
        setWatchlistIds((prev) => {
          const n = new Set(prev);
          n.delete(content.id);
          return n;
        });
        toast({ title: "Quitado de Mi Lista" });
      } else {
        await api.post("/watchlist", { contentId: content.id });
        setWatchlistIds((prev) => new Set(prev).add(content.id));
        toast({ title: "Agregado a Mi Lista ✓" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const scrollToContent = () => {
    document
      .getElementById("browse-content-rows")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <AppHeader />
      {/* Banner modo kids */}
      {isKidsMode && (
        <div className="flex items-center justify-center gap-2 bg-blue-600/30 px-4 py-1.5 text-center text-xs font-medium text-blue-300">
          <span className="text-sm">🧸</span>
          Modo Niños activo — solo contenido apto (ATP / +7)
        </div>
      )}

      {/* HERO */}
      <section className="relative flex min-h-[70vh] w-full items-end overflow-hidden md:min-h-[85vh]">
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            {hero && (
              <motion.div
                key={hero.id}
                initial={{ opacity: 0, scale: 1 }}
                animate={{ opacity: 1, scale: 1.08 }}
                exit={{ opacity: 0 }}
                transition={{
                  opacity: { duration: 0.8 },
                  scale: { duration: 8, ease: "easeOut" },
                }}
                className="absolute inset-0"
              >
                {hero.banner || hero.thumbnail ? (
                  <img
                    src={hero.banner || hero.thumbnail}
                    alt={hero.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary/30 via-black to-black" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 hero-gradient" />
          <div className="absolute inset-0 hero-gradient-left" />
        </div>

        {/* Hero content */}
        <div className="relative z-10 mx-auto w-full max-w-[1600px] px-4 pb-16 pt-24 sm:px-6 lg:px-8 lg:pb-24">
          {featuredLoading || !hero ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-72 bg-white/10" />
              <Skeleton className="h-4 w-96 max-w-full bg-white/10" />
              <Skeleton className="h-4 w-64 bg-white/10" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-11 w-32 bg-white/10" />
                <Skeleton className="h-11 w-32 bg-white/10" />
              </div>
            </div>
          ) : (
            <motion.div
              key={hero.id}
              variants={heroContainer}
              initial="hidden"
              animate="show"
              className="max-w-2xl"
            >
              {/* Badge / trending */}
              {hero.trending && (
                <motion.div
                  variants={heroItem}
                  className="mb-3 flex items-center gap-2"
                >
                  <span className="glow-red-sm flex items-center gap-1 rounded bg-orange-600 px-2 py-0.5 text-xs font-bold text-white">
                    <Flame className="h-3 w-3" /> TENDENCIA
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                    {hero.type === "MOVIE"
                      ? "Película"
                      : hero.type === "SERIES"
                        ? "Serie"
                        : "Especial"}
                  </span>
                </motion.div>
              )}

              {/* Title with red glow behind */}
              <motion.div variants={heroItem} className="relative mb-3">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-x-6 -inset-y-4 -z-10 rounded-full bg-primary/30 blur-3xl"
                />
                <h1 className="text-3xl font-black leading-tight text-white drop-shadow-2xl sm:text-5xl md:text-6xl">
                  {hero.title}
                </h1>
              </motion.div>

              {/* Metadata row (incl. maturity rating badge) */}
              <motion.div
                variants={heroItem}
                className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-white/80"
              >
                {hero.year && <span className="font-medium">{hero.year}</span>}
                {hero.duration && (
                  <>
                    <span className="text-white/40">•</span>
                    <span>{hero.duration} min</span>
                  </>
                )}
                {hero.genre && (
                  <>
                    <span className="text-white/40">•</span>
                    <span>{hero.genre}</span>
                  </>
                )}
                {hero.ageRating && (
                  <span className="ml-1 rounded-sm border border-white/40 bg-black/30 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    {hero.ageRating}
                  </span>
                )}
                {hero.rating > 0 && (
                  <span className="flex items-center gap-1 text-yellow-400">
                    <span className="text-white/40">•</span>
                    ★ {hero.rating.toFixed(1)}
                  </span>
                )}
              </motion.div>

              {/* Description (expandable via "Más info") */}
              <motion.p
                variants={heroItem}
                className={cn(
                  "mb-5 max-w-xl text-sm text-white/85 sm:text-base",
                  !showFullDesc && "line-clamp-3"
                )}
              >
                {hero.description}
              </motion.p>

              {/* Buttons */}
              <motion.div
                variants={heroItem}
                className="flex flex-wrap items-center gap-2 sm:gap-3"
              >
                <Button
                  size="lg"
                  onClick={() => navigate("watch", { id: hero.id })}
                  className="btn-shine h-11 px-6 sm:h-12 sm:px-8"
                >
                  <Play className="mr-2 h-5 w-5 fill-white" /> Reproducir
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => toggleWatchlist(hero)}
                  className="h-11 px-5 sm:h-12 sm:px-6"
                >
                  {watchlistIds.has(hero.id) ? (
                    <>
                      <Check className="mr-2 h-5 w-5" /> En Mi Lista
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-5 w-5" /> Mi Lista
                    </>
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() =>
                    setExpandedHeroId((v) => (hero && v === hero.id ? null : hero.id))
                  }
                  className="h-11 px-5 sm:h-12 sm:px-6"
                >
                  <Info className="mr-2 h-5 w-5" />{" "}
                  {showFullDesc ? "Menos info" : "Más info"}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Hero dot navigation + current title label (desktop) */}
        {featured.length > 1 && (
          <div className="absolute bottom-6 right-4 z-20 flex items-center gap-3 sm:right-8">
            <span className="hidden max-w-[200px] truncate text-xs font-medium text-white/70 lg:block">
              {hero?.title}
            </span>
            <div className="flex gap-1.5">
              {featured.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setHeroIndex(i)}
                  aria-label={`Ir a slide ${i + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === heroIndex
                      ? "glow-red-sm w-10 bg-primary"
                      : "w-2 bg-white/40 hover:bg-white/70"
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* "Ver más" scroll indicator (bottom center, desktop) */}
        <button
          onClick={scrollToContent}
          aria-label="Ver más contenido"
          className="absolute bottom-5 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-0.5 text-white/60 transition hover:text-white md:flex"
        >
          <span className="text-gradient-red text-[10px] font-semibold uppercase tracking-widest">
            Ver más
          </span>
          <motion.span
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="block"
          >
            <ChevronDown className="h-5 w-5" />
          </motion.span>
        </button>

        {/* Hero arrows */}
        {featured.length > 1 && (
          <>
            <button
              onClick={() =>
                setHeroIndex((i) => (i - 1 + featured.length) % featured.length)
              }
              aria-label="Anterior"
              className="absolute left-0 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-r-lg bg-black/40 text-white transition hover:bg-black/70 lg:flex"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => setHeroIndex((i) => (i + 1) % featured.length)}
              aria-label="Siguiente"
              className="absolute right-0 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-l-lg bg-black/40 text-white transition hover:bg-black/70 lg:flex"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </section>

      {/* CONTENT ROWS */}
      <div
        id="browse-content-rows"
        className="relative z-10 -mt-8 space-y-6 pb-12 md:-mt-12 md:space-y-8"
      >
        {/* Continue Watching */}
        {!historyQ.isLoading && continueItems.length > 0 && (
          <ContinueWatchingRow items={continueItems} />
        )}

        {/* Recomendado para vos */}
        {!recommendQ.isLoading && (recommendQ.data?.items ?? []).length > 0 && (
          <ContentRow
            title="Recomendado para vos"
            contents={recommendQ.data!.items}
            icon={<Sparkles className="h-5 w-5 text-primary" />}
          />
        )}

        {/* Top 10 en Argentina hoy */}
        {!top10Q.isLoading && (top10Q.data?.items ?? []).length > 0 && (
          <Top10Row contents={top10Q.data!.items} />
        )}

        {/* Novedades */}
        {!newQ.isLoading && (newQ.data?.items ?? []).length > 0 && (
          <ContentRow
            title="Novedades"
            contents={newQ.data!.items}
            icon={<Sparkles className="h-5 w-5 text-green-500" />}
          />
        )}

        {trendingQ.isLoading ? (
          <RowSkeleton title="Tendencias" />
        ) : (
          <ContentRow
            title="Tendencias"
            contents={trendingQ.data?.items ?? []}
            icon={<Flame className="h-5 w-5 text-orange-500" />}
          />
        )}

        {moviesQ.isLoading ? (
          <RowSkeleton title="Películas" />
        ) : (
          <ContentRow
            title="Películas"
            contents={moviesQ.data?.items ?? []}
            icon={<Film className="h-5 w-5 text-primary" />}
          />
        )}

        {seriesQ.isLoading ? (
          <RowSkeleton title="Series" />
        ) : (
          <ContentRow
            title="Series"
            contents={seriesQ.data?.items ?? []}
            icon={<Tv className="h-5 w-5 text-primary" />}
          />
        )}

        {CATEGORY_ROWS.map((row, i) => {
          const q = categoryQueries[i];
          if (q.isLoading) return <RowSkeleton key={row.title} title={row.title} />;
          const items = q.data?.items ?? [];
          if (items.length === 0) return null;
          return <ContentRow key={row.title} title={row.title} contents={items} />;
        })}

        {youtubeQ.isLoading ? (
          <RowSkeleton title="Especiales YouTube" />
        ) : (
          <ContentRow
            title="Especiales YouTube"
            contents={youtubeQ.data?.items ?? []}
            variant="wide"
          />
        )}
      </div>

      {/* Genre explorer */}
      <GenreExplorer />
    </div>
  );
}

function GenreExplorer() {
  const GENRES = [
    { name: "Acción", color: "from-red-600 to-red-900", icon: "🎬" },
    { name: "Comedia", color: "from-yellow-500 to-orange-700", icon: "😂" },
    { name: "Drama", color: "from-blue-600 to-blue-900", icon: "🎭" },
    { name: "Terror", color: "from-purple-700 to-black", icon: "👻" },
    { name: "Ciencia Ficción", color: "from-cyan-600 to-blue-900", icon: "🚀" },
    { name: "Romance", color: "from-pink-600 to-rose-900", icon: "💕" },
    { name: "Documental", color: "from-green-600 to-green-900", icon: "🌍" },
    { name: "Aventura", color: "from-amber-600 to-amber-900", icon: "🗺️" },
    { name: "Suspenso", color: "from-slate-600 to-slate-900", icon: "🔍" },
    { name: "Animación", color: "from-indigo-500 to-purple-900", icon: "🎨" },
  ];

  const { navigate } = useNav();

  return (
    <section className="px-4 pb-12 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center gap-2">
        <Grid3x3 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground sm:text-xl">
          Explorar por género
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {GENRES.map((g, i) => (
          <motion.button
            key={g.name}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: Math.min(i * 0.03, 0.2) }}
            onClick={() => navigate("search", { genre: g.name })}
            className={cn(
              "group relative flex h-24 items-center justify-between overflow-hidden rounded-lg bg-gradient-to-br p-4 text-left transition-all hover:scale-[1.03] hover:shadow-lg",
              g.color
            )}
          >
            <span className="text-lg font-bold text-white drop-shadow-lg">
              {g.name}
            </span>
            <span className="text-2xl opacity-80 transition-transform group-hover:scale-125">
              {g.icon}
            </span>
            <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:bg-black/0" />
          </motion.button>
        ))}
      </div>
    </section>
  );
}

function RowSkeleton({ title }: { title: string }) {
  return (
    <section className="px-4 sm:px-6 lg:px-8">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-bold text-foreground md:text-xl">{title}</h2>
      </div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-36 shrink-0 rounded-lg sm:w-44 md:w-48" />
        ))}
      </div>
    </section>
  );
}
