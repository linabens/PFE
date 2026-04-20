import { create } from 'zustand';

/**
 * BREW LUNA — Menu Store (Native)
 */

export const useMenuStore = create((set) => ({
  categories: [],
  products: [],
  activeCategoryId: 'all',
  isLoading: false,
  error: null,

  setCategories: (categories) => set({ categories }),
  setProducts: (products) => set({ products }),
  setActiveCategory: (id) => set({ activeCategoryId: id }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
