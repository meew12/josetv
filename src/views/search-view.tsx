"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNav } from "@/lib/nav-store";
import { useAuth } from "@/lib/auth-store";
import { api } from "@/lib/api-client";
import { Content } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { ContentCard } from "@/components/content-card";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X, Flame, TrendingUp, Clock, Film, Tv, Youtube, Frown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListResponse {
  items: Content[];
}

type Filter = "ALL" | "MOVIE" | "SERIES" | "YOUTUBE";

const FILTERS: { value: Filter; label: string; icon: any }[] = [
  { value: "ALL", label: "Todo", icon: TrendingUp },
  { value: "MOVIE", label: "Películas", icon: Film },
  { value: "SERIES", label: "Series", icon: Tv },
  { value: "YOUTUBE", label: "YouTube", icon: Youtube },
];

const GENRES = [
  "Acción",
  "Comedia",
  "Drama",
  "Terror",
  "Ciencia Ficción",
  "Romance",
  "Documental",
  "Aventura",
  "Suspenso",
  "Animación",
];

const RECENT_KEY = "jd_recent_searches";

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, 8) : [];
  } catch {
    return [];
  }
}

function saveRecent(term: string) {
  try {
    const prev = loadRecent().filter((t) => t !== term);
    const next = [term, ...prev].slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function SearchView() {
  const { navigate, params } = useNav();
  const { user } = useAuth();
  const genreFromParams = params.genre || "";
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [activeGenre, setActiveGenre] = useState<string>(genreFromParams);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [ratingMin, setRatingMin] = useState("");
  const [durationMax, setDurationMax] = useState("");
  const [selectedAgeRatings, setSelectedAgeRatings] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    return loadRecent();
  });
  const inputRef = useRef<HTMLInputElement>(null);

  // Auth guard
  useEffect(() => {
    if (!user) {
      const t = setTimeout(() => navigate("landing"), 50);
      return () => clearTimeout(t);
    }
  }, [user, navigate]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounce 400ms
  useEffect(() => {
    const t = setTimeout(() => setDebounced(input.trim()), 400);
    return () => clearTimeout(t);
  }, [input]);

  // Save recent when searching
  useEffect(() => {
    if (debounced.length >= 2) {
      saveRecent(debounced);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecent(loadRecent());
    }
  }, [debounced]);

  // Fetch trending (for empty state)
  const trendingQ = useQuery({
    queryKey: ["content", "trending"],
    queryFn: () => api.get<ListResponse>("/content/trending"),
    enabled: !!user,
  });

  // Fetch search results
  const searchQ = useQuery({
    queryKey: ["content", "search", debounced, filter, activeGenre, yearMin, yearMax, ratingMin, durationMax, selectedAgeRatings.join(",")],
    queryFn: () => {
      const params = new URLSearchParams();
      if (debounced) params.set("search", debounced);
      params.set("limit", "60");
      if (filter !== "ALL") params.set("type", filter);
      if (activeGenre) params.set("category", activeGenre);
      if (yearMin) params.set("yearMin", yearMin);
      if (yearMax) params.set("yearMax", yearMax);
      if (ratingMin) params.set("ratingMin", ratingMin);
      if (durationMax) params.set("durationMax", durationMax);
      if (selectedAgeRatings.length > 0) params.set("ageRatings", selectedAgeRatings.join(","));
      return api.get<ListResponse>(`/content?${params.toString()}`);
    },
    enabled: !!user && (debounced.length >= 2 || !!activeGenre || showAdvanced),
  });

  // Autocomplete suggestions (más rápido, menos resultados)
  const suggestQ = useQuery({
    queryKey: ["content", "suggest", input.trim()],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("search", input.trim());
      params.set("limit", "5");
      return api.get<ListResponse>(`/content?${params.toString()}`);
    },
    enabled: !!user && input.trim().length >= 2 && input.trim() !== debounced,
  });

  if (!user) return null;

  const hasActiveSearch =
    debounced.length >= 2 ||
    !!activeGenre ||
    !!yearMin ||
    !!yearMax ||
    !!ratingMin ||
    !!durationMax ||
    selectedAgeRatings.length > 0;
  const showEmptyState = !hasActiveSearch;
  const results = searchQ.data?.items ?? [];
  const isLoading = searchQ.isLoading && hasActiveSearch;
  const noResults = hasActiveSearch && !isLoading && results.length === 0;
  const suggestions = suggestQ.data?.items ?? [];
  const showSuggestions = input.trim().length >= 2 && input.trim() !== debounced && suggestions.length > 0;

  const pickRecent = (term: string) => {
    setInput(term);
    setDebounced(term);
  };

  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <AppHeader />

      <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 pt-20 sm:px-6 lg:px-8 lg:pt-24">
        {/* Search header */}
        <div className="mb-5">
          <h1 className="mb-3 text-2xl font-black text-white sm:text-3xl">Buscar</h1>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Buscá películas, series, géneros..."
              className="h-12 pl-11 pr-10 text-base"
              autoComplete="off"
            />
            {input && (
              <button
                onClick={() => {
                  setInput("");
                  setDebounced("");
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-accent hover:text-white"
                aria-label="Limpiar"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Autocomplete suggestions */}
            {showSuggestions && (
              <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-lg border border-border bg-popover/95 shadow-2xl backdrop-blur-xl">
                {suggestions.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      navigate("watch", { id: s.id });
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-accent"
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    {s.thumbnail ? (
                      <img
                        src={s.thumbnail}
                        alt=""
                        className="h-12 w-9 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="h-12 w-9 shrink-0 rounded bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {s.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.year || ""} {s.genre ? `· ${s.genre}` : ""}
                      </p>
                    </div>
                    {s.isAdult && (
                      <span className="rounded bg-primary px-1 text-[10px] font-bold text-white">
                        +18
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const Icon = f.icon;
              const active = filter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                    active
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-card/60 text-muted-foreground hover:border-primary/50 hover:text-white"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Genre chips */}
          {GENRES.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveGenre("")}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  !activeGenre
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border text-muted-foreground hover:text-white"
                )}
              >
                Todos los géneros
              </button>
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => setActiveGenre(g === activeGenre ? "" : g)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition",
                    activeGenre === g
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-white"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          {/* Botón filtros avanzados */}
          <div className="mt-3">
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {showAdvanced ? "Ocultar filtros avanzados" : "Filtros avanzados"}
              {(yearMin || yearMax || ratingMin || durationMax || selectedAgeRatings.length > 0) && (
                <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                  Activos
                </span>
              )}
            </button>

            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 grid grid-cols-2 gap-3 rounded-lg border border-border bg-card/40 p-3 sm:grid-cols-3 lg:grid-cols-4"
              >
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Año desde
                  </label>
                  <Input
                    type="number"
                    value={yearMin}
                    onChange={(e) => setYearMin(e.target.value)}
                    placeholder="2020"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Año hasta
                  </label>
                  <Input
                    type="number"
                    value={yearMax}
                    onChange={(e) => setYearMax(e.target.value)}
                    placeholder="2024"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Rating mín.
                  </label>
                  <select
                    value={ratingMin}
                    onChange={(e) => setRatingMin(e.target.value)}
                    className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
                  >
                    <option value="">Todos</option>
                    <option value="5">5+ ★</option>
                    <option value="7">7+ ★</option>
                    <option value="8">8+ ★</option>
                    <option value="9">9+ ★</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Duración máx.
                  </label>
                  <select
                    value={durationMax}
                    onChange={(e) => setDurationMax(e.target.value)}
                    className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
                  >
                    <option value="">Todas</option>
                    <option value="90">≤ 90 min</option>
                    <option value="120">≤ 120 min</option>
                    <option value="150">≤ 150 min</option>
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-4">
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Calificación de edad
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {["ATP", "+7", "+13", "+16", "+18"].map((ar) => (
                      <button
                        key={ar}
                        onClick={() =>
                          setSelectedAgeRatings((prev) =>
                            prev.includes(ar) ? prev.filter((x) => x !== ar) : [...prev, ar]
                          )
                        }
                        className={cn(
                          "rounded border px-2 py-0.5 text-xs font-medium transition",
                          selectedAgeRatings.includes(ar)
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-border text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {ar}
                      </button>
                    ))}
                  </div>
                </div>
                {(yearMin || yearMax || ratingMin || durationMax || selectedAgeRatings.length > 0) && (
                  <button
                    onClick={() => {
                      setYearMin("");
                      setYearMax("");
                      setRatingMin("");
                      setDurationMax("");
                      setSelectedAgeRatings([]);
                    }}
                    className="col-span-2 text-left text-xs text-destructive hover:underline sm:col-span-4"
                  >
                    Limpiar filtros
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Recent searches (only when no active query) */}
        {showEmptyState && recent.length > 0 && (
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> Búsquedas recientes
            </div>
            <div className="flex flex-wrap gap-2">
              {recent.map((t, i) => (
                <button
                  key={i}
                  onClick={() => pickRecent(t)}
                  className="rounded-full bg-secondary px-3 py-1 text-sm text-foreground transition hover:bg-secondary/70"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {!showEmptyState && (
          <div className="pb-10">
            {isLoading && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[2/3] w-full rounded-lg" />
                ))}
              </div>
            )}

            {!isLoading && results.length > 0 && (
              <>
                <p className="mb-3 text-sm text-muted-foreground">
                  {results.length} resultado{results.length !== 1 ? "s" : ""} para{" "}
                  <span className="font-semibold text-white">"{debounced}"</span>
                </p>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {results.map((c, i) => (
                    <ContentCard key={c.id} content={c} index={i} />
                  ))}
                </div>
              </>
            )}

            {noResults && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Frown className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-1 text-lg font-bold text-white">
                  No se encontraron resultados
                </h3>
                <p className="mb-6 max-w-md text-sm text-muted-foreground">
                  Probá con otras palabras clave o explorá las tendencias de abajo.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty state with trending */}
        {showEmptyState && (
          <div className="pb-12">
            <div className="mb-4 flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-bold text-white sm:text-xl">Tendencias</h2>
            </div>
            {trendingQ.isLoading ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[2/3] w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {(trendingQ.data?.items ?? []).map((c, i) => (
                  <ContentCard key={c.id} content={c} index={i} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AppFooter />
    </div>
  );
}
