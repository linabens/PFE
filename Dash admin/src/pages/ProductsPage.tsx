import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { Plus, Search, Edit, Trash2, Coffee, X, Loader2, Image as ImageIcon, Box, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const { products, categories: storeCategories, toggleProductActive, deleteProduct, addProduct, updateProduct, loading, fetchProducts, fetchCategories } = useAppStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showPanel, setShowPanel] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', price: '', categoryId: 1, stockQuantity: '50', minStockLevel: '10', imageUrl: ''
  });
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  const categoryList = [{ id: 0, name: 'All' }, ...storeCategories];

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
      const matchCat = category === 'All' || p.category === category;
      return matchSearch && matchCat;
    });
  }, [products, search, category]);

  const openAdd = () => {
    setEditTarget(null);
    setNewProduct({ name: '', description: '', price: '', categoryId: storeCategories[0]?.id || 1, stockQuantity: '50', minStockLevel: '10', imageUrl: '' });
    setShowPanel(true);
  };

  const openEdit = (product: any) => {
    setEditTarget(product);
    setNewProduct({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      categoryId: storeCategories.find(c => c.name === product.category)?.id || 1,
      stockQuantity: product.stockQuantity?.toString() || '50',
      minStockLevel: product.minStockLevel?.toString() || '10',
      imageUrl: product.imageUrl || ''
    });
    setShowPanel(true);
  };

  const handleSave = async () => {
    if (!newProduct.name || !newProduct.price) return;
    setIsSubmitting(true);
    try {
      if (editTarget) {
        await updateProduct(editTarget.id, {
          name: newProduct.name,
          description: newProduct.description,
          price: parseFloat(newProduct.price),
          categoryId: newProduct.categoryId,
          category: storeCategories.find(c => c.id === newProduct.categoryId)?.name || '',
          stockQuantity: parseInt(newProduct.stockQuantity),
          minStockLevel: parseInt(newProduct.minStockLevel),
          imageUrl: newProduct.imageUrl
        });
        toast.success('Produit mis à jour avec succès');
      } else {
        await addProduct({
          name: newProduct.name,
          description: newProduct.description,
          price: parseFloat(newProduct.price),
          categoryId: newProduct.categoryId,
          category: storeCategories.find(c => c.id === newProduct.categoryId)?.name || '',
          active: true,
          trending: false,
          seasonal: false,
          stockQuantity: parseInt(newProduct.stockQuantity),
          minStockLevel: parseInt(newProduct.minStockLevel),
          imageUrl: newProduct.imageUrl
        });
        toast.success('Produit ajouté avec succès');
      }
      setNewProduct({ name: '', description: '', price: '', categoryId: 1, stockQuantity: '50', minStockLevel: '10', imageUrl: '' });
      setShowPanel(false);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteProduct(confirmDelete.id);
      toast.success('Produit supprimé');
      setConfirmDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await toggleProductActive(id, current);
      toast.success('Statut mis à jour');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  };

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stockQuantity !== undefined && p.minStockLevel !== undefined && p.stockQuantity <= p.minStockLevel).length;
  const activeProducts = products.filter(p => p.active).length;

  return (
    <div className="space-y-6 p-1">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card/60 backdrop-blur-md px-6 py-5 rounded-3xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10"><Coffee className="w-5 h-5 text-primary" /></div>
            Menu & Inventaire
          </h1>
          <p className="text-xs text-muted-foreground mt-1 ml-11">Gérez vos produits, prix et niveaux de stock</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Chercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full appearance-none px-4 py-2 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all font-medium text-foreground"
            >
              {categoryList.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={openAdd}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all whitespace-nowrap w-full lg:w-auto">
          <Plus className="w-4 h-4" /> Nouveau Produit
        </motion.button>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Produits', value: totalProducts, icon: Box, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Produits Actifs', value: activeProducts, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Stock Faible', value: lowStockProducts, icon: AlertTriangle, color: lowStockProducts > 0 ? 'text-destructive' : 'text-muted-foreground', bg: lowStockProducts > 0 ? 'bg-destructive/10' : 'bg-secondary/20' },
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
      {loading && products.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Chargement du catalogue...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="h-64 border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-muted-foreground">
          <Coffee className="w-10 h-10 mb-3 opacity-20" />
          <p className="font-medium">Aucun produit trouvé</p>
          <p className="text-xs mt-1">Modifiez vos filtres ou ajoutez un nouveau produit.</p>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map(product => {
              const isLowStock = product.stockQuantity !== undefined && product.minStockLevel !== undefined && product.stockQuantity <= product.minStockLevel;
              return (
                <motion.div key={product.id} layout
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -4 }}
                  className={cn('group relative bg-card border border-border rounded-3xl overflow-hidden shadow-sm transition-all hover:shadow-xl flex flex-col', !product.active && 'opacity-60 grayscale')}>

                  {/* Image Header */}
                  <div className="relative h-40 bg-secondary/30 flex items-center justify-center overflow-hidden border-b border-border/50">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-background/50 flex items-center justify-center border border-border shadow-sm backdrop-blur-sm">
                        <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}

                    {/* Action Overlay */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button onClick={() => openEdit(product)} className="p-2 rounded-xl bg-white/90 text-foreground hover:text-primary shadow-lg backdrop-blur-md transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setConfirmDelete({ id: product.id, name: product.name })} className="p-2 rounded-xl bg-white/90 text-foreground hover:text-destructive shadow-lg backdrop-blur-md transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Status Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-black/60 text-white backdrop-blur-md border border-white/10 shadow-lg">
                        {product.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="font-display font-black text-lg text-foreground leading-tight">{product.name}</h3>
                      <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg text-sm shrink-0">
                        {parseFloat(product.price.toString()).toFixed(3)} <span className="text-[10px]">TND</span>
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">
                      {product.description || <span className="italic opacity-50">Aucune description</span>}
                    </p>

                    {/* Stock & Active Toggle */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/60">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", isLowStock ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground")}>
                          <Box className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">Stock</span>
                          <span className={cn("text-xs font-black", isLowStock ? "text-destructive" : "text-foreground")}>
                            {product.stockQuantity ?? '—'} <span className="text-[10px] font-normal text-muted-foreground">/ {product.minStockLevel ?? '-'} min</span>
                          </span>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer" title={product.active ? "Désactiver" : "Activer"}>
                        <input type="checkbox" className="sr-only peer" checked={product.active} onChange={() => handleToggle(product.id, !product.active)} />
                        <div className="w-11 h-6 bg-secondary border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-success peer-checked:border-success"></div>
                      </label>
                    </div>
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
              className="fixed top-0 right-0 h-full w-[450px] max-w-full bg-card border-l border-border z-50 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-border shrink-0 bg-secondary/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10"><Coffee className="w-5 h-5 text-primary" /></div>
                  <div>
                    <h2 className="font-display font-black text-xl">{editTarget ? 'Modifier le Produit' : 'Nouveau Produit'}</h2>
                    <p className="text-xs text-muted-foreground">{editTarget ? 'Mise à jour du catalogue' : 'Ajout au catalogue'}</p>
                  </div>
                </div>
                <button onClick={() => setShowPanel(false)} className="p-2 rounded-xl hover:bg-secondary/60 transition-all">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nom du Produit</label>
                  <input type="text" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Catégorie</label>
                    <select value={newProduct.categoryId} onChange={e => setNewProduct({ ...newProduct, categoryId: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all appearance-none">
                      {storeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Prix (TND)</label>
                    <input type="number" step="0.001" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-mono" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</label>
                  <textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} rows={3}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Stock Actuel</label>
                    <input type="number" value={newProduct.stockQuantity} onChange={e => setNewProduct({ ...newProduct, stockQuantity: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Alerte Stock Min</label>
                    <input type="number" value={newProduct.minStockLevel} onChange={e => setNewProduct({ ...newProduct, minStockLevel: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5 pt-4 border-t border-border/50">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5" /> URL de l'image
                  </label>
                  <input type="text" placeholder="https://..." value={newProduct.imageUrl} onChange={e => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-mono text-xs" />

                  {newProduct.imageUrl && (
                    <div className="mt-3 relative h-32 rounded-2xl overflow-hidden border border-border bg-secondary/30 flex items-center justify-center">
                      <img src={newProduct.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-border shrink-0 bg-background">
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSave} disabled={isSubmitting || !newProduct.name || !newProduct.price}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50 transition-all text-base">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editTarget ? 'Enregistrer les modifications' : 'Ajouter au catalogue'}
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
              <h3 className="font-display font-black text-xl mb-2">Supprimer le produit ?</h3>
              <p className="text-sm font-medium text-foreground mb-2">"{confirmDelete.name}"</p>
              <p className="text-xs text-muted-foreground mb-8">Cette action est irréversible. Le produit sera retiré du menu mobile et du dashboard.</p>
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
