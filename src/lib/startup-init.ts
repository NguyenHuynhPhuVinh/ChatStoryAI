/* eslint-disable @typescript-eslint/no-explicit-any */
import { 
  checkDatabaseHealth, 
  handleGracefulFailure, 
  shouldCrashOnFailure,
  dbHealthLogger,
  DatabaseHealthResult,
  GracefulFailureConfig
} from './db-health';

// Startup initialization configuration
export interface StartupConfig {
  enableDatabaseHealthCheck: boolean;
  healthCheckTimeout: number; // milliseconds
  gracefulFailureConfig: Partial<GracefulFailureConfig>;
  skipOnProduction?: boolean;
  logLevel: 'minimal' | 'detailed';
}

// Default startup configuration
const DEFAULT_STARTUP_CONFIG: StartupConfig = {
  enableDatabaseHealthCheck: true,
  healthCheckTimeout: 10000, // 10 seconds
  gracefulFailureConfig: {
    enableFallback: true,
    fallbackBehavior: 'continue',
    troubleshootingHints: true
  },
  skipOnProduction: false,
  logLevel: 'detailed'
};

// Global startup state
let isStartupComplete = false;
let startupPromise: Promise<boolean> | null = null;
let lastHealthCheckResult: DatabaseHealthResult | null = null;

/**
 * Main startup initialization function
 */
export async function initializeApplication(
  config: Partial<StartupConfig> = {}
): Promise<boolean> {
  // Return existing promise if startup is already in progress
  if (startupPromise) {
    return startupPromise;
  }

  // Return immediately if startup is already complete
  if (isStartupComplete) {
    return true;
  }

  const finalConfig = { ...DEFAULT_STARTUP_CONFIG, ...config };

  // Skip in production if configured
  if (finalConfig.skipOnProduction && process.env.NODE_ENV === 'production') {
    console.log('[STARTUP] Skipping database health check in production');
    isStartupComplete = true;
    return true;
  }

  // Skip if database health check is disabled
  if (!finalConfig.enableDatabaseHealthCheck) {
    console.log('[STARTUP] Database health check disabled');
    isStartupComplete = true;
    return true;
  }

  startupPromise = performStartupInitialization(finalConfig);
  return startupPromise;
}

/**
 * Perform the actual startup initialization
 */
async function performStartupInitialization(config: StartupConfig): Promise<boolean> {
  const startTime = Date.now();
  
  try {
    console.log('[STARTUP] 🚀 Starting application initialization...');
    
    // Step 1: Database Health Check
    console.log('[STARTUP] 📊 Running database health check...');
    
    const healthCheckPromise = checkDatabaseHealth();
    const timeoutPromise = new Promise<DatabaseHealthResult>((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), config.healthCheckTimeout);
    });

    let healthResult: DatabaseHealthResult;
    try {
      healthResult = await Promise.race([healthCheckPromise, timeoutPromise]);
    } catch (error) {
      // Handle timeout or other errors
      healthResult = {
        isHealthy: false,
        connectionStatus: { isConnected: false, retryAttempts: 0, maxRetries: 5 },
        versionCheck: { isCompatible: false, currentVersion: 'Unknown', requiredVersion: '8.0.0' },
        permissionsCheck: { 
          hasAllPermissions: false, 
          permissions: { CREATE: false, DROP: false, INSERT: false, SELECT: false, UPDATE: false, DELETE: false },
          missingPermissions: ['ALL']
        },
        errors: [{
          type: 'connection',
          message: error instanceof Error ? error.message : 'Health check failed',
          timestamp: new Date()
        }],
        timestamp: new Date(),
        totalCheckTime: Date.now() - startTime
      };
    }

    lastHealthCheckResult = healthResult;

    // Step 2: Handle results
    if (healthResult.isHealthy) {
      const totalTime = Date.now() - startTime;
      console.log(`[STARTUP] ✅ Application initialization completed successfully in ${totalTime}ms`);
      
      if (config.logLevel === 'detailed') {
        console.log('[STARTUP] 📋 Health check summary:', {
          connection: healthResult.connectionStatus.isConnected,
          version: healthResult.versionCheck.currentVersion,
          permissions: healthResult.permissionsCheck.hasAllPermissions,
          totalTime: healthResult.totalCheckTime
        });
      }
      
      isStartupComplete = true;
      return true;
    } else {
      // Handle graceful failure
      const failureResult = handleGracefulFailure(healthResult, config.gracefulFailureConfig);
      
      console.error('[STARTUP] ❌ Database health check failed');
      if (config.logLevel === 'detailed') {
        console.error(failureResult.errorMessage);
      }

      // Determine if we should crash or continue
      const shouldCrash = shouldCrashOnFailure(healthResult, config.gracefulFailureConfig);
      
      if (shouldCrash) {
        console.error('[STARTUP] 🛑 Application cannot continue due to database issues');
        throw new Error('Database health check failed - application cannot start');
      } else {
        console.warn('[STARTUP] ⚠️  Continuing with limited functionality due to database issues');
        isStartupComplete = true;
        return false; // Indicate partial success
      }
    }
    
  } catch (error) {
    console.error('[STARTUP] 💥 Fatal error during application initialization:', error);
    
    // Check if we should crash on failure
    if (lastHealthCheckResult) {
      const shouldCrash = shouldCrashOnFailure(lastHealthCheckResult, config.gracefulFailureConfig);
      if (!shouldCrash) {
        console.warn('[STARTUP] ⚠️  Continuing despite initialization errors');
        isStartupComplete = true;
        return false;
      }
    }
    
    throw error;
  }
}

/**
 * Get the last health check result
 */
export function getLastHealthCheckResult(): DatabaseHealthResult | null {
  return lastHealthCheckResult;
}

/**
 * Check if startup initialization is complete
 */
export function isStartupInitialized(): boolean {
  return isStartupComplete;
}

/**
 * Reset startup state (useful for testing)
 */
export function resetStartupState(): void {
  isStartupComplete = false;
  startupPromise = null;
  lastHealthCheckResult = null;
}

/**
 * Environment variable configuration helper
 */
export function getStartupConfigFromEnv(): Partial<StartupConfig> {
  return {
    enableDatabaseHealthCheck: process.env.DB_HEALTH_CHECK_ENABLED !== 'false',
    healthCheckTimeout: parseInt(process.env.DB_HEALTH_CHECK_TIMEOUT || '10000'),
    skipOnProduction: process.env.DB_HEALTH_CHECK_SKIP_PRODUCTION === 'true',
    logLevel: (process.env.DB_HEALTH_CHECK_LOG_LEVEL as 'minimal' | 'detailed') || 'detailed',
    gracefulFailureConfig: {
      enableFallback: process.env.DB_HEALTH_CHECK_ENABLE_FALLBACK !== 'false',
      fallbackBehavior: (process.env.DB_HEALTH_CHECK_FALLBACK_BEHAVIOR as 'continue' | 'exit' | 'retry') || 'continue',
      troubleshootingHints: process.env.DB_HEALTH_CHECK_TROUBLESHOOTING_HINTS !== 'false'
    }
  };
}

/**
 * Middleware-compatible initialization function
 */
export async function initializeForMiddleware(): Promise<boolean> {
  try {
    const config = getStartupConfigFromEnv();
    return await initializeApplication(config);
  } catch (error) {
    console.error('[STARTUP] Middleware initialization failed:', error);
    return false;
  }
}

/**
 * Server-side initialization for API routes
 */
export async function ensureInitialized(): Promise<void> {
  if (!isStartupComplete) {
    const config = getStartupConfigFromEnv();
    await initializeApplication(config);
  }
}
