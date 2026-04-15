import React from 'react';
import { motion } from 'framer-motion';

/**
 * BREW LUNA — Category Tabs
 * Horizontal scrollable category filters
 */

const CategoryTabs = ({ categories, activeId, onSelect }) => {
  // Add 'All' category if not present in API data
  const allCategories = [{ id: 'all', name: 'All Items' }, ...categories];

  return (
    <div style={{
      overflowX: 'auto',
      whiteSpace: 'nowrap',
      padding: 'var(--space-2) 0',
      marginBottom: 'var(--space-4)',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
    }} className="hide-scrollbar">
      <div style={{ display: 'inline-flex', gap: 'var(--space-3)', padding: '0 var(--space-4)' }}>
        {allCategories.map((cat) => {
          const isActive = activeId === cat.id;
          
          return (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(cat.id)}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: isActive ? 'var(--color-mocha)' : 'var(--bg-card)',
                color: isActive ? 'white' : 'var(--text-secondary)',
                fontSize: 'var(--text-sm)',
                fontWeight: isActive ? 'bold' : '500',
                border: isActive ? 'none' : '1px solid var(--border-light)',
                boxShadow: isActive ? 'var(--shadow-md)' : 'none',
                transition: 'var(--transition-base)',
              }}
            >
              {cat.name}
            </motion.button>
          );
        })}
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default CategoryTabs;
