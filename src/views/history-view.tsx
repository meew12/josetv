"use client";
import { useQuery } from "@tanstack/react-query";
import { useNav } from "@/lib/nav-store";
import { useProfile } from "@/lib/profile-store";
import { api } from "@/lib/api-client";
import { Content } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  History as HistoryIcon,
  Play,
  Trash2,
  RotateCw,
  Film,
  Clock,
  Tv,
  Star,
} from "lucide-react";
import { motion } from "framer-motion";
import { timeAgo, formatDuration } from "@/lib/format";
import { useState } from "react";

interface HistoryItem {
  id: string;
  userId: string;
  contentId: string;
  progress: number;
  duration: number | null;
  lastWatched: string;
  content: Content;
}

interface HistoryResponse {
  items: HistoryItem[];
}

function HistorySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-3 overflow-hidden rounded-lg border border-border bg-card/40 p-2"
        >
          <Skeleton className="aspect-video w-40 shrink-0 rounded-md sm:w-56" />
          <div className="flex-1 space-y-2 p-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function getThumb(content: Content) {
  // Usamos thumbnail o banner como landscape
  return content.thumbnail || content.banner || "";
}

export function HistoryView() {
  const { navigate } = useNav();
  const { activeProfile } = useProfile();
  const [clearing, setClearing] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  const { data, isLoading, isError, refetch } = useQuery<HistoryResponse>({
    queryKey: ["history", activeProfile?.id],
    queryFn: () => {
      const profileQuery = activeProfile ? `?profileId=${activeProfile.id}` : "";
      return api.get<HistoryResponse>(`/history${profileQuery}`);
    },
    staleTime: 10 * 1000,
  });

  const items = (data?.items || []).filter((i) => !hiddenIds.has(i.id));

  // Limpiar historial: oculta visualmente (no hay endpoint real de "clear")
  const handleClear = async () => {
    setClearing(true);
    // Demo: ocultamos visualmente. El backend conservará el historial.
    await new Promise((r) => setTimeout(r, 400));
    setHiddenIds(new Set((data?.items || []).map((i) => i.id)));
    setClearing(false);
  };

  const handleRemove = (id: string) => {
    setHiddenIds((prev) => new Set(prev).add(id));
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex-1">
        <div className="px-4 pb-20 pt-20 sm:px-6 md:pb-8 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 flex items-end justify-between gap-3"
          >
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-black text-white sm:text-3xl">
                <HistoryIcon className="h-6 w-6 text-primary" />
                Historial
              </h1>
              {items.length > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {items.length} {items.length === 1 ? "título reproducido" : "títulos reproducidos"}
                </p>
              )}
            </div>
            {items.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={clearing}
                className="text-destructive hover:text-destructive"
              >
                {clearing ? (
                  <RotateCw className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-1.5 h-4 w-4" />
                )}
                <span className="hidden sm:inline">Limpiar historial</span>
                <span className="sm:hidden">Limpiar</span>
              </Button>
            )}
          </motion.div>

          {/* Loading */}
          {isLoading && <HistorySkeleton />}

          {/* Error */}
          {isError && !isLoading && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
              <p className="text-muted-foreground">
                No pudimos cargar tu historial.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => refetch()}
              >
                Reintentar
              </Button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && items.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/30 py-16 text-center sm:py-24"
            >
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/15">
                <Play className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Aún no miraste nada
              </h2>
              <p className="mt-2 max-w-md px-4 text-sm text-muted-foreground">
                Cuando empieces a mirar películas o series, vas a poder
                continuar desde donde dejaste acá.
              </p>
              <Button
                size="lg"
                className="mt-6"
                onClick={() => navigate("browse")}
              >
                <Film className="mr-2 h-4 w-4" /> Explorar catálogo
              </Button>
            </motion.div>
          )}

          {/* List */}
          {!isLoading && !isError && items.length > 0 && (
            <div className="space-y-3">
              {items.map((h, i) => {
                const c = h.content;
                const progress =
                  h.progress && h.duration
                    ? Math.min(100, Math.round((h.progress / h.duration) * 100))
                    : 0;
                const remaining =
                  h.duration && h.progress ? h.duration - h.progress : null;
                const thumb = getThumb(c);
                return (
                  <motion.div
                    key={h.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
                    onClick={() => navigate("watch", { id: c.id })}
                    className="group relative flex cursor-pointer gap-3 overflow-hidden rounded-lg border border-border bg-card/50 p-2 transition-all hover:border-primary/60 hover:bg-card sm:gap-4 sm:p-3"
                  >
                    {/* Thumb */}
                    <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-md bg-muted sm:w-48 md:w-56">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={c.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 via-card to-black">
                          {c.type === "YOUTUBE" ? (
                            <Tv className="h-8 w-8 text-white/40" />
                          ) : (
                            <Play className="h-8 w-8 text-white/40" />
                          )}
                        </div>
                      )}
                      {/* Overlay play */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 text-white shadow-lg">
                          <Play className="h-5 w-5 fill-white" />
                        </div>
                      </div>
                      {/* Progress bar superpuesta */}
                      {progress > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex min-w-0 flex-1 flex-col py-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 text-sm font-semibold text-foreground sm:text-base">
                          {c.title}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(h.id);
                          }}
                          className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                          aria-label="Quitar del historial"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Meta */}
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {c.year && <span>{c.year}</span>}
                        {c.ageRating && (
                          <span className="rounded border border-border px-1">
                            {c.ageRating}
                          </span>
                        )}
                        {c.rating > 0 && (
                          <span className="flex items-center gap-0.5 text-yellow-500">
                            <Star className="h-3 w-3 fill-yellow-500" />
                            {c.rating.toFixed(1)}
                          </span>
                        )}
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {timeAgo(h.lastWatched)}
                        </span>
                      </div>

                      {/* Progress + continue */}
                      {progress > 0 ? (
                        <div className="mt-auto pt-2">
                          <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span className="font-medium text-primary">
                              Continuar viendo
                            </span>
                            <span>
                              {formatDuration(h.progress)}{" "}
                              {h.duration ? `/ ${formatDuration(h.duration)}` : ""}
                            </span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                          {remaining != null && remaining > 30 && (
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              Te quedan {formatDuration(remaining)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="mt-auto pt-2">
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary"
                          >
                            Visto recientemente
                          </Badge>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

export default HistoryView;
