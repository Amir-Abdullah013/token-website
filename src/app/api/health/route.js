import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

export async function GET() {
  try {
    // Test database connection
    if (!databaseHelpers.pool) {
      return NextResponse.json({
        status: 'error',
        message: 'Database pool not available',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Test a simple query
    const result = await databaseHelpers.pool.query('SELECT NOW() as current_time');
    
    return NextResponse.json({
      status: 'healthy',
      message: 'Database connection successful',
      database: {
        connected: true,
        currentTime: result.rows[0].current_time
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
