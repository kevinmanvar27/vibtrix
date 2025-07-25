"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useCallback, useRef, useEffect } from "react";
import { startMeasure } from "@/lib/performance-monitor";

import debug from "@/lib/debug";

export default function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create a memoized function to handle query client creation
  const createQueryClient = useCallback(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 2 * 60 * 1000, // 2 minutes (reduced from 5 minutes)
          gcTime: 5 * 60 * 1000, // 5 minutes (reduced from 10 minutes)
          refetchOnWindowFocus: false,
          retry: 1,
          refetchOnMount: true, // Changed to true to ensure fresh data on navigation
          refetchOnReconnect: true, // Changed to true to ensure fresh data on reconnect
          // Improve performance by using structural sharing
          structuralSharing: true,
          // Add cacheTime to control how long data stays in cache
          cacheTime: 10 * 60 * 1000, // 10 minutes
          // Add suspense option for better loading states
          suspense: false,
          // Add a default select function to transform data
          select: (data: any) => data,
          // Global error handler for unauthorized errors
          onError: (error: any) => {
            // If this is an unauthorized error, we'll handle it gracefully
            if (error?.status === 401) {
              // We don't need to do anything here as the API client will return empty data
              // This prevents the error from bubbling up to the UI
              return;
            }

            // For other errors, log them in development
            if (process.env.NODE_ENV === 'development') {
              debug.error('Query error:', error);
            }
          },
        },
        mutations: {
          retry: 1,
          // Global error handler for unauthorized errors in mutations
          onError: (error: any) => {
            // If this is an unauthorized error, we'll handle it gracefully
            if (error?.status === 401) {
              return;
            }

            // For other errors, log them in development
            if (process.env.NODE_ENV === 'development') {
              debug.error('Mutation error:', error);
            }
          },
        },
      },
    });
  }, []);

  // Create the query client only once
  const [queryClient] = useState(createQueryClient);

  // Track performance metrics
  const performanceMetricsRef = useRef({
    queryCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
  });

  // Monitor query performance
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'queryUpdated') {
        performanceMetricsRef.current.queryCount++;

        // Track if this was a cache hit or miss
        if (event.action.type === 'success' && event.action.dataUpdatedAt === event.action.data) {
          performanceMetricsRef.current.cacheHits++;
        } else if (event.action.type === 'success') {
          performanceMetricsRef.current.cacheMisses++;
        }

        // Log performance metrics periodically in development
        if (process.env.NODE_ENV === 'development' && performanceMetricsRef.current.queryCount % 10 === 0) {
          const metrics = performanceMetricsRef.current;
          const hitRate = metrics.queryCount > 0 ? (metrics.cacheHits / metrics.queryCount) * 100 : 0;
          debug.log(`[React Query] Cache hit rate: ${hitRate.toFixed(1)}% (${metrics.cacheHits}/${metrics.queryCount})`);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query DevTools disabled to reduce console output */}
    </QueryClientProvider>
  );
}
