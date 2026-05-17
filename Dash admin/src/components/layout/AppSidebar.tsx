import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Activity, Coffee, Grid3X3, QrCode,
  Star, Bell, Sparkles, Banknote, BarChart3, Users, Settings,
  ChevronLeft, ChevronRight, LogOut, Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { title: 'sidebar.dashboard', path: '/', icon: LayoutDashboard },
      { title: 'sidebar.orders', path: '/orders', icon: Activity, badge: 'orders' as const },
    ],
  },
  {
    label: 'Management',
    items: [
      { title: 'sidebar.products', path: '/products', icon: Package, roles: ['admin'] },
      { title: 'sidebar.categories', path: '/categories', icon: Grid3X3, roles: ['admin'] },
      { title: 'sidebar.promotions', path: '/promotions', icon: Sparkles, roles: ['admin'] },
      { title: 'sidebar.tables', path: '/tables', icon: QrCode },
    ],
  },
  {
    label: 'Customers',
    items: [
      { title: 'sidebar.loyalty', path: '/loyalty', icon: Star },
      { title: 'sidebar.assistance', path: '/assistance', icon: Bell, badge: 'assistance' as const },
    ],
  },
  {
    label: 'Reports',
    items: [
      { title: 'sidebar.revenue', path: '/revenue', icon: Banknote, roles: ['admin'] },
      { title: 'sidebar.analytics', path: '/analytics', icon: BarChart3, roles: ['admin'] },
    ],
  },
  {
    label: 'Settings',
    items: [
      { title: 'sidebar.staff', path: '/staff', icon: Users, roles: ['admin'] },
      { title: 'sidebar.profile', path: '/profile', icon: Settings },
    ],
  },
];

export default function AppSidebar() {
  const { sidebarCollapsed, toggleSidebar, orders, assistanceRequests, user, setUser } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr');
  };

  const handleLogout = () => {
    localStorage.removeItem('coffee_admin_token');
    localStorage.removeItem('coffee_admin_user');
    setUser(null);
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
      {!sidebarCollapsed && user && (
        <div className="flex items-center gap-3 px-5 py-4 border-b border-sidebar-border relative z-10">
          <div className="w-10 h-10 rounded-full border-2 border-sidebar-primary/20 bg-sidebar-primary/10 flex items-center justify-center overflow-hidden">
            {user.avatar ? (
              user.avatar.startsWith('data:') ? (
                <img src={user.avatar} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">{user.avatar}</span>
              )
            ) : (
              <span className="text-xs font-semibold text-sidebar-primary">
                {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'CT'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user.full_name || 'Admin'}</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sidebar-primary/15 text-sidebar-primary font-medium uppercase tracking-widest">
              {user.role}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={cn(
        "flex-1 overflow-y-auto py-6 relative z-10 scrollbar-none",
        sidebarCollapsed ? "px-3" : "px-4"
      )}>
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(item => {
            const roles = 'roles' in item ? (item as any).roles : undefined;
            return !roles || (user && roles.includes(user.role));
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="mb-8">
              {!sidebarCollapsed && (
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 px-4 mb-3 font-bold">
                  {group.label}
                </p>
              )}
              {visibleItems.map((item) => {
                const isActive = location.pathname === item.path;
                const itemBadge = 'badge' in item ? (item as any).badge : undefined;
                const badge = getBadge(itemBadge);
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
                    {!sidebarCollapsed && <span className={cn("flex-1 tracking-tight", isActive ? "font-semibold" : "font-medium")}>{item.title.startsWith('sidebar.') ? t(item.title) : item.title}</span>}
                    {badge !== null && (
                      <span className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-lg transition-all',
                        itemBadge === 'orders'
                          ? 'bg-primary text-white'
                          : 'bg-destructive text-white',
                        sidebarCollapsed
                          ? 'absolute top-1.5 right-1.5 scale-90 border-2 border-sidebar shadow-xl'
                          : 'relative ml-auto'
                      )}>
                        {badge}
                      </span>
                    )}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-4 px-3 py-2 rounded-xl bg-sidebar text-sidebar-foreground text-xs opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all shadow-2xl border border-white/10 whitespace-nowrap z-50">
                        {item.title}
                        {t(item.title)}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer Controls */}
      <div className="p-4 border-t border-sidebar-border relative z-10 flex flex-col gap-2">
        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-300 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5',
            sidebarCollapsed && 'justify-center px-0'
          )}
        >
          <div className="w-[18px] h-[18px] flex-shrink-0 font-display font-black text-[12px] uppercase border border-sidebar-foreground/30 rounded flex items-center justify-center">
            {i18n.language.substring(0, 2)}
          </div>
          {!sidebarCollapsed && <span className="font-medium tracking-tight flex-1 text-left">{t('sidebar.language')}</span>}
        </button>

        {/* Toggle Collapse */}
        <button
          onClick={toggleSidebar}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-300 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-white/5 hidden md:flex',
            sidebarCollapsed && 'justify-center px-0'
          )}
        >
          {sidebarCollapsed ? <ChevronRight className="w-[18px] h-[18px]" /> : <ChevronLeft className="w-[18px] h-[18px]" />}
          {!sidebarCollapsed && <span className="font-medium tracking-tight flex-1 text-left">{t('sidebar.collapse')}</span>}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-300 text-destructive/70 hover:text-destructive hover:bg-destructive/10',
            sidebarCollapsed && 'justify-center px-0'
          )}
        >
          <LogOut className="w-[18px] h-[18px]" />
          {!sidebarCollapsed && <span className="font-medium tracking-tight flex-1 text-left">{t('sidebar.logout')}</span>}
        </button>
      </div>
    </aside>
  );
}
