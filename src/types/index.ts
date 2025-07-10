import type { Product } from '../hooks/useSettingsData';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  images?: string[];
}

export interface OrderItem {
  menuItem?: MenuItem;
  product?: Product;
  quantity: number;
}

export interface Customer {
  name: string;
  mobile: string;
}

export interface Order {
  id: string;
  dbId?: string; // Database ID for deletion
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  discountCode?: string;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paymentType: 'cash' | 'card' | 'upi';
  timestamp: Date;
  status: 'pending' | 'completed' | 'cancelled';
  outlet?: string; // Add outlet information
}

export interface DiscountCode {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description: string;
}