"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNav } from "@/lib/nav-store";
import { useProfile } from "@/lib/profile-store";
import { api } from "@/lib/api-client";
import { Content } from "@/lib/types";
import { ContentCard } from "@/components/content-card";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ListPlus, Film } from "lucide-react";
import { motion } from "framer-motion";

interface WatchlistResponse {
  items: Content[];
}

function MyListSkeleton() {
  return (
    <div className="px-4 pb-20 pt-20 sm:px-6 md:pb-8 lg:px-8">
      <Skeleton className="mb-6 h-9 w-48" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[2/3] w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function MyListView() {
  const { navigate } = useNav();
  const { activeProfile } = useProfile();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery<WatchlistResponse>({
    queryKey: ["watchlist", activeProfile?.id],
    queryFn: () => {
      const profileQuery = activeProfile ? `?profileId=${activeProfile.id}` : "";
      return api.get<WatchlistResponse>(`/watchlist${profileQuery}`);
    },
    staleTime: 10 * 1000,
  });

  const items = data?.items || [];

  // Invalidate cuando ContentCard hace toggle
  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ["watchlist"] });
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
                <Heart className="h-6 w-6 fill-primary text-primary" />
                Mi Lista
              </h1>
              {items.length > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {items.length} {items.length === 1 ? "título guardado" : "títulos guardados"}
                </p>
              )}
            </div>
            {items.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("browse")}
                className="hidden sm:flex"
              >
                <ListPlus className="mr-1.5 h-4 w-4" />
                Explorar más
              </Button>
            )}
          </motion.div>

          {/* Loading */}
          {isLoading && <MyListSkeleton />}

          {/* Error */}
          {isError && !isLoading && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
              <p className="text-muted-foreground">
                No pudimos cargar tu lista.
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
                <Heart className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Tu lista está vacía
              </h2>
              <p className="mt-2 max-w-md px-4 text-sm text-muted-foreground">
                Agregá películas y series tocando el ícono{" "}
                <ListPlus className="inline h-3.5 w-3.5" /> en cualquier título para
                guardarlos acá y mirarlos cuando quieras.
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

          {/* Grid */}
          {!isLoading && !isError && items.length > 0 && (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.03 } },
              }}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5 xl:grid-cols-6"
              onMouseLeave={handleRefresh}
            >
              {items.map((c, i) => (
                <ContentCard key={c.id} content={c} index={i} />
              ))}
            </motion.div>
          )}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

export default MyListView;
