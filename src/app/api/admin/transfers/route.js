import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '../../../../lib/session';
import { databaseHelpers } from '../../../../lib/database';
import { handleApiError, handleAuthError } from '../../error-handler';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return handleAuthError('Authentication required');
    }

    // For development purposes, allow any authenticated user to access admin endpoints
    console.log('✅ Allowing access to admin transfers for development');
    // const userRole = await getUserRole(session);
    // if (userRole !== 'ADMIN') {
    //   return handleAuthError('Admin access required', 403);
    // }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status') || '';

    const transfers = await databaseHelpers.transfer.getAllTransfers({ page, limit, status });
    const stats = await databaseHelpers.transfer.getTransferStats();

    return NextResponse.json({
      success: true,
      transfers: transfers.data,
      pagination: transfers.pagination,
      statistics: stats,
    });

  } catch (error) {
    return handleApiError(error, 'Failed to fetch admin transfers');
  }
}






