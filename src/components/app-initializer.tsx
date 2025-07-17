'use client';

import { useEffect, useState } from 'react';

interface InitializationStatus {
  initialized: boolean;
  healthy: boolean;
  error?: string;
}

/**
 * Client-side component để initialize application startup
 * Chạy database health check khi application loads
 */
export function AppInitializer() {
  const [status, setStatus] = useState<InitializationStatus>({
    initialized: false,
    healthy: false
  });

  useEffect(() => {
    let mounted = true;

    async function initializeApp() {
      try {
        // Call initialization API
        const response = await fetch('/api/init', {
          method: 'GET',
          cache: 'no-store'
        });

        if (!mounted) return;

        const data = await response.json();

        if (response.ok) {
          setStatus({
            initialized: true,
            healthy: data.healthy,
          });

          // Log initialization result
          if (data.healthy) {
            console.log('[APP-INIT] ✅ Application initialized successfully');
          } else {
            console.warn('[APP-INIT] ⚠️ Application initialized with warnings');
          }
        } else {
          setStatus({
            initialized: true,
            healthy: false,
            error: data.message || 'Initialization failed'
          });
          console.error('[APP-INIT] ❌ Application initialization failed:', data.message);
        }

      } catch (error) {
        if (!mounted) return;

        setStatus({
          initialized: true,
          healthy: false,
          error: error instanceof Error ? error.message : 'Network error'
        });
        console.error('[APP-INIT] ❌ Failed to call initialization API:', error);
      }
    }

    // Run initialization
    initializeApp();

    return () => {
      mounted = false;
    };
  }, []);

  // Component không render gì - chỉ chạy initialization logic
  return null;
}

/**
 * Hook để check initialization status
 */
export function useAppInitialization() {
  const [status, setStatus] = useState<InitializationStatus>({
    initialized: false,
    healthy: false
  });

  useEffect(() => {
    let mounted = true;

    async function checkStatus() {
      try {
        const response = await fetch('/api/init', {
          method: 'GET',
          cache: 'no-store'
        });

        if (!mounted) return;

        const data = await response.json();

        setStatus({
          initialized: true,
          healthy: data.healthy,
          error: data.success ? undefined : data.message
        });

      } catch (error) {
        if (!mounted) return;

        setStatus({
          initialized: true,
          healthy: false,
          error: error instanceof Error ? error.message : 'Network error'
        });
      }
    }

    checkStatus();

    return () => {
      mounted = false;
    };
  }, []);

  return status;
}
