import { useState, useEffect } from 'react';
import { Order } from '../types';

const ORDERS_STORAGE_KEY = 'restaurant_pos_orders';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  // Load orders from localStorage on mount
  useEffect(() => {
    const storedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (storedOrders) {
      try {
        const parsedOrders = JSON.parse(storedOrders).map((order: any) => ({
          ...order,
          timestamp: new Date(order.timestamp)
        }));
        setOrders(parsedOrders);
      } catch (error) {
        console.error('Error loading orders from localStorage:', error);
      }
    }
  }, []);

  // Save orders to localStorage whenever orders change
  useEffect(() => {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  const addOrder = (order: Order) => {
    setOrders(prev => [order, ...prev]);
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, status } : order
      )
    );
  };

  const getOrderById = (orderId: string) => {
    return orders.find(order => order.id === orderId);
  };

  return {
    orders,
    addOrder,
    updateOrderStatus,
    getOrderById
  };
};