import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { Plus, Trash2, X, Loader2, Image as ImageIcon, ExternalLink, Megaphone, Target, BarChart3, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function PromotionsPage() {
  const { promotions, fetchPromotions, addPromotion, deletePromotion, togglePromotionStatus, loading } = useAppStore();
  const [showPanel, setShowPanel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);
  const [newPromo, setNewPromo] = useState({
    title: '', subtitle: '', tag: '', imageUrl: '', displayOrder: 0
  });

  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

  const handleAdd = async () => {
    if (!newPromo.title || !newPromo.imageUrl) {
      toast.error('Le titre et l\'image sont obligatoires');
      return;
    }
    setIsSubmitting(true);
    try {
      await addPromotion({ ...newPromo, active: true, displayOrder: Number(newPromo.displayOrder) || 0 });
      toast.success('Promotion ajoutée avec succès');
      setNewPromo({ title: '', subtitle: '', tag: '', imageUrl: '', displayOrder: 0 });
      setShowPanel(false);
    } catch (error: any) {
      toast.error(error.message || 'Échec de l\'ajout');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deletePromotion(confirmDelete.id);
      toast.success('Promotion supprimée');
      setConfirmDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Échec de la suppression');
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await togglePromotionStatus(id, current);
      toast.success('Statut de la promotion mis à jour');
    } catch (error: any) {
      toast.error(error.message || 'Échec de la mise à jour');
    }
  };

  const totalPromos = promotions.length;
  const activePromos = promotions.filter(p => p.active).length;

  return (
    <div className="space-y-6 p-1">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card/60 backdrop-blur-md px-6 py-5 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10"><Megaphone className="w-5 h-5 text-primary" /></div>
            Marketing & Promotions
          </h1>
          <p className="text-xs text-muted-foreground mt-1 ml-11">Gérez les bannières affichées sur l'application client</p>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-auto">
          <button onClick={fetchPromotions} className="p-2.5 rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground transition-all hover:bg-secondary/30">
            <RefreshCw className="w-4 h-4" />
          </button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowPanel(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all whitespace-nowrap">
            <Plus className="w-4 h-4" /> Nouvelle Campagne
          </motion.button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: 'Total Campagnes', value: totalPromos, icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Campagnes Diffusées', value: activePromos, icon: BarChart3, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
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
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Chargement des campagnes...</p>
        </div>
      ) : promotions.length === 0 ? (
        <div className="h-64 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-muted-foreground">
          <Megaphone className="w-10 h-10 mb-3 opacity-20" />
          <p className="font-medium">Aucune campagne active</p>
          <p className="text-xs mt-1">Créez votre première bannière pour animer l'application.</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {promotions.map((promo) => (
              <motion.div key={promo.id} layout
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                className={cn("glass-card rounded-3xl overflow-hidden group shadow-sm hover:shadow-xl transition-all border border-border flex flex-col", !promo.active && "opacity-70 grayscale")}>

                {/* Image Banner */}
                <div className="aspect-[21/9] relative bg-secondary/30 overflow-hidden border-b border-border/50">
                  <img src={promo.imageUrl} alt={promo.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800'; }} />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-5">
                    {promo.tag && (
                      <div className="mb-2">
                        <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-primary text-primary-foreground uppercase tracking-wider shadow-lg">
                          {promo.tag}
                        </span>
                      </div>
                    )}
                    <h3 className="text-white font-display font-black text-2xl leading-none mb-1">{promo.title}</h3>
                    <p className="text-white/80 text-xs font-medium line-clamp-1">{promo.subtitle}</p>
                  </div>
                </div>

                {/* Controls */}
                <div className="p-5 flex items-center justify-between bg-card flex-1">
                  <div className="flex items-center gap-6">
                    {/* Switch */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Diffusion</span>
                      <label className="relative inline-flex items-center cursor-pointer" title={promo.active ? "Désactiver" : "Activer"}>
                        <input type="checkbox" className="sr-only peer" checked={promo.active} onChange={() => handleToggle(promo.id, !promo.active)} />
                        <div className="w-11 h-6 bg-secondary border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success peer-checked:border-success"></div>
                      </label>
                    </div>

                    {/* Order */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Ordre</span>
                      <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center font-display font-black text-foreground border border-border shadow-inner">
                        {promo.displayOrder}
                      </div>
                    </div>
                  </div>

                  {/* Delete */}
                  <button onClick={() => setConfirmDelete({ id: promo.id, title: promo.title })}
                    className="p-3 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Slide Panel ── */}
      <AnimatePresence>
        {showPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPanel(false)} className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-[450px] max-w-full bg-card shadow-2xl z-[70] flex flex-col border-l border-border">
              <div className="flex items-center justify-between p-6 border-b border-border shrink-0 bg-secondary/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10"><Megaphone className="w-5 h-5 text-primary" /></div>
                  <div>
                    <h2 className="font-display font-black text-xl">Nouvelle Campagne</h2>
                    <p className="text-xs text-muted-foreground">Création de bannière promotionnelle</p>
                  </div>
                </div>
                <button onClick={() => setShowPanel(false)} className="p-2 rounded-xl hover:bg-secondary/60 transition-all">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Titre Principal</label>
                  <input value={newPromo.title} onChange={(e) => setNewPromo({ ...newPromo, title: e.target.value })}
                    placeholder="ex: Matin Magique"
                    className="w-full px-4 py-3.5 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sous-titre / Description</label>
                  <input value={newPromo.subtitle} onChange={(e) => setNewPromo({ ...newPromo, subtitle: e.target.value })}
                    placeholder="ex: 1 Café acheté = 1 Croissant offert"
                    className="w-full px-4 py-3.5 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tag (Badge)</label>
                    <input value={newPromo.tag} onChange={(e) => setNewPromo({ ...newPromo, tag: e.target.value })}
                      placeholder="-20% OFF"
                      className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Ordre d'Affichage</label>
                    <input type="number" value={newPromo.displayOrder} onChange={(e) => setNewPromo({ ...newPromo, displayOrder: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-mono" />
                  </div>
                </div>

                <div className="space-y-1.5 pt-4 border-t border-border/50">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5" /> URL de l'image (Format paysage)
                  </label>
                  <div className="relative">
                    <input value={newPromo.imageUrl} onChange={(e) => setNewPromo({ ...newPromo, imageUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-4 py-3 pr-10 rounded-2xl border border-border bg-background text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                    <ExternalLink className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic mt-1">Astuce : Utilisez Unsplash pour des images de haute qualité.</p>
                </div>

                {newPromo.imageUrl && (
                  <div className="rounded-2xl overflow-hidden aspect-[21/9] border border-border shadow-inner relative group bg-secondary/30">
                    <img src={newPromo.imageUrl} className="w-full h-full object-cover" alt="Preview" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-bold tracking-widest uppercase">Aperçu</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-border shrink-0 bg-background">
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={handleAdd} disabled={isSubmitting || !newPromo.title || !newPromo.imageUrl}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50 transition-all text-base">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lancer la Campagne'}
                </motion.button>
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
              onClick={() => setConfirmDelete(null)} className="fixed inset-0 bg-black/40 backdrop-blur-md z-[80]" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] bg-card border border-border rounded-3xl p-8 w-[360px] max-w-[90vw] text-center shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="font-display font-black text-xl mb-2">Supprimer la bannière ?</h3>
              <p className="text-sm font-medium text-foreground mb-2">"{confirmDelete.title}"</p>
              <p className="text-xs text-muted-foreground mb-8">Elle ne sera plus affichée sur l'écran d'accueil de l'application client.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-3.5 rounded-2xl bg-secondary/60 text-foreground text-sm font-bold hover:bg-secondary transition-all">Annuler</button>
                <button onClick={handleDelete}
                  className="flex-1 py-3.5 rounded-2xl bg-destructive text-white text-sm font-bold hover:brightness-110 shadow-lg shadow-destructive/20 transition-all">Supprimer</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
