import React from 'react';
import { motion } from 'framer-motion';

/**
 * BREW LUNA — Skeleton Loader
 * Reusable loading placeholder with shimmer effect
 */

const Skeleton = ({ width = '100%', height = '20px', borderRadius = 'var(--radius-sm)', style = {} }) => {
  return (
    <motion.div
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'var(--border-medium)',
        ...style
      }}
    />
  );
};

export default Skeleton;
