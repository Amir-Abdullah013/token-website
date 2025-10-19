import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';

// GET: fetch current addresses
export async function GET() {
  try {
    console.log('🔍 Fetching deposit addresses...');
    
    // Get the deposit addresses using database helpers
    const data = await databaseHelpers.depositAddresses.getDepositAddresses();
    
    console.log('🔍 Deposit addresses fetched:', data);
    
    return NextResponse.json({ 
      success: true, 
      data: data || { bep20: null, trc20: null }
    });
  } catch (error) {
    console.error('❌ Error fetching deposit addresses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deposit addresses' },
      { status: 500 }
    );
  }
}

// PUT: update addresses (admin only)
export async function PUT(req) {
  try {
    console.log('🔍 Updating deposit addresses...');
    
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = await getUserRole(session);
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { bep20, trc20 } = body;

    console.log('🔍 Updating addresses:', { bep20, trc20 });

    // Update deposit addresses using database helpers
    const updated = await databaseHelpers.depositAddresses.updateDepositAddresses({ bep20, trc20 });

    console.log('✅ Deposit addresses updated:', updated);
    
    return NextResponse.json({ 
      success: true, 
      data: updated 
    });
  } catch (error) {
    console.error('❌ Error updating deposit addresses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update deposit addresses' },
      { status: 500 }
    );
  }
}
