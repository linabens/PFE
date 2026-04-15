import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Utensils, ShoppingCart, Package, Gamepad2 } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';

/**
 * BREW LUNA — Bottom Tab Navigation
 * Floating navigation bar with active state animations
 */

const BottomTabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const itemCount = useCartStore((state) => state.getItemCount());

  const tabs = [
    { name: 'Home', icon: Home, path: '/home' },
    { name: 'Menu', icon: Utensils, path: '/menu' },
    { name: 'Cart', icon: ShoppingCart, path: '/cart', badge: itemCount },
    { name: 'Orders', icon: Package, path: '/orders' },
    { name: 'Play', icon: Gamepad2, path: '/fun' },
  ];

  // Don't show on splash screen
  if (location.pathname === '/') return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 'var(--space-6)',
      left: 'var(--space-4)',
      right: 'var(--space-4)',
      height: 'var(--nav-height)',
      backgroundColor: 'var(--color-espresso)',
      borderRadius: 'var(--radius-full)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '0 var(--space-2)',
      boxShadow: '0 8px 32px rgba(44, 24, 16, 0.4)',
      zIndex: 1000,
    }}>
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;

        return (
          <button
            key={tab.name}
            onClick={() => navigate(tab.path)}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              color: isActive ? 'var(--color-gold)' : 'rgba(255, 248, 240, 0.4)',
              transition: 'var(--transition-base)'
            }}
          >
            {isActive && (
              <motion.div
                layoutId="nav-bg"
                style={{
                  position: 'absolute',
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'rgba(212, 168, 83, 0.1)',
                  borderRadius: '50%',
                  zIndex: -1
                }}
              />
            )}
            
            <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            
            {tab.badge > 0 && (
              <div style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                backgroundColor: 'var(--color-gold)',
                color: 'var(--color-espresso)',
                fontSize: '10px',
                fontWeight: 'bold',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                {tab.badge}
              </div>
            )}

            <span style={{ 
              fontSize: '9px', 
              marginTop: '4px', 
              fontWeight: isActive ? '700' : '400',
              opacity: isActive ? 1 : 0.6
            }}>
              {tab.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomTabBar;
