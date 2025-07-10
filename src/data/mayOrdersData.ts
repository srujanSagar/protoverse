import { Order } from '../types';

// Function to parse CSV data and convert to Order objects
export const parseCSVToOrders = (csvData: string): Order[] => {
  const lines = csvData.split('\n');
  const orders: Order[] = [];
  
  // Menu items mapping for price lookup
  const menuItemsMap = new Map([
    ["Almond Basbousa", { id: "7", price: 299, category: "Basbousa", description: "Semolina cake soaked in syrup with almonds" }],
    ["Cashew Basbousa", { id: "8", price: 299, category: "Basbousa", description: "Semolina cake soaked in syrup with cashews" }],
    ["Kunafa Chocolate", { id: "1", price: 349, category: "Chocolate", description: "Rich chocolate kunafa with crispy kataifi pastry" }],
    ["Nutella Cream Cheese Kunafa", { id: "2", price: 399, category: "Kunafa", description: "Creamy kunafa with Nutella and cream cheese filling" }],
    ["Kataifi Cream Cheese Kunafa", { id: "3", price: 399, category: "Kunafa", description: "Traditional kataifi pastry with rich cream cheese" }],
    ["Mixed Dry-Fruit Baklava", { id: "4", price: 449, category: "Baklava", description: "Layered phyllo pastry with mixed dry fruits and honey" }],
    ["Pista Finger Baklava", { id: "5", price: 399, category: "Baklava", description: "Finger-shaped baklava filled with premium pistachios" }],
    ["Triangle Baklava", { id: "6", price: 399, category: "Baklava", description: "Triangle-shaped baklava with nuts and sweet syrup" }]
  ]);

  // Helper function to get outlet code
  const getOutletCode = (outletName: string): string => {
    switch (outletName.trim()) {
      case 'Kondapur':
        return 'KDR';
      case 'Kompally':
        return 'KPL';
      default:
        return 'UNK'; // Unknown outlet fallback
    }
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line with proper handling of quoted fields
    const values = parseCSVLine(line);
    if (values.length < 6) continue;
    
    const customerName = values[0]?.trim();
    const mobile = values[1]?.trim();
    const outlet = values[2]?.trim();
    const dateTime = values[3]?.trim();
    const itemsStr = values[4]?.trim();
    const totalPrice = parseFloat(values[5]?.trim());
    
    if (!customerName || !mobile || !dateTime || !itemsStr || !outlet) continue;
    
    // Parse items
    const itemNames = itemsStr.split(', ').map(item => item.trim());
    const orderItems = itemNames.map(itemName => {
      const menuItem = menuItemsMap.get(itemName);
      if (!menuItem) {
        console.warn(`Unknown menu item: ${itemName}`);
        return null;
      }
      return {
        menuItem: {
          id: menuItem.id,
          name: itemName,
          price: menuItem.price,
          category: menuItem.category,
          description: menuItem.description
        },
        quantity: 1
      };
    }).filter(item => item !== null);
    
    if (orderItems.length === 0) continue;
    
    // Calculate totals
    const subtotal = orderItems.reduce((sum, item) => sum + (item!.menuItem.price * item!.quantity), 0);
    const taxRate = 0.1;
    const taxAmount = subtotal * taxRate;
    const calculatedTotal = subtotal + taxAmount;
    
    // Generate payment type based on hash of customer name for consistency
    const paymentTypes: ('cash' | 'card' | 'upi')[] = ['cash', 'card', 'upi'];
    const hash = customerName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const paymentType = paymentTypes[hash % paymentTypes.length];
    
    // Generate order ID with outlet code
    const outletCode = getOutletCode(outlet);
    const orderId = `${outletCode}-${new Date(dateTime).getTime()}-${i}`;
    
    const order: Order = {
      id: orderId,
      dbId: `may-order-${i}`,
      customer: { name: customerName, mobile },
      items: orderItems as any[],
      subtotal,
      discountAmount: 0,
      taxRate,
      taxAmount,
      total: calculatedTotal,
      paymentType,
      timestamp: new Date(dateTime),
      status: 'completed',
      outlet: outlet // Add outlet information
    };
    
    orders.push(order);
  }
  
  return orders;
};

// Helper function to parse CSV line with proper quote handling
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}