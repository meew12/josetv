// Helpers de formato para JOSE DEMO (es-AR)

// Formatea monto como moneda argentina
export function formatARS(amount: number, currency = "ARS"): string {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

// Formatea fecha completa en español (Argentina)
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Formatea fecha y hora
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Tiempo relativo: "hace 2 horas", "hace 5 minutos"
export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";

  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 0) return "próximamente";
  if (seconds < 60) return "recién";
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    return `hace ${mins} ${mins === 1 ? "minuto" : "minutos"}`;
  }
  if (seconds < 86400) {
    const hrs = Math.floor(seconds / 3600);
    return `hace ${hrs} ${hrs === 1 ? "hora" : "horas"}`;
  }
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400);
    return `hace ${days} ${days === 1 ? "día" : "días"}`;
  }
  if (seconds < 2592000) {
    const weeks = Math.floor(seconds / 604800);
    return `hace ${weeks} ${weeks === 1 ? "semana" : "semanas"}`;
  }
  if (seconds < 31536000) {
    const months = Math.floor(seconds / 2592000);
    return `hace ${months} ${months === 1 ? "mes" : "meses"}`;
  }
  const years = Math.floor(seconds / 31536000);
  return `hace ${years} ${years === 1 ? "año" : "años"}`;
}

// Formatea segundos a m:ss o h:mm:ss
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "0:00";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Convierte estado de pago a etiqueta legible
export function paymentStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: "Pendiente",
    APPROVED: "Aprobado",
    REJECTED: "Rechazado",
    CANCELLED: "Cancelado",
    IN_PROCESS: "En proceso",
    REFUNDED: "Reembolsado",
  };
  return map[status] || status;
}

// Convierte estado de suscripción a etiqueta
export function subscriptionStatusLabel(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: "Activa",
    CANCELLED: "Cancelada",
    EXPIRED: "Expirada",
    PENDING: "Pendiente",
    PAUSED: "Pausada",
  };
  return map[status] || status;
}
