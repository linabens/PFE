import { Search, Bell, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme-toggle';
import { CommandMenu } from './CommandMenu';
import { useState, useEffect } from 'react';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Real-time overview of your coffee shop' },
  '/orders': { title: 'Live Orders', subtitle: 'Track and manage active orders' },
  '/products': { title: 'Products', subtitle: 'Manage your menu and inventory' },
  '/categories': { title: 'Categories', subtitle: 'Organize your products' },
  '/tables': { title: 'Tables & QR Codes', subtitle: 'Manage floor layout and QR codes' },
  '/loyalty': { title: 'Loyalty Program', subtitle: 'Customer rewards and points' },
  '/assistance': { title: 'Assistance Requests', subtitle: 'Handle customer calls' },
  '/revenue': { title: 'Revenue', subtitle: 'Financial reports and insights' },
  '/analytics': { title: 'Analytics', subtitle: 'Deep dive into your data' },
  '/staff': { title: 'Staff Accounts', subtitle: 'Manage team access' },
  '/system': { title: 'System Settings', subtitle: 'Configure your application' },
};

export default function Topbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const page = pageTitles[location.pathname] || { title: 'Page', subtitle: '' };

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('coffee_admin_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  return (
    <header className="h-20 border-b border-border flex items-center justify-between px-8 bg-background/80 backdrop-blur-sm sticky top-0 z-40 transition-all duration-300">
      <div className="flex flex-col">
        <h1 className="text-2xl md:text-3xl font-display text-foreground tracking-tight">
          {location.pathname === '/' ? 'Welcome to Coffee Time' : page.title}
        </h1>
        {page.subtitle && (
          <p className="text-sm text-muted-foreground/80 mt-0.5">{page.subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-6">
        <button 
          onClick={() => setOpen(true)}
          className="relative hidden lg:flex items-center w-72 h-10 px-4 rounded-xl bg-secondary/40 border border-espresso/5 text-sm text-muted-foreground/60 hover:bg-secondary/60 transition-all group"
        >
          <Search className="w-4 h-4 mr-3 group-hover:text-primary transition-colors" />
          <span>Search luxury blends...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-espresso/10 bg-latte/20 px-1.5 font-mono text-[10px] font-medium opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        <CommandMenu open={open} setOpen={setOpen} />

        <ThemeToggle />

        <button className="relative p-2.5 rounded-xl hover:bg-secondary/60 transition-all group">
          <Bell className="w-[18px] h-[18px] text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
        </button>
        
        <div className="flex items-center gap-3 pl-2 border-l border-border/50">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground">{user?.full_name || 'Admin Manager'}</p>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{user?.role || 'Super Admin'}</p>
          </div>
          <button className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group overflow-hidden">
            <User className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
}
