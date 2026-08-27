"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const LETTERS = "JOSE DEMO".split("");

export function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const duration = 2600;
    let raf = 0;
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / duration) * 100);
      setProgress(p);
      if (p < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(() => setExiting(true), 350);
        setTimeout(() => onDone(), 1100);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
      animate={exiting ? { opacity: 0, scale: 1.1 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
    >
      {/* Fondo de partículas/glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute left-1/3 top-1/3 h-[30vmin] w-[30vmin] rounded-full bg-red-700/10 blur-[80px] animate-pulse" />
      </div>

      {/* Logo animado */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 px-6">
          {LETTERS.map((ch, i) => (
            <span
              key={i}
              className="letter-pop text-5xl font-black tracking-tight text-white sm:text-7xl md:text-8xl"
              style={{
                animationDelay: `${i * 0.08}s`,
                color: ch === " " ? "transparent" : undefined,
                textShadow:
                  ch !== " "
                    ? "0 0 40px rgba(229,9,20,0.6), 0 0 80px rgba(229,9,20,0.3)"
                    : undefined,
              }}
            >
              {ch === " " ? "\u00A0" : ch}
            </span>
          ))}
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          className="mt-4 text-sm font-medium tracking-[0.3em] text-muted-foreground sm:text-base"
        >
          STREAM SIN LÍMITES
        </motion.p>

        {/* Barra de progreso */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="mt-10 h-1 w-56 overflow-hidden rounded-full bg-white/10 sm:w-72"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-700 to-primary transition-[width] duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-3 font-mono text-xs text-muted-foreground"
        >
          {Math.round(progress)}%
        </motion.p>
      </div>

      {/* Logo esquina */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
          © 2025 JOSE DEMO · Todos los derechos reservados
        </p>
      </div>
    </motion.div>
  );
}
