import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';

// Admin staking controls removed - staking is now automatic
// This endpoint is kept for backward compatibility but returns read-only message
export async function PATCH(request, { params }) {
  return NextResponse.json({
    success: false,
    error: 'Admin staking controls have been removed. Staking is now automatic and processes itself when the duration ends.',
    message: 'Staking system is now fully automated - no admin approval required'
  }, { status: 403 });
}






