"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Megaphone, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  className?: string;
}

export function AnnouncementBanner({ className }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    api
      .get<{ settings: Record<string, string> }>("/settings")
      .then((r) => {
        const ann = r.settings?.announcement;
        if (ann && ann.trim()) setMessage(ann.trim());
      })
      .catch(() => {});
  }, []);

  if (!message || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`relative z-40 overflow-hidden border-b border-primary/30 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 ${className || ""}`}
      >
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/30">
            <Megaphone className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="flex-1 truncate text-sm font-medium text-foreground">
            {message}
          </p>
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Cerrar anuncio"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
