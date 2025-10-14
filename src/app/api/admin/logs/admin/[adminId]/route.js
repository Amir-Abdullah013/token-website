import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

export async function GET(request, { params }) {
  try {
    const { adminId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    const logs = await databaseHelpers.admin.getAdminLogsByAdmin(adminId, limit, offset);
    
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching admin logs by admin:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin logs by admin' },
      { status: 500 }
    );
  }
}
