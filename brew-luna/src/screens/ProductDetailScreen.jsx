import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Minus, Plus, ShoppingBag, Clock, Heart } from 'lucide-react';
import { useMenuStore } from '../store/useMenuStore';
import { useCartStore } from '../store/useCartStore';
import { menuApi } from '../api/menuApi';
import Skeleton from '../components/ui/Skeleton';

/**
 * BREW LUNA — Product Detail Screen
 * In-depth view with customization and 'Big' add to cart button
 */

const ProductDetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const products = useMenuStore((state) => state.products);
  const addItem = useCartStore((state) => state.addItem);
  
  const [product, setProduct] = useState(products.find(p => p.id === parseInt(id)));
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(!product);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!product) {
      const fetchProduct = async () => {
        try {
          const res = await menuApi.getProductById(id);
          if (res.success) setProduct(res.data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, product]);

  const handleAddToCart = () => {
    setAdding(true);
    addItem(product, quantity);
    setTimeout(() => {
      setAdding(false);
      navigate(-1);
    }, 1000);
  };

  if (loading) return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <Skeleton height="300px" borderRadius="var(--radius-xl)" style={{ marginBottom: '24px' }} />
      <Skeleton width="70%" height="32px" style={{ marginBottom: '16px' }} />
      <Skeleton height="100px" style={{ marginBottom: '24px' }} />
      <Skeleton height="60px" borderRadius="var(--radius-lg)" />
    </div>
  );

  if (!product) return <div className="text-center" style={{ paddingTop: '100px' }}>Product not found.</div>;

  return (
    <div style={{ paddingBottom: '120px' }}>
      {/* Product Image Top Section */}
      <div style={{ position: 'relative', width: '100%', height: '45vh', overflow: 'hidden' }}>
        <img 
          src={product.image_url || 'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=600&h=600&auto=format&fit=crop'} 
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        
        {/* Top Controls */}
        <div style={{ position: 'absolute', top: 'var(--space-6)', left: 'var(--space-4)', right: 'var(--space-4)', display: 'flex', justifyContent: 'space-between' }}>
          <button 
            onClick={() => navigate(-1)}
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          >
            <ChevronLeft size={24} color="var(--color-espresso)" />
          </button>
          <button style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <Heart size={20} color="var(--color-error)" />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          marginTop: '-30px',
          background: 'var(--bg-page)',
          borderTopLeftRadius: '30px',
          borderTopRightRadius: '30px',
          padding: 'var(--space-8) var(--space-6)',
          position: 'relative',
          minHeight: '40vh'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: '4px' }}>{product.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={16} />
                <span>8-12 min</span>
              </div>
              <span>•</span>
              <span>⭐ 4.8 (120+ reviews)</span>
            </div>
          </div>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', color: 'var(--color-mocha)' }}>
            {Number(product.price).toFixed(3)} DT
          </div>
        </div>

        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-8)' }}>
          {product.description || 'Our signature brew, made from ethically sourced beans and roasted to perfection. Every sip is a journey of flavor and aroma that will awaken your senses.'}
        </p>

        {/* Customization Placeholders (Optional in Concept but nice for UI) */}
        <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>Quantity</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: 'var(--space-10)' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: 'var(--color-mocha)', 
            borderRadius: 'var(--radius-md)',
            padding: '4px'
          }}>
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              style={{ padding: '8px', color: 'white' }}
            ><Minus size={20} /></button>
            <span style={{ padding: '0 20px', color: 'white', fontWeight: 'bold', fontSize: 'var(--text-lg)', minWidth: '50px', textAlign: 'center' }}>
              {quantity}
            </span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              style={{ padding: '8px', color: 'white' }}
            ><Plus size={20} /></button>
          </div>
        </div>

        {/* Floating Add to Cart Button */}
        <div style={{ 
          position: 'fixed', 
          bottom: 'var(--space-8)', 
          left: 'var(--space-6)', 
          right: 'var(--space-6)',
          zIndex: 100
        }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            disabled={adding}
            style={{
              width: '100%',
              padding: '18px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: adding ? 'var(--color-success)' : 'var(--color-espresso)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              fontSize: 'var(--text-lg)',
              fontWeight: 'bold',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            {adding ? (
              <span>Added to Cart!</span>
            ) : (
              <>
                <ShoppingBag size={22} />
                <span>Add to Cart • {(product.price * quantity).toFixed(3)} DT</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProductDetailScreen;
