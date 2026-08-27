"use client";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNav } from "@/lib/nav-store";
import { useAuth } from "@/lib/auth-store";
import { useProfile } from "@/lib/profile-store";
import { api } from "@/lib/api-client";
import { Content } from "@/lib/types";
import { VideoPlayer } from "@/components/video-player";
import { ContentRow } from "@/components/content-row";
import { ReviewsSection } from "@/components/reviews-section";
import { WatchPartyButton } from "@/components/watch-party-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Check,
  Star,
  Calendar,
  Clock,
  Shield,
  Eye,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface ListResponse {
  items: Content[];
}

export function WatchView() {
  const { params, back, navigate } = useNav();
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const contentId = params.id;

  const progressRef = useRef({ current: 0, duration: 0 });
  const [inList, setInList] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!user) {
      const t = setTimeout(() => navigate("login"), 50);
      return () => clearTimeout(t);
    }
  }, [user, navigate]);

  // Fetch content
  const { data: content, isLoading, error } = useQuery({
    queryKey: ["content", "detail", contentId],
    queryFn: () => api.get<Content>(`/content/${contentId}`),
    enabled: !!contentId && !!user,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Related content (same category, excluding current)
  const { data: relatedData } = useQuery({
    queryKey: ["content", "related", content?.category],
    queryFn: () =>
      api.get<ListResponse>(
        `/content?category=${encodeURIComponent(content?.category || "General")}&limit=12`
      ),
    enabled: !!content,
  });

  // Watchlist state (filtrado por perfil activo)
  useEffect(() => {
    if (!user || !contentId) return;
    const profileQuery = activeProfile ? `?profileId=${activeProfile.id}` : "";
    api
      .get<ListResponse>(`/watchlist${profileQuery}`)
      .then((r) => setInList(r.items.some((c) => c.id === contentId)))
      .catch(() => {});
  }, [user, contentId, activeProfile]);

  // Progress tracking: POST every 10s (con profileId del perfil activo)
  useEffect(() => {
    if (!content || !user) return;
    const send = () => {
      api
        .post("/history", {
          contentId: content.id,
          progress: Math.floor(progressRef.current.current),
          duration: Math.floor(progressRef.current.duration) || null,
          profileId: activeProfile?.id,
        })
        .catch(() => {});
    };
    // initial ping
    send();
    const interval = setInterval(send, 10000);
    return () => {
      clearInterval(interval);
      // final ping on unmount
      api
        .post("/history", {
          contentId: content.id,
          progress: Math.floor(progressRef.current.current),
          duration: Math.floor(progressRef.current.duration) || null,
          profileId: activeProfile?.id,
        })
        .catch(() => {});
    };
  }, [content, user, activeProfile]);

  // Adult age gate (derived from content + user)
  const showAgeGate =
    !!content?.isAdult && !user?.adultVerified && user?.role !== "ADMIN";

  if (!user) return null;

  const handleProgress = (current: number, duration: number) => {
    progressRef.current = { current, duration };
  };

  const toggleList = async () => {
    if (!content) return;
    try {
      if (inList) {
        await api.delete(`/watchlist/${content.id}`);
        setInList(false);
        toast({ title: "Quitado de Mi Lista" });
      } else {
        await api.post("/watchlist", {
          contentId: content.id,
          profileId: activeProfile?.id,
        });
        setInList(true);
        toast({ title: "Agregado a Mi Lista ✓" });
      }
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="mx-auto max-w-6xl px-4 pt-4 sm:pt-6">
          <Button variant="ghost" size="sm" onClick={back} className="mb-3 text-white">
            <ArrowLeft className="mr-1 h-4 w-4" /> Volver
          </Button>
          <Skeleton className="aspect-video w-full rounded-xl" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (error || !content) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20 text-destructive">
          <Shield className="h-8 w-8" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-white">No se pudo cargar el contenido</h2>
        <p className="mb-6 max-w-md text-sm text-muted-foreground">
          {error?.message || "El contenido que buscás no existe o fue eliminado."}
        </p>
        <Button onClick={back}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </div>
    );
  }

  // Adult gate
  if (showAgeGate) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-primary pulse-red">
          <Shield className="h-10 w-10" />
        </div>
        <span className="mb-3 rounded bg-primary px-3 py-1 text-sm font-black text-white">
          CONTENIDO +18
        </span>
        <h2 className="mb-3 text-2xl font-black text-white sm:text-3xl">
          Acceso restringido
        </h2>
        <p className="mb-6 max-w-md text-sm text-muted-foreground">
          Este contenido es exclusivo para mayores de 18 años verificados. Tu cuenta
          aún no tiene verificación de edad habilitada. Contactá a un administrador para
          activarla.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={back}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
          <Button variant="outline" onClick={() => navigate("browse")}>
            Ir al inicio
          </Button>
        </div>
      </div>
    );
  }

  const related = (relatedData?.items ?? []).filter((c) => c.id !== content.id);

  const safeUrl = content.url || "";
  const safeType = (content.type || "MP4") as "MOVIE" | "SERIES" | "YOUTUBE" | "MP4";

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0">
      {/* Back button */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-black/90 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={back}
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Volver
          </Button>
        </div>
      </div>

      {/* Player */}
      <div className="mx-auto max-w-6xl px-0 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <VideoPlayer
            url={safeUrl}
            type={safeType}
            poster={content.thumbnail || content.banner}
            title={content.title}
            onProgress={handleProgress}
            className="rounded-none sm:rounded-lg"
          />
        </motion.div>

        {/* Info */}
        <div className="mt-5 px-4 sm:px-0">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {content.isAdult && (
                  <Badge className="bg-primary text-white">+18</Badge>
                )}
                {content.trending && (
                  <Badge className="bg-orange-600 text-white">Tendencia</Badge>
                )}
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {content.type === "MOVIE"
                    ? "Película"
                    : content.type === "SERIES"
                    ? "Serie"
                    : content.type === "YOUTUBE"
                    ? "YouTube"
                    : "Especial"}
                </span>
              </div>
              <h1 className="text-2xl font-black leading-tight text-white sm:text-3xl md:text-4xl">
                {content.title}
              </h1>

              {/* Metadata */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                {content.year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {content.year}
                  </span>
                )}
                {content.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {content.duration} min
                  </span>
                )}
                {content.rating != null && content.rating > 0 && (
                  <span className="flex items-center gap-1 text-yellow-400">
                    <Star className="h-3.5 w-3.5 fill-yellow-400" />{" "}
                    {Number(content.rating).toFixed(1)}
                  </span>
                )}
                {content.views != null && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" /> {content.views} vistas
                  </span>
                )}
                {content.ageRating && (
                  <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-bold">
                    {content.ageRating}
                  </span>
                )}
                {content.genre && (
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs">
                    {content.genre}
                  </span>
                )}
              </div>

              {/* Description */}
              {content.description && (
                <p className="mt-4 max-w-3xl text-sm text-foreground/85 sm:text-base">
                  {content.description}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
              <Button
                onClick={toggleList}
                variant={inList ? "secondary" : "default"}
                className="h-11 min-w-[160px]"
              >
                {inList ? (
                  <>
                    <Check className="mr-2 h-4 w-4" /> En Mi Lista
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" /> Agregar a Mi Lista
                  </>
                )}
              </Button>
              <WatchPartyButton
                contentId={content.id}
                contentTitle={content.title}
                contentType={content.type}
                contentUrl={content.url}
              />
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-10">
            <ContentRow title="Relacionados" contents={related} />
          </div>
        )}

        {/* Reviews & Reactions */}
        <div className="mt-12 px-4 sm:px-0">
          <ReviewsSection contentId={content.id} />
        </div>
      </div>
    </div>
  );
}
