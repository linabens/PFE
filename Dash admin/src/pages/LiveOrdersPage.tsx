import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, OrderStatus } from '@/stores/appStore';
import { ArrowRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';

const columns: { status: OrderStatus; label: string; color: string }[] = [
  { status: 'new', label: 'New', color: 'border-info bg-info/5' },
  { status: 'brewing', label: 'Brewing', color: 'border-purple-500 bg-purple-500/5' },
  { status: 'preparing', label: 'Preparing', color: 'border-warning bg-warning/5' },
  { status: 'ready', label: 'Ready', color: 'border-success bg-success/5' },
];

export default function LiveOrdersPage() {
  const { orders, advanceOrderStatus, fetchOrders } = useAppStore();
  const [, setTick] = useState(0);

  // Auto refresh — re-fetch orders from backend every 15s
  useEffect(() => {
    fetchOrders().catch(console.error); // Fetch immediately on mount
    
    const i = setInterval(() => {
      setTick((t) => t + 1);
      fetchOrders().catch(console.error);
    }, 10000);
    return () => clearInterval(i);
  }, [fetchOrders]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-success animate-pulse-dot" />
        <span className="text-xs text-muted-foreground">Auto-refreshing every 10s</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.status);
          return (
            <div key={col.status} className={cn('rounded-xl border-t-2 p-4 glass-card min-h-[400px]', col.color)}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-foreground">{col.label}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
                  {colOrders.length}
                </span>
              </div>
              <AnimatePresence>
                <div className="space-y-3">
                  {colOrders.map((order) => {
                    const mins = Math.floor((Date.now() - order.createdAt.getTime()) / 60000);
                    const urgent = mins > 10;
                    return (
                      <motion.div
                        key={order.id}
                        layout
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        whileHover={{ y: -4, boxShadow: '0 0 0 1px rgba(200,134,10,0.3)' }}
                        className={cn(
                          'p-4 rounded-lg bg-secondary/60 transition-all cursor-pointer',
                          urgent && 'border-l-2 border-destructive animate-pulse'
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-sm font-bold text-primary font-display">
                            T{order.tableNumber}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">{order.id}</span>
                        </div>
                        <div className="space-y-1 mb-3">
                          {order.items.map((item, i) => (
                            <p key={i} className="text-sm text-foreground">
                              {item.quantity}× {item.name}
                            </p>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px]">{mins}m ago</span>
                          </div>
                          {col.status !== 'ready' ? (
                            <button
                              onClick={() => {
                                const nextMap: Record<OrderStatus, OrderStatus> = {
                                  new: 'brewing',
                                  brewing: 'preparing',
                                  preparing: 'ready',
                                  ready: 'completed',
                                  completed: 'completed'
                                };
                                advanceOrderStatus(order.id, nextMap[col.status]);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary/15 hover:bg-primary/25 text-primary text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.97]"
                            >
                              Next <ArrowRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <button
                              onClick={() => advanceOrderStatus(order.id, 'completed')}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-success/15 hover:bg-success/25 text-success text-xs font-medium transition-all"
                            >
                              Complete ✓
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                  {colOrders.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                      No orders
                    </div>
                  )}
                </div>
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
