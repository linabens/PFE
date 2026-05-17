import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import {
  QrCode, Plus, Users, Eye, RefreshCw, X, Trash2,
  Loader2, Unlock, Download, Coffee, CheckCircle2, AlertTriangle, Wifi, Search, Filter, Printer, History, RotateCcw
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

const buildScanUrl = (qrCode: string) =>
  `http://${window.location.hostname}:3000/api/sessions/scan/${qrCode}`;

const STATUS_CONFIG = {
  free: { label: 'Libre', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
  occupied: { label: 'Occupée', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', dot: 'bg-primary animate-pulse' },
  'needs-attention': { label: 'Assistance', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20', dot: 'bg-destructive animate-pulse' },
};

export default function TablesPage() {
  const { tables, addTable, deleteTable, fetchTables, loading, freeTable, regenerateTableQr, fetchTableHistory } = useAppStore();
  const [viewQR, setViewQR] = useState<{ id: string; number: number; qrCode: string } | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTable, setNewTable] = useState({ number: '', capacity: '2' });
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; number: number } | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<{ id: string; number: number } | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  useEffect(() => {
    if (showHistory) {
      setLoadingHistory(true);
      fetchTableHistory(showHistory.id)
        .then(data => setHistoryData(data))
        .catch(() => toast.error("Erreur lors du chargement de l'historique"))
        .finally(() => setLoadingHistory(false));
    } else {
      setHistoryData([]);
    }
  }, [showHistory, fetchTableHistory]);


  const totalFree = tables.filter(t => t.status === 'free').length;
  const totalOccupied = tables.filter(t => t.status === 'occupied').length;
  const totalAttention = tables.filter(t => t.status === 'needs-attention').length;

  const filteredTables = useMemo(() => {
    return tables.filter(t => {
      if (search && !String(t.number).includes(search)) return false;
      if (filterStatus && t.status !== filterStatus) return false;
      return true;
    });
  }, [tables, search, filterStatus]);


  const handleAddTable = async () => {
    if (!newTable.number) return;
    setIsSubmitting(true);
    try {
      await addTable({ number: parseInt(newTable.number), capacity: parseInt(newTable.capacity) });
      toast.success(`Table ${newTable.number} créée avec succès`);
      setNewTable({ number: '', capacity: '2' });
      setShowAddPanel(false);
    } catch (error: any) {
      toast.error(error.message || 'Échec de la création');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTable = async () => {
    if (!confirmDelete) return;
    try {
      await deleteTable(confirmDelete.id);
      toast.success(`Table ${confirmDelete.number} supprimée`);
      setConfirmDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Échec de la suppression');
    }
  };

  const handleFreeTable = async (id: string, number: number) => {
    try {
      await freeTable(id);
      toast.success(`Table ${number} libérée avec succès`);
    } catch (error: any) {
      toast.error(error.message || 'Échec');
    }
  };

  const handleRegenerateQr = async (id: string) => {
    if (!confirm("Voulez-vous vraiment régénérer ce QR Code ? L'ancien code deviendra invalide.")) return;
    setIsRegenerating(true);
    try {
      const res = await regenerateTableQr(id);
      if (viewQR && viewQR.id === id) {
        setViewQR({ ...viewQR, qrCode: res.qr_code });
      }
      toast.success('QR Code régénéré avec succès');
    } catch (error: any) {
      toast.error(error.message || 'Échec de la régénération');
    } finally {
      setIsRegenerating(false);
    }
  }

  const downloadQRCode = (tableNumber: number) => {
    const svg = document.getElementById('qr-download');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 60;
      canvas.height = img.height + 80;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 30, 30);
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Table ${tableNumber} — Coffee Time`, canvas.width / 2, canvas.height - 15);
        const link = document.createElement('a');
        link.download = `table-${tableNumber}-qr.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const printQRCode = () => {
    const svg = document.getElementById('qr-download');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const printWindow = window.open('', '', 'width=600,height=600');
    if (printWindow) {
      printWindow.document.write(`
              <html>
                  <head>
                      <title>Imprimer QR Code Table ${viewQR?.number}</title>
                      <style>
                          body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; }
                          h1 { margin-bottom: 20px; }
                      </style>
                  </head>
                  <body>
                      <h1>Table ${viewQR?.number}</h1>
                      ${svgData}
                      <p style="margin-top:20px; color:#666;">Coffee Time</p>
                  </body>
              </html>
          `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  }

  return (
    <div className="space-y-6 p-1">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card/60 backdrop-blur-md px-6 py-5 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10"><QrCode className="w-5 h-5 text-primary" /></div>
            Tables & QR Codes
          </h1>
          <p className="text-xs text-muted-foreground mt-1 ml-11">{tables.length} tables configurées sur le plancher</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Chercher une table..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setFilterStatus(null)}
              className={cn("px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all", filterStatus === null ? "bg-secondary text-foreground" : "bg-transparent text-muted-foreground hover:bg-secondary/50")}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilterStatus('free')}
              className={cn("px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all", filterStatus === 'free' ? "bg-emerald-500/20 text-emerald-500" : "bg-transparent text-muted-foreground hover:bg-secondary/50")}
            >
              Libres
            </button>
            <button
              onClick={() => setFilterStatus('occupied')}
              className={cn("px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all", filterStatus === 'occupied' ? "bg-primary/20 text-primary" : "bg-transparent text-muted-foreground hover:bg-secondary/50")}
            >
              Occupées
            </button>
            <button
              onClick={() => setFilterStatus('needs-attention')}
              className={cn("px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all", filterStatus === 'needs-attention' ? "bg-destructive/20 text-destructive" : "bg-transparent text-muted-foreground hover:bg-secondary/50")}
            >
              Assistance
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-auto">
          <button onClick={fetchTables} className="p-2.5 rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground transition-all hover:bg-secondary/30">
            <RefreshCw className="w-4 h-4" />
          </button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowAddPanel(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all whitespace-nowrap">
            <Plus className="w-4 h-4" /> Nouvelle
          </motion.button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Libres', value: totalFree, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Occupées', value: totalOccupied, icon: Coffee, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Assistance', value: totalAttention, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="flex items-center gap-3 bg-card border border-border rounded-2xl px-5 py-4 shadow-sm">
            <div className={cn('p-2.5 rounded-xl', bg)}><Icon className={cn('w-5 h-5', color)} /></div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={cn('text-2xl font-black font-display leading-none', color)}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Grid ── */}
      {loading && tables.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Chargement des tables...</p>
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="h-64 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-muted-foreground">
          <QrCode className="w-10 h-10 mb-3 opacity-20" />
          <p className="font-medium">Aucune table trouvée</p>
          <p className="text-xs mt-1">Modifiez vos filtres ou créez une nouvelle table.</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredTables.map(table => {
              const s = STATUS_CONFIG[table.status] || STATUS_CONFIG.free;
              return (
                <motion.div key={table.id} layout
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -4 }}
                  className={cn('group relative bg-card border border-border rounded-3xl p-5 shadow-sm transition-all hover:shadow-xl flex flex-col', s.border, 'border')}>

                  {/* Actions Header */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full', s.dot)} />
                      <span className={cn('text-[10px] font-black uppercase tracking-wider', s.color)}>{s.label}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => setShowHistory({ id: table.id, number: table.number })} title="Historique"
                        className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <History className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setConfirmDelete({ id: table.id, number: table.number })} title="Supprimer"
                        className="p-1.5 rounded-xl hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Table number + Mini QR */}
                  <div className="flex items-start justify-between mb-4 flex-1">
                    <div>

                      <p className="font-display font-black text-4xl text-foreground leading-none mb-1">{table.number}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground">{table.capacity} places</span>
                      </div>
                    </div>
                    {/* Mini QR */}
                    <button onClick={() => setViewQR({ id: table.id, number: table.number, qrCode: table.qrCode })} className="p-2 bg-white rounded-xl shadow-sm hover:scale-105 transition-transform cursor-pointer border border-border hover:border-primary/50">
                      <QRCode value={table.qrCode ? buildScanUrl(table.qrCode) : `table-${table.number}`} size={52} level="M" />
                    </button>
                  </div>

                  {/* Active sessions / orders badges */}
                  <div className="flex items-center gap-2 mb-4 h-6">
                    {(table.activeOrders > 0 || table.activeSessions > 0) && (
                      <>
                        {table.activeOrders > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            <Coffee className="w-2.5 h-2.5" /> {table.activeOrders} <span className="hidden sm:inline">cmd</span>
                          </span>
                        )}
                        {table.activeSessions > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-secondary/50 text-muted-foreground px-2 py-0.5 rounded-full">
                            <Wifi className="w-2.5 h-2.5" /> {table.activeSessions} <span className="hidden sm:inline">sess</span>
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="flex gap-2">
                    <button onClick={() => setViewQR({ id: table.id, number: table.number, qrCode: table.qrCode })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-secondary/30 hover:bg-secondary/60 text-xs font-bold text-foreground transition-all">
                      <QrCode className="w-3.5 h-3.5" /> QR
                    </button>
                    {table.status !== 'free' ? (
                      <button onClick={() => handleFreeTable(table.id, table.number)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold border border-primary/20 transition-all">
                        <Unlock className="w-3.5 h-3.5" /> Libérer
                      </button>
                    ) : (
                      <div className="flex-1 py-2" /> // spacer
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Add Table Panel ── */}
      <AnimatePresence>
        {showAddPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddPanel(false)} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-[400px] max-w-full bg-card border-l border-border z-50 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10"><Plus className="w-4 h-4 text-primary" /></div>
                  <h2 className="font-display font-black text-lg">Nouvelle Table</h2>
                </div>
                <button onClick={() => setShowAddPanel(false)} className="p-2 rounded-xl hover:bg-secondary/40 transition-all">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Numéro de Table</label>
                  <input type="number" value={newTable.number}
                    onChange={e => setNewTable({ ...newTable, number: e.target.value })}
                    placeholder="ex: 10"
                    className="w-full px-4 py-3.5 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Capacité (Places)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['2', '4', '6', '8'].map(cap => (
                      <button key={cap} onClick={() => setNewTable({ ...newTable, capacity: cap })}
                        className={cn('py-3 rounded-2xl text-sm font-bold border transition-all', newTable.capacity === cap ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:text-foreground')}>
                        {cap}
                      </button>
                    ))}
                  </div>
                  <input type="number" value={newTable.capacity}
                    onChange={e => setNewTable({ ...newTable, capacity: e.target.value })}
                    placeholder="Autre..."
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                </div>

                {newTable.number && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-secondary/10 border border-border rounded-2xl flex flex-col items-center gap-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Aperçu QR Code</p>
                    <div className="p-4 bg-white rounded-2xl shadow-lg">
                      <QRCode value={`https://coffeetime.app/table/${newTable.number}`} size={160} level="H" />
                    </div>
                    <div className="text-center">
                      <p className="font-display font-black text-3xl text-foreground">Table {newTable.number}</p>
                      <p className="text-xs text-muted-foreground mt-1">{newTable.capacity} places</p>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="p-6 border-t border-border shrink-0">
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={handleAddTable} disabled={isSubmitting || !newTable.number}
                  className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 transition-all">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-4 h-4" /> Créer la Table</>}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── QR Modal ── */}
      <AnimatePresence>
        {viewQR !== null && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setViewQR(null)} className="fixed inset-0 bg-black/40 backdrop-blur-md z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card border border-border rounded-3xl p-8 w-[400px] max-w-[90vw] text-center shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10"><QrCode className="w-4 h-4 text-primary" /></div>
                  <div className="text-left">
                    <h3 className="font-display font-black text-lg">Table {viewQR.number}</h3>
                    <p className="text-xs text-muted-foreground">Accès direct</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleRegenerateQr(viewQR.id)} disabled={isRegenerating} title="Régénérer le QR Code" className="p-2 rounded-xl hover:bg-secondary/40 text-primary transition-all disabled:opacity-50">
                    <RotateCcw className={cn("w-4 h-4", isRegenerating && "animate-spin")} />
                  </button>
                  <button onClick={() => setViewQR(null)} className="p-2 rounded-xl hover:bg-secondary/40 transition-all">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl mx-auto w-fit shadow-inner mb-6 border border-border">
                <QRCode id="qr-download"
                  value={viewQR.qrCode ? buildScanUrl(viewQR.qrCode) : `table-${viewQR.number}`}
                  size={200} level="H" />
              </div>

              <div className="bg-secondary/30 rounded-2xl px-4 py-3 mb-6 border border-border/50 text-left">
                <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">Lien Encoded</p>
                <p className="font-mono text-xs text-foreground break-all truncate">
                  {viewQR.qrCode ? buildScanUrl(viewQR.qrCode) : `table-${viewQR.number}`}
                </p>
              </div>

              <div className="flex gap-2">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => downloadQRCode(viewQR.number)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary/50 text-foreground text-sm font-bold hover:bg-secondary transition-all">
                  <Download className="w-4 h-4" /> Sauvegarder
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={printQRCode}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all">
                  <Printer className="w-4 h-4" /> Imprimer
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Table History Modal ── */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowHistory(null)} className="fixed inset-0 bg-black/40 backdrop-blur-md z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.9, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9, x: 20 }}
              className="fixed top-0 right-0 h-full w-[400px] max-w-full bg-card border-l border-border z-50 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-secondary/50"><History className="w-4 h-4 text-foreground" /></div>
                  <div>
                    <h2 className="font-display font-black text-lg">Historique</h2>
                    <p className="text-xs text-muted-foreground">Table {showHistory.number}</p>
                  </div>
                </div>
                <button onClick={() => setShowHistory(null)} className="p-2 rounded-xl hover:bg-secondary/40 transition-all">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingHistory ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-xs">Chargement...</span>
                  </div>
                ) : historyData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-center">
                    <History className="w-8 h-8 mb-2 opacity-20" />
                    <span className="text-sm">Aucune commande récente</span>
                  </div>
                ) : (
                  historyData.map(order => (
                    <div key={order.id} className="bg-secondary/10 border border-border p-4 rounded-2xl">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs font-bold text-foreground">#{String(order.id).slice(-4).toUpperCase()}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
                        </div>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", order.status === 'completed' ? "bg-success/20 text-success" : "bg-primary/20 text-primary")}>
                          {order.status === 'completed' ? 'Complétée' : 'En cours'}
                        </span>
                      </div>
                      <div className="space-y-1 mb-3">
                        {(order.items || []).map((item: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs text-muted-foreground">
                            <span><span className="font-bold text-foreground">{item.quantity}×</span> {item.name}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-border/50">
                        <span className="text-[10px] text-muted-foreground">
                          {order.duration_minutes ? `${order.duration_minutes} min` : '-'}
                        </span>
                        <span className="text-xs font-black text-foreground">{parseFloat(order.total_price || 0).toFixed(3)} TND</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Confirm Delete Dialog ── */}
      <AnimatePresence>
        {confirmDelete && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmDelete(null)} className="fixed inset-0 bg-black/40 backdrop-blur-md z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card border border-border rounded-3xl p-8 w-[360px] max-w-[90vw] text-center shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="font-display font-black text-lg mb-2">Supprimer la Table {confirmDelete.number} ?</h3>
              <p className="text-sm text-muted-foreground mb-6">Cette action est irréversible. Les sessions et commandes liées seront dissociées.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-3 rounded-2xl bg-secondary/40 text-foreground text-sm font-bold hover:bg-secondary/60 transition-all">Annuler</button>
                <button onClick={handleDeleteTable}
                  className="flex-1 py-3 rounded-2xl bg-destructive text-white text-sm font-bold hover:brightness-110 transition-all">Supprimer</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
