import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { MenuItem, DiscountCode, Order, Customer, OrderItem } from '../types';
import { parseCSVToOrders } from '../data/mayOrdersData';
import { PRODUCTION_MENU_ITEMS } from '../config/menuItems';
import { PRODUCTION_DISCOUNT_CODES } from '../config/discountCodes';

export const useSupabaseData = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isProduction = useMemo(() => 
    !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY, 
    []
  );

  const fetchMenuItems = async () => {
    try {
      if (isProduction) {
        setMenuItems(PRODUCTION_MENU_ITEMS);
        return;
      }

      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;

      const formattedItems: MenuItem[] = data.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        description: item.description,
        images: item.images || []
      }));

      setMenuItems(formattedItems);
    } catch (err) {
      logger.error('Error fetching menu items', err);
      setMenuItems(PRODUCTION_MENU_ITEMS);
    }
  };

  const fetchDiscountCodes = async () => {
    try {
      if (isProduction) {
        setDiscountCodes(PRODUCTION_DISCOUNT_CODES);
        return;
      }

      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      const formattedCodes: DiscountCode[] = data.map(code => ({
        code: code.code,
        type: code.type,
        value: code.value,
        description: code.description
      }));

      setDiscountCodes(formattedCodes);
    } catch (err) {
      logger.error('Error fetching discount codes', err);
      setDiscountCodes(PRODUCTION_DISCOUNT_CODES);
    }
  };

  const loadMayData = async (): Promise<Order[]> => {
    try {
      const response = await fetch('/data/may-orders.csv');
      
      if (!response.ok) {
        logger.warn('CSV file not found, using fallback data');
        return [];
      }
      
      const csvText = await response.text();
      const mayOrders = parseCSVToOrders(csvText);
      
      logger.info(`Loaded ${mayOrders.length} orders from CSV`);
      return mayOrders;
    } catch (err) {
      logger.error('Error loading May data', err);
      return [];
    }
  };

  const fetchOrders = async () => {
    try {
      let dbOrders: Order[] = [];

      if (!isProduction) {
        try {
          logger.info('Fetching orders from database');
          
          const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select(`
              id,
              order_number,
              customer_id,
              subtotal,
              discount_code,
              discount_amount,
              tax_rate,
              tax_amount,
              total,
              status,
              payment_type,
              created_at,
              customers!inner (
                id,
                name,
                mobile
              )
            `)
            .order('created_at', { ascending: false });

          if (ordersError) {
            logger.error('Error fetching orders', ordersError);
            throw ordersError;
          }

          // Process orders data
          for (const order of ordersData || []) {
            const { data: orderItemsData, error: itemsError } = await supabase
              .from('order_items')
              .select(`
                id,
                quantity,
                unit_price,
                total_price,
                menu_items!inner (
                  id,
                  name,
                  price,
                  category,
                  description,
                  images
                )
              `)
              .eq('order_id', order.id);

            if (itemsError) {
              logger.error('Error fetching order items for order', { orderId: order.id, error: itemsError });
              continue;
            }

            const formattedOrder: Order = {
              id: order.order_number,
              dbId: order.id,
              customer: {
                name: order.customers?.name || 'Unknown Customer',
                mobile: order.customers?.mobile || 'Unknown Mobile'
              },
              items: (orderItemsData || []).map((item: any) => ({
                menuItem: {
                  id: item.menu_items.id,
                  name: item.menu_items.name,
                  price: item.menu_items.price,
                  category: item.menu_items.category,
                  description: item.menu_items.description,
                  images: item.menu_items.images || []
                },
                quantity: item.quantity
              })),
              subtotal: order.subtotal,
              discountCode: order.discount_code,
              discountAmount: order.discount_amount,
              taxRate: order.tax_rate,
              taxAmount: order.tax_amount,
              total: order.total,
              paymentType: order.payment_type || 'cash',
              timestamp: new Date(order.created_at),
              status: order.status,
              outlet: undefined
            };

            dbOrders.push(formattedOrder);
          }

          logger.info(`Successfully fetched ${dbOrders.length} orders from database`);
        } catch (dbError) {
          logger.warn('Database connection failed, using CSV data only', dbError);
        }
      }

      const mayOrders = await loadMayData();
      const allOrders = [...dbOrders, ...mayOrders].sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      );

      logger.info(`Total orders loaded`, { 
        total: allOrders.length, 
        db: dbOrders.length, 
        csv: mayOrders.length 
      });
      
      setOrders(allOrders);
    } catch (err) {
      logger.error('Error fetching orders', err);
      const mayOrders = await loadMayData();
      setOrders(mayOrders);
    }
  };

  const createOrder = async (order: Order): Promise<boolean> => {
    try {
      setLoading(true);

      if (isProduction) {
        const newOrder = {
          ...order,
          dbId: `local-${Date.now()}`,
          timestamp: new Date()
        };
        setOrders(prev => [newOrder, ...prev]);
        return true;
      }

      logger.info('Creating order in database', { orderId: order.id });

      let customerId: string;
      
      // Check if customer already exists
      const { data: existingCustomer, error: customerCheckError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('mobile', order.customer.mobile)
        .maybeSingle();

      if (customerCheckError) {
        logger.error('Error checking existing customer', customerCheckError);
        throw customerCheckError;
      }

      if (existingCustomer) {
        customerId = existingCustomer.id;
        logger.info('Found existing customer', { customerId, name: existingCustomer.name });
        
        // Update customer name if different
        if (existingCustomer.name !== order.customer.name) {
          const { error: updateError } = await supabase
            .from('customers')
            .update({ name: order.customer.name })
            .eq('id', customerId);
          
          if (updateError) {
            logger.error('Error updating customer name', updateError);
          } else {
            logger.info('Updated customer name', { customerId, newName: order.customer.name });
          }
        }
      } else {
        // Create new customer
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            name: order.customer.name,
            mobile: order.customer.mobile
          })
          .select()
          .single();

        if (customerError) {
          logger.error('Error creating customer', customerError);
          throw customerError;
        }

        customerId = newCustomer.id;
        logger.info('Created new customer', { customerId, name: order.customer.name });
      }

      // Create order
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: order.id,
          customer_id: customerId,
          subtotal: order.subtotal,
          discount_code: order.discountCode,
          discount_amount: order.discountAmount,
          tax_rate: order.taxRate,
          tax_amount: order.taxAmount,
          total: order.total,
          payment_type: order.paymentType,
          status: order.status
        })
        .select()
        .single();

      if (orderError) {
        logger.error('Error creating order', orderError);
        throw orderError;
      }

      logger.info('Created order', { orderId: newOrder.id, orderNumber: order.id });

      // Create order items
      const orderItems = order.items.map(item => ({
        order_id: newOrder.id,
        menu_item_id: item.menuItem.id,
        quantity: item.quantity,
        unit_price: item.menuItem.price,
        total_price: item.menuItem.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        logger.error('Error creating order items', itemsError);
        throw itemsError;
      }

      logger.info('Created order items', { orderId: newOrder.id, itemCount: orderItems.length });

      await fetchOrders();
      return true;
    } catch (err) {
      logger.error('Error creating order', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderDbId: string): Promise<boolean> => {
    try {
      if (isProduction) {
        setOrders(prev => prev.filter(order => order.dbId !== orderDbId));
        return true;
      }

      logger.info('Deleting order from database', { orderDbId });

      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderDbId);

      if (error) {
        logger.error('Error deleting order', error);
        throw error;
      }

      logger.info('Order deleted successfully', { orderDbId });
      await fetchOrders();
      return true;
    } catch (err) {
      logger.error('Error deleting order', err);
      return false;
    }
  };

  const refreshData = async () => {
    setError(null);
    await Promise.all([
      fetchMenuItems(),
      fetchDiscountCodes(),
      fetchOrders()
    ]);
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          fetchMenuItems(),
          fetchDiscountCodes(),
          fetchOrders()
        ]);
      } catch (err) {
        logger.error('Error initializing data', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  return {
    menuItems,
    discountCodes,
    orders,
    loading,
    error,
    createOrder,
    deleteOrder,
    refreshData
  };
};