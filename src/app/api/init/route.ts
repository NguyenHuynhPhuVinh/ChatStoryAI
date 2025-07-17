import { NextResponse } from 'next/server';
import { initializeApplication, isStartupInitialized, getStartupConfigFromEnv } from '@/lib/startup-init';

/**
 * GET /api/init - Initialize application startup
 * This endpoint can be called to trigger database health check initialization
 * since middleware cannot run Node.js modules in Edge Runtime
 */
export async function GET() {
  try {
    // Check if already initialized
    if (isStartupInitialized()) {
      return NextResponse.json({
        success: true,
        message: 'Application already initialized',
        alreadyInitialized: true,
        timestamp: new Date().toISOString()
      });
    }

    // Get configuration from environment
    const config = getStartupConfigFromEnv();
    
    // Run initialization
    const initResult = await initializeApplication(config);
    
    return NextResponse.json({
      success: true,
      message: initResult ? 'Application initialized successfully' : 'Application initialized with warnings',
      healthy: initResult,
      alreadyInitialized: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[INIT-API] Application initialization failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Application initialization failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST /api/init - Force re-initialization
 */
export async function POST() {
  try {
    const config = getStartupConfigFromEnv();
    
    // Force re-initialization by resetting state first
    const { resetStartupState } = await import('@/lib/startup-init');
    resetStartupState();
    
    // Run initialization
    const initResult = await initializeApplication(config);
    
    return NextResponse.json({
      success: true,
      message: initResult ? 'Application re-initialized successfully' : 'Application re-initialized with warnings',
      healthy: initResult,
      forced: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[INIT-API] Forced initialization failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Forced initialization failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      forced: true,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
