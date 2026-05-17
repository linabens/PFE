import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { Plus, Edit, Trash2, Coffee, Utensils, IceCream, Sparkles, X, Loader2, Eye, EyeOff, LayoutGrid, Layers, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import toast from 'react-hot-toast';

const iconMap: Record<string, any> = {
  coffee: Coffee,
  food: Utensils,
  cold: IceCream,
  special: Sparkles,
  default: Coffee
};

export default function CategoriesPage() {
  const { categories, products, addCategory, updateCategory, deleteCategory, toggleProductActive, loading, fetchCategories } = useAppStore();
  const [showPanel, setShowPanel] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  const [formData, setFormData] = useState({ name: '', type: 'coffee' });

  const getProductCount = (categoryId: number) => {
    return products.filter(p => p.categoryId === categoryId).length;
  };

  const handleSave = async () => {
    if (!formData.name) return;
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, { name: formData.name, type: formData.type, display_order: editingCategory.display_order, is_active: editingCategory.is_active });
        toast.success('Catégorie mise à jour');
      } else {
        await addCategory({ name: formData.name, type: formData.type, display_order: 0, is_active: true });
        toast.success('Catégorie créée avec succès');
      }
      setShowPanel(false);
      setEditingCategory(null);
      setFormData({ name: '', type: 'coffee' });
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteCategory(confirmDelete.id);
      toast.success('Catégorie supprimée');
      setConfirmDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Échec de la suppression');
    }
  };

  const toggleAllInCategory = async (categoryId: number, targetStatus: boolean) => {
    const productsToToggle = products.filter(p => p.categoryId === categoryId && p.active !== targetStatus);
    if (productsToToggle.length === 0) {
      toast.success(targetStatus ? "Tous les produits sont déjà actifs." : "Tous les produits sont déjà cachés.");
      return;
    }

    const promise = Promise.all(productsToToggle.map(p => toggleProductActive(p.id, targetStatus)));
    toast.promise(promise, {
      loading: `Mise à jour de ${productsToToggle.length} produits...`,
      success: `Produits de la catégorie ${targetStatus ? 'activés' : 'désactivés'}`,
      error: 'Erreur lors de la mise à jour'
    });
  };

  const openEdit = (cat: any) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, type: cat.type });
    setShowPanel(true);
  };

  const openAdd = () => {
    setEditingCategory(null);
    setFormData({ name: '', type: 'coffee' });
    setShowPanel(true);
  }

  const totalCategories = categories.length;
  const categoriesWithProducts = categories.filter(c => getProductCount(c.id) > 0).length;

  return (
    <div className="space-y-6 p-1">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card/60 backdrop-blur-md px-6 py-5 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10"><LayoutGrid className="w-5 h-5 text-primary" /></div>
            Catégories
          </h1>
          <p className="text-xs text-muted-foreground mt-1 ml-11">Organisez votre menu pour l'application mobile</p>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-auto">
          <button onClick={fetchCategories} className="p-2.5 rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground transition-all hover:bg-secondary/30">
            <RefreshCw className="w-4 h-4" />
          </button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all whitespace-nowrap">
            <Plus className="w-4 h-4" /> Nouvelle Catégorie
          </motion.button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: 'Total Catégories', value: totalCategories, icon: Layers, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Catégories Actives', value: categoriesWithProducts, icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
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
      {loading && categories.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Chargement des catégories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="h-64 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-muted-foreground">
          <LayoutGrid className="w-10 h-10 mb-3 opacity-20" />
          <p className="font-medium">Aucune catégorie trouvée</p>
          <p className="text-xs mt-1">Créez votre première catégorie pour organiser vos produits.</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <AnimatePresence mode="popLayout">
            {categories.map((cat) => {
              const Icon = iconMap[cat.type] || iconMap.default;
              const count = getProductCount(cat.id);

              return (
                <motion.div key={cat.id} layout
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -4 }}
                  className="group relative bg-card border border-border rounded-3xl p-5 shadow-sm transition-all hover:shadow-xl flex flex-col">

                  {/* Actions (Top Right) */}
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(cat)} className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-primary transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => setConfirmDelete({ id: cat.id, name: cat.name })} className="p-1.5 rounded-xl hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Header */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="pt-1">
                      <h3 className="font-display font-black text-xl text-foreground leading-tight">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono mt-1 capitalize">{cat.type}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm font-bold bg-secondary px-3 py-1 rounded-lg text-foreground">
                        {count} produit{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Mass Actions */}
                  <div className="flex gap-2 pt-4 border-t border-border/60">
                    <button onClick={() => toggleAllInCategory(cat.id, true)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-success/10 hover:bg-success/20 text-success text-xs font-bold transition-all" title="Activer tous les produits">
                      <Eye className="w-4 h-4" /> <span className="hidden sm:inline">Activer Tout</span>
                    </button>
                    <button onClick={() => toggleAllInCategory(cat.id, false)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/60 text-muted-foreground hover:text-foreground text-xs font-bold transition-all" title="Cacher tous les produits">
                      <EyeOff className="w-4 h-4" /> <span className="hidden sm:inline">Cacher Tout</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Add/Edit Panel ── */}
      <AnimatePresence>
        {showPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPanel(false)} className="fixed inset-0 bg-black/40 backdrop-blur-md z-40" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-[400px] max-w-full bg-card border-l border-border z-50 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-border shrink-0 bg-secondary/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10"><LayoutGrid className="w-5 h-5 text-primary" /></div>
                  <div>
                    <h2 className="font-display font-black text-xl">{editingCategory ? 'Modifier Catégorie' : 'Nouvelle Catégorie'}</h2>
                    <p className="text-xs text-muted-foreground">Organisation du menu mobile</p>
                  </div>
                </div>
                <button onClick={() => setShowPanel(false)} className="p-2 rounded-xl hover:bg-secondary/60 transition-all">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nom de la catégorie</label>
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ex: Boissons Chaudes"
                    className="w-full px-4 py-3.5 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium" />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Type d'icône</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.keys(iconMap).filter(k => k !== 'default').map((t) => {
                      const Icon = iconMap[t];
                      return (
                        <button key={t} onClick={() => setFormData({ ...formData, type: t })}
                          className={cn('flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all',
                            formData.type === t ? 'bg-primary/10 border-primary text-primary shadow-inner' : 'bg-background border-border text-muted-foreground hover:border-primary/50')}>
                          <Icon className="w-6 h-6" />
                          <span className="text-xs font-bold capitalize">{t}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border shrink-0 bg-background">
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSave} disabled={isSubmitting || !formData.name}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50 transition-all text-base">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingCategory ? 'Mettre à jour' : 'Créer la catégorie'}
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
              onClick={() => setConfirmDelete(null)} className="fixed inset-0 bg-black/40 backdrop-blur-md z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card border border-border rounded-3xl p-8 w-[360px] max-w-[90vw] text-center shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="font-display font-black text-xl mb-2">Supprimer la catégorie ?</h3>
              <p className="text-sm font-medium text-foreground mb-2">"{confirmDelete.name}"</p>
              <p className="text-xs text-muted-foreground mb-8">Les produits associés ne seront pas supprimés, mais deviendront "Non catégorisés".</p>
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
