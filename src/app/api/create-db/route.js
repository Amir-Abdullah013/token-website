export async function POST() {
  try {
    // Simple health check that doesn't require database connection
    return Response.json({
      success: true,
      message: 'API is working correctly',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('API health check error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'API health check failed',
        message: error.message 
      },
      { status: 500 }
    );
  }
}