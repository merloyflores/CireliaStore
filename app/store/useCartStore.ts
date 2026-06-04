import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category: string;
}

interface CartStore {
  cart: (Product & { quantity: number })[];
  favorites: Product[];
  addToCart: (product: Product) => void;
  toggleFavorite: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      cart: [],
      favorites: [],
      addToCart: (product) => set((state) => {
        const existing = state.cart.find((item) => item.id === product.id);
        if (existing) {
          return {
            cart: state.cart.map((item) =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ),
          };
        }
        return { cart: [...state.cart, { ...product, quantity: 1 }] };
      }),
      toggleFavorite: (product) => set((state) => {
        const isFav = state.favorites.some((item) => item.id === product.id);
        return {
          favorites: isFav 
            ? state.favorites.filter((item) => item.id !== product.id)
            : [...state.favorites, product]
        };
      }),
      removeFromCart: (productId) => set((state) => ({
        cart: state.cart.filter((item) => item.id !== productId)
      })),
      clearCart: () => set({ cart: [] }),
    }),
    { name: 'cirelia-storage' } // Esto guarda el carrito aunque cierres el navegador
  )
);