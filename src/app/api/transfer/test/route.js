import { NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/session';

export async function GET() {
  try {
    const session = await getServerSession();
    
    return NextResponse.json({
      success: true,
      message: 'Transfer API test endpoint working',
      session: {
        hasSession: !!session,
        sessionId: session?.id,
        sessionEmail: session?.email
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Transfer test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test endpoint failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
