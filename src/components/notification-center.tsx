"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useNav } from "@/lib/nav-store";
import { api } from "@/lib/api-client";
import {
  Bell,
  Crown,
  Heart,
  Film,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Notif {
  id: string;
  type: "welcome" | "sub_expiring" | "sub_active" | "new_content" | "review_reply";
  title: string;
  message: string;
  action?: { label: string; view: string };
  icon: any;
  color: string;
}

export function NotificationCenter() {
  const { user } = useAuth();
  const { navigate } = useNav();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const build = async () => {
      const list: Notif[] = [];

      // Bienvenida
      list.push({
        id: "welcome",
        type: "welcome",
        title: `¡Bienvenido, ${user.name}!`,
        message: "Explorá todo el contenido disponible en JOSE DEMO.",
        icon: Heart,
        color: "text-primary",
      });

      // Suscripción
      if (user.subscription) {
        const endDate = new Date(user.subscription.endDate);
        const daysLeft = Math.ceil(
          (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        if (user.subscription.status === "ACTIVE" && daysLeft <= 3 && daysLeft > 0) {
          list.push({
            id: "sub_expiring",
            type: "sub_expiring",
            title: "Tu suscripción vence pronto",
            message: `Te quedan ${daysLeft} día${daysLeft !== 1 ? "s" : ""} de suscripción ${user.subscription.plan?.name || ""}.`,
            action: { label: "Renovar", view: "subscription" },
            icon: AlertTriangle,
            color: "text-yellow-500",
          });
        } else if (user.subscription.status === "ACTIVE") {
          list.push({
            id: "sub_active",
            type: "sub_active",
            title: `Suscripción ${user.subscription.plan?.name || "activa"}`,
            message: `Calidad ${user.subscription.plan?.quality || "HD"} · ${daysLeft} días restantes.`,
            icon: Crown,
            color: "text-yellow-500",
          });
        }
      } else {
        list.push({
          id: "no_sub",
          type: "sub_expiring",
          title: "Activá tu suscripción",
          message: "Sin suscripción, el acceso al contenido es limitado.",
          action: { label: "Ver planes", view: "subscription" },
          icon: Crown,
          color: "text-primary",
        });
      }

      setNotifs(list);
    };
    build();
  }, [user]);

  const unread = notifs.filter((n) => !seenIds.has(n.id));

  const dismiss = (id: string) => {
    setSeenIds((prev) => new Set(prev).add(id));
  };

  if (!user) return null;

  return (
    <>
      {/* Botón campana */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-2 text-muted-foreground transition hover:text-foreground"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {unread.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
            {unread.length}
          </span>
        )}
      </button>

      {/* Panel desplegable */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border border-border bg-popover/95 shadow-2xl backdrop-blur-xl"
            >
              <div className="border-b border-border p-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">
                    Notificaciones
                  </h3>
                  {unread.length > 0 && (
                    <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {unread.length} nueva{unread.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifs.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">
                    No tenés notificaciones
                  </p>
                ) : (
                  notifs.map((n) => {
                    const Icon = n.icon;
                    const isUnread = !seenIds.has(n.id);
                    return (
                      <div
                        key={n.id}
                        className={cn(
                          "group relative border-b border-border/50 p-3 transition hover:bg-accent/50",
                          isUnread && "bg-primary/5"
                        )}
                      >
                        <div className="flex gap-3">
                          <div className={cn("mt-0.5 shrink-0", n.color)}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">
                              {n.title}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {n.message}
                            </p>
                            {n.action && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-2 h-7 px-2 text-xs"
                                onClick={() => {
                                  navigate(n.action!.view as any);
                                  setOpen(false);
                                }}
                              >
                                {n.action.label}
                              </Button>
                            )}
                          </div>
                          <button
                            onClick={() => dismiss(n.id)}
                            className="shrink-0 text-muted-foreground/50 opacity-0 transition hover:text-foreground group-hover:opacity-100"
                            aria-label="Descartar"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {isUnread && (
                          <div className="absolute left-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-border p-2">
                <button
                  onClick={() => {
                    setSeenIds(new Set(notifs.map((n) => n.id)));
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Marcar todo como leído
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
