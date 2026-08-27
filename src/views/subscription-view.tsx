"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNav } from "@/lib/nav-store";
import { api } from "@/lib/api-client";
import { Plan } from "@/lib/types";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Crown,
  Check,
  Sparkles,
  Tv,
  Monitor,
  Calendar,
  ShieldCheck,
  CreditCard,
  Zap,
  Star,
  Loader2,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { formatARS, formatDate, subscriptionStatusLabel } from "@/lib/format";

interface PlansResponse {
  items: Plan[];
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

interface CreatePaymentResponse {
  init_point: string;
  preferenceId: string;
  paymentId: string;
  demo?: boolean;
  sandbox?: boolean;
}

function parseFeatures(features: string): string[] {
  if (!features) return [];
  try {
    const parsed = JSON.parse(features);
    if (Array.isArray(parsed)) return parsed.filter((s) => typeof s === "string");
  } catch {
    /* not json */
  }
  // Si no es JSON, intentar separar por newlines o comas
  return features
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function PlanSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-card/40 p-5">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}

const FAQS = [
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí. Tu suscripción se mantiene activa hasta que venza el período que ya pagaste. Después no se renueva automáticamente (en modo demo).",
  },
  {
    q: "¿Cómo pago?",
    a: "Pagás con MercadoPago: tarjeta de crédito, débito, transferencia o dinero en cuenta. En el modo demo, el pago se aprueba automáticamente.",
  },
  {
    q: "¿Puedo cambiar de plan?",
    a: "Sí. Suscribite a un nuevo plan y se sumará al tiempo que ya te queda. La calidad máxima será la del plan activo más alto.",
  },
  {
    q: "¿Qué calidad de video tiene cada plan?",
    a: "Básico: HD (720p). Estándar: Full HD (1080p). Premium: 4K UHD + HDR cuando esté disponible.",
  },
  {
    q: "¿En cuántos dispositivos puedo mirar?",
    a: "Depende del plan: Básico 1 pantalla, Estándar 2 pantallas simultáneas, Premium hasta 4 pantallas.",
  },
  {
    q: "¿El contenido +18 está incluido?",
    a: "Sí, pero requiere verificación de adulto en tu cuenta. Si tu cuenta no está verificada, la sección +18 no aparecerá.",
  },
];

export function SubscriptionView() {
  const { navigate } = useNav();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  const { data: plansData, isLoading: plansLoading } = useQuery<PlansResponse>({
    queryKey: ["plans"],
    queryFn: () => api.get<PlansResponse>("/plans"),
    staleTime: 60 * 1000,
  });

  const { data: subData, isLoading: subLoading } = useQuery<SubStatusResponse>({
    queryKey: ["subscription-status"],
    queryFn: () => api.get<SubStatusResponse>("/subscriptions/status"),
    staleTime: 30 * 1000,
  });

  const plans = plansData?.items || [];
  const sub = subData?.subscription;
  const isActive = subData?.active === true;
  const daysLeft = sub?.daysLeft ?? 0;
  const subProgress = (() => {
    if (!sub || !sub.plan) return 0;
    const totalDays = sub.plan.durationDays || 30;
    const elapsed = Math.max(0, totalDays - daysLeft);
    return Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));
  })();

  // Determinar plan recomendado (Estándar)
  const recommendedName = "Estándar";

  // ¿Es el plan actualmente activo?
  const isCurrentPlan = (plan: Plan) =>
    isActive && sub?.plan?.id === plan.id;

  const handleSubscribe = async (plan: Plan) => {
    setProcessingPlanId(plan.id);
    try {
      const res = await api.post<CreatePaymentResponse>(
        "/payments/mercadopago/create",
        { planId: plan.id }
      );

      // Modo demo: init_point empieza con /api/
      if (res.demo || res.init_point.startsWith("/api/")) {
        // Esperar a que se active (modo demo ya activó en el backend)
        await new Promise((r) => setTimeout(r, 1200));
        await qc.invalidateQueries({ queryKey: ["subscription-status"] });
        await qc.invalidateQueries({ queryKey: ["payments"] });
        toast({
          title: "¡Suscripción activada! 🎉",
          description: `Plan ${plan.name} activo por ${plan.durationDays} días.`,
        });
        // Pequeña pausa para que se actualice el estado y navegar
        setTimeout(() => navigate("browse"), 600);
      } else {
        // Modo real: abrir init_point de MercadoPago
        toast({
          title: "Redirigiendo a MercadoPago...",
          description: "Vas a completar el pago en una pestaña nueva.",
        });
        if (typeof window !== "undefined") {
          window.location.href = res.init_point;
        }
      }
    } catch (err: any) {
      toast({
        title: "Error al procesar el pago",
        description: err.message || "Intentá de nuevo más tarde.",
        variant: "destructive",
      });
    } finally {
      setProcessingPlanId(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-20 sm:px-6 md:pb-8 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 text-center"
          >
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
              <Crown className="h-3.5 w-3.5" />
              Planes JOSE DEMO
            </div>
            <h1 className="text-2xl font-black text-white sm:text-4xl">
              Elegí tu plan y empezá a mirar
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Sin contratos. Cancelás cuando quieras. Pagá fácil con MercadoPago.
            </p>
          </motion.div>

          {/* Current subscription banner */}
          {subLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6"
            >
              <Skeleton className="h-24 w-full rounded-xl" />
            </motion.div>
          ) : isActive && sub ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <Card className="border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                        <Crown className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-white">
                            Plan actual: {sub.plan?.name || "—"}
                          </p>
                          <Badge className="bg-green-600/90 text-white">
                            <Check className="mr-1 h-3 w-3" />
                            {subscriptionStatusLabel(sub.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Vence el {formatDate(sub.endDate)} · {daysLeft} días restantes
                        </p>
                      </div>
                    </div>
                    {sub.plan?.quality && (
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="flex items-center gap-1 rounded bg-primary/15 px-2 py-1 text-primary">
                          <Sparkles className="h-3 w-3" /> {sub.plan.quality}
                        </span>
                        <span className="flex items-center gap-1 rounded bg-secondary px-2 py-1 text-secondary-foreground">
                          <Tv className="h-3 w-3" /> {sub.plan.screens} pantallas
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <Progress value={subProgress} className="h-2" />
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Podés suscribirte a un plan superior para sumar tiempo o
                    mejorar calidad. Tu plan actual sigue activo hasta su
                    vencimiento.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : !subLoading && !isActive ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <Card className="border-dashed border-yellow-600/40 bg-yellow-600/5">
                <CardContent className="flex items-center gap-3 p-4">
                  <Monitor className="h-5 w-5 shrink-0 text-yellow-500" />
                  <p className="text-sm text-muted-foreground">
                    No tenés una suscripción activa. Elegí un plan para
                    desbloquear todo el catálogo.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : null}

          {/* Plans grid */}
          {plansLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              <PlanSkeleton />
              <PlanSkeleton />
              <PlanSkeleton />
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
              <p className="text-muted-foreground">
                No hay planes disponibles en este momento.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan, idx) => {
                const features = parseFeatures(plan.features);
                const isRecommended =
                  plan.name.toLowerCase().includes("est") ||
                  plan.name === recommendedName;
                const current = isCurrentPlan(plan);
                const processing = processingPlanId === plan.id;
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    className="relative"
                  >
                    <Card
                      className={
                        "relative flex h-full flex-col overflow-hidden border-border/60 transition-all " +
                        (isRecommended
                          ? "border-primary/60 shadow-lg shadow-primary/20 ring-1 ring-primary/30"
                          : "bg-card/60 hover:border-border")
                      }
                    >
                      {/* Recommended badge */}
                      {isRecommended && (
                        <div className="absolute left-0 right-0 top-0 bg-gradient-to-r from-primary to-red-600 py-1 text-center text-[11px] font-bold uppercase tracking-wider text-white">
                          ⭐ Más popular
                        </div>
                      )}

                      <CardHeader
                        className={
                          isRecommended ? "pt-9" : undefined
                        }
                      >
                        <CardTitle className="flex items-center justify-between text-xl">
                          <span className="font-black text-white">{plan.name}</span>
                          {plan.quality === "4K" && (
                            <Sparkles className="h-4 w-4 text-primary" />
                          )}
                        </CardTitle>
                        <div className="mt-1 flex items-end gap-1">
                          <span className="text-3xl font-black text-white">
                            {formatARS(plan.price, plan.currency)}
                          </span>
                          <span className="mb-1 text-xs text-muted-foreground">
                            / {plan.durationDays} días
                          </span>
                        </div>
                        {plan.description && (
                          <p className="text-xs text-muted-foreground">
                            {plan.description}
                          </p>
                        )}
                      </CardHeader>

                      <CardContent className="flex flex-1 flex-col">
                        {/* Quality + screens badges */}
                        <div className="mb-3 flex flex-wrap gap-2">
                          <span className="flex items-center gap-1 rounded bg-primary/15 px-2 py-1 text-[11px] font-medium text-primary">
                            <Sparkles className="h-3 w-3" /> {plan.quality}
                          </span>
                          <span className="flex items-center gap-1 rounded bg-secondary px-2 py-1 text-[11px] font-medium text-secondary-foreground">
                            <Tv className="h-3 w-3" /> {plan.screens} {plan.screens === 1 ? "pantalla" : "pantallas"}
                          </span>
                        </div>

                        <Separator className="mb-3" />

                        {/* Features */}
                        <ul className="mb-4 flex-1 space-y-2">
                          {features.length > 0 ? (
                            features.map((f, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-xs text-muted-foreground"
                              >
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                <span>{f}</span>
                              </li>
                            ))
                          ) : (
                            <>
                              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                <span>Catálogo completo</span>
                              </li>
                              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                <span>Sin anuncios</span>
                              </li>
                              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                <span>Calidad {plan.quality}</span>
                              </li>
                            </>
                          )}
                        </ul>

                        {/* Button */}
                        {current ? (
                          <Button
                            variant="outline"
                            className="w-full"
                            disabled
                          >
                            <Check className="mr-1.5 h-4 w-4 text-green-500" />
                            Plan actual
                          </Button>
                        ) : (
                          <Button
                            className={
                              "w-full " +
                              (isRecommended
                                ? "bg-primary hover:bg-primary/90"
                                : "")
                            }
                            variant={isRecommended ? "default" : "outline"}
                            disabled={processing}
                            onClick={() => handleSubscribe(plan)}
                          >
                            {processing ? (
                              <>
                                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                Procesando...
                              </>
                            ) : (
                              <>
                                <Zap className="mr-1.5 h-4 w-4" />
                                Suscribirse
                              </>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* MercadoPago trust */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Pagá seguro con MercadoPago
            </span>
            <span className="text-muted-foreground/50">·</span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="h-4 w-4" />
              Tarjeta, transferencia o dinero en cuenta
            </span>
            <span className="text-muted-foreground/50">·</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Cancelás cuando quieras
            </span>
          </motion.div>

          {/* Demo note */}
          <div className="mx-auto mt-4 max-w-2xl rounded-lg border border-primary/20 bg-primary/5 p-3 text-center text-[11px] text-muted-foreground">
            <Star className="mb-0.5 mr-1 inline h-3 w-3 text-primary" />
            Modo demo: los pagos se aprueban automáticamente para que puedas
            probar la plataforma sin usar tarjetas reales.
          </div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mt-10"
          >
            <div className="mb-4 text-center">
              <h2 className="flex items-center justify-center gap-2 text-xl font-bold text-white sm:text-2xl">
                <HelpCircle className="h-5 w-5 text-primary" />
                Preguntas frecuentes
              </h2>
            </div>
            <Card className="border-border/60 bg-card/40">
              <CardContent className="p-2 sm:p-4">
                <Accordion type="single" collapsible className="w-full">
                  {FAQS.map((faq, i) => (
                    <AccordionItem key={i} value={`item-${i}`}>
                      <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

export default SubscriptionView;
