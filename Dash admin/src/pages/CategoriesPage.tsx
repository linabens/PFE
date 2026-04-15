import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { Plus, Edit, Trash2, Coffee, Utensils, IceCream, Sparkles, X, Loader2, Eye, EyeOff } from 'lucide-react';
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
  const { categories, products, addCategory, updateCategory, deleteCategory, toggleProductActive, loading } = useAppStore();
  const [showPanel, setShowPanel] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'coffee',
    display_order: ''
  });

  const getProductCount = (categoryId: number) => {
    return products.filter(p => p.categoryId === categoryId).length;
  };

  const handleSave = async () => {
    if (!formData.name) return;
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: formData.name,
          type: formData.type,
          display_order: formData.display_order ? parseInt(formData.display_order) : null
        });
        toast.success('Category updated');
      } else {
        await addCategory({
          name: formData.name,
          type: formData.type,
          display_order: formData.display_order ? parseInt(formData.display_order) : null
        });
        toast.success('Category created');
      }
      setShowPanel(false);
      setEditingCategory(null);
      setFormData({ name: '', type: 'coffee', display_order: '' });
    } catch (error: any) {
      toast.error(error.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category? This will not delete products but they will become uncategorized.')) return;
    try {
      await deleteCategory(id);
      toast.success('Category removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const toggleAllInCategory = async (categoryId: number, targetStatus: boolean) => {
    const productsToToggle = products.filter(p => p.categoryId === categoryId && p.active !== targetStatus);
    if (productsToToggle.length === 0) return;
    
    const promise = Promise.all(productsToToggle.map(p => toggleProductActive(p.id, !targetStatus)));
    toast.promise(promise, {
      loading: `Updating ${productsToToggle.length} products...`,
      success: `All products in category are now ${targetStatus ? 'active' : 'hidden'}`,
      error: 'Failed to update some products'
    });
  };

  const openEdit = (cat: any) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      type: cat.type,
      display_order: cat.display_order?.toString() || ''
    });
    setShowPanel(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-foreground">Category Management</h1>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            setEditingCategory(null);
            setFormData({ name: '', type: 'coffee', display_order: '' });
            setShowPanel(true);
          }}
          className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> New Category
        </motion.button>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading categories...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const Icon = iconMap[cat.type] || iconMap.default;
            const count = getProductCount(cat.id);
            return (
              <motion.div
                key={cat.id}
                layout
                className="glass-card rounded-xl p-5 group flex flex-col justify-between"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display text-foreground">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{cat.type} · {count} products</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(cat)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-md hover:bg-destructive/15 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-4 border-t border-border">
                  <span className="text-[10px] text-muted-foreground font-mono">Order: {cat.display_order || '-'}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleAllInCategory(cat.id, true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-success/10 hover:bg-success/20 text-success text-[10px] font-bold transition-colors"
                      title="Activate all products in this category"
                    >
                      <Eye className="w-3 h-3" /> ACTIVATE ALL
                    </button>
                    <button
                      onClick={() => toggleAllInCategory(cat.id, false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground text-[10px] font-bold transition-colors"
                      title="Hide all products in this category"
                    >
                      <EyeOff className="w-3 h-3" /> HIDE ALL
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {categories.length === 0 && (
            <div className="col-span-full h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground">
              <p>No categories found</p>
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
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 h-full w-[400px] max-w-full bg-card border-l border-border z-50 p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-display text-xl text-foreground">{editingCategory ? 'Edit Category' : 'New Category'}</h2>
                <button onClick={() => setShowPanel(false)} className="p-2 rounded-lg hover:bg-secondary">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Name</label>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Italian Coffee"
                    className="w-full h-11 px-4 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Type (Icon)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(iconMap).filter(k => k !== 'default').map((t) => {
                      const Icon = iconMap[t];
                      return (
                        <button
                          key={t}
                          onClick={() => setFormData({ ...formData, type: t })}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-xl border transition-all',
                            formData.type === t 
                              ? 'bg-primary/10 border-primary text-primary' 
                              : 'bg-secondary border-border text-muted-foreground hover:border-primary/50'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-xs capitalize">{t}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Display Order</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                    placeholder="Optional"
                    className="w-full h-11 px-4 rounded-xl bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-display flex items-center justify-center gap-2 shadow-lg shadow-primary/20 mt-8 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingCategory ? 'Update Category' : 'Create Category'}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
