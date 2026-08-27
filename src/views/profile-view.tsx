"use client";
import { useQuery } from "@tanstack/react-query";
import { useNav } from "@/lib/nav-store";
import { useAuth, type AuthUser } from "@/lib/auth-store";
import { api, apiFetch, ApiError } from "@/lib/api-client";
import { Plan, Payment } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  User as UserIcon,
  Mail,
  Crown,
  Calendar,
  Copy,
  Check,
  Shield,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  Edit2,
  Coins,
  CreditCard,
  Sparkles,
  Tv,
  Monitor,
  AlertCircle,
  Eye,
  Heart,
  Star,
  ThumbsUp,
  Clock,
  Loader2,
  Link as LinkIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import {
  formatDate,
  formatARS,
  paymentStatusLabel,
  subscriptionStatusLabel,
} from "@/lib/format";

interface PaymentsResponse {
  items: (Payment & {
    subscription?: { plan: Plan } | null;
  })[];
}

interface SubStatusResponse {
  hasSubscription: boolean;
  active: boolean;
  subscription: {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    autoRenew: boolean;
    daysLeft: number;
    plan?: Plan;
  } | null;
}

interface UserStats {
  watchlistCount: number;
  historyCount: number;
  reviewsCount: number;
  reactionsCount: number;
  totalMinutesWatched: number;
  favoriteGenre: string | null;
  memberSince: string;
}

interface UserStatsResponse {
  stats: UserStats;
}

function formatMinutesWatched(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return "0m";
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatMemberSince(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("es-AR", {
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function StatTile({
  icon,
  iconClass,
  value,
  label,
}: {
  icon: ReactNode;
  iconClass: string;
  value: string;
  label: string;
}) {
  return (
    <div className="break-words rounded-lg border border-border/60 bg-background/40 p-4 transition-colors hover:border-primary/40">
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${iconClass}`}
      >
        {icon}
      </div>
      <p className="text-lg font-black leading-tight text-white sm:text-xl">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function ProfileView() {
  const { navigate } = useNav();
  const { user, setUser, logout } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editAvatar, setEditAvatar] = useState(user?.avatar || "");
  const [savingEdit, setSavingEdit] = useState(false);
  const [verifyingAdult, setVerifyingAdult] = useState(false);

  // Estado de suscripción fresco
  const { data: subData, isLoading: subLoading } = useQuery<SubStatusResponse>({
    queryKey: ["subscription-status"],
    queryFn: () => api.get<SubStatusResponse>("/subscriptions/status"),
    staleTime: 30 * 1000,
  });

  // Historial de pagos
  const { data: paymentsData, isLoading: paymentsLoading } =
    useQuery<PaymentsResponse>({
      queryKey: ["payments"],
      queryFn: () => api.get<PaymentsResponse>("/payments?limit=20"),
      staleTime: 30 * 1000,
    });

  // Estadísticas del usuario
  const { data: statsData, isLoading: statsLoading } =
    useQuery<UserStatsResponse>({
      queryKey: ["user", "stats"],
      queryFn: () => api.get<UserStatsResponse>("/user/stats"),
      staleTime: 60 * 1000,
    });

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader />
        <main className="flex flex-1 flex-col items-center justify-center px-4 pb-20 pt-20 text-center">
          <p className="text-muted-foreground">
            Necesitás iniciar sesión para ver tu perfil.
          </p>
          <Button className="mt-4" onClick={() => navigate("login")}>
            Iniciar sesión
          </Button>
        </main>
      </div>
    );
  }

  const sub = subData?.subscription;
  const isActive = subData?.active === true;
  const daysLeft = sub?.daysLeft ?? 0;
  // Progreso de la suscripción: días transcurridos sobre el total
  const subProgress = (() => {
    if (!sub || !sub.plan) return 0;
    const plan = sub.plan;
    const totalDays = plan.durationDays || 30;
    const elapsed = Math.max(0, totalDays - daysLeft);
    const pct = totalDays > 0 ? (elapsed / totalDays) * 100 : 0;
    return Math.min(100, Math.max(0, Math.round(pct)));
  })();

  const payments = paymentsData?.items || [];
  const stats = statsData?.stats;

  const copyToken = async () => {
    const token = user.token || user.accessToken || "";
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast({ title: "Token copiado ✓" });
    } catch {
      toast({
        title: "No se pudo copiar",
        description: "Copiá el token manualmente.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    toast({ title: "Sesión cerrada" });
    navigate("landing");
  };

  const handleSaveEdit = async () => {
    const trimmedName = editName.trim();
    if (trimmedName.length < 2) {
      toast({
        title: "Nombre inválido",
        description: "El nombre debe tener al menos 2 caracteres.",
        variant: "destructive",
      });
      return;
    }
    setSavingEdit(true);
    try {
      const trimmedAvatar = editAvatar.trim();
      const res = await api.put<{ user: AuthUser }>("/auth/me", {
        name: trimmedName,
        avatar: trimmedAvatar || null,
      });
      setUser(res.user);
      setSavingEdit(false);
      setEditOpen(false);
      toast({ title: "Perfil actualizado ✓" });
    } catch (e: any) {
      setSavingEdit(false);
      const message =
        e instanceof ApiError ? e.message : "No se pudo actualizar el perfil";
      toast({
        title: "Error al guardar",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleVerifyAdult = async () => {
    setVerifyingAdult(true);
    try {
      const res = await apiFetch<{ user: AuthUser }>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ adultVerified: true }),
      });
      setUser(res.user);
      toast({ title: "Verificación +18 activada ✓" });
    } catch (e: any) {
      const message =
        e instanceof ApiError ? e.message : "No se pudo verificar";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setVerifyingAdult(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex-1">
        <div className="view-enter mx-auto max-w-4xl px-4 pb-20 pt-20 sm:px-6 md:pb-8 lg:px-8">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <h1 className="flex items-center gap-2 text-2xl font-black sm:text-3xl">
              <UserIcon className="h-6 w-6 text-primary" />
              <span className="text-gradient-red">Mi Perfil</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gestioná tu cuenta, suscripción y métodos de acceso.
            </p>
          </motion.div>

          {/* User info card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <Card className="card-hover border-border/60 bg-card/60 backdrop-blur">
              <CardContent className="flex flex-col items-center gap-5 p-5 sm:flex-row sm:p-6">
                <Avatar className="h-20 w-20 border-2 border-primary/40 sm:h-24 sm:w-24">
                  {user.avatar ? (
                    <AvatarImage src={user.avatar} alt={user.name} />
                  ) : null}
                  <AvatarFallback className="bg-primary/20 text-2xl font-black text-primary sm:text-3xl">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h2 className="text-xl font-bold text-white sm:text-2xl">
                      {user.name}
                    </h2>
                    {user.role === "ADMIN" && (
                      <Badge className="bg-yellow-600/90 text-white">
                        <Shield className="mr-1 h-3 w-3" /> Admin
                      </Badge>
                    )}
                    {isActive && (
                      <Badge className="bg-primary/90 text-primary-foreground">
                        <Crown className="mr-1 h-3 w-3" /> Premium
                      </Badge>
                    )}
                    {!user.adultVerified && (
                      <Badge variant="outline" className="border-yellow-600/50 text-yellow-500">
                        <ShieldAlert className="mr-1 h-3 w-3" /> No verificado +18
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 flex flex-col items-center gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-3">
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> {user.email}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground/80">
                    Miembro desde{" "}
                    {user.subscription?.endDate
                      ? formatDate(user.subscription.endDate)
                      : "recientemente"}
                  </div>
                </div>

                <div className="flex gap-2 sm:flex-col">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditName(user.name);
                      setEditAvatar(user.avatar || "");
                      setEditOpen(true);
                    }}
                  >
                    <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="text-destructive hover:text-destructive"
                  >
                    <LogOut className="mr-1.5 h-3.5 w-3.5" />
                    Salir
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08 }}
            className="mt-4"
          >
            <Card className="card-hover border-border/60 bg-card/60 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Mis Estadísticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-border/60 bg-background/40 p-4"
                      >
                        <Skeleton className="mb-3 h-10 w-10 rounded-full" />
                        <Skeleton className="h-6 w-12" />
                        <Skeleton className="mt-1 h-3 w-16" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    <StatTile
                      icon={<Eye className="h-5 w-5" />}
                      iconClass="bg-primary/15 text-primary"
                      value={String(stats?.historyCount ?? 0)}
                      label="Películas vistas"
                    />
                    <StatTile
                      icon={<Heart className="h-5 w-5" />}
                      iconClass="bg-rose-500/15 text-rose-400"
                      value={String(stats?.watchlistCount ?? 0)}
                      label="Mi Lista"
                    />
                    <StatTile
                      icon={<Star className="h-5 w-5" />}
                      iconClass="bg-yellow-500/15 text-yellow-500"
                      value={String(stats?.reviewsCount ?? 0)}
                      label="Reseñas"
                    />
                    <StatTile
                      icon={<ThumbsUp className="h-5 w-5" />}
                      iconClass="bg-green-500/15 text-green-500"
                      value={String(stats?.reactionsCount ?? 0)}
                      label="Reacciones"
                    />
                    <StatTile
                      icon={<Clock className="h-5 w-5" />}
                      iconClass="bg-primary/15 text-primary"
                      value={formatMinutesWatched(
                        stats?.totalMinutesWatched ?? 0,
                      )}
                      label="Tiempo mirado"
                    />
                    <StatTile
                      icon={<Sparkles className="h-5 w-5" />}
                      iconClass="bg-rose-500/15 text-rose-400"
                      value={stats?.favoriteGenre ?? "—"}
                      label="Género favorito"
                    />
                    <StatTile
                      icon={<Calendar className="h-5 w-5" />}
                      iconClass="bg-yellow-500/15 text-yellow-500"
                      value={formatMemberSince(stats?.memberSince)}
                      label="Miembro desde"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Grid: subscription + token */}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {/* Subscription status */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card
                className={`h-full border-border/60 bg-card/60 backdrop-blur ${
                  isActive ? "glow-red-sm card-hover" : "card-hover"
                }`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Crown className="h-4 w-4 text-primary" />
                    Suscripción
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-1/2" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ) : isActive && sub ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold text-white">
                            {sub.plan?.name || "Plan"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Estado:{" "}
                            <span className="font-medium text-green-500">
                              {subscriptionStatusLabel(sub.status)}
                            </span>
                          </p>
                        </div>
                        <Badge className="bg-green-600/90 text-white">
                          <Check className="mr-1 h-3 w-3" /> Activa
                        </Badge>
                      </div>

                      {/* Quality + screens */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {sub.plan?.quality && (
                          <span className="flex items-center gap-1 rounded bg-primary/15 px-2 py-1 text-primary">
                            <Sparkles className="h-3 w-3" /> {sub.plan.quality}
                          </span>
                        )}
                        {sub.plan?.screens && (
                          <span className="flex items-center gap-1 rounded bg-secondary px-2 py-1 text-secondary-foreground">
                            <Tv className="h-3 w-3" /> {sub.plan.screens} pantallas
                          </span>
                        )}
                      </div>

                      <Separator />

                      {/* Days left */}
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Días restantes
                          </span>
                          <span className="font-bold text-white">
                            {daysLeft} / {sub.plan?.durationDays ?? 30}
                          </span>
                        </div>
                        <Progress value={subProgress} className="h-2" />
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Vence el {formatDate(sub.endDate)}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => navigate("subscription")}
                      >
                        <Crown className="mr-1.5 h-3.5 w-3.5" />
                        Ver planes / Renovar
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">Sin suscripción activa</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Suscribite para desbloquear todo el catálogo en la mejor
                        calidad, sin anuncios y en múltiples pantallas.
                      </p>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => navigate("subscription")}
                      >
                        <Crown className="mr-1.5 h-4 w-4" />
                        Suscribirse ahora
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Access token */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <Card className="card-hover h-full border-border/60 bg-card/60 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Token de acceso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Usá este token para acceder sin email ni contraseña desde
                    cualquier dispositivo. Mantenelo privado.
                  </p>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2">
                    <code className="flex-1 truncate font-mono text-sm font-bold tracking-wider text-primary">
                      {user.token || user.accessToken || "—"}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyToken}
                      className="shrink-0"
                      aria-label="Copiar token"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="mt-3 rounded-md bg-primary/10 p-2 text-[11px] text-muted-foreground">
                    <Shield className="mb-0.5 mr-1 inline h-3 w-3 text-primary" />
                    Tratá tu token como una contraseña. Si lo compartís, otros
                    podrán acceder a tu cuenta.
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Adult verification note */}
          {!user.adultVerified && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4"
            >
              <Card className="card-hover border-yellow-600/30 bg-yellow-600/5">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <ShieldAlert className="h-6 w-6 shrink-0 text-yellow-500" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-yellow-500">
                      Verificación de adulto pendiente
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Tu cuenta no está verificada como adulto. La sección +18
                      está bloqueada. Confirmá que tenés 18 años o más para
                      desbloquearla.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVerifyAdult}
                    disabled={verifyingAdult}
                    className="shrink-0 border-yellow-600/50 text-yellow-500 hover:bg-yellow-600/10 hover:text-yellow-400"
                  >
                    {verifyingAdult ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {verifyingAdult ? "Verificando..." : "Confirmo que tengo 18+"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Payment history */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-4"
          >
            <Card className="card-hover border-border/60 bg-card/60 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Coins className="h-4 w-4 text-primary" />
                  Historial de pagos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full" />
                    ))}
                  </div>
                ) : payments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Monitor className="mb-2 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      Aún no tenés pagos registrados.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => navigate("subscription")}
                    >
                      Ver planes
                    </Button>
                  </div>
                ) : (
                  <div className="max-h-96 space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin]">
                    {payments.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/40 p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {p.subscription?.plan?.name || "Suscripción"}
                            </p>
                            <Badge
                              variant={
                                p.status === "APPROVED"
                                  ? "default"
                                  : p.status === "PENDING"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className={
                                p.status === "APPROVED"
                                  ? "bg-green-600/90 text-white"
                                  : ""
                              }
                            >
                              {paymentStatusLabel(p.status)}
                            </Badge>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(p.createdAt)}
                            </span>
                            <span>·</span>
                            <span className="uppercase">{p.method}</span>
                            {p.mercadopagoId && (
                              <>
                                <span>·</span>
                                <span className="truncate font-mono">
                                  {String(p.mercadopagoId).slice(0, 12)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-white">
                            {formatARS(p.amount, p.currency)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      <AppFooter />

      {/* Edit profile dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>
              Actualizá tu nombre visible y tu avatar. Los cambios se guardan
              en tu cuenta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Tu nombre"
                maxLength={50}
                minLength={2}
                disabled={savingEdit}
                autoComplete="name"
              />
              <p className="text-[11px] text-muted-foreground">
                Mínimo 2 caracteres.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-avatar">URL de avatar (opcional)</Label>
              <div className="relative">
                <LinkIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="edit-avatar"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="https://...jpg"
                  maxLength={500}
                  disabled={savingEdit}
                  className="pl-8"
                  autoComplete="url"
                  type="url"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Pegá una URL de imagen. Si lo dejás vacío, se usa la inicial.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={savingEdit}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={
                savingEdit || editName.trim().length < 2
              }
            >
              {savingEdit ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="mr-1.5 h-4 w-4" />
                  Guardar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProfileView;
