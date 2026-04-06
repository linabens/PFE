import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { Plus, Search, Edit, Trash2, Coffee, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const { products, categories: storeCategories, toggleProductActive, deleteProduct, addProduct, loading, fetchProducts, fetchCategories } = useAppStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showPanel, setShowPanel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProduct, setNewProduct] = useState({ 
    name: '', 
    description: '', 
    price: '', 
    categoryId: 0
  });

  // Fetch on mount
  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  const categoryList = [{ id: 0, name: 'All' }, ...storeCategories];

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || p.category === category;
    return matchSearch && matchCat;
  });

  const handleAdd = async () => {
    if (!newProduct.name || !newProduct.price) return;
    setIsSubmitting(true);
    try {
      await addProduct({
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        categoryId: newProduct.categoryId,
        category: storeCategories.find(c => c.id === newProduct.categoryId)?.name || '',
        active: true,
        trending: false,
        seasonal: false,
      });
      toast.success('Product added successfully');
      setNewProduct({ name: '', description: '', price: '', categoryId: 1 });
      setShowPanel(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      toast.success('Product deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await toggleProductActive(id, current);
      toast.success('Status updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        >
          {categoryList.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowPanel(true)}
          className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Product
        </motion.button>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Loading premium coffee data...</p>
        </div>
      ) : (
        /* Product Grid */
        <motion.div
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((product) => (
            <motion.div
              key={product.id}
              variants={{ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } }}
              whileHover={{ y: -3, boxShadow: 'var(--soft-shadow)' }}
              className="glass-card rounded-xl overflow-hidden group border border-espresso/5"
            >
              <div className="h-40 bg-secondary/30 flex items-center justify-center group-hover:bg-secondary/50 transition-colors">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover opacity-90" />
                ) : (
                  <Coffee className="w-16 h-16 text-primary/20" />
                )}
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-display text-lg text-foreground truncate leading-tight">{product.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
                  </div>
                  <span className="font-display text-primary text-xl font-medium whitespace-nowrap">{product.price} TND</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-latte/40 text-espresso/60 font-medium">{product.category}</span>
                  {product.trending && <span className="text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">TRENDING</span>}
                  {product.seasonal && <span className="text-[10px] px-2.5 py-1 rounded-full bg-info/10 text-info font-bold uppercase tracking-wider">Seasonal</span>}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <button
                    onClick={() => handleToggle(product.id, product.active)}
                    className={cn(
                      'relative w-10 h-5 rounded-full transition-colors',
                      product.active ? 'bg-success' : 'bg-muted'
                    )}
                  >
                    <span className={cn(
                      'absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform',
                      product.active ? 'left-5.5 translate-x-0' : 'left-0.5'
                    )} style={{ left: product.active ? '22px' : '2px' }} />
                  </button>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-1.5 rounded-md hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
              <Search className="w-8 h-8 mb-2 opacity-20" />
              <p>No products found Matching your criteria</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Add Product Slide Panel */}
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
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-[450px] max-w-full bg-card shadow-2xl border-l border-espresso/10 z-50 p-8 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg text-foreground">Add Product</h2>
                <button onClick={() => setShowPanel(false)} className="p-1.5 rounded-md hover:bg-secondary">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Name</label>
                  <input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Description</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full h-20 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Price (TND)</label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Category</label>
                  <select
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct({ ...newProduct, categoryId: parseInt(e.target.value) })}
                    className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    {storeCategories.filter((c) => c.id !== 0).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAdd}
                  disabled={isSubmitting}
                  className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium mt-4 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Product'}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
