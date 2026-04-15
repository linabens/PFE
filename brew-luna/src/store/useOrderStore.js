import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * BREW LUNA — Order Store
 * Manages tracking of the current active order
 */

export const useOrderStore = create(
  persist(
    (set) => ({
      currentOrderId: null,
      orderStatus: null, // 'pending', 'preparing', 'ready', 'completed'
      orderHistory: [],
      
      // Actions
      setCurrentOrder: (orderId, status = 'new') => set({ 
        currentOrderId: orderId, 
        orderStatus: status 
      }),
      
      updateOrderStatus: (status) => set({ orderStatus: status }),
      
      addToHistory: (order) => set((state) => ({ 
        orderHistory: [order, ...state.orderHistory].slice(0, 10) 
      })),
      
      clearCurrentOrder: () => set({ currentOrderId: null, orderStatus: null }),
    }),
    {
      name: 'brew-luna-orders',
      storage: createJSONStorage(() => sessionStorage), // Use session storage for order tracking
    }
  )
);
