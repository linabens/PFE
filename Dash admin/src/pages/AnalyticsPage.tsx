import { motion } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { TrendingUp, Users, ShoppingBag, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useMemo } from 'react';

const revenueData = [
  { name: 'Mon', revenue: 4000, orders: 240 },
  { name: 'Tue', revenue: 3000, orders: 198 },
  { name: 'Wed', revenue: 2000, orders: 150 },
  { name: 'Thu', revenue: 2780, orders: 190 },
  { name: 'Fri', revenue: 1890, orders: 120 },
  { name: 'Sat', revenue: 2390, orders: 170 },
  { name: 'Sun', revenue: 3490, orders: 210 },
];

const categoryData = [
  { name: 'Signature Blends', value: 400 },
  { name: 'Single Origin', value: 300 },
  { name: 'Cold Drip', value: 200 },
  { name: 'Pastries', value: 278 },
  { name: 'Brunch', value: 189 },
];

const COLORS = ['#8B5742', '#6A5750', '#392A25', '#220C02', '#E3C9AD'];

export default function AnalyticsPage() {
  const { dashboardStats } = useAppStore();

  const stats = [
    { title: 'Gross Revenue', value: '$12,845', change: '+12.5%', icon: TrendingUp, positive: true },
    { title: 'New Customers', value: '482', change: '+18.2%', icon: Users, positive: true },
    { title: 'Average Order', value: '$24.50', change: '-2.4%', icon: ShoppingBag, positive: false },
    { title: 'Prep Efficiency', value: '14.2m', change: '+5.1%', icon: Clock, positive: true },
  ];

  return (
    <div className="space-y-8 pb-12">
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
            <select className="bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary/50 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
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
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
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
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
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
          {[40, 25, 15, 10, 15, 35, 60, 85, 95, 80, 55, 45, 65, 75, 90, 85, 40, 30, 45, 50, 35, 20, 15, 10].map((h, i) => (
            <div key={i} className="flex-1 group relative">
              <div 
                className="w-full bg-primary/20 rounded-t-sm group-hover:bg-primary transition-colors cursor-pointer" 
                style={{ height: `${h}%` }}
              />
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-espresso text-latte text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {i}:00 — {h} Orders
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground text-center opacity-40">
                {i % 4 === 0 ? `${i}h` : ''}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
