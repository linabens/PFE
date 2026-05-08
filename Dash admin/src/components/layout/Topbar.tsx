import { Search, Bell, User, Clock, Check, ExternalLink, Inbox } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme-toggle';
import { CommandMenu } from './CommandMenu';
import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/appStore';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

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
  '/profile': { title: 'Mon Profil', subtitle: 'Gérer vos informations personnelles' },
};

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { user, fetchAssistance, assistanceRequests } = useAppStore();
  const page = pageTitles[location.pathname] || { title: 'Page', subtitle: '' };

  useEffect(() => {
    if (!user) return; // Don't poll if not logged in

    fetchAssistance();
    const interval = setInterval(fetchAssistance, 30000); // Increased to 30s for better performance
    return () => clearInterval(interval);
  }, [fetchAssistance, user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsDone = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.patch(`/assistance/${id}/handle`, {});
      toast.success('Demande marquée comme traitée');
      fetchAssistance();
    } catch (err) {
      toast.error('Erreur lors du traitement');
    }
  };

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

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2.5 rounded-xl transition-all group ${showNotifications ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/60 text-muted-foreground'}`}
            title="Notifications"
          >
            <Bell className={`w-[18px] h-[18px] transition-colors ${showNotifications ? 'text-primary' : 'group-hover:text-primary'}`} />
            {assistanceRequests.length > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-destructive flex items-center justify-center border-2 border-background animate-in zoom-in duration-300">
                <span className="text-[9px] font-bold text-white">{assistanceRequests.length}</span>
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute right-0 mt-3 w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                  <h3 className="font-display text-sm font-semibold text-foreground">Notifications</h3>
                  <Link 
                    to="/assistance" 
                    onClick={() => setShowNotifications(false)}
                    className="text-[10px] font-bold text-primary uppercase tracking-wider hover:underline flex items-center gap-1"
                  >
                    Voir tout <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {assistanceRequests.length === 0 ? (
                    <div className="p-10 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mb-3">
                        <Inbox className="w-6 h-6 text-muted-foreground/40" />
                      </div>
                      <p className="text-xs font-medium text-foreground">Aucun appel en attente</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Vous êtes à jour !</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {assistanceRequests.map((req) => (
                        <div 
                          key={req.id} 
                          className="p-4 hover:bg-secondary/30 transition-colors cursor-pointer group"
                          onClick={() => {
                            navigate('/assistance');
                            setShowNotifications(false);
                          }}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-xs font-semibold text-foreground">Appel Table {req.tableNumber}</p>
                            <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {formatDistanceToNow(new Date(req.requestedAt), { addSuffix: true, locale: fr })}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mb-3">Le client demande de l'assistance à sa table.</p>
                          <button
                            onClick={(e) => handleMarkAsDone(e, req.id)}
                            className="w-full h-8 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Check className="w-3 h-3" /> Marquer comme traité
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {assistanceRequests.length > 0 && (
                  <div className="p-2 border-t border-border bg-muted/10 text-center">
                    <p className="text-[9px] text-muted-foreground">Notifications en temps réel</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3 pl-2 border-l border-border/50">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground">{user?.full_name}</p>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{user?.role}</p>
          </div>
          <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group overflow-hidden hover:ring-2 hover:ring-primary/40 transition-all">
            {user?.avatar ? (
              user.avatar.startsWith('data:') ? (
                <img src={user.avatar} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">{user.avatar}</span>
              )
            ) : (
              <User className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
