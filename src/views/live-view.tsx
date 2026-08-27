"use client";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNav } from "@/lib/nav-store";
import { useAuth } from "@/lib/auth-store";
import { api } from "@/lib/api-client";
import { Channel } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { VideoPlayer } from "@/components/video-player";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tv, Radio, Search, X, Frown } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ListResponse {
  items: Channel[];
}

export function LiveView() {
  const { navigate } = useNav();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Channel | null>(null);
  const [filterCat, setFilterCat] = useState<string>("ALL");
  const [query, setQuery] = useState("");

  // Auth guard
  useEffect(() => {
    if (!user) {
      const t = setTimeout(() => navigate("landing"), 50);
      return () => clearTimeout(t);
    }
  }, [user, navigate]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["channels", "live"],
    queryFn: () => api.get<ListResponse>("/channels?limit=200"),
    enabled: !!user,
  });

  const channels = data?.items ?? [];

  // Derive categories from data
  const categories = useMemo(() => {
    const set = new Set<string>();
    channels.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set).sort();
  }, [channels]);

  // Filter client-side by category + search
  const filtered = useMemo(() => {
    return channels.filter((c) => {
      if (filterCat !== "ALL" && c.category !== filterCat) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          (c.category || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [channels, filterCat, query]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <AppHeader />

      <div className="mx-auto w-full max-w-[1600px] flex-1 px-4 pt-20 sm:px-6 lg:px-8 lg:pt-24">
        {/* Header */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-black text-white sm:text-3xl">En Vivo</h1>
            <span className="flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              LIVE
            </span>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar canal..."
              className="h-9 w-full rounded-md border border-border bg-card/60 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-white"
                aria-label="Limpiar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category chips */}
        {categories.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <CategoryChip
              label="Todos"
              active={filterCat === "ALL"}
              onClick={() => setFilterCat("ALL")}
            />
            {categories.map((cat) => (
              <CategoryChip
                key={cat}
                label={cat}
                active={filterCat === cat}
                onClick={() => setFilterCat(cat)}
              />
            ))}
          </div>
        )}

        {/* Channels grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-video w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Frown className="mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No se pudieron cargar los canales. Probá de nuevo más tarde.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Tv className="mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No se encontraron canales con ese filtro.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map((ch, i) => (
              <ChannelCard key={ch.id} channel={ch} index={i} onClick={() => setSelected(ch)} />
            ))}
          </div>
        )}
      </div>

      {/* Player dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-5xl overflow-hidden border-border bg-black p-0 sm:rounded-xl">
          {selected && (
            <>
              <div className="relative aspect-video w-full bg-black">
                <VideoPlayer
                  url={selected.url}
                  type="MP4"
                  title={selected.name}
                />
              </div>
              <DialogHeader className="bg-card px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                    EN VIVO
                  </span>
                  <DialogTitle className="text-base font-bold text-white sm:text-lg">
                    {selected.name}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  {selected.category || "General"} · Transmisión en vivo
                </DialogDescription>
              </DialogHeader>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AppFooter />
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
        active
          ? "border-primary bg-primary text-white"
          : "border-border bg-card/60 text-muted-foreground hover:border-primary/50 hover:text-white"
      )}
    >
      {label}
    </button>
  );
}

function ChannelCard({
  channel,
  index,
  onClick,
}: {
  channel: Channel;
  index: number;
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
      onClick={onClick}
      className="group relative aspect-video overflow-hidden rounded-lg border border-border bg-card transition-all hover:scale-[1.03] hover:border-primary/60 hover:shadow-lg hover:shadow-primary/20"
    >
      {/* Logo / image */}
      {!imgError && channel.logo ? (
        <img
          src={channel.logo}
          alt={channel.name}
          loading="lazy"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-card to-black">
          <Tv className="h-7 w-7 text-white/40" />
        </div>
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      {/* Live badge */}
      <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[9px] font-black text-white">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
        EN VIVO
      </span>

      {/* Info */}
      <div className="absolute inset-x-0 bottom-0 p-2">
        <h3 className="truncate text-xs font-bold text-white sm:text-sm">
          {channel.name}
        </h3>
        <p className="truncate text-[10px] text-white/70">
          {channel.category || "General"}
        </p>
      </div>

      {/* Play hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/90 text-white shadow-lg">
          <Tv className="h-5 w-5" />
        </div>
      </div>
    </motion.button>
  );
}
