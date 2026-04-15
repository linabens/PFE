import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Activity, Coffee, Grid3X3, QrCode,
  Star, Bell, TrendingUp, BarChart3, Users, Settings,
  ChevronLeft, ChevronRight, LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard', path: '/', icon: LayoutDashboard },
      { title: 'Live Orders', path: '/orders', icon: Activity, badge: 'orders' as const },
    ],
  },
  {
    label: 'Management',
    items: [
      { title: 'Products', path: '/products', icon: Coffee },
      { title: 'Categories', path: '/categories', icon: Grid3X3 },
      { title: 'Tables & QR', path: '/tables', icon: QrCode },
    ],
  },
  {
    label: 'Customers',
    items: [
      { title: 'Loyalty Program', path: '/loyalty', icon: Star },
      { title: 'Assistance', path: '/assistance', icon: Bell, badge: 'assistance' as const },
    ],
  },
  {
    label: 'Reports',
    items: [
      { title: 'Revenue', path: '/revenue', icon: TrendingUp },
      { title: 'Analytics', path: '/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Settings',
    items: [
      { title: 'Staff Accounts', path: '/staff', icon: Users },
      { title: 'System', path: '/system', icon: Settings },
    ],
  },
];

export default function AppSidebar() {
  const { sidebarCollapsed, toggleSidebar, orders, assistanceRequests } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('coffee_admin_token');
    navigate('/login');
  };

  const activeOrderCount = orders.filter((o) => !['completed'].includes(o.status)).length;
  const pendingAssistance = assistanceRequests.length;

  const getBadge = (type?: 'orders' | 'assistance') => {
    if (type === 'orders' && activeOrderCount > 0) return activeOrderCount;
    if (type === 'assistance' && pendingAssistance > 0) return pendingAssistance;
    return null;
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen flex flex-col border-r border-sidebar-border bg-sidebar noise-overlay z-50 transition-all duration-300',
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-sidebar-border relative z-10">
        <div className="w-9 h-9 rounded-xl bg-sidebar-primary/20 flex items-center justify-center flex-shrink-0">
          <Coffee className="w-5 h-5 text-sidebar-primary" />
        </div>
        {!sidebarCollapsed && (
          <span className="font-display text-lg text-sidebar-foreground tracking-tight">Coffee Time</span>
        )}
      </div>

      {/* Admin Info */}
      {!sidebarCollapsed && (
        <div className="flex items-center gap-3 px-5 py-4 border-b border-sidebar-border relative z-10">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary/30 flex items-center justify-center text-xs font-semibold text-sidebar-primary">
            AM
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">Admin Manager</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sidebar-primary/15 text-sidebar-primary font-medium">
              Super Admin
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 relative z-10 custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-8">
            {!sidebarCollapsed && (
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 px-4 mb-3 font-bold">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const isActive = location.pathname === item.path;
              const badge = getBadge(item.badge);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3.5 px-4 py-3 rounded-xl mb-1 text-sm transition-all duration-300 group relative',
                    isActive
                      ? 'text-sidebar-primary bg-sidebar-primary/10'
                      : 'text-sidebar-foreground/40 hover:text-sidebar-foreground/80 hover:bg-white/5'
                  )}
                >
                  {isActive && <motion.div layoutId="activeNav" className="absolute left-0 w-1 h-6 bg-sidebar-primary rounded-r-full" />}
                  <item.icon className={cn('w-[18px] h-[18px] flex-shrink-0 transition-colors', isActive ? 'text-sidebar-primary' : 'group-hover:text-sidebar-primary')} />
                  {!sidebarCollapsed && <span className={cn("flex-1 tracking-tight", isActive ? "font-semibold" : "font-medium")}>{item.title}</span>}
                  {badge !== null && (
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded-lg min-w-[22px] text-center shadow-lg',
                      item.badge === 'orders'
                        ? 'bg-primary text-white'
                        : 'bg-destructive text-white'
                    )}>
                      {badge}
                    </span>
                  )}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-4 px-3 py-2 rounded-xl bg-sidebar text-sidebar-foreground text-xs opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all shadow-2xl border border-white/10 whitespace-nowrap z-50">
                      {item.title}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className={cn(
          "flex items-center gap-3 px-6 py-4 border-t border-sidebar-border text-sidebar-foreground/60 hover:text-destructive transition-colors relative z-10",
          sidebarCollapsed && "justify-center px-0"
        )}
      >
        <LogOut className="w-[18px] h-[18px]" />
        {!sidebarCollapsed && <span className="text-sm font-medium">Logout</span>}
      </button>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center py-4 border-t border-sidebar-border text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors relative z-10"
      >
        {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
