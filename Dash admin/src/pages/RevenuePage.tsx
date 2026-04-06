import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '@/lib/api';
import { useAppStore } from '@/stores/appStore';
import { Loader2 } from 'lucide-react';

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

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.08 } } },
  item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
};

function Stat({ label, value, suffix, decimals }: { label: string; value: number; suffix?: string; decimals?: number }) {
  return (
    <motion.div variants={stagger.item} className="glass-card rounded-xl p-5 text-center">
      <p className="font-display text-2xl text-foreground">
        <CountUp end={value} duration={1.2} separator="," decimals={decimals || 0} />
        {suffix && <span className="text-sm text-muted-foreground ml-1">{suffix}</span>}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </motion.div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-xl">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-foreground">
        {payload[0].value.toLocaleString()}
        {payload[0].dataKey === 'revenue' ? ' TND' : ' orders'}
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

  // Pull revenue_last_7_days + top products from the existing dashboard store
  const { dashboardStats, fetchDashboardStats } = useAppStore();

  useEffect(() => {
    fetchDashboardStats().catch(console.error);
  }, [fetchDashboardStats]);

  const revenueData = (dashboardStats?.revenue_last_7_days || []).map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: parseFloat(d.revenue.toString()),
    orders: d.orders,
  }));

  const topProducts = (dashboardStats?.top_products_today || []).map((p) => ({
    name: p.name,
    revenue: parseFloat(p.revenue.toString()),
    qty: p.qty_sold,
    pct: Math.min(100, (p.qty_sold / Math.max(...(dashboardStats?.top_products_today || []).map((x) => x.qty_sold), 1)) * 100),
  }));

  // Fetch revenue summary when period changes
  useEffect(() => {
    setLoadingSummary(true);
    api
      .get<RevenueSummary>(`/admin/revenue/summary?period=${period}`)
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoadingSummary(false));
  }, [period]);

  // Fetch peak hours once on mount
  useEffect(() => {
    setLoadingPeak(true);
    api
      .get<PeakHourRow[]>('/admin/peak-hours')
      .then((rows) =>
        setPeakHours(
          rows.map((r) => ({
            hour: `${String(Math.floor(r.hour)).padStart(2, '0')}:00`,
            orders: r.order_count,
          }))
        )
      )
      .catch(console.error)
      .finally(() => setLoadingPeak(false));
  }, []);

  const getBarColor = (orders: number) => {
    if (orders >= 10) return '#C8860A';
    if (orders >= 5) return '#E8A020';
    return '#4A3C2A';
  };

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-end">
        <div className="flex bg-secondary rounded-lg p-1">
          {(['today', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-4 py-1.5 rounded-md text-xs font-medium transition-all capitalize',
                period === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      {loadingSummary ? (
        <div className="h-24 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <motion.div variants={stagger.container} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Stat label="Total Revenue" value={parseFloat(summary?.total_revenue?.toString() || '0')} suffix="TND" decimals={2} />
          <Stat label="Avg Order Value" value={parseFloat(summary?.avg_order_value?.toString() || '0')} suffix="TND" decimals={2} />
          <Stat label="Total Orders" value={summary?.total_orders || 0} />
          <Stat label="Completed" value={summary?.completed || 0} />
          <Stat label="Tables Served" value={summary?.tables_served || 0} />
        </motion.div>
      )}

      {/* Revenue Chart — last 7 days from dashboard store */}
      <motion.div variants={stagger.item} className="glass-card rounded-xl p-5">
        <h3 className="font-display text-foreground mb-4">Revenue — Last 7 Days</h3>
        {revenueData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm italic">No revenue data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C8860A" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#C8860A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#4A3C2A" tick={{ fontSize: 12 }} />
              <YAxis stroke="#4A3C2A" tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#C8860A" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours */}
        <motion.div variants={stagger.item} className="glass-card rounded-xl p-5">
          <h3 className="font-display text-foreground mb-4">Orders Per Hour (Today)</h3>
          {loadingPeak ? (
            <div className="h-[250px] flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : peakHours.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm italic">No orders today yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={peakHours}>
                <XAxis dataKey="hour" stroke="#4A3C2A" tick={{ fontSize: 10 }} />
                <YAxis stroke="#4A3C2A" tick={{ fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                  {peakHours.map((entry, i) => (
                    <Cell key={i} fill={getBarColor(entry.orders)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Top Products Today */}
        <motion.div variants={stagger.item} className="glass-card rounded-xl p-5">
          <h3 className="font-display text-foreground mb-4">Top Products Today</h3>
          {topProducts.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm italic">No sales recorded today</div>
          ) : (
            <div className="space-y-4 pt-2">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                  <span className="text-sm text-foreground w-32 truncate">{p.name}</span>
                  <div className="flex-1 h-5 bg-secondary/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${p.pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.08 }}
                      className="h-full rounded-full bg-gradient-to-r from-primary/50 to-primary"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-24 text-right">
                    {p.revenue} TND ({p.qty})
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
