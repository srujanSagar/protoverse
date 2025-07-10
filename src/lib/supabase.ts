import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { logger } from './logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: any;

// Create a dummy client if environment variables are missing (for production)
if (!supabaseUrl || !supabaseAnonKey) {
  logger.warn('Supabase environment variables missing - running in offline mode');
  
  // Create a mock client that won't actually connect
  supabase = {
    from: () => ({
      select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }),
      insert: () => ({ select: () => Promise.resolve({ data: null, error: new Error('Offline mode') }) }),
      update: () => ({ eq: () => Promise.resolve({ error: new Error('Offline mode') }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: new Error('Offline mode') }) })
    })
  };
} else {
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
}

export { supabase };