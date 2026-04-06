import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, History, Loader2 } from 'lucide-react';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.06 } } },
  item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
};

export default function LoyaltyPage() {
  const { loyaltyMembers, loading, fetchLoyalty } = useAppStore();

  useEffect(() => {
    fetchLoyalty();
  }, [fetchLoyalty]);

  if (loading && loyaltyMembers.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading loyalty records...</p>
      </div>
    );
  }

  const totalPoints = loyaltyMembers.reduce((s, m) => s + m.points, 0);
  const totalEarned = loyaltyMembers.reduce((s, m) => s + m.totalEarned, 0);

  // Dynamic "Active This Week"
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const activeThisWeek = loyaltyMembers.filter(m => new Date(m.lastActivity) > oneWeekAgo).length;

  const getPointsColor = (points: number) => {
    if (points >= 1000) return 'text-success';
    if (points >= 300) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-6">
      {/* Stats */}
      <motion.div variants={stagger.container} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={stagger.item} className="glass-card rounded-xl p-5 text-center">
          <p className="font-display text-2xl text-foreground"><CountUp end={loyaltyMembers.length} duration={1} /></p>
          <p className="text-xs text-muted-foreground mt-1">Total Members</p>
        </motion.div>
        <motion.div variants={stagger.item} className="glass-card rounded-xl p-5 text-center">
          <p className="font-display text-2xl text-foreground"><CountUp end={totalEarned} duration={1.2} separator="," /></p>
          <p className="text-xs text-muted-foreground mt-1">Points Distributed</p>
        </motion.div>
        <motion.div variants={stagger.item} className="glass-card rounded-xl p-5 text-center">
          <p className="font-display text-2xl text-foreground"><CountUp end={totalEarned - totalPoints} duration={1.2} separator="," /></p>
          <p className="text-xs text-muted-foreground mt-1">Points Redeemed</p>
        </motion.div>
        <motion.div variants={stagger.item} className="glass-card rounded-xl p-5 text-center">
          <p className="font-display text-2xl text-foreground"><CountUp end={activeThisWeek} duration={0.8} /></p>
          <p className="text-xs text-muted-foreground mt-1">Active This Week</p>
        </motion.div>
      </motion.div>

      {/* Customer Table */}
      <motion.div variants={stagger.item} className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-muted-foreground font-medium p-4">Name</th>
                <th className="text-left text-xs text-muted-foreground font-medium p-4">Phone</th>
                <th className="text-right text-xs text-muted-foreground font-medium p-4">Points</th>
                <th className="text-right text-xs text-muted-foreground font-medium p-4">Total Earned</th>
                <th className="text-left text-xs text-muted-foreground font-medium p-4">Last Activity</th>
                <th className="text-right text-xs text-muted-foreground font-medium p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loyaltyMembers.map((member) => (
                <tr key={member.id} className="border-b border-border/50 hover:bg-secondary/30 group transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {member.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <span className="text-sm text-foreground font-medium">{member.name}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-xs text-muted-foreground">{member.phone}</td>
                  <td className={cn('p-4 text-right font-display text-lg', getPointsColor(member.points))}>
                    {member.points.toLocaleString()}
                  </td>
                  <td className="p-4 text-right text-sm text-muted-foreground">{member.totalEarned.toLocaleString()}</td>
                  <td className="p-4 text-xs text-muted-foreground">{format(member.lastActivity, 'MMM d, HH:mm')}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-md hover:bg-primary/15 text-muted-foreground hover:text-primary transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <History className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
