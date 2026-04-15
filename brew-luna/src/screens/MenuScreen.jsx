import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, ShoppingCart } from 'lucide-react';
import { menuApi } from '../api/menuApi';
import { useMenuStore } from '../store/useMenuStore';
import { useCartStore } from '../store/useCartStore';
import CategoryTabs from '../components/menu/CategoryTabs';
import ProductCard from '../components/menu/ProductCard';
import Skeleton from '../components/ui/Skeleton';

/**
 * BREW LUNA — Menu Screen
 * Category selection and product browsing
 */

const MenuScreen = () => {
  const navigate = useNavigate();
  const { 
    categories, products, activeCategoryId, isLoading, 
    setCategories, setProducts, setActiveCategory, setLoading, setError 
  } = useMenuStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const itemCount = useCartStore((state) => state.getItemCount());

  useEffect(() => {
    const fetchMenu = async () => {
      if (categories.length > 0 && products.length > 0) return;
      
      setLoading(true);
      try {
        const [catsRes, prodsRes] = await Promise.all([
          menuApi.getCategories(),
          menuApi.getProducts()
        ]);
        
        if (catsRes.success) setCategories(catsRes.data);
        if (prodsRes.success) setProducts(prodsRes.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategoryId === 'all' || p.category_id === activeCategoryId;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ paddingBottom: '120px' }}>
      {/* Header & Search */}
      <div style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 10, 
        backgroundColor: 'rgba(255, 248, 240, 0.9)', 
        backdropFilter: 'blur(8px)',
        padding: 'var(--space-4) var(--space-4) var(--space-2)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h1 style={{ fontSize: 'var(--text-3xl)', color: 'var(--color-espresso)' }}>The Menu</h1>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/cart')}
            style={{ position: 'relative', padding: '8px', color: 'var(--color-mocha)' }}
          >
            <ShoppingCart size={24} />
            {itemCount > 0 && (
              <span style={{
                position: 'absolute',
                top: 0,
                right: 0,
                backgroundColor: 'var(--color-gold)',
                color: 'var(--color-espresso)',
                fontSize: '10px',
                fontWeight: 'bold',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--bg-page)'
              }}>
                {itemCount}
              </span>
            )}
          </motion.button>
        </div>

        <div style={{ position: 'relative', marginBottom: 'var(--space-2)' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search your favorite coffee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 40px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-card)',
              fontSize: 'var(--text-sm)',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Categories */}
      {isLoading ? (
        <div style={{ display: 'flex', gap: '12px', padding: '0 var(--space-4)', margin: 'var(--space-4) 0' }}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} width="80px" height="36px" borderRadius="var(--radius-full)" />)}
        </div>
      ) : (
        <CategoryTabs 
          categories={categories} 
          activeId={activeCategoryId} 
          onSelect={setActiveCategory} 
        />
      )}

      {/* Product Grid */}
      <div className="container">
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Skeleton height="150px" borderRadius="var(--radius-lg)" />
                <Skeleton width="60%" />
                <Skeleton width="40%" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div 
            layout
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}
          >
            <AnimatePresence>
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProductCard 
                    product={product} 
                    onClick={(p) => navigate(`/product/${p.id}`)} 
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center" style={{ marginTop: '60px' }}>
            <p style={{ color: 'var(--text-muted)' }}>No items found for this selection.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuScreen;
