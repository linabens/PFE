import { create } from 'zustand';
import { api } from '@/lib/api';

export type OrderStatus = 'new' | 'brewing' | 'preparing' | 'ready' | 'completed';
export type TableStatus = 'free' | 'occupied' | 'needs-attention';

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  tableNumber: number;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: Date;
  total: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  categoryId: number;
  active: boolean;
  trending: boolean;
  seasonal: boolean;
  imageUrl?: string;
}

export interface CoffeeTable {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  activeOrders: number;
  active: boolean;
}

export interface LoyaltyMember {
  id: string;
  name: string;
  phone: string;
  points: number;
  totalEarned: number;
  lastActivity: Date;
}

export interface AssistanceRequest {
  id: string;
  tableNumber: number;
  requestedAt: Date;
  handled: boolean;
}

export interface Promotion {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  imageUrl: string;
  active: boolean;
  displayOrder: number;
}

export interface DashboardStats {
  today: {
    total_orders: number;
    total_revenue: number;
    completed_orders: number;
    pending_orders: number;
    avg_prep_time_minutes: number;
    date: string;
  };
  live: {
    active_orders: number;
    pending_assistance: number;
  };
  revenue_last_7_days: Array<{ date: string; orders: number; revenue: number }>;
  top_products_today: Array<{ id: number; name: string; qty_sold: number; revenue: number }>;
  recent_orders: Array<{
    id: string;
    status: OrderStatus;
    total_price: string;
    created_at: string;
    table_number: number;
  }>;
}

export interface Category {
  id: number;
  name: string;
  type: string;
  display_order: number | null;
}

interface AppState {
  sidebarCollapsed: boolean;
  loading: boolean;
  error: string | null;
  toggleSidebar: () => void;
  orders: Order[];
  products: Product[];
  categories: Category[];
  tables: CoffeeTable[];
  loyaltyMembers: LoyaltyMember[];
  assistanceRequests: AssistanceRequest[];
  allAssistanceRequests: AssistanceRequest[];
  promotions: Promotion[];
  dashboardStats: DashboardStats | null;

  // Actions
  fetchInitialData: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchTables: () => Promise<void>;
  fetchLoyalty: () => Promise<void>;
  fetchAssistance: () => Promise<void>;
  fetchAllAssistance: () => Promise<void>;
  fetchPromotions: () => Promise<void>;
  fetchDashboardStats: () => Promise<void>;
  fetchDashboardSummary: (period: 'today' | 'week' | 'month') => Promise<void>;

  advanceOrderStatus: (orderId: string, nextStatus: OrderStatus) => Promise<void>;
  handleAssistance: (id: string) => Promise<void>;

  // Promotion Actions
  addPromotion: (promo: Omit<Promotion, 'id'>) => Promise<void>;
  deletePromotion: (id: string) => Promise<void>;
  togglePromotionStatus: (id: string, currentStatus: boolean) => Promise<void>;

  // Product Actions
  toggleProductActive: (id: string, currentStatus: boolean) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Category Actions
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: number, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;

  // Table Actions
  addTable: (table: { number: number; capacity: number }) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
}

const statusFlow: Record<OrderStatus, OrderStatus | null> = {
  new: 'brewing',
  brewing: 'preparing',
  preparing: 'ready',
  ready: 'completed',
  completed: null,
};

export const useAppStore = create<AppState>((set, get) => ({
  sidebarCollapsed: false,
  loading: false,
  error: null,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  orders: [],
  products: [],
  categories: [],
  tables: [],
  loyaltyMembers: [],
  assistanceRequests: [],
  allAssistanceRequests: [],
  promotions: [],
  dashboardStats: null,

  fetchInitialData: async () => {
    set({ loading: true, error: null });
    try {
      await Promise.all([
        get().fetchDashboardStats(),
        get().fetchCategories(),
        get().fetchProducts(),
        get().fetchOrders(),
        get().fetchTables(),
        get().fetchAssistance(),
        get().fetchLoyalty(),
        get().fetchPromotions(),
      ]);
    } catch (err: any) {
      console.error('Fetch Initial Data Error:', err);
      set({ error: err.message || 'Verification Error' });
    } finally {
      set({ loading: false });
    }
  },

  fetchDashboardStats: async () => {
    const data = await api.get<DashboardStats>('/admin/dashboard');
    set({ dashboardStats: data });
  },

  fetchDashboardSummary: async (period: 'today' | 'week' | 'month') => {
    const data = await api.get<any>(`/admin/revenue/summary?period=${period}`);
    if (get().dashboardStats) {
      set({
        dashboardStats: {
          ...get().dashboardStats!,
          today: {
            ...get().dashboardStats!.today,
            total_orders: data.total_orders,
            total_revenue: data.total_revenue,
            avg_prep_time_minutes: data.avg_prep_time_minutes || get().dashboardStats!.today.avg_prep_time_minutes
          }
        }
      });
    }
  },

  fetchCategories: async () => {
    const data = await api.get<any[]>('/categories');
    set({
      categories: data.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        display_order: c.display_order
      }))
    });
  },

  fetchProducts: async () => {
    const data = await api.get<any[]>('/products');
    const cats = get().categories;
    set({
      products: data.map(p => ({
        id: p.id.toString(),
        name: p.name,
        description: p.description,
        price: parseFloat(p.price),
        categoryId: p.category_id,
        category: cats.find(c => c.id === p.category_id)?.name || 'Uncategorized',
        active: p.is_active,
        trending: p.is_trending,
        seasonal: p.is_seasonal,
        imageUrl: p.image_url
      }))
    });
  },

  fetchOrders: async () => {
    const data = await api.get<any[]>('/admin/orders/active');
    set({
      orders: data.map(o => ({
        id: o.id.toString(),
        tableNumber: o.table_number,
        status: o.status,
        items: (o.items || []).map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: parseFloat(item.price)
        })),
        createdAt: new Date(o.created_at),
        total: parseFloat(o.total_price)
      }))
    });
  },

  fetchTables: async () => {
    const data = await api.get<any[]>('/admin/tables');
    set({
      tables: data.map(t => ({
        id: t.id.toString(),
        number: t.table_number,
        capacity: t.capacity,
        status: t.active_orders > 0 ? 'occupied' : 'free',
        activeOrders: t.active_orders,
        active: t.is_active
      }))
    });
  },

  fetchLoyalty: async () => {
    const data = await api.get<{ accounts: any[]; total: number }>('/admin/loyalty');
    set({
      loyaltyMembers: data.accounts.map(l => ({
        id: l.id.toString(),
        name: l.customer_name,
        phone: l.phone_number || 'N/A',
        points: l.points,
        totalEarned: l.total_earned,
        lastActivity: new Date(l.updated_at)
      }))
    });
  },

  fetchAssistance: async () => {
    const data = await api.get<any[]>('/assistance/pending');
    set({
      assistanceRequests: data.map(r => ({
        id: r.id.toString(),
        tableNumber: r.table_number,
        requestedAt: new Date(r.requested_at),
        handled: r.status === 'handled'
      }))
    });
  },

  fetchAllAssistance: async () => {
    // fetch all handled + pending by fetching pending and recent handled separately
    const pending = await api.get<any[]>('/assistance/pending');
    set({
      allAssistanceRequests: pending.map(r => ({
        id: r.id.toString(),
        tableNumber: r.table_number,
        requestedAt: new Date(r.requested_at),
        handled: r.status === 'handled'
      }))
    });
  },

  fetchPromotions: async () => {
    const data = await api.get<any[]>('/promotions/all');
    set({
      promotions: data.map(p => ({
        id: p.id.toString(),
        title: p.title,
        subtitle: p.subtitle,
        tag: p.tag,
        imageUrl: p.image_url,
        active: p.is_active,
        displayOrder: p.display_order
      }))
    });
  },

  advanceOrderStatus: async (orderId, nextStatus) => {
    await api.patch(`/orders/${orderId}/status`, { status: nextStatus });
    await get().fetchOrders();
    await get().fetchDashboardStats();
  },

  handleAssistance: async (id) => {
    await api.patch(`/assistance/${id}/handle`, {});
    await get().fetchAssistance();
    await get().fetchDashboardStats();
  },

  toggleProductActive: async (id, currentStatus) => {
    await api.patch(`/products/${id}`, { is_active: !currentStatus });
    await get().fetchProducts();
  },

  addProduct: async (product) => {
    await api.post('/products', {
      ...product,
      category_id: product.categoryId,
      is_active: product.active,
      is_trending: product.trending,
      is_seasonal: product.seasonal,
      image_url: product.imageUrl
    });
    await get().fetchProducts();
  },

  deleteProduct: async (id) => {
    await api.delete(`/products/${id}`);
    await get().fetchProducts();
  },

  addCategory: async (category) => {
    await api.post('/categories', category);
    await get().fetchCategories();
  },

  updateCategory: async (id, data) => {
    await api.patch(`/categories/${id}`, data);
    await get().fetchCategories();
  },

  deleteCategory: async (id) => {
    await api.delete(`/categories/${id}`);
    await get().fetchCategories();
  },

  addTable: async (table) => {
    await api.post('/tables', {
      table_number: table.number,
      capacity: table.capacity
    });
    await get().fetchTables();
  },

  deleteTable: async (id) => {
    await api.delete(`/tables/${id}`);
    await get().fetchTables();
  },

  addPromotion: async (promo) => {
    await api.post('/promotions', {
      title: promo.title,
      subtitle: promo.subtitle,
      tag: promo.tag,
      image_url: promo.imageUrl,
      display_order: promo.displayOrder
    });
    await get().fetchPromotions();
  },

  deletePromotion: async (id) => {
    await api.delete(`/promotions/${id}`);
    await get().fetchPromotions();
  },

  togglePromotionStatus: async (id, currentStatus) => {
    await api.patch(`/promotions/${id}/status`, { is_active: !currentStatus });
    await get().fetchPromotions();
  },
}));
