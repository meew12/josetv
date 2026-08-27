"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  url: string;
  type: "MOVIE" | "SERIES" | "YOUTUBE" | "MP4";
  poster?: string;
  title?: string;
  onProgress?: (current: number, duration: number) => void;
  className?: string;
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

const isHls = (u: string) => /\.m3u8(\?.*)?$/i.test(u);
const isMp4 = (u: string) => /\.mp4(\?.*)?$/i.test(u);

// Reproductor nativo — usa el elemento video directamente.
// Para HLS: intenta nativo primero (Safari/iOS), luego hls.js lazy-loaded con fallback.
function NativeVideo({
  url,
  poster,
  title,
  onProgress,
  className,
}: Omit<Props, "type">) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hlsFailed, setHlsFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: any = null;
    let cancelled = false;

    const onLoaded = () => setLoading(false);
    const onErr = () => {
      setError("No se pudo cargar el video. Probá de nuevo más tarde.");
      setLoading(false);
    };

    video.addEventListener("canplay", onLoaded);
    video.addEventListener("loadeddata", onLoaded);
    video.addEventListener("error", onErr);

    const setup = async () => {
      if (isHls(url)) {
        // 1) Intentar nativo (Safari/iOS)
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = url;
          video.play().catch(() => {});
          return;
        }
        // 2) Si hls.js ya falló antes, usar src directo como último recurso
        if (hlsFailed) {
          video.src = url;
          video.play().catch(() => {});
          return;
        }
        // 3) Intentar hls.js dinámico
        try {
          const HlsModule = await import("hls.js");
          if (cancelled) return;
          const Hls = HlsModule.default;
          if (Hls && Hls.isSupported()) {
            hls = new Hls({ enableWorker: false, lowLatencyMode: false });
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              video.play().catch(() => {});
            });
            hls.on(Hls.Events.ERROR, (_e: any, data: any) => {
              if (data.fatal) {
                // fallback a src directo
                try { hls?.destroy(); } catch {}
                hls = null;
                setHlsFailed(true);
                video.src = url;
                video.play().catch(() => {});
              }
            });
          } else {
            video.src = url;
            video.play().catch(() => {});
          }
        } catch {
          // Si el chunk falla, usar src directo
          if (!cancelled) {
            setHlsFailed(true);
            video.src = url;
            video.play().catch(() => {});
          }
        }
      } else if (isMp4(url)) {
        video.src = url;
        video.play().catch(() => {});
      } else {
        video.src = url;
      }
    };
    setup();

    return () => {
      cancelled = true;
      video.removeEventListener("canplay", onLoaded);
      video.removeEventListener("loadeddata", onLoaded);
      video.removeEventListener("error", onErr);
      if (hls) {
        try { hls.destroy(); } catch {}
      }
    };
  }, [url, hlsFailed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !onProgress) return;
    const onTime = () => onProgress(video.currentTime, video.duration || 0);
    video.addEventListener("timeupdate", onTime);
    return () => video.removeEventListener("timeupdate", onTime);
  }, [onProgress]);

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  if (error) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-lg bg-card text-center">
        <p className="mb-2 text-lg font-semibold">Error de reproducción</p>
        <p className="max-w-md text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onDoubleClick={toggleFullscreen}
      className={cn(
        "group relative aspect-video w-full overflow-hidden rounded-lg bg-black",
        className
      )}
    >
      <video
        ref={videoRef}
        poster={poster}
        controls
        playsInline
        className="h-full w-full"
      />
      {loading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-primary" />
        </div>
      )}
    </div>
  );
}

export function VideoPlayer({ url, type, poster, title, onProgress, className }: Props) {
  const ytId = type === "YOUTUBE" ? getYouTubeId(url) : null;

  if (ytId) {
    return (
      <div
        className={cn(
          "relative aspect-video w-full overflow-hidden rounded-lg bg-black",
          className
        )}
      >
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
          title={title || "Reproductor"}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <NativeVideo
      key={url + (type === "YOUTUBE" ? "_yt" : "")}
      url={url}
      poster={poster}
      title={title}
      onProgress={onProgress}
      className={className}
    />
  );
}
