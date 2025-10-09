import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
      '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
      '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
      '@radix-ui/react-tabs@1.1.3': '@radix-ui/react-tabs',
  '@radix-ui/react-checkbox@1.1.4': '@radix-ui/react-checkbox',
      'lucide-react@0.487.0': 'lucide-react',
      'class-variance-authority@0.7.1': 'class-variance-authority',
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src')
    }
  },
  test: {
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      'tests/e2e/**/*'
    ],
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
})
