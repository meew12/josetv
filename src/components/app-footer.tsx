"use client";
import { useEffect } from "react";
import { useNav } from "@/lib/nav-store";

export function AppFooter() {
  const { view } = useNav();

  // no mostrar footer en pantallas full (watch, admin)
  if (view === "watch" || view === "admin") return null;

  return (
    <footer className="mt-auto border-t border-border bg-background/80 px-4 py-6 text-center text-xs text-muted-foreground safe-bottom">
      <div className="mx-auto max-w-4xl space-y-2">
        <p className="font-semibold text-foreground">JOSE DEMO</p>
        <p>Stream sin límites · Películas, series y canales en vivo</p>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          <a href="#" className="hover:text-primary transition-colors">Términos</a>
          <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
          <a href="#" className="hover:text-primary transition-colors">Ayuda</a>
          <a href="#" className="hover:text-primary transition-colors">Contacto</a>
        </div>
        <p className="text-muted-foreground/60">© 2025 JOSE DEMO. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
