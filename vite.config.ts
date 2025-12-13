import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';

    return {
      server: {
        host: "::",
        port: 8080,
      },
      plugins: [
        react(),
        mode === 'development' && componentTagger(),
      ].filter(Boolean),
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      },
      build: {
        // Optimize bundle size
        rollupOptions: {
          external: [/^supabase\/functions\/.*/],
          output: {
            manualChunks: {
              // Split vendor chunks for better caching
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              'ui-vendor': ['lucide-react'],
              'supabase-vendor': ['@supabase/supabase-js'],
              'ai-vendor': ['@google/genai'],
            },
          },
        },
        // Enable source maps in production for debugging
        sourcemap: !isProduction,
        // Optimize chunk size
        chunkSizeWarningLimit: 600,
        // Enable compression with esbuild (built into Vite)
        minify: 'esbuild',
      },
      // CDN and caching optimizations
      optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
      },
    };
});
