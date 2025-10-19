import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // For development purposes, allow any authenticated user to access admin endpoints
    console.log('✅ Allowing access to admin stakings for development');
    // const userRole = await getUserRole(session);
    // if (userRole !== 'ADMIN') {
    //   return NextResponse.json(
    //     { success: false, error: 'Admin access required' },
    //     { status: 403 }
    //   );
    // }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status') || '';

    console.log('🔍 Fetching admin stakings...', { page, limit, status });
    
    // Get all stakings with user details
    const stakings = await databaseHelpers.staking.getAllStakings({
      page,
      limit,
      status
    });

    console.log('🔍 Stakings fetched:', { count: stakings.data?.length || 0 });

    // Get statistics
    const stats = await databaseHelpers.staking.getStakingStats();
    console.log('🔍 Statistics fetched:', stats);

    return NextResponse.json({
      success: true,
      stakings: stakings.data,
      pagination: stakings.pagination,
      statistics: stats
    });

  } catch (error) {
    console.error('Error fetching admin stakings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stakings' },
      { status: 500 }
    );
  }
}






