import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * BREW LUNA — Cart Store
 * Manages items selection and totals
 */

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // [{ id, name, price, quantity, options }]
      
      // Actions
      addItem: (product, quantity = 1, options = []) => {
        const { items } = get();
        // Check if item with same ID and same options already exists
        const existingItemIndex = items.findIndex(
          (item) => item.id === product.id && JSON.stringify(item.options) === JSON.stringify(options)
        );

        if (existingItemIndex !== -1) {
          const updatedItems = [...items];
          updatedItems[existingItemIndex].quantity += quantity;
          set({ items: updatedItems });
        } else {
          set({ items: [...items, { ...product, quantity, options }] });
        }
      },

      removeItem: (productId, options = []) => {
        const { items } = get();
        set({
          items: items.filter(
            (item) => !(item.id === productId && JSON.stringify(item.options) === JSON.stringify(options))
          ),
        });
      },

      updateQuantity: (productId, quantity, options = []) => {
        if (quantity < 1) return get().removeItem(productId, options);
        
        const { items } = get();
        const updatedItems = items.map((item) => {
          if (item.id === productId && JSON.stringify(item.options) === JSON.stringify(options)) {
            return { ...item, quantity };
          }
          return item;
        });
        set({ items: updatedItems });
      },

      clearCart: () => set({ items: [] }),

      // Selectors
      getTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'brew-luna-cart',
    }
  )
);
