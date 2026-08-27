"use client";
import { useEffect, useRef, useState } from "react";
import { Content } from "@/lib/types";
import { useNav } from "@/lib/nav-store";
import { useAuth } from "@/lib/auth-store";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Heart, Play, Plus, Star, Flame, Tv, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Props {
  content: Content;
  index?: number;
  variant?: "default" | "wide";
}

export function ContentCard({ content, index = 0, variant = "default" }: Props) {
  const { navigate } = useNav();
  const { user } = useAuth();
  const { toast } = useToast();
  const [inList, setInList] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [muted, setMuted] = useState(true);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const open = () => navigate("watch", { id: content.id });

  // Hover delay para trailer
  const handleMouseEnter = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      setHovered(true);
    }, 600);
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHovered(false);
  };

  // Play trailer cuando hovered
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (hovered && content.trailerUrl) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [hovered, content.trailerUrl]);

  const toggleList = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate("login");
      return;
    }
    try {
      if (inList) {
        await api.delete(`/watchlist/${content.id}`);
        setInList(false);
        toast({ title: "Quitado de Mi Lista" });
      } else {
        await api.post(`/watchlist`, { contentId: content.id });
        setInList(true);
        toast({ title: "Agregado a Mi Lista ✓" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3) }}
      onClick={open}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "group relative shrink-0 cursor-pointer overflow-hidden rounded-lg bg-card transition-all duration-300 hover:scale-[1.06] hover:z-10 hover:shadow-2xl hover:shadow-primary/20",
        variant === "wide" ? "w-72 sm:w-80" : "w-36 sm:w-44 md:w-48"
      )}
    >
      {/* Imagen / Trailer */}
      <div
        className={cn(
          "relative aspect-[2/3] w-full bg-muted",
          variant === "wide" && "aspect-video"
        )}
      >
        {/* Imagen estática */}
        {!imgError && content.thumbnail ? (
          <img
            src={content.thumbnail}
            alt={content.title}
            loading="lazy"
            onError={() => setImgError(true)}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-300",
              hovered && content.trailerUrl ? "opacity-0" : "opacity-100"
            )}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 via-card to-black">
            {content.type === "YOUTUBE" ? (
              <Tv className="h-8 w-8 text-white/40" />
            ) : (
              <Play className="h-8 w-8 text-white/40" />
            )}
          </div>
        )}

        {/* Trailer en hover */}
        {hovered && content.trailerUrl && !imgError && (
          <video
            ref={videoRef}
            src={content.trailerUrl}
            muted={muted}
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-100"
          />
        )}

        {/* Botón mute */}
        {hovered && content.trailerUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMuted((m) => !m);
            }}
            className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-black/60 text-white backdrop-blur transition hover:bg-primary/80"
            aria-label={muted ? "Activar sonido" : "Silenciar"}
          >
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {content.isAdult && (
            <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
              +18
            </span>
          )}
          {content.trending && (
            <span className="flex items-center gap-0.5 rounded bg-orange-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              <Flame className="h-2.5 w-2.5" /> TOP
            </span>
          )}
        </div>

        {/* Rating */}
        {content.rating > 0 && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-yellow-400 backdrop-blur">
            <Star className="h-2.5 w-2.5 fill-yellow-400" />
            {Number(content.rating).toFixed(1)}
          </div>
        )}

        {/* Overlay hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Botón play hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 text-white shadow-lg pulse-red">
            <Play className="h-5 w-5 fill-white" />
          </div>
        </div>

        {/* Botón mi lista */}
        <button
          onClick={toggleList}
          className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-black/60 text-white opacity-0 backdrop-blur transition hover:border-primary hover:bg-primary/80 group-hover:opacity-100"
          aria-label="Mi lista"
        >
          {inList ? <Heart className="h-4 w-4 fill-primary text-primary" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      {/* Info */}
      <div className="p-2">
        <h3 className="truncate text-xs font-semibold text-foreground sm:text-sm">
          {content.title}
        </h3>
        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          {content.year && <span>{content.year}</span>}
          {content.duration && (
            <>
              <span className="text-muted-foreground/50">•</span>
              <span>{content.duration}m</span>
            </>
          )}
          <span className="rounded border border-border px-1 text-muted-foreground">
            {content.ageRating}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
