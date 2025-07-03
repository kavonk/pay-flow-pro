// Suppress React 18 recharts defaultProps warnings
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0]?.includes?.("Support for defaultProps will be removed from function components") && 
        (args[0]?.includes?.("XAxis") || args[0]?.includes?.("YAxis"))) {
      return; // Suppress recharts warnings
    }
    originalWarn.apply(console, args);
  };
}import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from 'utils/queryClient';
import { Toaster } from '@/components/ui/sonner';
import { initializePerformanceOptimizations } from 'utils/performance';

// Initialize performance optimizations on app load
if (typeof window !== 'undefined') {
  initializePerformanceOptimizations();
}



import { UserGuard } from "../app/auth/UserGuard";
import { Suspense } from "react";

interface Props {
  children: ReactNode;
}

export const AppProvider = ({ children }: Props) => {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div>Loading...</div>}>
        {children}
      </Suspense>
      <Toaster />
    </QueryClientProvider>
  );
};