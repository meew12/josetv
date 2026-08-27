"use client";
import { Content } from "@/lib/types";
import { useNav } from "@/lib/nav-store";
import { Play, Trash2, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  item: {
    content: Content;
    progress: number;
    duration: number;
    lastWatched: string;
  };
  index?: number;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d}d`;
  return `hace ${Math.floor(d / 7)}sem`;
}

function formatRemaining(progress: number, duration: number): string {
  if (!duration) return "";
  const remaining = Math.max(0, duration - progress);
  const min = Math.floor(remaining / 60);
  if (min < 60) return `${min} min restantes`;
  const h = Math.floor(min / 60);
  return `${h}h ${min % 60}m restantes`;
}

export function ContinueWatchingCard({ item, index = 0 }: Props) {
  const { navigate } = useNav();
  const qc = useQueryClient();
  const [imgError, setImgError] = useState(false);
  const c = item.content;
  const pct = item.duration ? Math.min(100, (item.progress / item.duration) * 100) : 0;

  const remove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/history/${c.id}`);
      qc.invalidateQueries({ queryKey: ["history"] });
    } catch {
      /* ignore */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3) }}
      onClick={() => navigate("watch", { id: c.id })}
      className="group relative w-64 shrink-0 cursor-pointer overflow-hidden rounded-lg bg-card transition-all duration-300 hover:scale-[1.04] hover:z-10 hover:shadow-2xl hover:shadow-primary/20 sm:w-72 md:w-80"
    >
      <div className="relative aspect-video w-full bg-muted">
        {!imgError && c.thumbnail ? (
          <img
            src={c.thumbnail}
            alt={c.title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 via-card to-black">
            <Play className="h-8 w-8 text-white/40" />
          </div>
        )}

        {/* Overlay hover */}
        <div className="absolute inset-0 card-overlay opacity-60 transition-opacity group-hover:opacity-90" />

        {/* Botón play hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 text-white shadow-lg glow-red">
            <Play className="h-6 w-6 fill-white" />
          </div>
        </div>

        {/* Info abajo */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="truncate text-sm font-bold text-white">{c.title}</h3>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-white/70">
            <Clock className="h-2.5 w-2.5" />
            {formatRemaining(item.progress, item.duration)}
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export function ContinueWatchingRow({ items }: { items: Props["item"][] }) {
  if (items.length === 0) return null;
  return (
    <section className="group/row relative">
      <div className="mb-2 flex items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Play className="h-5 w-5 text-primary" />
        <h2 className="text-base font-bold text-foreground sm:text-lg md:text-xl">
          Continuar viendo
        </h2>
        <span className="text-xs text-muted-foreground">({items.length})</span>
      </div>
      <div className="hide-scrollbar flex gap-2 overflow-x-auto scroll-smooth px-4 pb-2 sm:px-6 lg:px-8">
        {items.map((item, i) => (
          <ContinueWatchingCard key={item.content.id} item={item} index={i} />
        ))}
      </div>
    </section>
  );
}
