"use client";
import { Content } from "@/lib/types";
import { useNav } from "@/lib/nav-store";
import { Flame } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  contents: Content[];
}

export function Top10Row({ contents }: Props) {
  if (contents.length === 0) return null;

  return (
    <section className="group/row relative">
      <div className="mb-3 flex items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Flame className="h-5 w-5 text-orange-500" />
        <h2 className="text-base font-bold text-foreground sm:text-lg md:text-xl">
          Top 10 en Argentina hoy
        </h2>
      </div>

      <div className="hide-scrollbar flex gap-1 overflow-x-auto px-4 pb-4 sm:px-6 lg:px-8">
        {contents.slice(0, 10).map((c, i) => (
          <Top10Card key={c.id} content={c} rank={i + 1} />
        ))}
      </div>
    </section>
  );
}

function Top10Card({ content, rank }: { content: Content; rank: number }) {
  const { navigate } = useNav();
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(rank * 0.05, 0.4) }}
      onClick={() => navigate("watch", { id: content.id })}
      className="group relative flex shrink-0 cursor-pointer items-end transition-transform duration-300 hover:scale-105"
    >
      {/* Número grande */}
      <span
        className={cn(
          "select-none font-black leading-none text-transparent [-webkit-text-stroke:3px] [-webkit-text-stroke-color:rgba(229,9,20,0.8)]",
          "text-[80px] sm:text-[100px] md:text-[120px]",
          "mr-[-12px] z-0 drop-shadow-[0_0_20px_rgba(229,9,20,0.3)]"
        )}
      >
        {rank}
      </span>

      {/* Imagen */}
      <div className="relative z-10 h-36 w-24 overflow-hidden rounded-md bg-card shadow-xl sm:h-48 sm:w-32 md:h-56 md:w-40">
        {!imgError && content.thumbnail ? (
          <img
            src={content.thumbnail}
            alt={content.title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 via-card to-black">
            <span className="text-xs font-bold text-white/50">{content.title}</span>
          </div>
        )}

        {/* Overlay hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        {/* Badge +18 */}
        {content.isAdult && (
          <span className="absolute right-1 top-1 rounded bg-primary px-1 text-[10px] font-bold text-white">
            +18
          </span>
        )}

        {/* Título al hover */}
        <div className="absolute bottom-0 left-0 right-0 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <p className="truncate text-[10px] font-bold text-white drop-shadow-lg sm:text-xs">
            {content.title}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
