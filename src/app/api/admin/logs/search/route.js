import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const results = await databaseHelpers.admin.searchAdminLogs(query, limit, offset);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching admin logs:', error);
    return NextResponse.json(
      { error: 'Failed to search admin logs' },
      { status: 500 }
    );
  }
}
