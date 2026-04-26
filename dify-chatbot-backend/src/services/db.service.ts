import axios from 'axios';
import { prisma } from '../db/prisma';

const mainApi = axios.create({
  baseURL: process.env.MAIN_BACKEND_URL || 'http://localhost:3000/api',
  timeout: 5000,
});

mainApi.interceptors.request.use((config) => {
  config.headers['x-chatbot-key'] = process.env.CHATBOT_SECRET || '';
  return config;
});

// -------------------------------------------------------------
// Database-Aware Service Functions
// These functions retrieve structured data from the main backend
// and from PostgreSQL to feed into Dify as context.
// -------------------------------------------------------------

export const getUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, created_at: true },
  });
};

export const getConversationHistory = async (conversation_id: string) => {
  return await prisma.message.findMany({
    where: { conversation_id },
    orderBy: { created_at: 'asc' },
    take: 20, // last 20 messages
  });
};

/**
 * Fetch product info from the main backend by name.
 * Falls back to a descriptive message if not found.
 */
export const getProductByName = async (name: string): Promise<string> => {
  try {
    const response = await mainApi.get('/products');
    const products: any[] = response.data?.data || [];
    const match = products.find((p: any) =>
      p.name?.toLowerCase().includes(name.toLowerCase())
    );
    if (match) {
      const status = match.is_active ? 'available' : 'currently unavailable';
      const trending = match.is_trending ? ' (Trending 🔥)' : '';
      const seasonal = match.is_seasonal ? ' (Seasonal)' : '';
      return `"${match.name}" costs ${parseFloat(match.price).toFixed(2)} DZD and is ${status}${trending}${seasonal}. ${match.description || ''}`.trim();
    }
    return `No product named "${name}" was found in the current menu.`;
  } catch (err) {
    console.error('getProductByName error:', err);
    return `Unable to fetch product info for "${name}" right now.`;
  }
};

/**
 * Fetch all active products from the main backend.
 */
export const getAllProducts = async (): Promise<string> => {
  try {
    const response = await mainApi.get('/products');
    const products: any[] = response.data?.data || [];
    const active = products.filter((p: any) => p.is_active);
    if (active.length === 0) return 'The menu is currently empty.';
    const list = active
      .map((p: any) => `• ${p.name}: ${parseFloat(p.price).toFixed(2)} DZD${p.is_trending ? ' 🔥' : ''}`)
      .join('\n');
    return `Current Menu (${active.length} items):\n${list}`;
  } catch (err) {
    console.error('getAllProducts error:', err);
    return 'Unable to fetch the menu right now.';
  }
};

/**
 * Fetch real-time orders context.
 */
export const getRealtimeOrders = async (): Promise<string> => {
  try {
    const response = await mainApi.get('/admin/orders/active');
    const orders: any[] = response.data?.data || [];
    if (orders.length === 0) return "There are currently no active orders in the kitchen.";
    
    const summary = orders.map(o => {
      const itemsStr = (o.items || []).map((i: any) => `${i.quantity}x ${i.name}`).join(', ');
      return `- Order #${o.id} at Table ${o.table_number || '?'}: ${o.status.toUpperCase()} (${itemsStr})`;
    }).join('\n');
    
    return `Live Kitchen Status (${orders.length} active orders):\n${summary}`;
  } catch (err) {
    return "Unable to fetch live orders right now.";
  }
};

/**
 * Fetch today's detailed dashboard stats.
 */
export const getDashboardContext = async (): Promise<string> => {
  try {
    const [dashRes, revenueRes] = await Promise.all([
      mainApi.get('/admin/dashboard'),
      mainApi.get('/admin/revenue/summary?period=today')
    ]);

    const dash = dashRes.data?.data;
    const revenue = revenueRes.data?.data;

    if (!dash) return 'No dashboard data available.';

    const topSales = (dash.top_products || [])
      .slice(0, 5)
      .map((s: any) => `• ${s.name}: ${s.qty_sold} sold`)
      .join('\n');

    return (
      `TODAY'S PERFORMANCE:\n` +
      `- Total Orders: ${dash.today.total_orders}\n` +
      `- Total Revenue: ${parseFloat(dash.today.total_revenue).toFixed(2)} DZD\n` +
      `- Active Orders in Kitchen: ${dash.live.active_orders}\n` +
      `- Customers Waiting for Assistance: ${dash.live.pending_assistance}\n` +
      `TOP PRODUCTS TODAY:\n${topSales || 'No sales data yet.'}\n` +
      `RECENT ACTIVITY:\n${(dash.recent_orders || []).slice(0, 3).map((o: any) => `- Table ${o.table_number}: ${o.total_price} DZD (${o.status})`).join('\n')}`
    );
  } catch (err: any) {
    console.error('getDashboardContext error:', err.response?.data || err.message);
    return 'Unable to fetch real-time dashboard data.';
  }
};
