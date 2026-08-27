import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-helpers";

// GET /api/admin/stats - estadísticas del dashboard admin
export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse("No autorizado", 401);
    if (user.role !== "ADMIN") return errorResponse("Acceso denegado", 403);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeSubscriptions,
      totalContent,
      totalChannels,
      contentViewsAgg,
      recentSignups,
      approvedPayments,
      allPayments,
      subscriptions,
    ] = await Promise.all([
      db.user.count(),
      db.subscription.count({ where: { status: "ACTIVE" } }),
      db.content.count(),
      db.channel.count(),
      db.content.aggregate({ _sum: { views: true } }),
      db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      db.payment.findMany({
        where: { status: "APPROVED" },
        include: { subscription: { include: { plan: true } } },
      }),
      db.payment.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
      }),
      db.subscription.findMany({ include: { plan: true } }),
    ]);

    const totalRevenue = approvedPayments.reduce(
      (acc, p) => acc + p.amount,
      0
    );
    const totalViews = contentViewsAgg._sum.views || 0;

    // Revenue by plan
    const revenueByPlanMap = new Map<string, { name: string; total: number; count: number }>();
    for (const p of approvedPayments) {
      const planName = p.subscription?.plan?.name || "Sin plan";
      const planId = p.subscription?.plan?.id || "unknown";
      const existing = revenueByPlanMap.get(planId);
      if (existing) {
        existing.total += p.amount;
        existing.count += 1;
      } else {
        revenueByPlanMap.set(planId, { name: planName, total: p.amount, count: 1 });
      }
    }
    const revenueByPlan = Array.from(revenueByPlanMap.values());

    // Monthly revenue (last 6 months)
    const months: Array<{ label: string; total: number; count: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const label = d.toLocaleDateString("es-AR", { month: "short", year: "2-digit" });
      const items = allPayments.filter(
        (p) =>
          p.status === "APPROVED" &&
          p.createdAt >= d &&
          p.createdAt < next
      );
      months.push({
        label,
        total: items.reduce((acc, p) => acc + p.amount, 0),
        count: items.length,
      });
    }

    // Active subscriptions by plan
    const subsByPlanMap = new Map<string, { name: string; count: number }>();
    for (const s of subscriptions) {
      if (s.status !== "ACTIVE") continue;
      if (new Date(s.endDate).getTime() < now.getTime()) continue;
      const name = s.plan?.name || "Sin plan";
      const id = s.plan?.id || "unknown";
      const ex = subsByPlanMap.get(id);
      if (ex) ex.count += 1;
      else subsByPlanMap.set(id, { name, count: 1 });
    }
    const activeSubsByPlan = Array.from(subsByPlanMap.values());

    return successResponse({
      totalUsers,
      activeSubscriptions,
      totalRevenue,
      totalContent,
      totalChannels,
      totalViews,
      recentSignups,
      revenueByPlan,
      monthlyRevenue: months,
      activeSubsByPlan,
      totalApprovedPayments: approvedPayments.length,
    });
  } catch (err) {
    console.error("[admin/stats] error:", err);
    return errorResponse("Error al obtener estadísticas", 500);
  }
}
