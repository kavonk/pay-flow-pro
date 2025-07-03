/**
 * Global performance optimizations for PayFlow Pro
 * 
 * This module handles preloading of critical resources to eliminate
 * blocking loading states throughout the app.
 */

// Stripe preloading
let stripePreloadPromise: Promise<any> | null = null;

export const preloadStripe = async (): Promise<any> => {
  if (stripePreloadPromise) return stripePreloadPromise;
  
  stripePreloadPromise = (async () => {
    try {
      console.log('Starting Stripe preload...');
      const { loadStripe } = await import('@stripe/stripe-js');
      
      // Try to load Stripe config from API first
      try {
        console.log('Fetching Stripe config from API...');
        const brain = await import('brain');
        const brainClient = brain.default;
        const response = await brainClient.get_public_stripe_config();
        console.log('Stripe config response status:', response.status);
        if (response.ok) {
          const config = await response.json();
          console.log('✅ Stripe config loaded from API:', config);
          return loadStripe(config.publishable_key);
        } else {
          console.warn('API returned non-OK status:', response.status);
        }
      } catch (error) {
        console.warn('Failed to fetch Stripe config, using fallback:', error);
      }
      
      // Fallback to hardcoded key
      const fallbackKey = 'pk_live_51QPOSK2KicZEnxzfLtTNGIWcDRlxjsw7te3xDP6jq8MFd9Jgu1NGX6asz1N0TkQJNx2KnySbxJ6K4IasV3Gwqc2B00sxykbtyh';
      console.log('Using fallback Stripe key');
      return loadStripe(fallbackKey);
    } catch (error) {
      console.error('❌ Failed to preload Stripe:', error);
      throw error;
    }
  })();
  
  return stripePreloadPromise;
};

// App data preloading
let criticalDataPreloaded = false;

export const preloadCriticalData = async (user: any): Promise<void> => {
  if (criticalDataPreloaded) return;
  if (!user) return; // Don't preload if user is not authenticated

  
  try {
    console.log('Starting critical data preload...');
    
    // Import dependencies with detailed logging
    console.log('Importing queryClient...');
    const { queryClient } = await import('./queryClient');
    console.log('Importing queryHooks...');
    const { queryKeys, teamQueryKeys } = await import('./queryHooks');
    console.log('Importing useSubscription...');
    const { subscriptionQueryKeys } = await import('./useSubscription');
    console.log('Importing brain client...');
    const brain = await import('brain');
    const brainClient = brain.default;
    
    console.log('Brain client imported successfully:', !!brainClient);
    
    // Use React Query prefetching to avoid duplicate requests
    const prefetchPromises = [
      // Financial stats for dashboard
      queryClient.prefetchQuery({
        queryKey: queryKeys.financialStats(user.id),
        queryFn: async () => {
          console.log('Fetching financial stats...');
          const response = await brainClient.get_financial_stats();
          console.log('Financial stats response status:', response.status);
          if (!response.ok) throw new Error(`Failed to fetch financial stats: ${response.status}`);
          const data = await response.json();
          console.log('Financial stats data:', data);
          return data;
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
      }),
      // User role for app layout
      queryClient.prefetchQuery({
        queryKey: teamQueryKeys.role(user.id),
        queryFn: async () => {
          console.log('Fetching user role...');
          const response = await brainClient.get_my_role();
          console.log('User role response status:', response.status);
          if (!response.ok) throw new Error(`Failed to fetch user role: ${response.status}`);
          const data = await response.json();
          console.log('User role data:', data);
          return data;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
      }),
      // Feature access for subscription UI
      queryClient.prefetchQuery({
        queryKey: subscriptionQueryKeys.featureAccess(user.id),
        queryFn: async () => {
          console.log('Fetching feature access...');
          const response = await brainClient.get_feature_access();
          console.log('Feature access response status:', response.status);
          if (response.status === 404) return null;
          if (!response.ok) throw new Error(`Failed to fetch feature access: ${response.status}`);
          const data = await response.json();
          console.log('Feature access data:', data);
          return data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      }),
    ];
    
    console.log('Starting prefetch promises...');
    const results = await Promise.allSettled(prefetchPromises);
    
    // Log individual results
    results.forEach((result, index) => {
      const names = ['financial stats', 'user role', 'feature access'];
      if (result.status === 'fulfilled') {
        console.log(`✅ ${names[index]} prefetch succeeded`);
      } else {
        console.error(`❌ ${names[index]} prefetch failed:`, result.reason);
      }
    });
    
    criticalDataPreloaded = true;
    console.log('✅ Critical app data preload completed');
  } catch (error) {
    console.error('❌ Failed to preload critical data - outer catch:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
  }
};

// Initialize performance optimizations
export const initializePerformanceOptimizations = (user: any) => {
  if (typeof window === 'undefined') return;
  
  // Start Stripe preloading immediately
  preloadStripe().catch(error => {
    console.warn('Stripe preloading failed:', error);
  });
  
  // Preload critical data after a short delay to not block initial render
  setTimeout(() => {
    preloadCriticalData(user).catch(error => {
      console.warn('Critical data preloading failed:', error);
    });
  }, 1000);
  
  // Prefetch common routes
  setTimeout(() => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // Preload dashboard route assets
        import('../pages/Dashboard').catch(() => {});
        // Preload invoices route assets  
        import('../pages/Invoices').catch(() => {});
      });
    }
  }, 2000);
};

// Export the preloaded Stripe promise for use in signup
export { stripePreloadPromise };

// Utility to check if resources are preloaded
export const isStripePreloaded = () => {
  return stripePreloadPromise !== null;
};

export const isCriticalDataPreloaded = () => {
  return criticalDataPreloaded;
};
