/**
 * CartContext – provides cart state and operations throughout the app.
 * Cart is synchronized with the backend for authenticated users.
 */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [], total: '0.00', item_count: 0 });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [], total: '0.00', item_count: 0 });
      return;
    }
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      setCart(response.data);
    } catch {
      // silently fail – cart will be empty
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    const response = await cartAPI.addItem({ product_id: productId, quantity });
    setCart(response.data);
    return response.data;
  }, []);

  const updateCartItem = useCallback(async (itemId, quantity) => {
    const response = await cartAPI.updateItem(itemId, { quantity });
    setCart(response.data);
    return response.data;
  }, []);

  const removeCartItem = useCallback(async (itemId) => {
    const response = await cartAPI.removeItem(itemId);
    setCart(response.data);
    return response.data;
  }, []);

  const clearLocalCart = useCallback(() => {
    setCart({ items: [], total: '0.00', item_count: 0 });
  }, []);

  return (
    <CartContext.Provider value={{
      cart, loading, fetchCart,
      addToCart, updateCartItem, removeCartItem, clearLocalCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
