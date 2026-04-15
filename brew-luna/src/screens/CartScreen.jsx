import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useSessionStore } from '../store/useSessionStore';
import { useOrderStore } from '../store/useOrderStore';
import { orderApi } from '../api/orderApi';

/**
 * BREW LUNA — Cart Screen
 * Review items and place order
 */

const CartScreen = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, getTotal, clearCart } = useCartStore();
  const { tableId } = useSessionStore();
  const { setCurrentOrder } = useOrderStore();
  
  const [isPlacing, setIsPlacing] = useState(false);
  const total = getTotal();

  const handleCheckout = async () => {
    if (items.length === 0) return;
    
    setIsPlacing(true);
    try {
      // Structure the items for the API
      const orderData = {
        table_id: tableId,
        items: items.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          options: item.options || []
        }))
      };

      const response = await orderApi.createOrder(orderData);
      
      if (response.success) {
        // Save order info to store for tracking
        setCurrentOrder(response.data.id, response.data.status);
        clearCart();
        navigate('/orders');
      }
    } catch (err) {
      alert(err.message || "Failed to place order. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex-center" style={{ height: '80vh', flexDirection: 'column', padding: 'var(--space-10)' }}>
        <ShoppingBag size={80} color="var(--border-medium)" style={{ marginBottom: 'var(--space-6)' }} />
        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>Your cart is empty</h2>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          Looks like you haven't added any delicious blends yet.
        </p>
        <button 
          onClick={() => navigate('/menu')}
          style={{ 
            backgroundColor: 'var(--color-mocha)', 
            color: 'white', 
            padding: '12px 32px', 
            borderRadius: 'var(--radius-full)',
            fontWeight: 'bold'
          }}
        >
          Go to Menu
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-6) var(--space-4)', paddingBottom: '160px' }}>
      <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-6)', color: 'var(--color-espresso)' }}>Your Order</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{
                display: 'flex',
                background: 'var(--bg-card)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)',
                gap: '12px',
                alignItems: 'center',
                border: '1px solid var(--border-light)'
              }}
            >
              <img 
                src={item.image_url || 'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=100&h=100&auto=format&fit=crop'} 
                alt={item.name}
                style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
              />
              
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>{item.name}</h3>
                <p style={{ color: 'var(--color-mocha)', fontSize: 'var(--text-sm)', fontWeight: '600' }}>
                  {Number(item.price).toFixed(3)} DT
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-foam)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  style={{ padding: '4px', color: 'var(--color-mocha)' }}
                >
                  {item.quantity === 1 ? <Trash2 size={16} /> : <Minus size={16} />}
                </button>
                <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>
                  {item.quantity}
                </span>
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  style={{ padding: '4px', color: 'var(--color-mocha)' }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Summary Footer */}
      <div style={{
        position: 'fixed',
        bottom: '100px', // Above navigation bar
        left: 'var(--space-4)',
        right: 'var(--space-4)',
        backgroundColor: 'var(--bg-card)',
        padding: 'var(--space-5)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-light)',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Total Amount</span>
          <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: 'var(--color-espresso)' }}>
            {total.toFixed(3)} DT
          </span>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          disabled={isPlacing}
          onClick={handleCheckout}
          style={{
            width: '100%',
            backgroundColor: isPlacing ? 'var(--text-muted)' : 'var(--color-espresso)',
            color: 'white',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontSize: 'var(--text-base)'
          }}
        >
          {isPlacing ? (
            <span>Placing Order...</span>
          ) : (
            <>
              <span>Confirm Order</span>
              <ArrowRight size={20} />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default CartScreen;
