"use client";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ContentCard } from "./content-card";
import { Content } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  contents: Content[];
  variant?: "default" | "wide";
  icon?: React.ReactNode;
}

export function ContentRow({ title, contents, variant = "default", icon }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
  };

  if (contents.length === 0) return null;

  return (
    <section className="group/row relative">
      <div className="mb-2 flex items-center gap-2 px-4 sm:px-6 lg:px-8">
        {icon}
        <h2 className="text-base font-bold text-foreground sm:text-lg md:text-xl">
          {title}
        </h2>
        <span className="text-xs text-muted-foreground">({contents.length})</span>
      </div>

      <div className="relative">
        {/* Flecha izquierda */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 z-20 hidden h-[calc(100%-2.5rem)] w-10 items-center justify-center bg-gradient-to-r from-black/80 to-transparent text-white opacity-0 transition group-hover/row:opacity-100 md:flex"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div
          ref={scrollRef}
          className="hide-scrollbar flex gap-2 overflow-x-auto scroll-smooth px-4 pb-2 sm:px-6 lg:px-8"
        >
          {contents.map((c, i) => (
            <ContentCard key={c.id} content={c} index={i} variant={variant} />
          ))}
        </div>

        {/* Flecha derecha */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 z-20 hidden h-[calc(100%-2.5rem)] w-10 items-center justify-center bg-gradient-to-l from-black/80 to-transparent text-white opacity-0 transition group-hover/row:opacity-100 md:flex"
          aria-label="Siguiente"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </section>
  );
}
