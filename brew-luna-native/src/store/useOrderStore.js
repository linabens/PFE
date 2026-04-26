import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useOrderStore = create(
  persist(
    (set) => ({
      currentOrderId: null,
      orderStatus: null,

      setCurrentOrder: (orderId, status = 'new') =>
        set({ currentOrderId: orderId, orderStatus: status }),

      updateOrderStatus: (status) => set({ orderStatus: status }),

      clearCurrentOrder: () => set({ currentOrderId: null, orderStatus: null }),
    }),
    {
      name: 'brew-luna-orders',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
