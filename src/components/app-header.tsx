"use client";
import { useState, useEffect } from "react";
import { useNav } from "@/lib/nav-store";
import { useAuth } from "@/lib/auth-store";
import { useProfile } from "@/lib/profile-store";
import { NotificationCenter } from "@/components/notification-center";
import { Button } from "@/components/ui/button";
import {
  Home,
  Search,
  Tv,
  Flame,
  Heart,
  History,
  User,
  Crown,
  Shield,
  LogOut,
  Menu,
  X,
  Play,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { view: "browse", label: "Inicio", icon: Home },
  { view: "live", label: "En Vivo", icon: Tv },
  { view: "search", label: "Buscar", icon: Search },
  { view: "mylist", label: "Mi Lista", icon: Heart },
] as const;

const FULL_NAV = [
  { view: "browse", label: "Inicio", icon: Home },
  { view: "live", label: "En Vivo", icon: Tv },
  { view: "search", label: "Buscar", icon: Search },
  { view: "mylist", label: "Mi Lista", icon: Heart },
  { view: "history", label: "Historial", icon: History },
  { view: "adult", label: "+18", icon: Flame },
] as const;

export function AppHeader() {
  const { view, navigate } = useNav();
  const { user, logout } = useAuth();
  const { activeProfile, setActive, showGate } = useProfile();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (v: string) => view === v;

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 safe-top",
          scrolled
            ? "bg-background/95 backdrop-blur-md shadow-lg shadow-black/30"
            : "bg-gradient-to-b from-black/80 via-black/40 to-transparent"
        )}
      >
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-2 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <button
            onClick={() => navigate("browse")}
            className="flex items-center gap-1 shrink-0"
            aria-label="JOSE DEMO inicio"
          >
            <span className="text-xl font-black tracking-tighter text-primary sm:text-2xl">
              JOSE
            </span>
            <span className="text-xl font-black tracking-tighter text-white sm:text-2xl">
              DEMO
            </span>
          </button>

          {/* Nav desktop */}
          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {FULL_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.view}
                  onClick={() => navigate(item.view as any)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive(item.view)
                      ? "text-white"
                      : "text-muted-foreground hover:text-white"
                  )}
                >
                  {item.view === "adult" && (
                    <span className="rounded bg-primary/20 px-1 text-[10px] font-bold text-primary">
                      +18
                    </span>
                  )}
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/* Cambiar perfil */}
            {user && activeProfile && (
              <button
                onClick={() => {
                  setActive(null);
                  showGate();
                }}
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                title="Cambiar perfil"
              >
                <span className="text-lg">{activeProfile.avatar}</span>
                <span className="hidden sm:inline">{activeProfile.name}</span>
              </button>
            )}

            {/* Notificaciones */}
            {user && (
              <div className="relative hidden sm:block">
                <NotificationCenter />
              </div>
            )}

            {/* Admin */}
            {user?.role === "ADMIN" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("admin")}
                className={cn(
                  "hidden sm:flex text-muted-foreground hover:text-white",
                  isActive("admin") && "text-white"
                )}
              >
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            )}

            {/* Suscripción */}
            {user && (
              <Button
                variant={user.subscription?.status === "ACTIVE" ? "outline" : "default"}
                size="sm"
                onClick={() => navigate("subscription")}
                className="hidden sm:flex"
              >
                <Crown className="h-4 w-4" />
                {user.subscription?.status === "ACTIVE" ? "Premium" : "Suscribirse"}
              </Button>
            )}

            {/* Perfil */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full ring-2 ring-transparent transition hover:ring-primary/50">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarFallback className="bg-primary/20 text-xs font-bold text-primary">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("profile")}>
                    <User className="mr-2 h-4 w-4" /> Mi Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("subscription")}>
                    <Crown className="mr-2 h-4 w-4" /> Suscripción
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("history")}>
                    <History className="mr-2 h-4 w-4" /> Historial
                  </DropdownMenuItem>
                  {user.role === "ADMIN" && (
                    <DropdownMenuItem onClick={() => navigate("admin")}>
                      <Shield className="mr-2 h-4 w-4" /> Panel Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      navigate("landing");
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" onClick={() => navigate("login")} className="sm:hidden">
                <Play className="h-4 w-4" />
              </Button>
            )}

            {/* Botón menú móvil */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden rounded-md p-2 text-white"
              aria-label="Menú"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Menú móvil desplegable */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background/98 backdrop-blur-md">
            <nav className="flex flex-col gap-1 p-3">
              {FULL_NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.view}
                    onClick={() => {
                      navigate(item.view as any);
                      setMobileOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                      isActive(item.view)
                        ? "bg-primary/15 text-white"
                        : "text-muted-foreground hover:bg-accent hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {item.view === "adult" && (
                      <span className="ml-auto rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold">
                        +18
                      </span>
                    )}
                  </button>
                );
              })}
              {user?.role === "ADMIN" && (
                <button
                  onClick={() => {
                    navigate("admin");
                    setMobileOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent"
                >
                  <Shield className="h-4 w-4" />
                  Panel Admin
                </button>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Bottom nav móvil (app-like) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl safe-bottom md:hidden">
        <div className="grid grid-cols-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.view);
            return (
              <button
                key={item.view}
                onClick={() => navigate(item.view as any)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_6px_rgba(229,9,20,0.6)]")} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
