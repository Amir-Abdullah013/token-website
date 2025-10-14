import { NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/session';
import { databaseHelpers } from '../../../../lib/database';

export async function POST(request) {
  console.log('🔍 CHECK USER: Testing user existence');
  
  try {
    const session = await getServerSession();
    console.log('🔍 CHECK USER: Session:', session);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No session found'
      }, { status: 401 });
    }
    
    // Check if user already exists
    console.log('🔍 CHECK USER: Checking if user exists...');
    try {
      const existingUser = await databaseHelpers.user.getUserByEmail(session.email);
      console.log('🔍 CHECK USER: Existing user:', existingUser);
      
      if (existingUser) {
        return NextResponse.json({
          success: true,
          message: 'User already exists',
          user: existingUser,
          exists: true
        });
      } else {
        return NextResponse.json({
          success: true,
          message: 'User does not exist',
          user: null,
          exists: false
        });
      }
    } catch (checkError) {
      console.error('❌ CHECK USER: Error checking user:', checkError);
      return NextResponse.json({
        success: false,
        error: 'Error checking user',
        details: checkError.message
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ CHECK USER: Error in test endpoint:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error.message
    }, { status: 500 });
  }
}
