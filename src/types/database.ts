export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          name: string;
          mobile: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          mobile: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          mobile?: string;
          created_at?: string;
        };
      };
      menu_items: {
        Row: {
          id: string;
          name: string;
          price: number;
          category: string;
          description: string;
          images: string[];
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          price: number;
          category: string;
          description?: string;
          images?: string[];
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          price?: number;
          category?: string;
          description?: string;
          images?: string[];
          is_active?: boolean;
          created_at?: string;
        };
      };
      discount_codes: {
        Row: {
          id: string;
          code: string;
          type: 'percentage' | 'fixed';
          value: number;
          description: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          type: 'percentage' | 'fixed';
          value: number;
          description?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          type?: 'percentage' | 'fixed';
          value?: number;
          description?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string;
          subtotal: number;
          discount_code: string | null;
          discount_amount: number;
          tax_rate: number;
          tax_amount: number;
          total: number;
          status: 'pending' | 'completed' | 'cancelled';
          created_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          customer_id: string;
          subtotal: number;
          discount_code?: string | null;
          discount_amount?: number;
          tax_rate: number;
          tax_amount: number;
          total: number;
          status?: 'pending' | 'completed' | 'cancelled';
          created_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          customer_id?: string;
          subtotal?: number;
          discount_code?: string | null;
          discount_amount?: number;
          tax_rate?: number;
          tax_amount?: number;
          total?: number;
          status?: 'pending' | 'completed' | 'cancelled';
          created_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          menu_item_id?: string;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          created_at?: string;
        };
      };
      whatsapp_messages: {
        Row: {
          id: string;
          message_id: string;
          from_number: string;
          message_text: string;
          timestamp: string;
          received_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          from_number: string;
          message_text: string;
          timestamp: string;
          received_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          from_number?: string;
          message_text?: string;
          timestamp?: string;
          received_at?: string;
          created_at?: string;
        };
      };
    };
  };
}