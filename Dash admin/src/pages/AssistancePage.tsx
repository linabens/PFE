import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { Bell, CheckCircle2, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.06 } } },
  item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
};

export default function AssistancePage() {
  const { assistanceRequests, handleAssistance, fetchAssistance } = useAppStore();
  const [handlingId, setHandlingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Poll every 15s
  useEffect(() => {
    fetchAssistance().catch(console.error); // Fetch immediately on mount
    
    const interval = setInterval(() => {
      fetchAssistance().catch(console.error);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchAssistance]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAssistance().catch(console.error);
    setRefreshing(false);
  };

  const onHandle = async (id: string, tableNumber: number) => {
    setHandlingId(id);
    try {
      await handleAssistance(id);
      toast.success(`Table ${tableNumber} — request handled ✓`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to mark as handled');
    } finally {
      setHandlingId(null);
    }
  };

  const pending = assistanceRequests.filter((r) => !r.handled);
  const handled = assistanceRequests.filter((r) => r.handled);

  return (
    <motion.div
      variants={stagger.container}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display text-foreground">Assistance Requests</h1>
          {pending.length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-2.5 py-0.5 rounded-full bg-destructive text-white text-xs font-bold animate-pulse"
            >
              {pending.length} PENDING
            </motion.span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse-dot" />
          <span>Live — auto-refreshes every 15s</span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="ml-2 p-1.5 rounded-md hover:bg-secondary transition-colors"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-muted-foreground', refreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Stat Strip */}
      <motion.div variants={stagger.container} className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', value: pending.length, color: pending.length > 0 ? 'text-destructive' : 'text-success' },
          { label: 'Handled', value: handled.length, color: 'text-success' },
          { label: 'Total Today', value: assistanceRequests.length, color: 'text-foreground' },
        ].map((s) => (
          <motion.div key={s.label} variants={stagger.item} className="glass-card rounded-xl p-5 text-center">
            <p className={cn('font-display text-3xl', s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Pending Requests */}
      <motion.div variants={stagger.item} className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-destructive" />
          <h2 className="font-display text-foreground">Pending</h2>
        </div>

        {pending.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-success" />
            </div>
            <p className="font-display text-foreground">All clear!</p>
            <p className="text-sm text-muted-foreground">No pending assistance requests</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {pending.map((req) => {
                const minutes = Math.floor((Date.now() - req.requestedAt.getTime()) / 60000);
                const urgent = minutes > 5;
                return (
                  <motion.div
                    key={req.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl border transition-all',
                      urgent
                        ? 'bg-destructive/5 border-destructive/30'
                        : 'bg-secondary/40 border-border'
                    )}
                  >
                    {/* Table badge */}
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold font-display shrink-0',
                        urgent ? 'bg-destructive/20 text-destructive' : 'bg-primary/15 text-primary'
                      )}
                    >
                      T{req.tableNumber}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">Table {req.tableNumber}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock className={cn('w-3 h-3', urgent ? 'text-destructive' : 'text-muted-foreground')} />
                        <span className={cn('text-xs', urgent ? 'text-destructive font-semibold' : 'text-muted-foreground')}>
                          {minutes === 0 ? 'Just now' : `${minutes} min ago`}
                          {urgent && ' — URGENT'}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                        {format(req.requestedAt, 'HH:mm:ss')}
                      </p>
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => onHandle(req.id, req.tableNumber)}
                      disabled={handlingId === req.id}
                      className={cn(
                        'h-9 px-5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all',
                        urgent
                          ? 'bg-destructive text-white hover:bg-destructive/80'
                          : 'bg-primary text-primary-foreground hover:bg-primary/80'
                      )}
                    >
                      {handlingId === req.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Handle
                        </>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </motion.div>

      {/* Handled / History */}
      {handled.length > 0 && (
        <motion.div variants={stagger.item} className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <h2 className="font-display text-foreground">Handled</h2>
          </div>
          <div className="space-y-2">
            {handled.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 opacity-60"
              >
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center text-sm font-bold font-display text-success shrink-0">
                  T{req.tableNumber}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">Table {req.tableNumber}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {format(req.requestedAt, 'HH:mm:ss')} · {formatDistanceToNow(req.requestedAt, { addSuffix: true })}
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-medium">
                  Done
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
