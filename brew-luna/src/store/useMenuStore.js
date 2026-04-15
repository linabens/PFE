import { create } from 'zustand';

/**
 * BREW LUNA — Menu Store
 * Manages categories and products loading from API
 */

export const useMenuStore = create((set) => ({
  categories: [],
  products: [],
  activeCategoryId: 'all',
  isLoading: false,
  error: null,

  // Actions
  setCategories: (categories) => set({ categories }),
  setProducts: (products) => set({ products }),
  setActiveCategory: (id) => set({ activeCategoryId: id }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  // Computed (Helper for filtering in components)
  getFilteredProducts: (products, categoryId) => {
    if (categoryId === 'all') return products;
    return products.filter((p) => p.category_id === categoryId);
  }
}));
