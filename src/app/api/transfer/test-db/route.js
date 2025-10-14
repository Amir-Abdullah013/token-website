import { NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/session';
import { databaseHelpers } from '../../../../lib/database';
import { randomUUID } from 'crypto';

export async function POST(request) {
  console.log('🔍 DB TEST: Testing direct database insert');
  
  try {
    const session = await getServerSession();
    console.log('🔍 DB TEST: Session:', session);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No session found'
      }, { status: 401 });
    }
    
    // Try direct database insert
    console.log('🔍 DB TEST: Attempting direct database insert...');
    try {
      const userId = randomUUID();
      const result = await databaseHelpers.pool.query(`
        INSERT INTO users (id, email, password, name, "emailVerified", role, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *
      `, [userId, session.email, null, session.name || 'User', true, 'USER']);
      
      console.log('✅ DB TEST: Direct insert successful:', result.rows[0]);
      
      return NextResponse.json({
        success: true,
        message: 'Direct insert successful',
        user: result.rows[0]
      });
    } catch (insertError) {
      console.error('❌ DB TEST: Direct insert failed:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Direct insert failed',
        details: insertError.message,
        code: insertError.code,
        constraint: insertError.constraint
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ DB TEST: Error in test endpoint:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error.message
    }, { status: 500 });
  }
}
