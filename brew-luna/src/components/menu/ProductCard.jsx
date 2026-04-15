import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';

/**
 * BREW LUNA — Product Card
 * Displays an individual product with 'Add to Cart' quick action
 */

const ProductCard = ({ product, onClick }) => {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddQuickly = (e) => {
    e.stopPropagation();
    addItem(product, 1);
  };

  const isUnavailable = !product.is_active || product.stock <= 0;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(product)}
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        opacity: isUnavailable ? 0.7 : 1,
      }}
    >
      {/* Product Image */}
      <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden' }}>
        <img 
          src={product.image_url || 'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=300&h=300&auto=format&fit=crop'} 
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        
        {isUnavailable && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 'var(--text-xs)',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Sold Out
          </div>
        )}

        {/* Price Tag */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          background: 'rgba(44, 24, 16, 0.8)',
          backdropFilter: 'blur(4px)',
          color: 'white',
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--text-xs)',
          fontWeight: 'bold',
        }}>
          {Number(product.price).toFixed(3)} DT
        </div>
      </div>

      {/* Info Content */}
      <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginBottom: '4px', fontWeight: 'bold' }}>
          {product.name}
        </h3>
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '12px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {product.description || 'Deliciously crafted for your enjoyment.'}
        </p>
        
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-mocha)', fontSize: '10px' }}>
            <Clock size={12} />
            <span>5-10 min</span>
          </div>
          
          <button
            disabled={isUnavailable}
            onClick={handleAddQuickly}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isUnavailable ? 'var(--text-muted)' : 'var(--color-mocha)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isUnavailable ? 'none' : '0 4px 8px rgba(107, 58, 42, 0.3)',
            }}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
