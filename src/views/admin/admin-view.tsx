"use client";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  Film,
  Tv,
  CreditCard,
  Wallet,
  Repeat,
  Settings,
  Plus,
  Pencil,
  Trash2,
  Search,
  Menu,
  ArrowLeft,
  Shield,
  Crown,
  TrendingUp,
  Eye,
  DollarSign,
  UserPlus,
  Save,
  X,
  Upload,
  Download,
  Ban,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Star,
  Flame,
} from "lucide-react";

import { useNav } from "@/lib/nav-store";
import { useAuth } from "@/lib/auth-store";
import { api, ApiError } from "@/lib/api-client";
import { uploadFile } from "@/lib/upload";
import { useToast } from "@/hooks/use-toast";
import type { Content, Channel, Plan } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

/* =========================================================================
   Types
   ========================================================================= */

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  totalContent: number;
  totalChannels: number;
  totalViews: number;
  recentSignups: number;
  totalApprovedPayments: number;
  revenueByPlan: Array<{ name: string; total: number; count: number }>;
  monthlyRevenue: Array<{ label: string; total: number; count: number }>;
  activeSubsByPlan: Array<{ name: string; count: number }>;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string | null;
  banned: boolean;
  adultVerified: boolean;
  token: string | null;
  createdAt: string;
  updatedAt?: string;
  subscription?: {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    autoRenew?: boolean;
    plan?: { id: string; name: string; price: number; currency: string } | null;
  } | null;
}

interface AdminPayment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  mercadopagoId: string | null;
  createdAt: string;
  user?: { id: string; email: string; name: string } | null;
  subscription?: { plan?: { name: string } | null } | null;
}

interface AdminSubscription {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  createdAt: string;
  user?: { id: string; email: string; name: string } | null;
  plan?: { id: string; name: string; price: number; currency: string } | null;
}

interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type Section =
  | "dashboard"
  | "users"
  | "content"
  | "channels"
  | "plans"
  | "payments"
  | "subscriptions"
  | "settings";

/* =========================================================================
   Constants
   ========================================================================= */

const SECTIONS: Array<{
  id: Section;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Usuarios", icon: Users },
  { id: "content", label: "Contenido", icon: Film },
  { id: "channels", label: "Canales", icon: Tv },
  { id: "plans", label: "Planes", icon: CreditCard },
  { id: "payments", label: "Pagos", icon: Wallet },
  { id: "subscriptions", label: "Suscripciones", icon: Repeat },
  { id: "settings", label: "Ajustes", icon: Settings },
];

const CONTENT_TYPES = [
  { value: "MOVIE", label: "Película" },
  { value: "SERIES", label: "Serie" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "MP4", label: "MP4" },
];

const AGE_RATINGS = ["ATP", "+7", "+13", "+16", "+18"];

const PAYMENT_STATUSES = [
  { value: "PENDING", label: "Pendiente", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { value: "APPROVED", label: "Aprobado", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  { value: "REJECTED", label: "Rechazado", color: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
  { value: "CANCELLED", label: "Cancelado", color: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
];

const SUB_STATUSES = [
  { value: "ACTIVE", label: "Activa", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  { value: "EXPIRED", label: "Vencida", color: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
  { value: "CANCELLED", label: "Cancelada", color: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
  { value: "PENDING", label: "Pendiente", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
];

const CHART_COLORS = ["#E50914", "#f59e0b", "#10b981", "#3b82f6", "#a855f7", "#ec4899"];

/* =========================================================================
   Helpers
   ========================================================================= */

function formatCurrency(amount: number, currency = "ARS"): string {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  } catch {
    return `$${(amount || 0).toFixed(0)}`;
  }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function statusMeta(status: string) {
  return (
    PAYMENT_STATUSES.find((s) => s.value === status.toUpperCase()) ||
    SUB_STATUSES.find((s) => s.value === status.toUpperCase()) || {
      value: status,
      label: status,
      color: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    }
  );
}

function downloadCsv(filename: string, rows: Array<Record<string, any>>) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = v == null ? "" : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function featuresToString(features: string): string {
  // features viene como JSON string array
  try {
    const arr = JSON.parse(features);
    if (Array.isArray(arr)) return arr.join("\n");
    return features;
  } catch {
    return features || "";
  }
}

function stringToFeatures(s: string): string {
  const arr = s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return JSON.stringify(arr);
}

/* =========================================================================
   Small UI primitives
   ========================================================================= */

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: "primary" | "emerald" | "amber" | "violet";
}) {
  const accentMap: Record<string, string> = {
    primary: "from-primary/20 to-primary/0 text-primary",
    emerald: "from-emerald-500/20 to-emerald-500/0 text-emerald-400",
    amber: "from-amber-500/20 to-amber-500/0 text-amber-400",
    violet: "from-violet-500/20 to-violet-500/0 text-violet-400",
  };
  return (
    <Card className="relative overflow-hidden border-border/60 bg-card/40">
      <div
        className={cn(
          "pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br blur-2xl",
          accentMap[accent]
        )}
      />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          </div>
          <div className={cn("rounded-xl bg-muted/40 p-2.5", accentMap[accent].split(" ").pop())}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-bold text-white sm:text-2xl">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function TableSkeleton({ cols = 5, rows = 6 }: { cols?: number; rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, hint }: { icon: React.ComponentType<{ className?: string }>; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="rounded-full bg-muted/40 p-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ConfirmDelete({
  open,
  onOpenChange,
  title = "Eliminar",
  description = "¿Estás seguro? Esta acción no se puede deshacer.",
  confirmText = "Eliminar",
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  description?: string;
  confirmText?: string;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Eliminando..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta(status);
  return (
    <Badge variant="outline" className={cn("border", meta.color)}>
      {meta.label}
    </Badge>
  );
}

/* =========================================================================
   Upload button (thumbnail/banner/logo)
   ========================================================================= */

function UploadField({
  label,
  value,
  onChange,
  accept = "image/*",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
}) {
  const { toast } = useToast();
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onChange(url);
      toast({ title: "Archivo subido" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          title="Subir archivo"
        >
          {uploading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onFile}
          className="hidden"
        />
      </div>
      {value && (
        <div className="mt-1 h-16 w-28 overflow-hidden rounded-md border border-border bg-muted/20">
          <img src={value} alt="" className="h-full w-full object-cover" />
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   DASHBOARD
   ========================================================================= */

function DashboardSection() {
  const { data, isLoading, isError } = useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: () => api.get<AdminStats>("/admin/stats"),
  });

  if (isLoading)
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );

  if (isError || !data)
    return (
      <EmptyState icon={LayoutDashboard} title="No se pudieron cargar las estadísticas" hint="Intentá recargar la página." />
    );

  const monthly = data.monthlyRevenue.map((m) => ({ name: m.label, total: m.total, count: m.count }));
  const byPlan = data.revenueByPlan.map((p) => ({ name: p.name, total: p.total, count: p.count }));
  const subsByPlan = data.activeSubsByPlan.map((p) => ({ name: p.name, value: p.count }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={Users} label="Usuarios" value={data.totalUsers} hint={`${data.recentSignups} nuevos (7 días)`} />
        <StatCard icon={Crown} label="Suscripciones activas" value={data.activeSubscriptions} accent="amber" />
        <StatCard icon={DollarSign} label="Ingresos totales" value={formatCurrency(data.totalRevenue)} accent="emerald" hint={`${data.totalApprovedPayments} pagos aprobados`} />
        <StatCard icon={Film} label="Contenido" value={data.totalContent} accent="violet" />
        <StatCard icon={Eye} label="Vistas totales" value={data.totalViews.toLocaleString("es-AR")} />
        <StatCard icon={Tv} label="Canales" value={data.totalChannels} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Ingresos mensuales (6 meses)
            </CardTitle>
            <CardDescription>Evolución de los pagos aprobados por mes.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E50914" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#E50914" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v).replace(/\,\d+/, "")} />
                <Tooltip
                  contentStyle={{ background: "#0a0a0a", border: "1px solid #27272a", borderRadius: 8, color: "#fff" }}
                  formatter={(v: any) => [formatCurrency(v), "Ingresos"]}
                />
                <Area type="monotone" dataKey="total" stroke="#E50914" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-primary" />
              Ingresos por plan
            </CardTitle>
            <CardDescription>Distribución de ingresos aprobados por tipo de suscripción.</CardDescription>
          </CardHeader>
          <CardContent>
            {byPlan.length === 0 ? (
              <EmptyState icon={CreditCard} title="Sin datos aún" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byPlan} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v).replace(/\,\d+/, "")} />
                  <Tooltip
                    cursor={{ fill: "#ffffff08" }}
                    contentStyle={{ background: "#0a0a0a", border: "1px solid #27272a", borderRadius: 8, color: "#fff" }}
                    formatter={(v: any) => [formatCurrency(v), "Ingresos"]}
                  />
                  <Bar dataKey="total" fill="#E50914" radius={[6, 6, 0, 0]} maxBarSize={64} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="h-4 w-4 text-primary" />
              Suscripciones activas por plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subsByPlan.length === 0 ? (
              <EmptyState icon={Crown} title="Sin suscripciones activas" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={subsByPlan} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={3}>
                    {subsByPlan.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12, color: "#a1a1aa" }} />
                  <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #27272a", borderRadius: 8, color: "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/40 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-4 w-4 text-primary" />
              Registros recientes
            </CardTitle>
            <CardDescription>Usuarios nuevos en los últimos 7 días.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className="text-5xl font-black text-primary">{data.recentSignups}</div>
              <div className="mb-1 text-sm text-muted-foreground">
                nuevos usuarios en la última semana
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MiniStat label="Pagos aprobados" value={String(data.totalApprovedPayments)} />
              <MiniStat label="Suscripciones activas" value={String(data.activeSubscriptions)} />
              <MiniStat label="Ingresos totales" value={formatCurrency(data.totalRevenue)} />
              <MiniStat label="Vistas totales" value={data.totalViews.toLocaleString("es-AR")} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/10 p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

/* =========================================================================
   USUARIOS
   ========================================================================= */

function UsersSection() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const limit = 20;

  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const queryKey = React.useMemo(
    () => ["admin", "users", { page, search: debouncedSearch }],
    [page, debouncedSearch]
  );

  const { data, isLoading } = useQuery<ListResponse<AdminUser>>({
    queryKey,
    queryFn: () =>
      api.get<ListResponse<AdminUser>>(
        `/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(debouncedSearch)}`
      ),
    placeholderData: (prev) => prev,
  });

  const updateUser = useMutation({
    mutationFn: (vars: { id: string; body: Partial<AdminUser> }) =>
      api.put(`/admin/users/${vars.id}`, vars.body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast({ title: "Usuario eliminado" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const [editing, setEditing] = React.useState<AdminUser | null>(null);
  const [deleting, setDeleting] = React.useState<AdminUser | null>(null);

  const users = data?.items || [];
  const totalPages = data?.totalPages || 1;

  const toggleField = async (u: AdminUser, field: "banned" | "adultVerified", value: boolean) => {
    // optimista: invalidamos igual, pero mostramos toast primero
    try {
      await updateUser.mutateAsync({ id: u.id, body: { [field]: value } });
      toast({ title: value ? `${field === "banned" ? "Usuario baneado" : "Verificación +18 activada"}` : `${field === "banned" ? "Ban removido" : "Verificación +18 desactivada"}` });
    } catch {
      // error ya manejado
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Usuarios"
        description={`${data?.total || 0} usuarios registrados en la plataforma.`}
        action={
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        }
      />

      <Card className="border-border/60 bg-card/40">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton cols={6} />
            </div>
          ) : users.length === 0 ? (
            <EmptyState icon={Users} title="Sin usuarios" hint="Probá con otra búsqueda." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Suscripción</TableHead>
                  <TableHead>Baneado</TableHead>
                  <TableHead>+18</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-border">
                          <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">
                            {u.name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">{u.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatShortDate(u.createdAt)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          u.role === "ADMIN"
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-border bg-muted/30 text-muted-foreground"
                        }
                      >
                        {u.role === "ADMIN" ? "ADMIN" : "USER"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.subscription ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">
                            {u.subscription.plan?.name || "—"}
                          </span>
                          <StatusBadge status={u.subscription.status} />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin suscripción</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={u.banned}
                        onCheckedChange={(v) => toggleField(u, "banned", v)}
                        disabled={updateUser.isPending}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={u.adultVerified}
                        onCheckedChange={(v) => toggleField(u, "adultVerified", v)}
                        disabled={updateUser.isPending}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditing(u)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleting(u)}
                          title="Eliminar"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <PaginationRow page={page} totalPages={totalPages} onChange={setPage} />
      )}

      <UserEditDialog
        user={editing}
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        onSaved={() => {
          setEditing(null);
        }}
      />

      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Eliminar usuario"
        description={`¿Eliminar a "${deleting?.name}" (${deleting?.email})? Se borrarán sus suscripciones y pagos asociados.`}
        loading={deleteUser.isPending}
        onConfirm={async () => {
          await deleteUser.mutateAsync(deleting!.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}

function UserEditDialog({
  user,
  open,
  onOpenChange,
  onSaved,
}: {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState("USER");
  const [banned, setBanned] = React.useState(false);
  const [adultVerified, setAdultVerified] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setName(user.name || "");
      setRole(user.role || "USER");
      setBanned(user.banned || false);
      setAdultVerified(user.adultVerified || false);
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: () =>
      api.put(`/admin/users/${user!.id}`, { name, role, banned, adultVerified }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      toast({ title: "Usuario actualizado" });
      onSaved();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogDescription>
            Modificá los datos, rol y permisos de {user?.email}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled className="bg-muted/30" />
          </div>
          <div className="space-y-1.5">
            <Label>Rol</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">Usuario</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/10 p-3">
              <div className="flex items-center gap-2">
                <Ban className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Baneado</p>
                  <p className="text-xs text-muted-foreground">No puede iniciar sesión</p>
                </div>
              </div>
              <Switch checked={banned} onCheckedChange={setBanned} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/10 p-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Verificado +18</p>
                  <p className="text-xs text-muted-foreground">Acceso a contenido adulto</p>
                </div>
              </div>
              <Switch checked={adultVerified} onCheckedChange={setAdultVerified} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !name.trim()}>
            {mutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* =========================================================================
   CONTENIDO
   ========================================================================= */

const EMPTY_CONTENT: Partial<Content> = {
  title: "",
  description: "",
  type: "MOVIE",
  url: "",
  thumbnail: "",
  banner: "",
  logo: "",
  category: "Película" as string,
  genre: "",
  year: null,
  duration: null,
  rating: 0,
  ageRating: "ATP",
  isAdult: false,
  featured: false,
  trending: false,
  trailerUrl: "",
};

function ContentSection() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL");
  const [adultFilter, setAdultFilter] = React.useState<string>("ALL");

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const params = new URLSearchParams({ limit: "100", page: "1" });
  if (debounced) params.set("search", debounced);
  if (typeFilter !== "ALL") params.set("type", typeFilter);
  if (adultFilter !== "ALL") params.set("isAdult", adultFilter);

  const { data, isLoading } = useQuery<ListResponse<Content>>({
    queryKey: ["admin", "content", { debounced, typeFilter, adultFilter }],
    queryFn: () => api.get<ListResponse<Content>>(`/admin/content?${params.toString()}`),
  });

  const deleteContent = useMutation({
    mutationFn: (id: string) => api.delete(`/content/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "content"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      qc.invalidateQueries({ queryKey: ["content"] });
      toast({ title: "Contenido eliminado" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const [editing, setEditing] = React.useState<Content | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Content | null>(null);

  const items = data?.items || [];

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Contenido"
        description={`${data?.total || 0} títulos en la plataforma.`}
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Agregar contenido
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los tipos</SelectItem>
            {CONTENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={adultFilter} onValueChange={setAdultFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Adulto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todo el contenido</SelectItem>
            <SelectItem value="false">Sin adulto</SelectItem>
            <SelectItem value="true">Solo adulto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/60 bg-card/40">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton cols={5} />
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={Film} title="Sin contenido" hint="Agregá tu primer título." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Año</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="h-12 w-20 overflow-hidden rounded-md bg-muted/20">
                        {c.thumbnail ? (
                          <img src={c.thumbnail} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-white">{c.title}</p>
                      <p className="line-clamp-1 max-w-xs text-xs text-muted-foreground">
                        {c.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-border bg-muted/30">
                        {c.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.category || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.year || "—"}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm">
                        <Star className="h-3.5 w-3.5 text-amber-400" />
                        {(c.rating || 0).toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.featured && (
                          <Badge className="bg-primary/15 text-primary" variant="secondary">
                            Destacado
                          </Badge>
                        )}
                        {c.trending && (
                          <Badge className="bg-amber-500/15 text-amber-400" variant="secondary">
                            <Flame className="mr-1 h-3 w-3" />
                            Tendencia
                          </Badge>
                        )}
                        {c.isAdult && (
                          <Badge className="bg-rose-500/15 text-rose-400" variant="secondary">
                            +18
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditing(c)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleting(c)}
                          title="Eliminar"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ContentFormDialog
        open={creating}
        onOpenChange={setCreating}
        content={null}
      />
      <ContentFormDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        content={editing}
      />

      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Eliminar contenido"
        description={`¿Eliminar "${deleting?.title}"? Esta acción no se puede deshacer.`}
        loading={deleteContent.isPending}
        onConfirm={async () => {
          await deleteContent.mutateAsync(deleting!.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}

function ContentFormDialog({
  open,
  onOpenChange,
  content,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  content: Content | null;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const isEdit = !!content;

  const [form, setForm] = React.useState<Partial<Content>>(EMPTY_CONTENT);
  const [yearStr, setYearStr] = React.useState("");
  const [durationStr, setDurationStr] = React.useState("");
  const [ratingStr, setRatingStr] = React.useState("0");

  React.useEffect(() => {
    if (open) {
      const src = content || EMPTY_CONTENT;
      setForm({ ...src });
      setYearStr(src.year ? String(src.year) : "");
      setDurationStr(src.duration ? String(src.duration) : "");
      setRatingStr(src.rating != null ? String(src.rating) : "0");
    }
  }, [open, content]);

  const set = <K extends keyof Content>(k: K, v: Content[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => {
      const payload: any = {
        ...form,
        year: yearStr ? Number(yearStr) : null,
        duration: durationStr ? Number(durationStr) : null,
        rating: ratingStr ? Number(ratingStr) : 0,
        trailerUrl: form.trailerUrl || null,
      };
      if (isEdit) return api.put(`/content/${content!.id}`, payload);
      return api.post(`/content`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "content"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      qc.invalidateQueries({ queryKey: ["content"] });
      toast({ title: isEdit ? "Contenido actualizado" : "Contenido creado" });
      onOpenChange(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar contenido" : "Agregar contenido"}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Modificando "${content?.title}"` : "Completá los datos del nuevo título."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Título *</Label>
            <Input value={form.title || ""} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Descripción</Label>
            <Textarea
              rows={3}
              value={form.description || ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo *</Label>
            <Select value={form.type} onValueChange={(v) => set("type", v as Content["type"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Calificación por edad</Label>
            <Select value={form.ageRating || "ATP"} onValueChange={(v) => set("ageRating", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGE_RATINGS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>URL del video *</Label>
            <Input
              value={form.url || ""}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://... | /uploads/... | m3u8 | youtube"
            />
          </div>
          <UploadField label="Thumbnail" value={form.thumbnail || ""} onChange={(v) => set("thumbnail", v)} />
          <UploadField label="Banner" value={form.banner || ""} onChange={(v) => set("banner", v)} />
          <UploadField label="Logo" value={form.logo || ""} onChange={(v) => set("logo", v)} />
          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <Input value={form.category || ""} onChange={(e) => set("category", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Género</Label>
            <Input value={form.genre || ""} onChange={(e) => set("genre", e.target.value)} placeholder="Acción, Drama..." />
          </div>
          <div className="space-y-1.5">
            <Label>Año</Label>
            <Input
              type="number"
              value={yearStr}
              onChange={(e) => setYearStr(e.target.value)}
              placeholder="2024"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Duración (min)</Label>
            <Input
              type="number"
              value={durationStr}
              onChange={(e) => setDurationStr(e.target.value)}
              placeholder="120"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Rating (0-10)</Label>
            <Input type="number" step="0.1" value={ratingStr} onChange={(e) => setRatingStr(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>URL del trailer</Label>
            <Input
              value={form.trailerUrl || ""}
              onChange={(e) => set("trailerUrl", e.target.value)}
              placeholder="https://youtube.com/..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:col-span-2">
            <ToggleRow label="Contenido +18" desc="Requiere verificación de edad" checked={!!form.isAdult} onChange={(v) => set("isAdult", v)} />
            <ToggleRow label="Destacado" desc="Aparece en el hero / destacados" checked={!!form.featured} onChange={(v) => set("featured", v)} />
            <ToggleRow label="Tendencia" desc="Se muestra en tendencia" checked={!!form.trending} onChange={(v) => set("trending", v)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.title || !form.url}>
            {mutation.isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear contenido"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/10 p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/* =========================================================================
   CANALES
   ========================================================================= */

function ChannelsSection() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const params = new URLSearchParams({ limit: "200" });
  if (debounced) params.set("search", debounced);

  const { data, isLoading } = useQuery<ListResponse<Channel>>({
    queryKey: ["admin", "channels", debounced],
    queryFn: () => api.get<ListResponse<Channel>>(`/channels?${params.toString()}`),
  });

  const deleteChannel = useMutation({
    mutationFn: (id: string) => api.delete(`/channels/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "channels"] });
      qc.invalidateQueries({ queryKey: ["channels"] });
      toast({ title: "Canal eliminado" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const [creating, setCreating] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [editing, setEditing] = React.useState<Channel | null>(null);
  const [deleting, setDeleting] = React.useState<Channel | null>(null);

  const items = data?.items || [];

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Canales"
        description={`${data?.total || 0} canales en vivo.`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImporting(true)}>
              <Download className="h-4 w-4" />
              Importar m3u
            </Button>
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              Agregar canal
            </Button>
          </div>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar canales..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 sm:max-w-md"
        />
      </div>

      <Card className="border-border/60 bg-card/40">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton cols={5} />
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={Tv} title="Sin canales" hint="Agregá un canal o importá una lista m3u." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>+18</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="h-9 w-9 overflow-hidden rounded-md bg-muted/20">
                        {c.logo ? (
                          <img src={c.logo} alt="" className="h-full w-full object-contain" />
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-white">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.views || 0} vistas</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.category || "—"}</TableCell>
                    <TableCell>
                      <span className="block max-w-[220px] truncate text-xs text-muted-foreground" title={c.url}>
                        {c.url}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={c.isAdult}
                        onCheckedChange={async (v) => {
                          try {
                            await api.put(`/channels/${c.id}`, { isAdult: v });
                            qc.invalidateQueries({ queryKey: ["admin", "channels"] });
                            toast({ title: "Canal actualizado" });
                          } catch (err: any) {
                            toast({ title: "Error", description: err.message, variant: "destructive" });
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={c.active}
                        onCheckedChange={async (v) => {
                          try {
                            await api.put(`/channels/${c.id}`, { active: v });
                            qc.invalidateQueries({ queryKey: ["admin", "channels"] });
                            toast({ title: "Canal actualizado" });
                          } catch (err: any) {
                            toast({ title: "Error", description: err.message, variant: "destructive" });
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditing(c)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleting(c)}
                          title="Eliminar"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ChannelFormDialog open={creating} onOpenChange={setCreating} channel={null} />
      <ChannelFormDialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)} channel={editing} />

      <PlaylistImportDialog open={importing} onOpenChange={setImporting} />

      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
        title="Eliminar canal"
        description={`¿Eliminar el canal "${deleting?.name}"?`}
        loading={deleteChannel.isPending}
        onConfirm={async () => {
          await deleteChannel.mutateAsync(deleting!.id);
          setDeleting(null);
        }}
      />
    </div>
  );
}

// pequeño wrapper para evitar un typo en el table head anterior
// (no usado, mantenido por compatibilidad interna)

function ChannelFormDialog({
  open,
  onOpenChange,
  channel,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  channel: Channel | null;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const isEdit = !!channel;
  const [form, setForm] = React.useState<Partial<Channel>>({});

  React.useEffect(() => {
    if (open) {
      setForm(
        channel || { name: "", url: "", logo: "", category: "General", isAdult: false, active: true }
      );
    }
  }, [open, channel]);

  const mutation = useMutation({
    mutationFn: () => {
      if (isEdit) return api.put(`/channels/${channel!.id}`, form);
      return api.post(`/channels`, form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "channels"] });
      qc.invalidateQueries({ queryKey: ["channels"] });
      toast({ title: isEdit ? "Canal actualizado" : "Canal creado" });
      onOpenChange(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar canal" : "Agregar canal"}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Modificando "${channel?.name}"` : "Configurá un canal de streaming en vivo."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>URL del stream *</Label>
            <Input
              value={form.url || ""}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://.../playlist.m3u8"
            />
          </div>
          <UploadField label="Logo" value={form.logo || ""} onChange={(v) => setForm((f) => ({ ...f, logo: v }))} />
          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <Input value={form.category || ""} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ToggleRow label="Contenido +18" checked={!!form.isAdult} onChange={(v) => setForm((f) => ({ ...f, isAdult: v }))} />
            <ToggleRow label="Activo" checked={form.active ?? true} onChange={(v) => setForm((f) => ({ ...f, active: v }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name || !form.url}>
            {mutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlaylistImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [mode, setMode] = React.useState<"url" | "content">("url");
  const [playlistUrl, setPlaylistUrl] = React.useState("");
  const [playlistContent, setPlaylistContent] = React.useState("");
  const [preview, setPreview] = React.useState<Array<{ name: string; url: string; category: string; isAdult: boolean }>>([]);

  React.useEffect(() => {
    if (!open) {
      setMode("url");
      setPlaylistUrl("");
      setPlaylistContent("");
      setPreview([]);
    }
  }, [open]);

  // previsualización local del contenido pegado
  React.useEffect(() => {
    if (mode !== "content") {
      setPreview([]);
      return;
    }
    const text = playlistContent || "";
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsed: Array<{ name: string; url: string; category: string; isAdult: boolean }> = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.toUpperCase().startsWith("#EXTINF")) continue;
      const logoM = line.match(/tvg-logo="([^"]*)"/i);
      const groupM = line.match(/group-title="([^"]*)"/i);
      const category = groupM ? groupM[1] : "General";
      const comma = line.lastIndexOf(",");
      const name = comma >= 0 ? line.slice(comma + 1).trim() : "Canal sin nombre";
      let urlLine = "";
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].startsWith("#")) continue;
        urlLine = lines[j];
        break;
      }
      if (!urlLine) continue;
      const lower = (name + " " + category).toLowerCase();
      const isAdult = /xxx|adult|\+18|adultos/.test(lower);
      parsed.push({ name, url: urlLine, category, isAdult });
    }
    setPreview(parsed.slice(0, 50));
  }, [mode, playlistContent]);

  const mutation = useMutation({
    mutationFn: () => {
      const body = mode === "url" ? { playlistUrl } : { playlistContent };
      return api.post(`/channels`, body);
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["admin", "channels"] });
      qc.invalidateQueries({ queryKey: ["channels"] });
      toast({ title: `${data?.imported || 0} canales importados` });
      onOpenChange(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar lista m3u / m3u8</DialogTitle>
          <DialogDescription>
            Importá una playlist de canales desde una URL o pegando el contenido.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={mode === "url" ? "default" : "outline"}
              onClick={() => setMode("url")}
            >
              Desde URL
            </Button>
            <Button
              size="sm"
              variant={mode === "content" ? "default" : "outline"}
              onClick={() => setMode("content")}
            >
              Pegar contenido
            </Button>
          </div>

          {mode === "url" ? (
            <div className="space-y-1.5">
              <Label>URL de la playlist</Label>
              <Input
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                placeholder="https://.../lista.m3u8"
              />
              <p className="text-xs text-muted-foreground">
                El servidor descargará y parseará la playlist automáticamente.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Contenido de la playlist</Label>
              <Textarea
                rows={8}
                value={playlistContent}
                onChange={(e) => setPlaylistContent(e.target.value)}
                placeholder={"#EXTM3U\n#EXTINF:-1 tvg-logo=\"...\" group-title=\"Noticias\",Canal Ejemplo\nhttps://.../stream.m3u8"}
                className="font-mono text-xs"
              />
              {preview.length > 0 && (
                <div className="rounded-lg border border-border bg-muted/10 p-2">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Previsualización ({preview.length} canales detectados{preview.length === 50 ? "+" : ""})
                  </p>
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {preview.map((p, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 rounded px-2 py-1 text-xs hover:bg-muted/20">
                        <span className="truncate text-foreground">{p.name}</span>
                        <div className="flex shrink-0 gap-1">
                          <Badge variant="outline" className="border-border text-[10px]">
                            {p.category}
                          </Badge>
                          {p.isAdult && (
                            <Badge className="bg-rose-500/15 text-rose-400 text-[10px]" variant="secondary">
                              +18
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || (mode === "url" ? !playlistUrl.trim() : !playlistContent.trim())}
          >
            {mutation.isPending ? "Importando..." : "Importar canales"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* =========================================================================
   PLANES
   ========================================================================= */

function PlansSection() {
  const { data, isLoading } = useQuery<{ items: Plan[] }>({
    queryKey: ["admin", "plans"],
    queryFn: () => api.get(`/plans?all=true`),
  });

  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<Plan | null>(null);

  const plans = data?.items || [];

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Planes de suscripción"
        description={`${plans.length} planes configurados.`}
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Nuevo plan
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <EmptyState icon={CreditCard} title="Sin planes" hint="Creá tu primer plan de suscripción." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} onEdit={() => setEditing(p)} />
          ))}
        </div>
      )}

      <PlanFormDialog open={creating} onOpenChange={setCreating} plan={null} />
      <PlanFormDialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)} plan={editing} />
    </div>
  );
}

function PlanCard({ plan, onEdit }: { plan: Plan; onEdit: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const features = featuresToString(plan.features || "")
    .split("\n")
    .filter(Boolean);

  const toggleActive = async () => {
    try {
      await api.put(`/plans`, { plans: [{ id: plan.id, active: !plan.active }] });
      qc.invalidateQueries({ queryKey: ["admin", "plans"] });
      qc.invalidateQueries({ queryKey: ["plans"] });
      toast({ title: plan.active ? "Plan desactivado" : "Plan activado" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Card className={cn("relative flex flex-col border-border/60 bg-card/40", !plan.active && "opacity-60")}>
      {plan.active && (
        <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-emerald-500" title="Activo" />
      )}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{plan.name}</CardTitle>
          <Badge variant="outline" className="border-border">
            {plan.quality}
          </Badge>
        </div>
        <CardDescription>{plan.description || "Sin descripción"}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="flex items-end gap-1">
          <span className="text-3xl font-black text-primary">{formatCurrency(plan.price, plan.currency)}</span>
          <span className="mb-1 text-xs text-muted-foreground">/ {plan.durationDays} días</span>
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>📱 {plan.screens} pantalla(s)</span>
          <span>🎬 {plan.quality}</span>
        </div>
        {features.length > 0 && (
          <ul className="space-y-1">
            {features.slice(0, 5).map((f, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                {f}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
        <div className="flex items-center gap-2">
          <Switch checked={plan.active} onCheckedChange={toggleActive} />
          <span className="text-xs text-muted-foreground">{plan.active ? "Activo" : "Inactivo"}</span>
        </div>
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
      </CardFooter>
    </Card>
  );
}

function PlanFormDialog({
  open,
  onOpenChange,
  plan,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  plan: Plan | null;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const isEdit = !!plan;
  const [form, setForm] = React.useState<Partial<Plan>>({});
  const [featuresText, setFeaturesText] = React.useState("");
  const [priceStr, setPriceStr] = React.useState("");
  const [durationStr, setDurationStr] = React.useState("");
  const [screensStr, setScreensStr] = React.useState("1");

  React.useEffect(() => {
    if (open) {
      const src = plan || {
        name: "",
        price: 0,
        currency: "ARS",
        durationDays: 30,
        description: "",
        features: "[]",
        quality: "HD",
        screens: 1,
        active: true,
      };
      setForm({ ...src });
      setFeaturesText(featuresToString(src.features || ""));
      setPriceStr(String(src.price ?? 0));
      setDurationStr(String(src.durationDays ?? 30));
      setScreensStr(String(src.screens ?? 1));
    }
  }, [open, plan]);

  const mutation = useMutation({
    mutationFn: () => {
      const features = stringToFeatures(featuresText);
      const payload = {
        ...form,
        price: Number(priceStr) || 0,
        durationDays: Number(durationStr) || 1,
        screens: Number(screensStr) || 1,
        features,
      };
      if (isEdit) {
        return api.put(`/plans`, { plans: [{ id: plan!.id, ...payload }] });
      }
      return api.post(`/plans`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "plans"] });
      qc.invalidateQueries({ queryKey: ["plans"] });
      toast({ title: isEdit ? "Plan actualizado" : "Plan creado" });
      onOpenChange(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar plan" : "Nuevo plan"}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Modificando "${plan?.name}"` : "Definí un nuevo plan de suscripción."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Nombre *</Label>
            <Input value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Básico, Estándar, Premium..." />
          </div>
          <div className="space-y-1.5">
            <Label>Precio</Label>
            <Input type="number" value={priceStr} onChange={(e) => setPriceStr(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Moneda</Label>
            <Select value={form.currency || "ARS"} onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ARS">ARS ($)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Duración (días)</Label>
            <Input type="number" value={durationStr} onChange={(e) => setDurationStr(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Pantallas</Label>
            <Input type="number" value={screensStr} onChange={(e) => setScreensStr(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Calidad</Label>
            <Select value={form.quality || "HD"} onValueChange={(v) => setForm((f) => ({ ...f, quality: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SD">SD</SelectItem>
                <SelectItem value="HD">HD</SelectItem>
                <SelectItem value="Full HD">Full HD</SelectItem>
                <SelectItem value="4K">4K</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select value={form.active ? "true" : "false"} onValueChange={(v) => setForm((f) => ({ ...f, active: v === "true" }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Activo</SelectItem>
                <SelectItem value="false">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Descripción</Label>
            <Textarea rows={2} value={form.description || ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Características (una por línea)</Label>
            <Textarea
              rows={5}
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              placeholder={"Calidad 4K Ultra HD\nHasta 4 pantallas\nSin anuncios\nDescargas offline"}
            />
            <p className="text-xs text-muted-foreground">Cada línea será un ítem en la lista de beneficios.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name}>
            {mutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* =========================================================================
   PAGOS
   ========================================================================= */

function PaymentsSection() {
  const [status, setStatus] = React.useState("ALL");
  const params = new URLSearchParams({ limit: "200" });
  if (status !== "ALL") params.set("status", status);

  const { data, isLoading } = useQuery<ListResponse<AdminPayment>>({
    queryKey: ["admin", "payments", status],
    queryFn: () => api.get<ListResponse<AdminPayment>>(`/admin/payments?${params.toString()}`),
  });

  const payments = data?.items || [];

  const onExport = () => {
    const rows = payments.map((p) => ({
      id: p.id,
      usuario: p.user?.name || "",
      email: p.user?.email || "",
      monto: p.amount,
      moneda: p.currency,
      estado: p.status,
      metodo: p.method,
      plan: p.subscription?.plan?.name || "",
      mercadopago_id: p.mercadopagoId || "",
      fecha: p.createdAt,
    }));
    downloadCsv(`pagos_${Date.now()}.csv`, rows);
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Pagos"
        description={`${data?.total || 0} pagos registrados.`}
        action={
          <div className="flex items-center gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {PAYMENT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={onExport} disabled={payments.length === 0}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </Button>
          </div>
        }
      />

      <Card className="border-border/60 bg-card/40">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton cols={6} />
            </div>
          ) : payments.length === 0 ? (
            <EmptyState icon={Wallet} title="Sin pagos" hint="No hay pagos para el filtro seleccionado." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Usuario</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>MP ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="font-medium text-white">{p.user?.name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{p.user?.email}</p>
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-400">
                      {formatCurrency(p.amount, p.currency)}
                    </TableCell>
                    <TableCell>{p.subscription?.plan?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{p.method || "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                    <TableCell>
                      <span className="block max-w-[140px] truncate text-xs text-muted-foreground" title={p.mercadopagoId || ""}>
                        {p.mercadopagoId || "—"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* =========================================================================
   SUSCRIPCIONES
   ========================================================================= */

function SubscriptionsSection() {
  const [status, setStatus] = React.useState("ALL");
  const params = new URLSearchParams({ limit: "200" });
  if (status !== "ALL") params.set("status", status);

  const { data, isLoading } = useQuery<ListResponse<AdminSubscription>>({
    queryKey: ["admin", "subscriptions", status],
    queryFn: () => api.get<ListResponse<AdminSubscription>>(`/admin/subscriptions?${params.toString()}`),
  });

  const subs = data?.items || [];

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Suscripciones"
        description={`${data?.total || 0} suscripciones registradas.`}
        action={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              {SUB_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <Card className="border-border/60 bg-card/40">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton cols={6} />
            </div>
          ) : subs.length === 0 ? (
            <EmptyState icon={Repeat} title="Sin suscripciones" hint="No hay suscripciones para el filtro seleccionado." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Usuario</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Auto-renovar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subs.map((s) => {
                  const expired = s.status === "ACTIVE" && new Date(s.endDate).getTime() < Date.now();
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <p className="font-medium text-white">{s.user?.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{s.user?.email}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{s.plan?.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.plan ? formatCurrency(s.plan.price, s.plan.currency) : ""}
                        </p>
                      </TableCell>
                      <TableCell>
                        {expired ? (
                          <Badge className="bg-rose-500/15 text-rose-400" variant="secondary">
                            Vencida
                          </Badge>
                        ) : (
                          <StatusBadge status={s.status} />
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatShortDate(s.startDate)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatShortDate(s.endDate)}</TableCell>
                      <TableCell>
                        {s.autoRenew ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* =========================================================================
   AJUSTES (Settings)
   ========================================================================= */

const SETTINGS_FIELDS = [
  { key: "heroTitle", label: "Título del hero", type: "text", placeholder: "Películas y series sin límite" },
  { key: "heroSubtitle", label: "Subtítulo del hero", type: "text", placeholder: "Donde quieras. Cuando quieras." },
  { key: "footerText", label: "Texto del footer", type: "text", placeholder: "© 2024 JOSE DEMO" },
  { key: "announcement", label: "Anuncio (banner superior)", type: "text", placeholder: "¡Oferta especial!" },
  { key: "primaryColor", label: "Color primario", type: "color" },
  { key: "mpAccessToken", label: "Token de MercadoPago (MP_ACCESS_TOKEN)", type: "text", placeholder: "APP_USR-xxxxx-xxxxx" },
  { key: "mpPublicKey", label: "Public Key de MercadoPago", type: "text", placeholder: "APP_USR-xxxxx" },
  { key: "mpSandbox", label: "MercadoPago Sandbox (true/false)", type: "text", placeholder: "true" },
  { key: "landingTitle", label: "Título de la landing", type: "text", placeholder: "Stream sin límites" },
  { key: "landingDescription", label: "Descripción de la landing", type: "text", placeholder: "Películas, series y canales en vivo..." },
  { key: "ctaRegister", label: "Texto botón registrarse", type: "text", placeholder: "Comenzá gratis" },
  { key: "ctaLogin", label: "Texto botón login", type: "text", placeholder: "Iniciar sesión" },
  { key: "sectionTrending", label: "Título fila Tendencias", type: "text", placeholder: "Tendencias" },
  { key: "sectionMovies", label: "Título fila Películas", type: "text", placeholder: "Películas" },
  { key: "sectionSeries", label: "Título fila Series", type: "text", placeholder: "Series" },
  { key: "sectionNew", label: "Título fila Novedades", type: "text", placeholder: "Novedades" },
  { key: "sectionRecommend", label: "Título fila Recomendados", type: "text", placeholder: "Recomendado para vos" },
  { key: "sectionContinueWatching", label: "Título fila Continuar Viendo", type: "text", placeholder: "Continuar viendo" },
] as const;

function SettingsSection() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ settings: Record<string, string> }>(`/settings`);
      setValues(data.settings || {});
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const onSave = async () => {
    setSaving(true);
    try {
      await api.put(`/settings`, { settings: values });
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast({ title: "Configuración guardada" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Ajustes"
        description="Estos valores controlan el contenido visible en el sitio público."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/40 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Contenido del frontend</CardTitle>
            <CardDescription>Editá los textos que ven los usuarios en la plataforma.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : (
              SETTINGS_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label>{field.label}</Label>
                  {field.type === "color" ? (
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={values[field.key] || "#E50914"}
                        onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                        className="h-10 w-14 cursor-pointer rounded-md border border-border bg-transparent"
                      />
                      <Input
                        value={values[field.key] || ""}
                        onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                        placeholder="#E50914"
                        className="flex-1"
                      />
                    </div>
                  ) : (
                    <Input
                      value={values[field.key] || ""}
                      onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))
            )}
          </CardContent>
          <CardFooter className="border-t border-border/60 pt-4">
            <Button onClick={onSave} disabled={loading || saving}>
              <Save className="h-4 w-4" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-border/60 bg-card/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ExternalLink className="h-4 w-4 text-primary" />
              Edición del frontend
            </CardTitle>
            <CardDescription>¿Cómo se aplican estos cambios?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Los textos que editás acá se muestran en la página principal y en el footer del sitio
              público, sin necesidad de tocar código.
            </p>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span><strong className="text-foreground">Hero:</strong> título y subtítulo principales.</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-muted-foreground" />
                <span><strong className="text-foreground">Footer:</strong> copyright visible abajo.</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <span><strong className="text-foreground">Anuncio:</strong> banner superior opcional.</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-violet-500" />
                <span><strong className="text-foreground">Color primario:</strong> acento de la marca.</span>
              </div>
            </div>
            <Separator />
            <p className="text-xs">
              Tip: para que el color primario tome efecto en toda la app, puede requerir recargar la
              página, ya que algunas variables CSS se aplican al cargar.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* =========================================================================
   Pagination
   ========================================================================= */

function PaginationRow({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-1">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Anterior
      </Button>
      {start > 1 && (
        <>
          <Button variant="ghost" size="sm" onClick={() => onChange(1)}>
            1
          </Button>
          {start > 2 && <span className="px-1 text-muted-foreground">…</span>}
        </>
      )}
      {pages.map((p) => (
        <Button
          key={p}
          variant={p === page ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange(p)}
        >
          {p}
        </Button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-muted-foreground">…</span>}
          <Button variant="ghost" size="sm" onClick={() => onChange(totalPages)}>
            {totalPages}
          </Button>
        </>
      )}
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Siguiente
      </Button>
    </div>
  );
}

/* =========================================================================
   Sidebar
   ========================================================================= */

function SidebarContent({
  section,
  onSelect,
}: {
  section: Section;
  onSelect: (s: Section) => void;
}) {
  return (
    <nav className="flex flex-col gap-1 p-3">
      {SECTIONS.map((s) => {
        const Icon = s.icon;
        const active = section === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-white"
            )}
          >
            <Icon className="h-4 w-4" />
            {s.label}
            {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
          </button>
        );
      })}
    </nav>
  );
}

/* =========================================================================
   MAIN ADMIN VIEW
   ========================================================================= */

export function AdminView() {
  const { user } = useAuth();
  const { navigate } = useNav();
  const [section, setSection] = React.useState<Section>("dashboard");
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      navigate("browse");
    }
  }, [user, navigate]);

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  const currentLabel = SECTIONS.find((s) => s.id === section)?.label || "";

  const renderSection = () => {
    switch (section) {
      case "dashboard":
        return <DashboardSection />;
      case "users":
        return <UsersSection />;
      case "content":
        return <ContentSection />;
      case "channels":
        return <ChannelsSection />;
      case "plans":
        return <PlansSection />;
      case "payments":
        return <PaymentsSection />;
      case "subscriptions":
        return <SubscriptionsSection />;
      case "settings":
        return <SettingsSection />;
      default:
        return <DashboardSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card/30 backdrop-blur-sm lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-white">JOSE DEMO</p>
            <p className="text-[10px] uppercase tracking-wider text-primary">Admin Panel</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarContent section={section} onSelect={setSection} />
        </div>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2 rounded-lg bg-muted/20 p-2">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarFallback className="bg-primary/20 text-xs font-bold text-primary">
                {user.name?.charAt(0).toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-xs font-medium text-white">{user.name}</p>
              <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar (drawer) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-border bg-card p-0">
          <SheetHeader className="h-16 border-b border-border">
            <SheetTitle className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <Shield className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold text-white">JOSE DEMO Admin</span>
            </SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto">
            <SidebarContent
              section={section}
              onSelect={(s) => {
                setSection(s);
                setMobileOpen(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-md sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Abrir menú"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 lg:hidden">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold">JOSE DEMO</span>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-base font-semibold text-white">{currentLabel}</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("browse")}>
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Volver al sitio</span>
              <span className="sm:hidden">Volver</span>
            </Button>
          </div>
        </header>

        {/* Section content */}
        <main className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}

export default AdminView;
