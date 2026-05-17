import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, OrderStatus } from '@/stores/appStore';
import {
  ArrowRight, Clock, Coffee, ChefHat, PackageCheck, AlertCircle,
  RefreshCw, Zap, LayoutGrid, List, Filter, SortAsc, X,
  History, TrendingUp, CheckCircle2, Timer, Volume2, VolumeX,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '@/lib/api';

/* ── Types ── */
type ColDef = {
  status: OrderStatus; label: string; icon: React.ElementType;
  accent: string; ring: string; glow: string; bg: string; pill: string;
};

const COLUMNS: ColDef[] = [
  { status: 'new', label: 'Nouvelles', icon: Zap, accent: 'text-blue-400', ring: 'border-l-blue-500', glow: 'hover:ring-blue-500/30', bg: 'from-blue-500/15 to-transparent', pill: 'bg-blue-500/20 text-blue-300' },
  { status: 'brewing', label: 'Préparation', icon: Coffee, accent: 'text-purple-400', ring: 'border-l-purple-500', glow: 'hover:ring-purple-500/30', bg: 'from-purple-500/15 to-transparent', pill: 'bg-purple-500/20 text-purple-300' },
  { status: 'preparing', label: 'Cuisine', icon: ChefHat, accent: 'text-amber-400', ring: 'border-l-amber-500', glow: 'hover:ring-amber-500/30', bg: 'from-amber-500/15 to-transparent', pill: 'bg-amber-500/20 text-amber-300' },
  { status: 'ready', label: 'Prêt', icon: PackageCheck, accent: 'text-emerald-400', ring: 'border-l-emerald-500', glow: 'hover:ring-emerald-500/30', bg: 'from-emerald-500/15 to-transparent', pill: 'bg-emerald-500/20 text-emerald-300' },
];

const NEXT: Record<OrderStatus, OrderStatus> = {
  new: 'brewing', brewing: 'preparing', preparing: 'ready', ready: 'completed', completed: 'completed',
};

const URGENT_MIN = 10;

/* ── Live Timer ── */
function LiveTimer({ createdAt }: { createdAt: Date }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const calc = () => setElapsed(Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [createdAt]);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  const urgent = m >= URGENT_MIN;
  return (
    <span className={cn('font-mono text-[11px] font-bold tabular-nums', urgent ? 'text-destructive' : m >= 5 ? 'text-amber-500' : 'text-success')}>
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}

/* ── Order Card ── */
function OrderCard({ order, col, compact, onAdvance }: { order: any; col: ColDef; compact: boolean; onAdvance: () => void }) {
  const mins = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
  const urgent = mins >= URGENT_MIN;
  const warming = mins >= 5 && !urgent;

  if (compact) return (
    <motion.div layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className={cn('flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2 shadow-sm', urgent && 'border-l-4 border-l-destructive bg-destructive/5')}>
      <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0">T{order.tableNumber}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate">{order.items.map((i: any) => `${i.quantity}× ${i.name}`).join(', ')}</p>
        <LiveTimer createdAt={order.createdAt} />
      </div>
      {urgent && <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0 animate-pulse" />}
      <button onClick={onAdvance} className={cn('shrink-0 p-1.5 rounded-lg transition-all active:scale-95', col.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white' : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground')}>
        <ArrowRight className="w-3 h-3" />
      </button>
    </motion.div>
  );

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.88, x: 40 }}
      whileHover={{ y: -3 }}
      className={cn('relative bg-card border border-border rounded-2xl p-4 shadow-sm transition-all hover:shadow-lg', col.glow, 'hover:ring-2',
        urgent && 'ring-2 ring-destructive/40 border-destructive/30', warming && 'ring-1 ring-amber-500/25')}>
      {urgent && (
        <div className="absolute -top-2.5 -right-2.5 bg-destructive text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg animate-bounce flex items-center gap-1 z-10">
          <AlertCircle className="w-2.5 h-2.5" /> URGENT
        </div>
      )}
      {warming && !urgent && (
        <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full z-10">{mins}m</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={cn('w-11 h-11 rounded-xl font-black text-sm flex items-center justify-center shadow-lg', urgent ? 'bg-destructive text-white' : 'bg-primary text-primary-foreground shadow-primary/25')}>
            T{order.tableNumber}
          </div>
          <div>
            <p className="text-xs font-black tracking-tight">#{order.id.slice(-4).toUpperCase()}</p>
            <LiveTimer createdAt={order.createdAt} />
          </div>
        </div>
        {/* Time bar */}
        <div className="flex flex-col items-end gap-1">
          <div className="w-14 h-1 bg-secondary/40 rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', urgent ? 'bg-destructive' : mins >= 5 ? 'bg-amber-500' : 'bg-success')}
              style={{ width: `${Math.min((mins / 15) * 100, 100)}%` }} />
          </div>
          {order.total > 0 && <span className="text-[10px] font-bold text-primary">{order.total.toFixed(3)} TND</span>}
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1.5 mb-4">
        {order.items.map((item: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <span className={cn('text-[10px] font-black w-6 text-center py-0.5 rounded-md', col.pill)}>{item.quantity}</span>
            <span className="text-xs font-medium text-foreground/85 truncate flex-1">{item.name}</span>
          </div>
        ))}
      </div>

      {/* Action */}
      <div className="pt-3 border-t border-border/60">
        <motion.button whileTap={{ scale: 0.95 }} onClick={onAdvance}
          className={cn('w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all',
            col.status === 'ready' ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
              : urgent ? 'bg-destructive/20 text-destructive hover:bg-destructive hover:text-white'
                : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground')}>
          {col.status === 'ready' ? '✓ Marquer Terminé' : 'Passer au suivant'}
          {col.status !== 'ready' && <ArrowRight className="w-3 h-3" />}
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ── History Panel ── */
function HistoryPanel({ onClose }: { onClose: () => void }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any[]>('/admin/orders/completed-today')
      .then(data => setHistory(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 h-full w-80 bg-card border-l border-border shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <h3 className="font-display font-black text-base">Complétées aujourd'hui</h3>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-secondary/40 transition-all"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-none">
        {loading && <div className="text-center py-10 text-muted-foreground text-xs">Chargement...</div>}
        {!loading && history.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-xs">Aucune commande complétée aujourd'hui</div>
        )}
        {history.map(o => (
          <div key={o.id} className="bg-secondary/10 border border-border rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black">T{o.table_number} · #{String(o.id).slice(-4).toUpperCase()}</span>
              <span className="text-[10px] font-bold text-success">{parseFloat(o.total_price || 0).toFixed(3)} TND</span>
            </div>
            <div className="space-y-0.5">
              {(o.items || []).map((item: any, i: number) => (
                <p key={i} className="text-[10px] text-muted-foreground"><span className="text-foreground font-bold">{item.quantity}×</span> {item.name}</p>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-border/40">
              <Timer className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{o.prep_minutes ?? '—'} min de préparation</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border shrink-0 bg-success/5">
        <p className="text-xs font-bold text-success text-center">{history.length} commande{history.length !== 1 ? 's' : ''} complétée{history.length !== 1 ? 's' : ''}</p>
      </div>
    </motion.div>
  );
}

/* ── Main Page ── */
export default function LiveOrdersPage() {
  const { orders, advanceOrderStatus, fetchOrders, user, dashboardStats } = useAppStore();
  const [compact, setCompact] = useState(false);
  const [filterTable, setFilterTable] = useState('');
  const [sortBy, setSortBy] = useState<'time' | 'table'>('time');
  const [showFilter, setShowFilter] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [, setTick] = useState(0);
  const prevCountRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playAlert = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
    } catch { /* ignore */ }
  }, [soundEnabled]);

  useEffect(() => {
    if (!user) return;
    fetchOrders().catch(console.error);
    const i = setInterval(() => {
      setTick(t => t + 1);
      fetchOrders().catch(console.error);
    }, 15000);
    return () => clearInterval(i);
  }, [fetchOrders, user]);

  // Sound alert on new orders
  useEffect(() => {
    const newCount = orders.filter(o => o.status === 'new').length;
    if (newCount > prevCountRef.current && prevCountRef.current > 0) playAlert();
    prevCountRef.current = newCount;
  }, [orders, playAlert]);

  const active = orders.filter(o => o.status !== 'completed');
  const urgent = active.filter(o => Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000) >= URGENT_MIN);
  const avgPrepTime = dashboardStats?.today.avg_prep_time_minutes;

  const getFiltered = (status: OrderStatus) => {
    let list = orders.filter(o => o.status === status);
    if (filterTable) list = list.filter(o => String(o.tableNumber).includes(filterTable));
    return sortBy === 'table'
      ? [...list].sort((a, b) => a.tableNumber - b.tableNumber)
      : [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  return (
    <div className="space-y-5 p-1">
      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Commandes actives', value: active.length, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Urgentes', value: urgent.length, icon: AlertCircle, color: urgent.length > 0 ? 'text-destructive' : 'text-muted-foreground', bg: urgent.length > 0 ? 'bg-destructive/10' : 'bg-secondary/20' },
          { label: 'Temps moy. prép.', value: avgPrepTime ? `${avgPrepTime} min` : '—', icon: Timer, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Prêtes', value: orders.filter(o => o.status === 'ready').length, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 shadow-sm">
            <div className={cn('p-2 rounded-xl', bg)}><Icon className={cn('w-4 h-4', color)} /></div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={cn('text-xl font-black font-display', color)}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/60 backdrop-blur-md px-5 py-4 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-display font-black tracking-tight flex items-center gap-2">
            Commandes en Direct
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
          </h1>
          {urgent.length > 0 && (
            <span className="text-[10px] font-black bg-destructive/20 text-destructive px-2 py-0.5 rounded-full animate-pulse">
              {urgent.length} urgente{urgent.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* History */}
          <button onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border bg-background border-border text-muted-foreground hover:text-foreground transition-all">
            <History className="w-3.5 h-3.5" /> Historique
          </button>
          {/* Sound */}
          <button onClick={() => setSoundEnabled(s => !s)}
            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all',
              soundEnabled ? 'bg-primary/10 text-primary border-primary/20' : 'bg-background border-border text-muted-foreground')}>
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          {/* Filter */}
          <button onClick={() => setShowFilter(f => !f)}
            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all',
              showFilter ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:text-foreground')}>
            <Filter className="w-3 h-3" /> Filtres
          </button>
          {/* Compact */}
          <button onClick={() => setCompact(c => !c)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border bg-background border-border text-muted-foreground hover:text-foreground transition-all">
            {compact ? <LayoutGrid className="w-3 h-3" /> : <List className="w-3 h-3" />}
            {compact ? 'Détaillé' : 'Compact'}
          </button>
          {/* Refresh */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-success/10 text-success border border-success/20 text-xs font-bold">
            <RefreshCw className="w-3 h-3 animate-spin [animation-duration:3s]" /> 15s
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <AnimatePresence>
        {showFilter && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 bg-card/60 border border-border rounded-2xl px-5 py-4">
              <div className="relative">
                <input type="text" value={filterTable} onChange={e => setFilterTable(e.target.value)}
                  placeholder="Filtrer par table..." className="pl-3 pr-8 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-44" />
                {filterTable && <button onClick={() => setFilterTable('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>}
              </div>
              <div className="flex items-center gap-1">
                <SortAsc className="w-3.5 h-3.5 text-muted-foreground" />
                {(['time', 'table'] as const).map(s => (
                  <button key={s} onClick={() => setSortBy(s)}
                    className={cn('px-3 py-1.5 rounded-xl text-xs font-bold transition-all', sortBy === s ? 'bg-primary text-primary-foreground' : 'bg-secondary/30 text-muted-foreground hover:text-foreground')}>
                    {s === 'time' ? 'Heure' : 'Table'}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Kanban Board ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
        {COLUMNS.map(col => {
          const colOrders = getFiltered(col.status);
          const Icon = col.icon;
          const pct = active.length > 0 ? Math.round((colOrders.length / active.length) * 100) : 0;

          return (
            <div key={col.status} className="flex flex-col gap-3">
              {/* Column Header */}
              <div className={cn('relative overflow-hidden bg-card border border-border border-l-4 rounded-2xl p-4 shadow-sm', col.ring)}>
                <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none', col.bg)} />
                <div className="relative flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn('p-1.5 rounded-xl bg-background/60 backdrop-blur-sm', col.accent)}><Icon className="w-4 h-4" /></div>
                    <div>
                      <h3 className="font-display font-black text-sm">{col.label}</h3>
                      <p className="text-[10px] text-muted-foreground">{colOrders.length} commande{colOrders.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <span className={cn('text-xs font-black px-2 py-1 rounded-xl', col.pill)}>{colOrders.length}</span>
                </div>
                <div className="w-full h-1 bg-border/40 rounded-full overflow-hidden">
                  <motion.div className={cn('h-full rounded-full', col.accent.replace('text-', 'bg-'))}
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
                </div>
                <p className="text-[9px] text-muted-foreground/50 mt-1 text-right font-mono">{pct}% du total actif</p>
              </div>

              {/* Cards container — independent scroll */}
              <div className={cn('flex flex-col gap-3 rounded-2xl bg-secondary/5 border border-dashed border-border/40 p-2 overflow-y-auto scrollbar-none', compact ? 'max-h-[320px]' : 'max-h-[600px]')}>
                <AnimatePresence mode="popLayout">
                  {colOrders.map(order => (
                    <OrderCard key={order.id} order={order} col={col} compact={compact}
                      onAdvance={() => advanceOrderStatus(order.id, NEXT[col.status])} />
                  ))}
                </AnimatePresence>
                {colOrders.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center mb-2">
                      <Icon className="w-5 h-5 text-muted-foreground/20" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/30">Aucune commande</p>
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── History Panel ── */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setShowHistory(false)} />
            <HistoryPanel onClose={() => setShowHistory(false)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
