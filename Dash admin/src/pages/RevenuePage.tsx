import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { api } from '@/lib/api';
import { useAppStore } from '@/stores/appStore';
import { Loader2, TrendingUp, DollarSign, ShoppingBag, CheckCircle2, Users, PieChart, Activity, RefreshCw } from 'lucide-react';

interface RevenueSummary {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  tables_served: number;
  completed: number;
}

interface PeakHourRow {
  hour: number;
  order_count: number;
  revenue: number;
}

function Stat({ label, value, suffix, decimals, icon: Icon, color, bg }: { label: string; value: number; suffix?: string; decimals?: number, icon: any, color: string, bg: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("p-2 rounded-xl", bg)}><Icon className={cn("w-4 h-4", color)} /></div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className={cn("font-display font-black text-3xl leading-none", color)}>
        <CountUp end={value} duration={1.2} separator="," decimals={decimals || 0} />
        {suffix && <span className="text-sm font-bold text-muted-foreground ml-1">{suffix}</span>}
      </p>
    </motion.div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-xl p-3 shadow-xl backdrop-blur-md">
      <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">{label}</p>
      <p className="font-display font-black text-foreground text-lg leading-none">
        {payload[0].value.toLocaleString()}
        <span className="text-xs font-bold text-muted-foreground ml-1">{payload[0].dataKey === 'revenue' ? 'TND' : 'cmd'}</span>
      </p>
    </div>
  );
}

export default function RevenuePage() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [peakHours, setPeakHours] = useState<{ hour: string; orders: number }[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingPeak, setLoadingPeak] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { dashboardStats, fetchDashboardStats } = useAppStore();

  useEffect(() => {
    fetchDashboardStats().catch(console.error);
  }, [fetchDashboardStats]);

  const fetchSummary = () => {
    setLoadingSummary(true);
    api.get<RevenueSummary>(`/admin/revenue/summary?period=${period}`)
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoadingSummary(false));
  };

  useEffect(() => { fetchSummary(); }, [period]);

  const fetchPeak = () => {
    setLoadingPeak(true);
    api.get<PeakHourRow[]>('/admin/peak-hours')
      .then((rows) => setPeakHours(rows.map((r) => ({ hour: `${String(Math.floor(r.hour)).padStart(2, '0')}:00`, orders: r.order_count }))))
      .catch(console.error)
      .finally(() => setLoadingPeak(false));
  };

  useEffect(() => { fetchPeak(); }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboardStats(), fetchSummary(), fetchPeak()]);
    setRefreshing(false);
  }

  const revenueData = (dashboardStats?.revenue_last_7_days || []).map((d) => ({
    date: new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
    revenue: parseFloat(d.revenue.toString()),
    orders: d.orders,
  }));

  const topProducts = (dashboardStats?.top_products_today || []).map((p) => ({
    name: p.name,
    revenue: parseFloat(p.revenue.toString()),
    qty: p.qty_sold,
    pct: Math.min(100, (p.qty_sold / Math.max(...(dashboardStats?.top_products_today || []).map((x) => x.qty_sold), 1)) * 100),
  }));

  const getBarColor = (orders: number) => {
    if (orders >= 10) return '#10b981'; // emerald-500
    if (orders >= 5) return '#fbbf24';  // amber-400
    return '#64748b'; // slate-500
  };

  return (
    <div className="space-y-6 p-1">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card/60 backdrop-blur-md px-6 py-5 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10"><TrendingUp className="w-5 h-5 text-primary" /></div>
            Revenus & Analytiques
          </h1>
          <p className="text-xs text-muted-foreground mt-1 ml-11">Aperçu financier et performances du café</p>
        </div>

        <div className="flex items-center gap-3 self-end lg:self-auto">
          {/* Period Selector */}
          <div className="flex bg-secondary rounded-xl p-1 border border-border/50">
            {(['today', 'week', 'month'] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={cn('px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm',
                  period === p ? 'bg-background text-foreground' : 'bg-transparent text-muted-foreground hover:text-foreground')}>
                {p === 'today' ? "Aujourd'hui" : p === 'week' ? "Cette Semaine" : "Ce Mois"}
              </button>
            ))}
          </div>

          <button onClick={handleRefresh} disabled={refreshing}
            className="p-2.5 rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground transition-all hover:bg-secondary/30 disabled:opacity-50">
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      {loadingSummary ? (
        <div className="h-32 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-xs">Chargement des données financières...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Stat label="Chiffre d'Affaires" value={parseFloat(summary?.total_revenue?.toString() || '0')} suffix="TND" decimals={3} icon={DollarSign} color="text-emerald-500" bg="bg-emerald-500/10" />
          <Stat label="Panier Moyen" value={parseFloat(summary?.avg_order_value?.toString() || '0')} suffix="TND" decimals={3} icon={PieChart} color="text-blue-500" bg="bg-blue-500/10" />
          <Stat label="Commandes" value={summary?.total_orders || 0} icon={ShoppingBag} color="text-primary" bg="bg-primary/10" />
          <Stat label="Complétées" value={summary?.completed || 0} icon={CheckCircle2} color="text-purple-500" bg="bg-purple-500/10" />
          <Stat label="Tables Servies" value={summary?.tables_served || 0} icon={Users} color="text-amber-500" bg="bg-amber-500/10" />
        </div>
      )}

      {/* ── Revenue Chart ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="font-display font-black text-lg text-foreground">Évolution des Revenus (7 derniers jours)</h3>
        </div>

        {revenueData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-2xl">
            Aucune donnée financière disponible
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C8860A" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#C8860A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.1} />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}`} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
              <Area type="monotone" dataKey="revenue" stroke="#C8860A" fill="url(#revGrad)" strokeWidth={3} activeDot={{ r: 6, fill: '#C8860A', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Peak Hours ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <h3 className="font-display font-black text-lg text-foreground mb-6">Heures de Pointe (Aujourd'hui)</h3>
          {loadingPeak ? (
            <div className="h-[250px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs">Analyse des flux...</span>
            </div>
          ) : peakHours.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-2xl">
              Aucune commande aujourd'hui
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={peakHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.1} />
                <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="orders" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {peakHours.map((entry, i) => (
                    <Cell key={i} fill={getBarColor(entry.orders)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* ── Top Products Today ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <h3 className="font-display font-black text-lg text-foreground mb-6">Meilleures Ventes (Aujourd'hui)</h3>
          {topProducts.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-2xl">
              Aucune vente enregistrée
            </div>
          ) : (
            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-secondary">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-4 bg-secondary/30 p-3 rounded-2xl border border-border/50">
                  <div className="w-6 h-6 rounded-md bg-background flex items-center justify-center text-[10px] font-black text-muted-foreground shrink-0 shadow-sm border border-border">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-sm font-bold text-foreground truncate">{p.name}</span>
                      <span className="text-xs font-black text-primary whitespace-nowrap">
                        {p.revenue.toFixed(3)} <span className="text-[10px] font-bold">TND</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-background rounded-full overflow-hidden border border-border/50">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${p.pct}%` }}
                          transition={{ duration: 0.8, delay: i * 0.08 }}
                          className="h-full rounded-full bg-gradient-to-r from-primary/50 to-primary"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground">{p.qty} vendus</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
