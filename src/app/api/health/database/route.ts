import { NextRequest, NextResponse } from 'next/server';
import { 
  checkDatabaseHealth, 
  formatHealthCheckResult,
  handleGracefulFailure 
} from '@/lib/db-health';
import { getLastHealthCheckResult } from '@/lib/startup-init';

/**
 * GET /api/health/database - Check database health status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // json | text
    const useCache = searchParams.get('cache') !== 'false';

    let healthResult;

    if (useCache) {
      // Try to get cached result from startup
      healthResult = getLastHealthCheckResult();
      
      if (!healthResult) {
        // No cached result, run fresh check
        healthResult = await checkDatabaseHealth();
      }
    } else {
      // Always run fresh check
      healthResult = await checkDatabaseHealth();
    }

    // Determine HTTP status code
    const statusCode = healthResult.isHealthy ? 200 : 503;

    if (format === 'text') {
      // Return formatted text response
      const formattedResult = formatHealthCheckResult(healthResult);
      
      return new NextResponse(formattedResult, {
        status: statusCode,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    } else {
      // Return JSON response
      const response = {
        healthy: healthResult.isHealthy,
        timestamp: healthResult.timestamp,
        totalCheckTime: healthResult.totalCheckTime,
        connection: {
          connected: healthResult.connectionStatus.isConnected,
          attempts: healthResult.connectionStatus.retryAttempts,
          maxRetries: healthResult.connectionStatus.maxRetries,
          connectionTime: healthResult.connectionStatus.connectionTime,
          lastError: healthResult.connectionStatus.lastError
        },
        version: {
          compatible: healthResult.versionCheck.isCompatible,
          current: healthResult.versionCheck.currentVersion,
          required: healthResult.versionCheck.requiredVersion,
          versionNumber: healthResult.versionCheck.versionNumber
        },
        permissions: {
          hasAll: healthResult.permissionsCheck.hasAllPermissions,
          granted: healthResult.permissionsCheck.permissions,
          missing: healthResult.permissionsCheck.missingPermissions
        },
        errors: healthResult.errors,
        troubleshooting: healthResult.isHealthy ? null : handleGracefulFailure(healthResult).troubleshootingHints
      };

      return NextResponse.json(response, {
        status: statusCode,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

  } catch (error) {
    console.error('[HEALTH-API] Database health check failed:', error);
    
    const errorResponse = {
      healthy: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}

/**
 * POST /api/health/database - Force refresh database health check
 */
export async function POST() {
  try {
    // Always run fresh check for POST requests
    const healthResult = await checkDatabaseHealth();
    
    const response = {
      healthy: healthResult.isHealthy,
      timestamp: healthResult.timestamp,
      totalCheckTime: healthResult.totalCheckTime,
      refreshed: true,
      connection: {
        connected: healthResult.connectionStatus.isConnected,
        attempts: healthResult.connectionStatus.retryAttempts,
        maxRetries: healthResult.connectionStatus.maxRetries,
        connectionTime: healthResult.connectionStatus.connectionTime
      },
      version: {
        compatible: healthResult.versionCheck.isCompatible,
        current: healthResult.versionCheck.currentVersion,
        required: healthResult.versionCheck.requiredVersion
      },
      permissions: {
        hasAll: healthResult.permissionsCheck.hasAllPermissions,
        granted: healthResult.permissionsCheck.permissions,
        missing: healthResult.permissionsCheck.missingPermissions
      },
      errors: healthResult.errors
    };

    const statusCode = healthResult.isHealthy ? 200 : 503;
    
    return NextResponse.json(response, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('[HEALTH-API] Forced health check failed:', error);
    
    return NextResponse.json({
      healthy: false,
      error: 'Forced health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      refreshed: false
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}
