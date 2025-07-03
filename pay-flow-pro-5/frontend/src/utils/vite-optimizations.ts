// Vite build optimizations configuration
export const buildOptimizations = {
  // Optimize bundle splitting
  rollupOptions: {
    output: {
      manualChunks: {
        // Separate vendor chunks for better caching
        'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        'ui-vendor': [
          '@radix-ui/react-avatar', 
          '@radix-ui/react-dialog', 
          '@radix-ui/react-dropdown-menu',
          '@radix-ui/react-select',
          '@radix-ui/react-tabs'
        ],
        'chart-vendor': ['recharts'],
        'table-vendor': ['@tanstack/react-table', '@tanstack/react-virtual', 'react-window'],
        'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
        'stripe-vendor': ['@stripe/react-stripe-js', '@stripe/stripe-js'],
        'query-vendor': ['@tanstack/react-query'],
        'icons-vendor': ['lucide-react', '@radix-ui/react-icons'],
      },
    },
  },
  // Optimize chunk size warnings
  chunkSizeWarningLimit: 1000,
  // Enable source maps for production debugging (optional)
  sourcemap: false,
  // Minify with terser for better compression
  minify: 'terser' as const,
  terserOptions: {
    compress: {
      drop_console: true, // Remove console.logs in production
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info'], // Remove specific console methods
    },
  },
};

// Performance optimizations for dependency pre-bundling
export const optimizeDepsConfig = {
  include: [
    'react',
    'react-dom',
    'react-router-dom',
    '@tanstack/react-query',
    'recharts',
    'lucide-react',
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    'react-hook-form',
    'zod',
    'sonner',
    'react-loading-skeleton',
    'react-window',
  ],
  exclude: ['@vite/client', '@vite/env'],
};