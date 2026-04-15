import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { QrCode, Plus, Users, Eye, RefreshCw, X, Trash2, Loader2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.05 } } },
  item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
};

export default function TablesPage() {
  const { tables, addTable, deleteTable, fetchTables, loading } = useAppStore();

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);
  const [viewQR, setViewQR] = useState<number | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTable, setNewTable] = useState({ number: '', capacity: '2' });

  const handleAddTable = async () => {
    if (!newTable.number) return;
    setIsSubmitting(true);
    try {
      await addTable({
        number: parseInt(newTable.number),
        capacity: parseInt(newTable.capacity)
      });
      toast.success(`Table ${newTable.number} added successfully`);
      setNewTable({ number: '', capacity: '2' });
      setShowAddPanel(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add table');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTable = async (id: string, number: number) => {
    if (!confirm(`Are you sure you want to delete Table ${number}?`)) return;
    try {
      await deleteTable(id);
      toast.success(`Table ${number} deleted`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete table');
    }
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('qr-code-download');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width + 40; // Add padding
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `table-${viewQR}-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-foreground">Tables & QR Codes</h1>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowAddPanel(true)}
          className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Table
        </motion.button>
      </div>

      <motion.div variants={stagger.container} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading && tables.length === 0 ? (
          <div className="col-span-full h-48 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Scanning floor for tables...</p>
          </div>
        ) : (
          tables.map((table) => (
            <motion.div
              key={table.id}
              variants={stagger.item}
              whileHover={{ y: -3 }}
              className={cn(
                'glass-card rounded-xl p-5 transition-all relative group',
                table.status === 'occupied' && 'border-primary/30',
                table.status === 'needs-attention' && 'border-destructive/30'
              )}
            >
              <button
                onClick={() => handleDeleteTable(table.id, table.number)}
                className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-destructive/15 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-display text-3xl text-foreground">{table.number}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{table.capacity} seats</span>
                  </div>
                </div>
                <span className={cn(
                  'text-[10px] px-2.5 py-1 rounded-full font-medium capitalize',
                  table.status === 'free' && 'bg-secondary text-muted-foreground',
                  table.status === 'occupied' && 'bg-primary/15 text-primary',
                  table.status === 'needs-attention' && 'bg-destructive/15 text-destructive'
                )}>
                  {table.status.replace('-', ' ')}
                </span>
              </div>

              {/* Micro QR preview */}
              <div className="w-full aspect-square max-w-[120px] mx-auto mb-4 p-2 bg-foreground rounded-lg flex items-center justify-center">
                <QRCode
                  value={`https://coffeetime.app/table/${table.number}`}
                  size={104}
                  level="M"
                />
              </div>

              {table.activeOrders > 0 && (
                <p className="text-xs text-primary text-center mb-3">
                  {table.activeOrders} active order{table.activeOrders > 1 ? 's' : ''}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setViewQR(table.number)}
                  className="flex-1 h-8 rounded-md bg-secondary hover:bg-secondary/80 text-xs text-foreground flex items-center justify-center gap-1 transition-colors"
                >
                  <Eye className="w-3 h-3" /> View QR
                </button>
                <button className="h-8 px-3 rounded-md bg-secondary hover:bg-secondary/80 text-xs text-foreground flex items-center justify-center gap-1 transition-colors">
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))
        )}
        {!loading && tables.length === 0 && (
          <div className="col-span-full h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground">
            <QrCode className="w-8 h-8 mb-2 opacity-20" />
            <p>No tables configured yet</p>
          </div>
        )}
      </motion.div>

      {/* Add Table Panel */}
      <AnimatePresence>
        {showAddPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddPanel(false)}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 h-full w-[400px] max-w-full bg-card border-l border-border z-50 p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-display text-xl text-foreground">Add New Table</h2>
                <button onClick={() => setShowAddPanel(false)} className="p-2 rounded-lg hover:bg-secondary">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Table Number</label>
                  <input
                    type="number"
                    value={newTable.number}
                    onChange={(e) => setNewTable({ ...newTable, number: e.target.value })}
                    placeholder="e.g. 10"
                    className="w-full h-11 px-4 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Capacity (Seats)</label>
                  <input
                    type="number"
                    value={newTable.capacity}
                    onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
                    placeholder="e.g. 4"
                    className="w-full h-11 px-4 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {newTable.number && (
                  <div className="p-6 bg-secondary/30 rounded-2xl border border-border flex flex-col items-center gap-4">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">QR Code Preview</p>
                    <div className="p-3 bg-foreground rounded-xl">
                      <QRCode 
                        value={`https://coffeetime.app/table/${newTable.number}`} 
                        size={160} 
                        level="H" 
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground break-all">
                      https://coffeetime.app/table/{newTable.number}
                    </p>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddTable}
                  disabled={isSubmitting || !newTable.number}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-display flex items-center justify-center gap-2 shadow-lg shadow-primary/20 mt-8 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Table'}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* QR Modal */}
      {viewQR !== null && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-background/70 backdrop-blur-sm z-50"
            onClick={() => setViewQR(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card border border-border rounded-2xl p-8 w-[360px] max-w-[90vw] text-center"
          >
            <h3 className="font-display text-xl text-foreground mb-2">Table {viewQR}</h3>
            <div className="mx-auto w-48 h-48 p-3 bg-foreground rounded-xl mb-4 flex items-center justify-center">
              <QRCode 
                id="qr-code-download"
                value={`https://coffeetime.app/table/${viewQR}`} 
                size={168} 
                level="H" 
              />
            </div>
            <p className="font-mono text-xs text-muted-foreground mb-4 break-all">
              https://coffeetime.app/table/{viewQR}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={downloadQRCode}
                className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                Download PNG
              </button>
              <button
                onClick={() => setViewQR(null)}
                className="flex-1 h-9 rounded-lg bg-secondary text-foreground text-sm font-medium"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
