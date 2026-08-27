"use client";
import { useEffect, useState, lazy, Suspense } from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { ErrorBoundary } from "@/components/error-boundary";
import { ProfileGate } from "@/components/profile-gate";
import { useNav } from "@/lib/nav-store";
import { useAuth } from "@/lib/auth-store";
import { useProfile } from "@/lib/profile-store";
import { api } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

// Carga diferida — chunks pequeños que se pre-calientan al inicio
const LandingView = lazy(() => import("@/views/landing-view").then((m) => ({ default: m.LandingView })));
const LoginView = lazy(() => import("@/views/auth/login-view").then((m) => ({ default: m.LoginView })));
const RegisterView = lazy(() => import("@/views/auth/register-view").then((m) => ({ default: m.RegisterView })));
const BrowseView = lazy(() => import("@/views/browse-view").then((m) => ({ default: m.BrowseView })));
const WatchView = lazy(() => import("@/views/watch-view").then((m) => ({ default: m.WatchView })));
const SearchView = lazy(() => import("@/views/search-view").then((m) => ({ default: m.SearchView })));
const LiveView = lazy(() => import("@/views/live-view").then((m) => ({ default: m.LiveView })));
const AdultView = lazy(() => import("@/views/adult-view").then((m) => ({ default: m.AdultView })));
const MyListView = lazy(() => import("@/views/mylist-view").then((m) => ({ default: m.MyListView })));
const HistoryView = lazy(() => import("@/views/history-view").then((m) => ({ default: m.HistoryView })));
const ProfileView = lazy(() => import("@/views/profile-view").then((m) => ({ default: m.ProfileView })));
const SubscriptionView = lazy(() => import("@/views/subscription-view").then((m) => ({ default: m.SubscriptionView })));
const AdminView = lazy(() => import("@/views/admin/admin-view").then((m) => ({ default: m.AdminView })));

// Pre-cargar todas las vistas al inicio para evitar errores de chunk loading on-demand
const PRELOAD = [
  () => import("@/views/landing-view"),
  () => import("@/views/auth/login-view"),
  () => import("@/views/auth/register-view"),
  () => import("@/views/browse-view"),
  () => import("@/views/watch-view"),
  () => import("@/views/search-view"),
  () => import("@/views/live-view"),
  () => import("@/views/adult-view"),
  () => import("@/views/mylist-view"),
  () => import("@/views/history-view"),
  () => import("@/views/profile-view"),
  () => import("@/views/subscription-view"),
  () => import("@/views/admin/admin-view"),
];

function ViewSkeleton() {
  return (
    <div className="min-h-screen pt-16">
      <div className="space-y-4 p-4">
        <Skeleton className="h-[45vh] w-full rounded-xl" />
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-40 shrink-0 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-40 shrink-0 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { view, navigate } = useNav();
  const { user, setUser } = useAuth();
  const { activeProfile } = useProfile();
  const [booting, setBooting] = useState(() => {
    if (typeof window === "undefined") return true;
    return !sessionStorage.getItem("jd_loaded");
  });
  const [authChecked, setAuthChecked] = useState(false);

  const onLoadingDone = () => {
    sessionStorage.setItem("jd_loaded", "1");
    setBooting(false);
  };

  // Verificar sesión persistida al arrancar
  useEffect(() => {
    if (booting) return;
    if (authChecked) return;
    let cancelled = false;
    (async () => {
      if (user) {
        try {
          const me: any = await api.get("/auth/me");
          if (!cancelled && me?.user) setUser(me.user);
        } catch {
          // token inválido - se queda sin user
        }
      }
      if (!cancelled) setAuthChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [booting, authChecked, user, setUser]);

  // Decidir vista inicial tras carga
  useEffect(() => {
    if (booting || !authChecked) return;
    if (view !== "loading") return; // ya navegó el usuario
    if (user) navigate("browse");
    else navigate("landing");
  }, [booting, authChecked, user, view, navigate]);

  // Pre-cargar todas las vistas en background para evitar errores de chunk on-demand
  useEffect(() => {
    if (booting) return;
    const timer = setTimeout(() => {
      PRELOAD.forEach((loader) => {
        loader().catch(() => {});
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [booting]);

  if (booting) return <LoadingScreen onDone={onLoadingDone} />;

  const renderView = () => {
    switch (view) {
      case "loading":
        return null;
      case "landing":
        return <LandingView />;
      case "login":
        return <LoginView />;
      case "register":
        return <RegisterView />;
      case "browse":
        return <BrowseView />;
      case "watch":
        return <WatchView />;
      case "search":
        return <SearchView />;
      case "live":
        return <LiveView />;
      case "adult":
        return <AdultView />;
      case "mylist":
        return <MyListView />;
      case "history":
        return <HistoryView />;
      case "profile":
        return <ProfileView />;
      case "subscription":
        return <SubscriptionView />;
      case "admin":
        return <AdminView />;
      default:
        return <BrowseView />;
    }
  };

  // Mostrar profile gate si hay usuario, no estamos en login/register/landing, y no hay perfil activo
  const showProfileGate =
    user &&
    authChecked &&
    !activeProfile &&
    !["loading", "landing", "login", "register"].includes(view);

  return (
    <div className="flex min-h-screen flex-col">
      <ErrorBoundary>
        <Suspense fallback={<ViewSkeleton />}>
          {showProfileGate ? <ProfileGate /> : renderView()}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
