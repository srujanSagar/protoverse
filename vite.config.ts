import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  
  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      proxy: {
        '/api/whatsapp': {
          target: `${env.VITE_SUPABASE_URL}/functions/v1`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/whatsapp/, '/whatsapp-webhook'),
          headers: {
            'Authorization': `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
          },
        },
      },
    },
  };
});