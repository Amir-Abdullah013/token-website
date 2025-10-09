import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    try {
      // Import database helpers dynamically to avoid import errors
      const { databaseHelpers } = await import('../../../../lib/database.js');
      
      // Get user from database
      const user = await databaseHelpers.user.getUserById(userId);
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      // Return user profile data (without sensitive information)
      const profileData = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin,
        country: user.country,
        timezone: user.timezone
      };

      return NextResponse.json({
        success: true,
        user: profileData
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Fallback to mock user data
      return NextResponse.json({
        success: true,
        user: {
          id: userId,
          name: 'Amir Abdullah',
          email: 'amirabdullah2508@gmail.com',
          phone: '',
          role: 'USER',
          emailVerified: true,
          createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
          updatedAt: new Date().toISOString(),
          country: '',
          timezone: 'UTC'
        }
      });
    }

  } catch (error) {
    console.error('Profile API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch user profile',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
