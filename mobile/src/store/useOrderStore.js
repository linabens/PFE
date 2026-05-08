import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useOrderStore = create(
  persist(
    (set) => ({
      currentOrderId: null,
      orderStatus: null,
      hasShownReady: false,

      setCurrentOrder: (orderId, status = 'new') =>
        set({ currentOrderId: orderId, orderStatus: status, hasShownReady: false }),

      updateOrderStatus: (status) => set({ orderStatus: status }),
      
      setHasShownReady: (value) => set({ hasShownReady: value }),

      clearCurrentOrder: () => set({ currentOrderId: null, orderStatus: null, hasShownReady: false }),
    }),
    {
      name: 'brew-luna-orders',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
