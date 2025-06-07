import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '@/types';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';

interface CartState {
  items: CartItem[];
  
  // Actions
  addItem: (product: Product, selectedColor: string, selectedDimension: string, quantity: number) => void;
  removeItem: (productId: string, color: string, dimension: string) => void;
  updateQuantity: (productId: string, color: string, dimension: string, quantity: number) => void;
  clearCart: () => void;
  getTotalAmount: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, selectedColor, selectedDimension, quantity) => {
        const { user, isAuthenticated } = useAuthStore.getState();
        
        if (!isAuthenticated || !user) {
          return;
        }

        const existingItem = get().items.find(
          item => 
            item.productId === product.id && 
            item.selectedColor === selectedColor &&
            item.selectedDimension === selectedDimension
        );

        if (existingItem) {
          get().updateQuantity(existingItem.productId, existingItem.selectedColor, existingItem.selectedDimension, existingItem.quantity + quantity);
        } else {
          const newItem: CartItem = {
            productId: product.id,
            productCode: product.productCode,
            selectedDimension,
            weight: product.weight,
            pieceCount: product.pieceCount,
            unitPrice: product.unitPrice,
            selectedColor,
            quantity,
            subtotal: product.unitPrice * quantity,
            image: product.image,
            minimumOrderQty: product.minimumOrderQty,
            // 新增字段
            discount: 0, // 默认无折扣
            discountedPrice: product.unitPrice, // 默认原价
          };

          set(state => ({
            items: [...state.items, newItem]
          }));
        }
        
        toast.success('商品已添加到购物车');
      },
      
      removeItem: (productId, color, dimension) => {
        const items = get().items.filter(
          item => !(item.productId === productId && item.selectedColor === color && item.selectedDimension === dimension)
        );
        set({ items });
        toast.success('商品已从购物车移除');
      },
      
      updateQuantity: (productId, color, dimension, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, color, dimension);
          return;
        }
        
        const items = get().items.map(item =>
          item.productId === productId && item.selectedColor === color && item.selectedDimension === dimension
            ? { ...item, quantity, subtotal: quantity * item.unitPrice }
            : item
        );
        
        set({ items });
      },
      
      clearCart: () => {
        set({ items: [] });
        toast.success('购物车已清空');
      },
      
      getTotalAmount: () => {
        return get().items.reduce((total, item) => total + item.subtotal, 0);
      },
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      }
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items })
    }
  )
); 