import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Users, ShoppingBag, Clock, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const COLORS = ['#8B5742', '#6A5750', '#392A25', '#220C02', '#E3C9AD', '#C09891', '#7A5C4D'];

interface AnalyticsStats {
  gross_revenue: { value: number, change: string };
  new_customers: { value: number, change: string };
  average_order: { value: number, change: string };
  prep_efficiency: { value: number, change: string };
}

interface AnalyticsData {
  period: number;
  stats: AnalyticsStats;
  revenue_chart: { name: string, revenue: number, orders: number }[];
  category_chart: { name: string, value: number }[];
  peak_hours: number[];
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7' | '30'>('7');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.get<AnalyticsData>(`/admin/analytics?period=${period}`);
        if (res) {
          setData(res);
        }
      } catch (err) {
        console.error('Analytics fetch error:', err);
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [period]);

  const stats = data ? [
    { title: 'Gross Revenue', value: `$${data.stats.gross_revenue.value.toFixed(2)}`, change: data.stats.gross_revenue.change, icon: TrendingUp, positive: !data.stats.gross_revenue.change.startsWith('-') },
    { title: 'New Customers', value: data.stats.new_customers.value.toString(), change: data.stats.new_customers.change, icon: Users, positive: !data.stats.new_customers.change.startsWith('-') },
    { title: 'Average Order', value: `$${data.stats.average_order.value.toFixed(2)}`, change: data.stats.average_order.change, icon: ShoppingBag, positive: !data.stats.average_order.change.startsWith('-') },
    { title: 'Prep Efficiency', value: `${data.stats.prep_efficiency.value}m`, change: data.stats.prep_efficiency.change, icon: Clock, positive: data.stats.prep_efficiency.change.startsWith('-') }, // Negative change is good for time!
  ] : [];

  const maxPeak = data && data.peak_hours.length > 0 ? Math.max(...data.peak_hours) : 1;


  return (
    <div className="space-y-8 pb-12">
      {loading && !data ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Crunching numbers...</p>
        </div>
      ) : (
        <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 rounded-2xl border border-espresso/5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-primary/10">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${stat.positive ? 'text-success' : 'text-destructive'}`}>
                {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.title}</p>
            <h3 className="text-2xl font-display mt-1 text-foreground">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 glass-card p-8 rounded-3xl border border-espresso/5"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-display text-xl text-foreground">Revenue Performance</h3>
              <p className="text-sm text-muted-foreground">Weekly earnings vs projected growth</p>
            </div>
            <select 
              value={period}
              onChange={(e) => setPeriod(e.target.value as '7' | '30')}
              className="bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary/50 outline-none"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
          </div>
          
          <div className="h-[350px] w-full relative">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.revenue_chart || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--caramel))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--caramel))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsla(var(--espresso), 0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--espresso))', 
                    border: 'none', 
                    borderRadius: '12px',
                    color: 'hsl(var(--latte))'
                  }}
                  itemStyle={{ color: 'hsl(var(--caramel))' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--caramel))" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Pie Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-8 rounded-3xl border border-espresso/5 flex flex-col"
        >
          <h3 className="font-display text-xl text-foreground mb-1">Sales by Category</h3>
          <p className="text-sm text-muted-foreground mb-8">Product distribution mix</p>
          
          <div className="flex-1 min-h-[300px]">
            {data?.category_chart && data.category_chart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.category_chart}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                  {data.category_chart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--espresso))', 
                    border: 'none', 
                    borderRadius: '12px',
                    color: 'hsl(var(--latte))'
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No category data for this period
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Hourly Heatmap or Similar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-8 rounded-3xl border border-espresso/5"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-display text-xl text-foreground">Peak Order Hours</h3>
            <p className="text-sm text-muted-foreground">Identifying busiest time slots</p>
          </div>
        </div>

        <div className="h-48 w-full flex items-end gap-1 px-4">
          {(data?.peak_hours || Array(24).fill(0)).map((h, i) => {
            const heightPct = maxPeak > 0 ? (h / maxPeak) * 100 : 0;
            return (
            <div key={i} className="flex-1 group relative h-full flex flex-col justify-end">
              <div 
                className="w-full bg-primary/20 rounded-t-sm group-hover:bg-primary transition-colors cursor-pointer" 
                style={{ height: `${heightPct}%`, minHeight: h > 0 ? '4px' : '0' }}
              />
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-espresso text-latte text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                {i}:00 — {h} Orders
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground text-center opacity-40">
                {i % 4 === 0 ? `${i}h` : ''}
              </div>
            </div>
          )})}
        </div>
      </motion.div>
        </>
      )}
    </div>
  );
}
