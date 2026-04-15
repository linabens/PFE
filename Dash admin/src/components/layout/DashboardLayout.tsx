import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import Topbar from './Topbar';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export default function DashboardLayout() {
  const { sidebarCollapsed, fetchInitialData } = useAppStore();
  const location = useLocation();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return (
    <div className="min-h-screen bg-[hsl(var(--espresso))] relative overflow-hidden font-body">
      {/* Texture Layer */}
      <div className="absolute inset-0 noise-overlay pointer-events-none opacity-40 z-0" />
      
      <AppSidebar />
      
      <div
        className={cn(
          'transition-all duration-300 relative z-10 min-h-screen bg-background shadow-2xl',
          sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'
        )}
      >
        <Topbar />
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="p-6"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
