import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }
    
    const userId = session.id || session.user?.id;
    const email = session.email;
    
    if (!userId || !email) {
      return NextResponse.json({
        success: false,
        error: 'User data not found in session'
      }, { status: 400 });
    }
    
    // Generate Von ID using the same logic as auth-context
    const emailHash = email.split('@')[0].toUpperCase();
    const idSuffix = userId.substring(0, 8).toUpperCase();
    const VonId = `Von-${emailHash.substring(0, 4)}-${idSuffix}`;
    
    console.log('🔍 User Von ID API: Generated Von ID for user:', {
      email: email,
      userId: userId,
      VonId: VonId
    });
    
    return NextResponse.json({
      success: true,
      VonId: VonId,
      email: email,
      userId: userId
    });
    
  } catch (error) {
    console.error('❌ User Von ID API: Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
