import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { Bell, CheckCircle2, Clock, RefreshCw, Loader2, AlertCircle, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

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
      toast.success(`Table ${tableNumber} — Résolu ✓`);
    } catch (e: any) {
      toast.error(e.message || 'Échec de la validation');
    } finally {
      setHandlingId(null);
    }
  };

  const pending = assistanceRequests.filter((r) => !r.handled);
  const handled = assistanceRequests.filter((r) => r.handled);

  return (
    <div className="space-y-6 p-1">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card/60 backdrop-blur-md px-6 py-5 rounded-3xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-destructive/10 relative">
            <Bell className="w-6 h-6 text-destructive" />
            {pending.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-display font-black tracking-tight text-foreground">Demandes d'Assistance</h1>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" /> Temps Réel</span>
              <span>•</span>
              <span>Actualisation auto (15s)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {pending.length > 0 && (
            <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm font-bold rounded-xl border border-destructive/20 animate-pulse">
              {pending.length} EN ATTENTE
            </div>
          )}
          <button onClick={handleRefresh} disabled={refreshing}
            className="p-2.5 rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground transition-all hover:bg-secondary/30 disabled:opacity-50">
            <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'En attente', value: pending.length, icon: AlertCircle, color: pending.length > 0 ? 'text-destructive' : 'text-success', bg: pending.length > 0 ? 'bg-destructive/10' : 'bg-success/10' },
          { label: 'Résolues', value: handled.length, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Total Aujourd\'hui', value: assistanceRequests.length, icon: History, color: 'text-primary', bg: 'bg-primary/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="flex items-center gap-3 bg-card border border-border rounded-3xl px-5 py-4 shadow-sm hover:shadow-md transition-shadow">
            <div className={cn('p-3 rounded-2xl', bg)}><Icon className={cn('w-6 h-6', color)} /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className={cn('text-3xl font-black font-display leading-none mt-1', color)}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Pending Column ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 px-2">
            <h2 className="font-display font-black text-lg text-foreground flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" /> À Traiter
            </h2>
          </div>

          {pending.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="h-64 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-muted-foreground bg-card/30 backdrop-blur-sm">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <p className="font-display font-black text-xl text-foreground">Tout est sous contrôle !</p>
              <p className="text-sm mt-1">Aucune table n'a besoin d'assistance pour le moment.</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {pending.map((req) => {
                  const minutes = Math.floor((Date.now() - req.requestedAt.getTime()) / 60000);
                  const urgent = minutes > 5;

                  return (
                    <motion.div key={req.id} layout
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                      className={cn("bg-card border rounded-3xl p-5 shadow-sm transition-all flex items-center gap-5 relative overflow-hidden",
                        urgent ? "border-destructive/40 shadow-destructive/10" : "border-border hover:shadow-md")}>

                      {urgent && <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />}

                      {/* Table Badge */}
                      <div className={cn("w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-inner border",
                        urgent ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-primary/10 text-primary border-primary/20")}>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-0.5">Table</span>
                        <span className="font-display font-black text-2xl leading-none">{req.tableNumber}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {urgent && <span className="text-[10px] font-black uppercase tracking-wider bg-destructive text-white px-2 py-0.5 rounded-lg animate-pulse">Urgent</span>}
                          <span className="text-sm font-bold text-foreground">Appel Serveur</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className={cn("w-3.5 h-3.5", urgent ? "text-destructive" : "text-muted-foreground")} />
                          <span className={cn("text-xs font-medium", urgent ? "text-destructive" : "text-muted-foreground")}>
                            Il y a {minutes === 0 ? "quelques secondes" : `${minutes} min`}
                          </span>
                          <span className="text-muted-foreground/30">•</span>
                          <span className="text-xs font-mono text-muted-foreground">{format(req.requestedAt, 'HH:mm')}</span>
                        </div>
                      </div>

                      {/* Action */}
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => onHandle(req.id, req.tableNumber)}
                        disabled={handlingId === req.id}
                        className={cn("h-12 px-6 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg text-sm",
                          urgent ? "bg-destructive text-white hover:brightness-110 shadow-destructive/20" : "bg-primary text-primary-foreground hover:brightness-110 shadow-primary/20")}>
                        {handlingId === req.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="hidden sm:inline">Marquer Résolu</span>
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ── History Column ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <h2 className="font-display font-black text-lg text-muted-foreground flex items-center gap-2">
              <History className="w-5 h-5" /> Historique
            </h2>
          </div>

          <div className="bg-card/50 border border-border rounded-3xl p-5 shadow-sm">
            {handled.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p className="text-sm">Aucun historique pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-secondary">
                {handled.map((req) => (
                  <div key={req.id} className="flex items-center gap-3 p-3 rounded-2xl bg-background border border-border/50 opacity-70">
                    <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center font-display font-black text-success border border-success/20">
                      T{req.tableNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground">Assistance terminée</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {formatDistanceToNow(req.requestedAt, { addSuffix: true })}
                      </p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
