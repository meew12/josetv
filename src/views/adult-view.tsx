"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNav } from "@/lib/nav-store";
import { useAuth } from "@/lib/auth-store";
import { api } from "@/lib/api-client";
import { Content, Channel } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { ContentCard } from "@/components/content-card";
import { VideoPlayer } from "@/components/video-player";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Flame, Shield, ArrowLeft, Tv, AlertTriangle, Info } from "lucide-react";
import { motion } from "framer-motion";

interface ContentListResponse {
  items: Content[];
}
interface ChannelListResponse {
  items: Channel[];
}

export function AdultView() {
  const { navigate, back } = useNav();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Channel | null>(null);

  // Auth guard
  useEffect(() => {
    if (!user) {
      const t = setTimeout(() => navigate("login"), 50);
      return () => clearTimeout(t);
    }
  }, [user, navigate]);

  // Age gate (derived): blocked if not verified and not admin
  const blocked = !!user && !user.adultVerified && user.role !== "ADMIN";

  // Fetch adult content + channels (only if allowed)
  const contentQ = useQuery({
    queryKey: ["content", "adult"],
    queryFn: () => api.get<ContentListResponse>("/content?isAdult=true&limit=60"),
    enabled: !!user && (user.adultVerified || user.role === "ADMIN") && !blocked,
  });

  const channelsQ = useQuery({
    queryKey: ["channels", "adult"],
    queryFn: () => api.get<ChannelListResponse>("/channels?isAdult=true&limit=100"),
    enabled: !!user && (user.adultVerified || user.role === "ADMIN") && !blocked,
  });

  if (!user) return null;

  // Blocked state: not age-verified
  if (blocked) {
    return (
      <div className="flex min-h-screen flex-col pb-20 md:pb-0">
        <AppHeader />
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 text-primary pulse-red"
          >
            <Shield className="h-12 w-12" />
          </motion.div>
          <span className="mb-4 rounded bg-primary px-3 py-1 text-sm font-black text-white">
            ZONA +18
          </span>
          <h1 className="mb-3 text-3xl font-black text-white sm:text-4xl">
            Acceso restringido
          </h1>
          <p className="mb-2 max-w-md text-sm text-muted-foreground">
            Esta sección contiene material exclusivo para mayores de 18 años. Para
            acceder, tu cuenta debe tener la verificación de edad habilitada.
          </p>
          <p className="mb-6 max-w-md text-xs text-muted-foreground/80">
            Si ya sos mayor de edad, contactate con un administrador para activar la
            verificación en tu cuenta.
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
        <AppFooter />
      </div>
    );
  }

  const contents = contentQ.data?.items ?? [];
  const channels = channelsQ.data?.items ?? [];

  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <AppHeader />

      {/* Disclaimer banner */}
      <div className="mt-16 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-y border-primary/30">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          <AlertTriangle className="h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs text-foreground sm:text-sm">
            <span className="font-bold text-primary">Zona +18:</span> El material de esta
            sección es exclusivo para mayores de 18 años. Contenido explícito.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white sm:text-3xl">
              Zona <span className="text-primary">+18</span>
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Contenido exclusivo para adultos
            </p>
          </div>
        </div>

        {/* Content section */}
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-lg font-bold text-white sm:text-xl">Películas y Series</h2>
            <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
              +18
            </span>
          </div>

          {contentQ.isLoading ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
              {Array.from({ length: 16 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[2/3] w-full rounded-lg" />
              ))}
            </div>
          ) : contents.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
              <Info className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No hay contenido adulto disponible por el momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
              {contents.map((c, i) => (
                <ContentCard key={c.id} content={c} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* Channels section */}
        {channels.length > 0 && (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Tv className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-white sm:text-xl">Canales en Vivo</h2>
              <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                +18
              </span>
            </div>

            {channelsQ.isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-video w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {channels.map((ch, i) => (
                  <AdultChannelCard
                    key={ch.id}
                    channel={ch}
                    index={i}
                    onClick={() => setSelected(ch)}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Channel player dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-5xl overflow-hidden border-border bg-black p-0 sm:rounded-xl">
          {selected && (
            <>
              <div className="relative aspect-video w-full bg-black">
                <VideoPlayer url={selected.url} type="MP4" title={selected.name} />
              </div>
              <DialogHeader className="bg-card px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-black text-white">
                    +18
                  </span>
                  <DialogTitle className="text-base font-bold text-white sm:text-lg">
                    {selected.name}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  {selected.category || "Adultos"} · Transmisión en vivo · Solo +18
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

function AdultChannelCard({
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
      className="group relative aspect-video overflow-hidden rounded-lg border border-primary/30 bg-card transition-all hover:scale-[1.03] hover:border-primary hover:shadow-lg hover:shadow-primary/30"
    >
      {!imgError && channel.logo ? (
        <img
          src={channel.logo}
          alt={channel.name}
          loading="lazy"
          onError={() => setImgError(true)}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 via-card to-black">
          <Flame className="h-7 w-7 text-primary/60" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

      <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[9px] font-black text-white">
        +18
      </span>
      <span className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
        LIVE
      </span>

      <div className="absolute inset-x-0 bottom-0 p-2">
        <h3 className="truncate text-xs font-bold text-white sm:text-sm">
          {channel.name}
        </h3>
        <p className="truncate text-[10px] text-white/70">
          {channel.category || "Adultos"}
        </p>
      </div>
    </motion.button>
  );
}
