import { NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/session';
import { databaseHelpers } from '../../../../lib/database';

export async function POST(request) {
  console.log('🔍 USER TEST: Testing user creation');
  
  try {
    const session = await getServerSession();
    console.log('🔍 USER TEST: Session:', session);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No session found'
      }, { status: 401 });
    }
    
    // Try to create user directly
    console.log('🔍 USER TEST: Attempting to create user...');
    try {
      const user = await databaseHelpers.user.createUser({
        email: session.email,
        password: null,
        name: session.name || 'User',
        emailVerified: true,
        role: 'USER'
      });
      console.log('✅ USER TEST: User created successfully:', user);
      
      return NextResponse.json({
        success: true,
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (createError) {
      console.error('❌ USER TEST: User creation failed:', createError);
      return NextResponse.json({
        success: false,
        error: 'User creation failed',
        details: createError.message,
        stack: createError.stack
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ USER TEST: Error in test endpoint:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
