import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { DollarSign, ClipboardList, Zap, Clock, TrendingUp, TrendingDown, ArrowRight, Loader2, X } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect, useRef } from 'react';

import { useNavigate } from 'react-router-dom';

const stagger = {
  container: { transition: { staggerChildren: 0.08 } },
  item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
};

function KPICard({ icon: Icon, label, value, suffix, decimals, change, positive, pulse, onClick }: {
  icon: React.ElementType; label: string; value: number; suffix?: string; decimals?: number;
  change: string; positive: boolean; pulse?: boolean; onClick?: () => void;
}) {
  return (
    <motion.div
      variants={stagger.item}
      whileHover={{ y: -3, boxShadow: '0 0 0 1px hsla(18, 35%, 40%, 0.3), 0 0 20px hsla(18, 35%, 40%, 0.1)' }}
      onClick={onClick}
      className={cn("glass-card rounded-xl p-5 transition-all duration-200 border border-espresso/5", onClick && "cursor-pointer")}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-primary/15', pulse && 'glow-gold')}>
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className={cn('flex items-center gap-1 text-xs font-medium', positive ? 'text-success' : 'text-destructive')}>
          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </div>
      </div>
      <p className="font-display text-2xl text-foreground">
        <CountUp end={value} duration={1.5} decimals={decimals || 0} separator="," />
        {suffix && <span className="text-sm text-muted-foreground ml-1">{suffix}</span>}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </motion.div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="font-display text-foreground">{payload[0].value.toLocaleString()} TND</p>
      {payload[0].payload.orders && <p className="text-xs text-muted-foreground">{payload[0].payload.orders} orders</p>}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { orders, assistanceRequests, fetchDashboardStats, fetchDashboardSummary, advanceOrderStatus, handleAssistance, tables, dashboardStats, loading, error, fetchInitialData } = useAppStore();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const lastAssistanceCount = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ✅ All hooks must come BEFORE any conditional returns
  // Polling for live data
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardStats().catch(console.error);
    }, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchDashboardStats]);

  // Update cards based on period
  useEffect(() => {
    if (period !== 'today') {
      fetchDashboardSummary(period).catch(console.error);
    } else {
      fetchDashboardStats().catch(console.error);
    }
  }, [period, fetchDashboardSummary, fetchDashboardStats]);

  // Play alert if new assistance request arrives
  useEffect(() => {
    if (assistanceRequests.length > lastAssistanceCount.current) {
      audioRef.current?.play().catch(() => { });
    }
    lastAssistanceCount.current = assistanceRequests.length;
  }, [assistanceRequests.length]);

  // Conditional returns AFTER all hooks
  if (error) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
          <X className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-display text-foreground">Sync Failed</h2>
        <p className="text-sm text-muted-foreground max-w-md">{error}</p>
        <button
          onClick={() => fetchInitialData()}
          className="mt-4 px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (loading || !dashboardStats) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="font-display text-lg text-muted-foreground">Synthesizing real-time analytics...</p>
      </div>
    );
  }

  const activeOrders = orders.filter((o) => o.status !== 'completed');

  // Transform revenue data for charts
  const revenueData = dashboardStats.revenue_last_7_days.map(d => ({
    day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    revenue: parseFloat(d.revenue.toString()),
    orders: d.orders
  }));

  // Derive order status data
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const orderStatusData = [
    { name: 'New', value: statusCounts.new || 0, color: '#816053' },      /* Muted Brown */
    { name: 'Brewing', value: statusCounts.brewing || 0, color: '#8B5742' },    /* Caramel */
    { name: 'Preparing', value: statusCounts.preparing || 0, color: '#A0816C' }, /* Roast */
    { name: 'Ready', value: statusCounts.ready || 0, color: '#5A8F7B' },    /* Sage (Coffee leaf) */
    { name: 'Completed', value: statusCounts.completed || 0, color: '#392A25' }, /* Deep Roast */
  ];

  const topProducts = dashboardStats.top_products_today.map(p => ({
    name: p.name,
    revenue: parseFloat(p.revenue.toString()),
    quantity: p.qty_sold,
    pct: Math.min(100, (p.qty_sold / (dashboardStats.today.total_orders || 1)) * 100)
  }));

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

      {/* KPI Cards */}
      <motion.div variants={stagger.container} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={DollarSign}
          label="Today's Revenue"
          value={parseFloat(dashboardStats.today.total_revenue.toString())}
          suffix="TND"
          change="+12%"
          positive
          onClick={() => navigate('/revenue')}
        />
        <KPICard
          icon={ClipboardList}
          label="Total Orders"
          value={dashboardStats.today.total_orders}
          change={`${dashboardStats.today.completed_orders} done`}
          positive
          onClick={() => navigate('/orders')}
        />
        <KPICard
          icon={Zap}
          label="Active Orders"
          value={dashboardStats.live.active_orders}
          change="live"
          positive
          pulse
          onClick={() => navigate('/orders')}
        />
        <KPICard
          icon={Clock}
          label="Avg Prep Time"
          value={parseFloat(dashboardStats.today.avg_prep_time_minutes?.toString() || '0')}
          suffix="min"
          decimals={1}
          change="-0.8min"
          positive
        />
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <motion.div variants={stagger.item} className="lg:col-span-3 glass-card rounded-xl p-5">
          <h3 className="font-display text-foreground mb-4">Revenue — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5742" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#8B5742" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#220C02" tick={{ fontSize: 12 }} opacity={0.6} />
              <YAxis stroke="#220C02" tick={{ fontSize: 12 }} opacity={0.6} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#8B5742" fill="url(#goldGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={stagger.item} className="lg:col-span-2 glass-card rounded-xl p-5">
          <h3 className="font-display text-foreground mb-4">Order Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={orderStatusData} innerRadius={55} outerRadius={80} dataKey="value" stroke="none">
                {orderStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center -mt-4 mb-3">
            <p className="font-display text-xl text-foreground"><CountUp end={dashboardStats.today.total_orders} duration={1} /></p>
            <p className="text-[10px] text-muted-foreground">Total Today</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {orderStatusData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[10px] text-muted-foreground">{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Live Orders + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={stagger.item} className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/orders')}>
              <h3 className="font-display text-foreground">Kitchen View</h3>
              <span className="w-2 h-2 rounded-full bg-success animate-pulse-dot" />
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground cursor-pointer" onClick={() => navigate('/orders')} />
          </div>
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
            {activeOrders.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-muted-foreground italic text-sm">
                No orders in progress
              </div>
            ) : (
              activeOrders.slice(0, 10).map((order) => (
                <motion.div
                  key={order.id}
                  layout
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    T{order.tableNumber}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] text-muted-foreground truncate">{order.id}</p>
                    <p className="text-sm text-foreground">{order.total} TND</p>
                  </div>
                  <span className={cn(
                    'text-[10px] px-2 py-1 rounded-full font-medium capitalize',
                    order.status === 'new' && 'bg-info/20 text-info',
                    order.status === 'brewing' && 'bg-purple-500/20 text-purple-400',
                    order.status === 'preparing' && 'bg-warning/20 text-warning',
                    order.status === 'ready' && 'bg-success/20 text-success',
                  )}>
                    {order.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(order.createdAt, { addSuffix: false })}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div variants={stagger.item} className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-foreground cursor-pointer" onClick={() => navigate('/products')}>Top Products Today</h3>
            <ArrowRight className="w-4 h-4 text-muted-foreground cursor-pointer" onClick={() => navigate('/products')} />
          </div>
          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-muted-foreground italic text-sm">
                No sales recorded today
              </div>
            ) : (
              topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                  <span className="text-sm text-foreground w-28 truncate">{p.name}</span>
                  <div className="flex-1 h-6 bg-secondary/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${p.pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-16 text-right">{p.revenue} TND</span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row: Assistance + Tables + Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assistance */}
        <motion.div variants={stagger.item} className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => navigate('/assistance')}>
            <h3 className="font-display text-foreground">Pending Assistance</h3>
            {assistanceRequests.length > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-destructive text-[10px] text-white animate-pulse">
                {assistanceRequests.length} ALERT
              </span>
            ) : (
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          {assistanceRequests.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-3">
                <span className="text-success text-lg">✓</span>
              </div>
              <p className="text-sm text-muted-foreground">All clear!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assistanceRequests.map((req) => {
                const mins = Math.floor((Date.now() - req.requestedAt.getTime()) / 60000);
                const urgent = mins > 5;
                return (
                  <div
                    key={req.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-transparent transition-all',
                      urgent && 'border-destructive/40 bg-destructive/5'
                    )}
                  >
                    <span className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors',
                      urgent ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'
                    )}>
                      T{req.tableNumber}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">Table {req.tableNumber}</p>
                      <p className={cn('text-[10px]', urgent ? 'text-destructive font-bold' : 'text-muted-foreground')}>
                        {mins} min waiting
                      </p>
                    </div>
                    <button
                      onClick={() => handleAssistance(req.id)}
                      className="px-3 py-1.5 rounded-md bg-primary/15 hover:bg-primary/25 text-primary text-xs font-medium transition-colors"
                    >
                      Handle
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Tables Overview */}
        <motion.div variants={stagger.item} className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => navigate('/tables')}>
            <h3 className="font-display text-foreground">Tables Overview</h3>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-3 gap-2 pr-1">
            {tables.length === 0 ? (
              <div className="col-span-full h-32 flex items-center justify-center text-muted-foreground italic text-sm">
                No tables defined
              </div>
            ) : (
              tables.slice(0, 12).map((t) => (
                <div
                  key={t.id}
                  onClick={() => navigate('/tables')}
                  className={cn(
                    'p-3 rounded-lg text-center text-xs font-medium transition-colors cursor-pointer',
                    t.status === 'free' && 'bg-secondary/50 text-muted-foreground hover:bg-secondary',
                    t.status === 'occupied' && 'bg-primary/15 text-primary border border-primary/20',
                    t.status === 'needs-attention' && 'bg-destructive/15 text-destructive border border-destructive/30'
                  )}
                >
                  <p className="font-display text-lg">{t.number}</p>
                  <p className="text-[9px] capitalize mt-0.5">{t.status.replace('-', ' ')}</p>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div variants={stagger.item} className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => navigate('/revenue')}>
            <h3 className="font-display text-foreground">Recent Transactions</h3>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2">
            {dashboardStats.recent_orders.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-muted-foreground italic text-sm">
                No transactions yet
              </div>
            ) : (
              dashboardStats.recent_orders.map((o) => (
                <div key={o.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors group">
                  <div className="w-0.5 h-8 rounded-full bg-transparent group-hover:bg-primary transition-colors" />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[9px] text-muted-foreground truncate">{o.id}</p>
                    <p className="text-sm text-foreground">Table {o.table_number}</p>
                  </div>
                  <p className="text-sm font-display text-foreground">{o.total_price} TND</p>
                  <span className={cn(
                    'text-[9px] px-2 py-0.5 rounded-full font-medium capitalize',
                    o.status === 'completed' ? 'bg-success/15 text-success' : 'bg-primary/15 text-primary'
                  )}>
                    {o.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(o.created_at), { addSuffix: false })}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
    </motion.div>
  );
}
