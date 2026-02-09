
import { CartItem, Order, Product } from "../types";
import { MOCK_PRODUCTS } from "../constants";

/**
 * SIMULATED BACKEND LOGIC
 * CRITICAL: We calculate totals here to prevent client-side tampering.
 */

export const calculateOrderTotal = (cartItems: CartItem[]): number => {
  return cartItems.reduce((acc, item) => {
    // Re-verify the price against our "source of truth"
    const trueProduct = MOCK_PRODUCTS.find(p => p.id === item.id);
    const price = trueProduct ? trueProduct.price : 0;
    return acc + (price * item.quantity);
  }, 0);
};

export const processPayment = async (amount: number): Promise<boolean> => {
  // Simulate Stripe processing delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // 95% success rate simulation
      resolve(Math.random() > 0.05);
    }, 2000);
  });
};

export const saveOrder = (order: Order) => {
  const existingOrders = JSON.parse(localStorage.getItem('nova_orders') || '[]');
  localStorage.setItem('nova_orders', JSON.stringify([...existingOrders, order]));
};

export const getOrderHistory = (): Order[] => {
  return JSON.parse(localStorage.getItem('nova_orders') || '[]');
};
