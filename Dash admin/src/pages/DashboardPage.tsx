import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import { DollarSign, ClipboardList, Zap, Clock, TrendingUp, TrendingDown, ArrowRight, Loader2, X, Bell, LayoutGrid, CheckCircle2, ShoppingBag, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function KPICard({ icon: Icon, label, value, suffix, decimals, change, positive, pulse, onClick, color, bg }: {
  icon: React.ElementType; label: string; value: number; suffix?: string; decimals?: number;
  change: string; positive: boolean; pulse?: boolean; onClick?: () => void; color: string; bg: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { y: -4, scale: 1.01 } : {}}
      onClick={onClick}
      className={cn("bg-card border border-border rounded-3xl p-5 shadow-sm transition-all", onClick && "cursor-pointer hover:shadow-md hover:border-primary/20")}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('p-2.5 rounded-2xl relative', bg)}>
            <Icon className={cn("w-5 h-5", color)} />
            {pulse && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", bg.replace('/10', ''))}></span>
                  <span className={cn("relative inline-flex rounded-full h-3 w-3", color.replace('text-', 'bg-'))}></span>
                </span>
            )}
        </div>
        <div className={cn('flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider', positive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </div>
      </div>
      <p className={cn("font-display font-black text-3xl leading-none mb-1", color)}>
        <CountUp end={value} duration={1.5} decimals={decimals || 0} separator="," />
        {suffix && <span className="text-sm font-bold text-muted-foreground ml-1">{suffix}</span>}
      </p>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
    </motion.div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-xl p-3 shadow-xl backdrop-blur-md">
      <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">{label}</p>
      <p className="font-display font-black text-foreground text-lg leading-none">
        {payload[0].value.toLocaleString()}
        <span className="text-xs font-bold text-muted-foreground ml-1">TND</span>
      </p>
      {payload[0].payload.orders && <p className="text-[10px] text-muted-foreground mt-1">{payload[0].payload.orders}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { orders, assistanceRequests, fetchDashboardStats, fetchDashboardSummary, advanceOrderStatus, handleAssistance, tables, dashboardStats, loading, error, fetchInitialData, user } = useAppStore();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const lastAssistanceCount = useRef(0)
  const lastOrderCount = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const orderAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => { fetchDashboardStats().catch(console.error); }, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardStats, user]);

  useEffect(() => {
    if (period !== 'today') { fetchDashboardSummary(period).catch(console.error); }
    else { fetchDashboardStats().catch(console.error); }
  }, [period, fetchDashboardSummary, fetchDashboardStats]);

  useEffect(() => {
    if (assistanceRequests.length > lastAssistanceCount.current) { audioRef.current?.play().catch(() => { }); }
    lastAssistanceCount.current = assistanceRequests.length;
  }, [assistanceRequests.length]);

  useEffect(() => {
    if (orders.length > lastOrderCount.current && lastOrderCount.current !== 0) {
      orderAudioRef.current?.play().catch(() => { });
      import('react-hot-toast').then(({ toast }) => {
        toast.success('Nouvelle commande reçue ! ☕', { duration: 4000, icon: '🛎️' });
      });
    }
    lastOrderCount.current = orders.length;
  }, [orders.length]);

  if (error) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-3xl bg-destructive/10 flex items-center justify-center mb-2 shadow-inner border border-destructive/20">
          <X className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-display font-black text-foreground">Échec de synchronisation</h2>
        <p className="text-sm text-muted-foreground max-w-md">{error}</p>
        <button onClick={() => fetchInitialData()} className="mt-4 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20">
          Réessayer
        </button>
      </div>
    );
  }

  if (loading || !dashboardStats) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="font-display font-bold text-lg text-muted-foreground">Analyse des données en temps réel...</p>
      </div>
    );
  }

  const activeOrders = orders.filter((o) => o.status !== 'completed');
  const revenueData = dashboardStats.revenue_last_7_days.map(d => ({
    day: new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short' }),
    revenue: parseFloat(d.revenue.toString()),
    orders: d.orders
  }));

  const statusCounts = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {} as Record<string, number>);
  const orderStatusData = [
    { name: t('dashboard.status.new'), value: statusCounts.new || 0, color: '#3b82f6' },      
    { name: t('dashboard.status.brewing'), value: statusCounts.brewing || 0, color: '#a855f7' }, 
    { name: t('dashboard.status.ready'), value: statusCounts.ready || 0, color: '#10b981' },    
  ];

  const topProducts = dashboardStats.top_products_today.map(p => ({
    name: p.name, revenue: parseFloat(p.revenue.toString()), quantity: p.qty_sold,
    pct: Math.min(100, (p.qty_sold / (dashboardStats.today.total_orders || 1)) * 100)
  }));

  const inventoryAlerts = useAppStore.getState().products.filter(p => p.stockQuantity !== undefined && p.minStockLevel !== undefined && p.stockQuantity <= p.minStockLevel);

  return (
    <div className="space-y-6 p-1">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card/60 backdrop-blur-md px-6 py-5 rounded-3xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 shadow-inner border border-primary/20">
            <LayoutGrid className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-black tracking-tight text-foreground">{t('dashboard.title')}</h1>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" /> {t('dashboard.live')}</span>
                <span>•</span>
                <span>{t('dashboard.auto_refresh')}</span>
            </p>
          </div>
        </div>
        
        <div className="flex bg-secondary rounded-xl p-1 border border-border/50 self-end lg:self-auto">
          {(['today', 'week', 'month'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn('px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm',
                period === p ? 'bg-background text-foreground' : 'bg-transparent text-muted-foreground hover:text-foreground')}>
              {p === 'today' ? t('dashboard.today') : p === 'week' ? t('dashboard.week') : t('dashboard.month')}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard icon={DollarSign} label={t('dashboard.revenue_today')} value={parseFloat(dashboardStats.today.total_revenue.toString())} suffix="TND" decimals={3} change="+12%" positive onClick={() => navigate('/revenue')} color="text-emerald-500" bg="bg-emerald-500/10" />
        <KPICard icon={ClipboardList} label={t('dashboard.total_orders')} value={dashboardStats.today.total_orders} change={`${dashboardStats.today.completed_orders}`} positive onClick={() => navigate('/orders')} color="text-blue-500" bg="bg-blue-500/10" />
        <KPICard icon={Zap} label={t('dashboard.active_orders')} value={dashboardStats.live.active_orders} change="Live" positive pulse onClick={() => navigate('/orders')} color="text-primary" bg="bg-primary/10" />
        <KPICard icon={Clock} label={t('dashboard.avg_prep_time')} value={parseFloat(dashboardStats.today.avg_prep_time_minutes?.toString() || '0')} suffix="min" decimals={1} change="-0.8min" positive color="text-purple-500" bg="bg-purple-500/10" />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-3 bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-black text-lg text-foreground">{t('dashboard.revenue_7_days')}</h3>
              <button onClick={() => navigate('/revenue')} className="text-xs font-bold text-primary hover:underline">{t('dashboard.details')}</button>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C8860A" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#C8860A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.1} />
              <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}`} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
              <Area type="monotone" dataKey="revenue" stroke="#C8860A" fill="url(#goldGrad)" strokeWidth={3} activeDot={{ r: 6, fill: '#C8860A', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
          <h3 className="font-display font-black text-lg text-foreground mb-2">{t('dashboard.order_status')}</h3>
          <div className="flex-1 relative min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={orderStatusData} innerRadius={60} outerRadius={80} dataKey="value" stroke="none" paddingAngle={5}>
                    {orderStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="font-display font-black text-3xl text-foreground"><CountUp end={dashboardStats.today.total_orders} duration={1} /></p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('dashboard.total_today')}</p>
              </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {orderStatusData.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: s.color }} />
                <span className="text-xs font-bold text-foreground">{s.name} <span className="text-muted-foreground ml-1">({s.value})</span></span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assistance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6 cursor-pointer group" onClick={() => navigate('/assistance')}>
            <h3 className="font-display font-black text-lg text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                <Bell className="w-5 h-5 text-destructive" /> {t('dashboard.assistance')}
            </h3>
            {assistanceRequests.length > 0 ? (
              <span className="px-3 py-1 rounded-xl bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-widest animate-pulse border border-destructive/20">
                {assistanceRequests.length}
              </span>
            ) : (
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            )}
          </div>
          <div className="flex-1">
              {assistanceRequests.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-4">
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  </div>
                  <p className="text-sm font-bold text-foreground">{t('dashboard.all_quiet')}</p>
                  <p className="text-xs">{t('dashboard.no_calls')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assistanceRequests.map((req) => {
                    const mins = Math.floor((Date.now() - req.requestedAt.getTime()) / 60000);
                    const urgent = mins > 5;
                    return (
                      <div key={req.id} className={cn('flex items-center gap-3 p-3 rounded-2xl border transition-all', urgent ? 'border-destructive/40 bg-destructive/5' : 'bg-secondary/30 border-border/50')}>
                        <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black font-display transition-colors', urgent ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary')}>
                          T{req.tableNumber}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-foreground">Table {req.tableNumber}</p>
                          <p className={cn('text-[10px] uppercase font-bold tracking-wider', urgent ? 'text-destructive animate-pulse' : 'text-muted-foreground')}>
                            {mins} {t('dashboard.wait_time')}
                          </p>
                        </div>
                        <button onClick={() => handleAssistance(req.id)} className="p-2 rounded-xl bg-primary text-primary-foreground hover:brightness-110 shadow-md transition-all">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        </motion.div>

        {/* Tables Overview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6 cursor-pointer group" onClick={() => navigate('/tables')}>
            <h3 className="font-display font-black text-lg text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-primary" /> {t('dashboard.table_status')}
            </h3>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="flex-1">
              {tables.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-2xl">
                  {t('dashboard.no_tables')}
                </div>
              ) : (
                  <div className="grid grid-cols-4 gap-2">
                  {tables.slice(0, 16).map((t) => (
                    <div key={t.id} onClick={() => navigate('/tables')}
                      className={cn('aspect-square rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer border',
                        t.status === 'free' ? 'bg-secondary/30 text-muted-foreground border-border hover:bg-secondary' : 
                        t.status === 'occupied' ? 'bg-primary/10 text-primary border-primary/20 shadow-inner' : 
                        'bg-destructive/10 text-destructive border-destructive/20 animate-pulse')}
                    >
                      <p className="font-display font-black text-xl">{t.number}</p>
                      <div className={cn("w-1.5 h-1.5 rounded-full mt-1", t.status === 'free' ? 'bg-muted-foreground/30' : t.status === 'occupied' ? 'bg-primary' : 'bg-destructive')} />
                    </div>
                  ))}
                </div>
              )}
          </div>
        </motion.div>

        {/* Live Orders */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6 cursor-pointer group" onClick={() => navigate('/orders')}>
            <h3 className="font-display font-black text-lg text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-500" /> {t('dashboard.live_orders')}
            </h3>
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-dot" />
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-secondary">
              {activeOrders.length === 0 ? (
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                  <ShoppingBag className="w-8 h-8 opacity-20 mb-2" />
                  <p className="text-sm font-bold">{t('dashboard.no_orders')}</p>
                </div>
              ) : (
                activeOrders.map((order) => (
                  <div key={order.id} className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => navigate('/orders')}>
                    <span className="w-10 h-10 rounded-xl bg-background flex items-center justify-center font-display font-black text-foreground shadow-sm border border-border">
                      T{order.tableNumber}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{parseFloat(String(order.total)).toFixed(3)} TND</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{formatDistanceToNow(order.createdAt, { addSuffix: false })}</p>
                    </div>
                    <span className={cn('text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg',
                      order.status === 'new' ? 'bg-blue-500/10 text-blue-500' :
                      order.status === 'brewing' ? 'bg-purple-500/10 text-purple-500' :
                      'bg-emerald-500/10 text-emerald-500'
                    )}>
                      {order.status === 'new' ? t('dashboard.status.new') : order.status === 'brewing' ? t('dashboard.status.brewing') : t('dashboard.status.ready')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
      <audio ref={orderAudioRef} src="https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3" preload="auto" />

      {/* Inventory Alerts Overlay */}
      <AnimatePresence>
          {inventoryAlerts.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="fixed bottom-6 right-6 z-50 w-80 bg-card/90 backdrop-blur-xl border border-destructive/20 p-5 rounded-3xl shadow-2xl shadow-destructive/10 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-black text-destructive uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 animate-pulse" /> {t('dashboard.inventory_alerts')}
                </h4>
                <span className="text-[10px] bg-destructive text-white px-2 py-1 rounded-lg font-black shadow-md">
                  {inventoryAlerts.length}
                </span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-destructive/20">
                {inventoryAlerts.map(p => (
                  <div key={p.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-destructive/5 border border-destructive/10">
                    <span className="text-xs font-bold text-foreground truncate flex-1">{p.name}</span>
                    <span className="text-[10px] font-black text-destructive bg-destructive/10 px-2 py-0.5 rounded-md">
                      {p.stockQuantity} {t('dashboard.left')}
                    </span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/products')} className="mt-4 w-full py-2.5 rounded-xl bg-destructive text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-destructive/20 hover:brightness-110 transition-all">
                {t('dashboard.manage_stock')}
              </button>
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}
