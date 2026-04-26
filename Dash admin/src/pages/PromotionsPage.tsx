import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { Plus, Trash2, X, Loader2, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function PromotionsPage() {
  const { promotions, fetchPromotions, addPromotion, deletePromotion, togglePromotionStatus, loading } = useAppStore();
  const [showPanel, setShowPanel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPromo, setNewPromo] = useState({
    title: '',
    subtitle: '',
    tag: '',
    imageUrl: '',
    displayOrder: 0
  });

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const handleAdd = async () => {
    if (!newPromo.title || !newPromo.imageUrl) {
      toast.error('Title and Image URL are required');
      return;
    }
    setIsSubmitting(true);
    try {
      await addPromotion({
        ...newPromo,
        active: true,
        displayOrder: Number(newPromo.displayOrder) || 0
      });
      toast.success('Promotion added successfully');
      setNewPromo({ title: '', subtitle: '', tag: '', imageUrl: '', displayOrder: 0 });
      setShowPanel(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add promotion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;
    try {
      await deletePromotion(id);
      toast.success('Promotion deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete promotion');
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await togglePromotionStatus(id, current);
      toast.success('Status updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-foreground">Marketing & Promotions</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage the image banners on the mobile home screen</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowPanel(true)}
          className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4" /> Add Promotion
        </motion.button>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading carousel data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {promotions.map((promo) => (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl overflow-hidden group border border-espresso/5 shadow-sm"
            >
              <div className="aspect-[21/9] relative bg-secondary/30 overflow-hidden">
                <img 
                  src={promo.imageUrl} 
                  alt={promo.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary text-primary-foreground uppercase tracking-widest">
                      {promo.tag || 'PROMO'}
                    </span>
                  </div>
                  <h3 className="text-white font-display text-lg leading-tight">{promo.title}</h3>
                  <p className="text-white/70 text-xs line-clamp-1">{promo.subtitle}</p>
                </div>
              </div>
              
              <div className="p-4 flex items-center justify-between bg-card">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Status</span>
                    <button
                      onClick={() => handleToggle(promo.id, promo.active)}
                      className={cn(
                        'mt-1 w-9 h-4.5 rounded-full transition-colors relative',
                        promo.active ? 'bg-success' : 'bg-muted'
                      )}
                    >
                      <div className={cn(
                        'absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform',
                        promo.active ? 'left-5' : 'left-0.5'
                      )} />
                    </button>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Order</span>
                    <span className="text-sm font-display text-foreground mt-0.5">{promo.displayOrder}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDelete(promo.id)}
                    className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          
          {promotions.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-espresso/10 rounded-2xl bg-secondary/10">
              <ImageIcon className="w-12 h-12 text-espresso/20 mb-4" />
              <p className="text-espresso/40 font-display">No promotions active</p>
              <button 
                onClick={() => setShowPanel(true)}
                className="mt-4 text-primary text-sm font-bold hover:underline"
              >
                Create your first banner
              </button>
            </div>
          )}
        </div>
      )}

      {/* Slide Panel */}
      <AnimatePresence>
        {showPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPanel(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 h-full w-[400px] bg-card shadow-2xl z-[70] p-8 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-display text-xl text-foreground">New Promotion</h2>
                <button onClick={() => setShowPanel(false)} className="p-2 rounded-full hover:bg-secondary">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Title</label>
                  <input
                    value={newPromo.title}
                    onChange={(e) => setNewPromo({ ...newPromo, title: e.target.value })}
                    placeholder="e.g., Morning Magic"
                    className="w-full bg-secondary border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Subtitle</label>
                  <input
                    value={newPromo.subtitle}
                    onChange={(e) => setNewPromo({ ...newPromo, subtitle: e.target.value })}
                    placeholder="e.g., Buy 1 Get 1 on All Lattes"
                    className="w-full bg-secondary border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tag</label>
                    <input
                      value={newPromo.tag}
                      onChange={(e) => setNewPromo({ ...newPromo, tag: e.target.value })}
                      placeholder="-20% OFF"
                      className="w-full bg-secondary border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Order</label>
                    <input
                      type="number"
                      value={newPromo.displayOrder}
                      onChange={(e) => setNewPromo({ ...newPromo, displayOrder: parseInt(e.target.value) })}
                      className="w-full bg-secondary border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none text-center"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Image URL</label>
                  <div className="relative">
                    <input
                      value={newPromo.imageUrl}
                      onChange={(e) => setNewPromo({ ...newPromo, imageUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-secondary border-none rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                    <ExternalLink className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic mt-1">
                    Pro tip: Use Unsplash for high-quality coffee photography.
                  </p>
                </div>

                {newPromo.imageUrl && (
                  <div className="rounded-xl overflow-hidden aspect-[21/9] border border-espresso/10">
                    <img src={newPromo.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                  </div>
                )}

                <button
                  onClick={handleAdd}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 mt-4"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Launch Promotion'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
