import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RefreshCcw, Home, MessageSquare } from 'lucide-react';
import { useOrderStore } from '../store/useOrderStore';
import { orderApi } from '../api/orderApi';
import OrderStatusStepper from '../components/order/OrderStatusStepper';

/**
 * BREW LUNA — Order Tracking Screen
 * Polls the API for status updates
 */

const OrderTrackingScreen = () => {
  const navigate = useNavigate();
  const { currentOrderId, orderStatus, updateOrderStatus, clearCurrentOrder } = useOrderStore();
  const [lastCheck, setLastCheck] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!currentOrderId) return;

    const checkStatus = async () => {
      setIsRefreshing(true);
      try {
        const response = await orderApi.getOrderStatus(currentOrderId);
        if (response.success) {
          updateOrderStatus(response.data.status);
          setLastCheck(new Date());
        }
      } catch (err) {
        console.error("Polling error:", err);
      } finally {
        setIsRefreshing(false);
      }
    };

    // Poll every 8 seconds
    const interval = setInterval(checkStatus, 8000);
    
    // Initial check
    if (!orderStatus) checkStatus();

    return () => clearInterval(interval);
  }, [currentOrderId, updateOrderStatus]);

  if (!currentOrderId) {
    return (
      <div className="flex-center" style={{ height: '80vh', flexDirection: 'column', padding: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>No Active Order</h2>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          You don't have any orders currently being brewed.
        </p>
        <button 
          onClick={() => navigate('/menu')}
          style={{ backgroundColor: 'var(--color-mocha)', color: 'white', padding: '12px 32px', borderRadius: 'var(--radius-full)' }}
        >
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-6) var(--space-4)', paddingBottom: '120px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-espresso)' }}>Track Order</h1>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>ID: #{currentOrderId}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
          <motion.div animate={{ rotate: isRefreshing ? 360 : 0 }} transition={{ repeat: isRefreshing ? Infinity : 0, duration: 1 }}>
            <RefreshCcw size={14} />
          </motion.div>
          <span style={{ fontSize: '10px' }}>Updating...</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8) var(--space-6)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-light)',
          marginBottom: 'var(--space-8)'
        }}
      >
        <OrderStatusStepper currentStatus={orderStatus} />
      </motion.div>

      {/* Helpful Actions */}
      <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>Need anything else?</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        <button 
          onClick={() => navigate('/home')}
          style={{
            background: 'var(--color-foam)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'var(--color-espresso)',
            border: '1px solid var(--border-light)'
          }}
        >
          <Home size={20} />
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>Back Home</span>
        </button>
        <button 
          style={{
            background: 'var(--color-foam)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'var(--color-espresso)',
             border: '1px solid var(--border-light)'
          }}
        >
          <MessageSquare size={20} />
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>Leave Review</span>
        </button>
      </div>

      {orderStatus === 'completed' && (
        <button 
          onClick={clearCurrentOrder}
          style={{ 
            marginTop: '40px', 
            width: '100%', 
            color: 'var(--text-muted)', 
            fontSize: 'var(--text-sm)',
            textDecoration: 'underline'
          }}
        >
          Clear Tracking
        </button>
      )}
    </div>
  );
};

export default OrderTrackingScreen;
