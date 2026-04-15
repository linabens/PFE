import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, ShoppingBag, Gamepad2, Newspaper } from 'lucide-react';
import { useSessionStore } from '../store/useSessionStore';

/**
 * BREW LUNA — Landing Screen
 * Welcome screen after successful session initialization
 */

const LandingScreen = () => {
  const navigate = useNavigate();
  const { tableNumber } = useSessionStore();

  const quickLinks = [
    { name: 'Browse Menu', icon: ShoppingBag, path: '/menu', color: 'var(--color-mocha)' },
    { name: 'Entertainment', icon: Gamepad2, path: '/fun', color: 'var(--color-sienna)' },
    { name: 'Latest News', icon: Newspaper, path: '/news', color: 'var(--color-espresso)' },
  ];

  return (
    <div style={{ padding: 'var(--space-6) var(--space-4)', paddingBottom: '100px' }}>
      {/* Header Section */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 'var(--space-8)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', color: 'var(--text-muted)' }}>Welcome to</h2>
          <div style={{ padding: '4px 12px', background: 'var(--color-mocha)', borderRadius: 'var(--radius-full)', color: 'white', fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>
            Table {tableNumber || '...'}
          </div>
        </div>
        <h1 style={{ fontSize: 'var(--text-4xl)', color: 'var(--color-espresso)' }}>BREW LUNA</h1>
      </motion.header>

      {/* Main Promo Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        style={{ 
          background: 'linear-gradient(135deg, var(--color-mocha), var(--color-espresso))',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 'var(--space-8)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h3 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>Hungry?</h3>
          <p style={{ opacity: 0.8, marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)', maxWidth: '200px' }}>
            Browse our fresh categories and order directly to your table.
          </p>
          <button 
            onClick={() => navigate('/menu')}
            style={{ 
              backgroundColor: 'var(--color-gold)', 
              color: 'var(--color-espresso)',
              padding: '12px 24px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 'bold',
              fontSize: 'var(--text-sm)'
            }}
          >
            Start Ordering
          </button>
        </div>
        
        {/* Background Coffee beans icon deco */}
        <ShoppingBag 
          size={140} 
          style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.1, color: 'white' }} 
        />
      </motion.div>

      {/* Quick Actions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        {quickLinks.map((link, idx) => (
          <motion.button
            key={link.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + (idx * 0.1) }}
            onClick={() => navigate(link.path)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-3)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: 'var(--radius-sm)', 
              backgroundColor: 'var(--color-foam)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: link.color
            }}>
              <link.icon size={24} />
            </div>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: '600' }}>{link.name}</span>
          </motion.button>
        ))}

        {/* Call Staff Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            background: 'var(--color-foam)',
            border: '2px dashed var(--color-latte)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: 'var(--radius-sm)', 
            backgroundColor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-sienna)'
          }}>
            <Bell size={24} />
          </div>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: '600', color: 'var(--color-sienna)' }}>Call Staff</span>
        </motion.button>
      </div>

      {/* Suggestion Section */}
      <section>
        <h4 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)' }}>Today's Pick</h4>
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', display: 'flex', padding: '12px', gap: '16px', border: '1px solid var(--border-light)' }}>
          <img 
            src="https://images.unsplash.com/photo-1541167760496-162955ed8a9f?q=80&w=200&h=200&auto=format&fit=crop" 
            alt="Coffee"
            style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{ fontWeight: 'bold' }}>Caramel Macchiato</p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Rich, buttery and sweet.</p>
            <p style={{ fontWeight: 'bold', color: 'var(--color-mocha)', marginTop: '4px' }}>4.500 TND</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingScreen;
