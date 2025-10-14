import { NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/session';

export async function POST(request) {
  console.log('🔍 MINIMAL TEST: Testing minimal transfer');
  
  try {
    const session = await getServerSession();
    console.log('🔍 MINIMAL TEST: Session:', session);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No session found'
      }, { status: 401 });
    }
    
    const body = await request.json();
    console.log('🔍 MINIMAL TEST: Request body:', body);
    
    const { recipientEmail, amount, note } = body;
    const numericAmount = parseFloat(amount);
    
    // Basic validation
    if (!recipientEmail || !amount) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid amount'
      }, { status: 400 });
    }
    
    if (session.email === recipientEmail) {
      return NextResponse.json({
        success: false,
        error: 'Cannot send to yourself'
      }, { status: 400 });
    }
    
    // Simulate successful transfer
    return NextResponse.json({
      success: true,
      message: 'Transfer completed successfully',
      transfer: {
        id: 'test-transfer-id',
        senderEmail: session.email,
        recipientEmail: recipientEmail,
        amount: numericAmount,
        note: note || null,
        status: 'COMPLETED',
        createdAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ MINIMAL TEST: Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error.message
    }, { status: 500 });
  }
}
