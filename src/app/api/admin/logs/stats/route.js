import { NextResponse } from 'next/server';
import { databaseHelpers } from '@/lib/database';

export async function GET() {
  try {
    const stats = await databaseHelpers.admin.getAdminLogStats();
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin log stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin log stats' },
      { status: 500 }
    );
  }
}
