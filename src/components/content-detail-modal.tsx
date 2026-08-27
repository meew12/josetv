"use client";
import { Content } from "@/lib/types";
import { useNav } from "@/lib/nav-store";
import { useAuth } from "@/lib/auth-store";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Plus, Check, Star, Calendar, Clock, Flame, Share2 } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  content: Content | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContentDetailModal({ content, open, onOpenChange }: Props) {
  const { navigate } = useNav();
  const { user } = useAuth();
  const { toast } = useToast();
  const [inList, setInList] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!content) return null;

  const play = () => {
    onOpenChange(false);
    navigate("watch", { id: content.id });
  };

  const toggleList = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onOpenChange(false);
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

  const share = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: content.title, url });
      } else {
        await navigator.clipboard.writeText(`${content.title} - JOSE DEMO`);
        toast({ title: "Enlace copiado ✓" });
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden border-border/60 bg-card p-0 sm:rounded-2xl">
        {/* Banner */}
        <div className="relative aspect-video w-full overflow-hidden sm:aspect-[21/9]">
          {!imgError && (content.banner || content.thumbnail) ? (
            <img
              src={content.banner || content.thumbnail}
              alt={content.title}
              onError={() => setImgError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/30 via-card to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-card/60 to-transparent" />

          {/* Logo/Title sobre banner */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-black text-white drop-shadow-lg sm:text-4xl md:text-5xl"
            >
              {content.title}
            </motion.h2>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 p-4 sm:p-6">
          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button size="lg" onClick={play} className="btn-shine h-11 px-6">
              <Play className="mr-2 h-5 w-5 fill-white" /> Reproducir
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={toggleList}
              className="h-11 px-5"
            >
              {inList ? (
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
              onClick={share}
              className="h-11 w-11 p-0"
              aria-label="Compartir"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {content.rating > 0 && (
              <span className="flex items-center gap-1 font-bold text-yellow-400">
                <Star className="h-4 w-4 fill-yellow-400" />
                {content.rating.toFixed(1)}
              </span>
            )}
            {content.year && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {content.year}
              </span>
            )}
            {content.duration && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {content.duration} min
              </span>
            )}
            <Badge variant="outline" className="border-border">
              {content.ageRating}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {content.type === "MOVIE" ? "Película" : content.type === "SERIES" ? "Serie" : content.type === "YOUTUBE" ? "YouTube" : "Video"}
            </Badge>
            {content.trending && (
              <Badge className="bg-orange-600 text-white">
                <Flame className="mr-1 h-3 w-3" /> Tendencia
              </Badge>
            )}
          </div>

          {/* Description */}
          {content.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {content.description}
            </p>
          )}

          {/* Genre */}
          {content.genre && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Género:</span>
              <Badge variant="outline">{content.genre}</Badge>
            </div>
          )}

          {/* Category */}
          {content.category && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Categoría:</span>
              <Badge variant="outline">{content.category}</Badge>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
