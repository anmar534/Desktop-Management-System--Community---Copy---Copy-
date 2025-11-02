import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tsconfigPaths from 'vite-tsconfig-paths'

const devServerPort = Number(process.env.DEV_SERVER_PORT ?? process.env.PORT ?? 3003) || 3003

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    react({
      // Simplified config for Electron desktop app
      jsxRuntime: 'automatic',
    }),
  ],
  base: './', // مهم جداً لـ Electron
  define: {
    'process.env': '{}',
    process: 'undefined',
    global: 'globalThis',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/application': path.resolve(__dirname, './src/application'),
      '@/domain': path.resolve(__dirname, './src/domain'),
      '@/presentation': path.resolve(__dirname, './src/presentation'),
      '@/infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@/repository': path.resolve(__dirname, './src/repository'),
      'vaul@1.1.2': 'vaul',
      'sonner@2.0.3': 'sonner',
      'recharts@2.15.2': 'recharts',
      'react-resizable-panels@2.1.7': 'react-resizable-panels',
      'react-hook-form@7.55.0': 'react-hook-form',
      'react-day-picker@8.10.1': 'react-day-picker',
      'next-themes@0.4.6': 'next-themes',
      'lucide-react@0.487.0': 'lucide-react',
      'input-otp@1.4.2': 'input-otp',
      'embla-carousel-react@8.6.0': 'embla-carousel-react',
      'cmdk@1.1.1': 'cmdk',
      'class-variance-authority@0.7.1': 'class-variance-authority',
      '@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip',
      '@radix-ui/react-toggle@1.1.2': '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group@1.1.2': '@radix-ui/react-toggle-group',
      '@radix-ui/react-tabs@1.1.3': '@radix-ui/react-tabs',
      '@radix-ui/react-switch@1.1.3': '@radix-ui/react-switch',
      '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
      '@radix-ui/react-slider@1.2.3': '@radix-ui/react-slider',
      '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
      '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
      '@radix-ui/react-scroll-area@1.2.3': '@radix-ui/react-scroll-area',
      '@radix-ui/react-radio-group@1.2.3': '@radix-ui/react-radio-group',
      '@radix-ui/react-progress@1.1.2': '@radix-ui/react-progress',
      '@radix-ui/react-popover@1.1.6': '@radix-ui/react-popover',
      '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
      '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
      '@radix-ui/react-collapsible@1.1.3': '@radix-ui/react-collapsible',
      '@radix-ui/react-checkbox@1.1.4': '@radix-ui/react-checkbox',
      '@radix-ui/react-alert-dialog@1.1.6': '@radix-ui/react-alert-dialog',
      '@radix-ui/react-accordion@1.2.3': '@radix-ui/react-accordion',
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
  optimizeDeps: {
    // Phase 1.5: Pre-bundle heavy dependencies for faster builds
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'echarts',
      'echarts-for-react',
      '@tanstack/react-table',
      '@tanstack/react-virtual',
      'framer-motion',
      'react-hook-form',
      'zod',
      'lucide-react',
    ],
    exclude: [
      // Exclude electron-specific packages
      'electron',
      '@electron/remote',
    ],
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          charts: ['echarts', 'echarts-for-react', 'recharts'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs'],
        },
      },
      // لا نستثني أسعار المراقبة أثناء البناء حتى تتوفر في الحزمة الإنتاجية
    },
  },
  server: {
    port: devServerPort,
    strictPort: false,
    host: '127.0.0.1',
    open: false,
    hmr: {
      protocol: 'ws',
      host: '127.0.0.1',
      port: devServerPort,
    },
    headers: {
      // CSP for Electron Desktop Development - Allow inline scripts for Vite HMR
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "connect-src 'self' ws: wss: https://open.er-api.com https://*.er-api.com",
        "worker-src 'self' blob:",
      ].join('; '),
    },
  },
})
