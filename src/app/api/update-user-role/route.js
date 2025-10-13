import { NextResponse } from 'next/server';
import { getServerSession } from '../../../lib/session';

export async function POST(request) {
  try {
    const user = await getServerSession();
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'No user session found' 
      });
    }

    const { email, role } = await request.json();
    
    if (!email || !role) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email and role are required' 
      });
    }

    if (!['USER', 'ADMIN'].includes(role)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid role. Must be USER or ADMIN' 
      });
    }

    // Update user role in database
    const { databaseHelpers } = await import('../../../lib/database.js');
    const updatedUser = await databaseHelpers.user.updateUserRole(email, role);
    
    if (!updatedUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found or update failed' 
      });
    }
    
    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
    
  } catch (error) {
    console.error('Update user role error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    });
  }
}












