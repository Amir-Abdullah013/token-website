import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';

export async function POST(request) {
  console.log('🔍 SIMPLE TEST: Testing basic transfer validation');
  
  try {
    const session = await getServerSession();
    console.log('🔍 SIMPLE TEST: Session:', session);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No session found'
      }, { status: 401 });
    }
    
    const body = await request.json();
    console.log('🔍 SIMPLE TEST: Request body:', body);
    
    // Basic validation
    const { recipientEmail, amount, note } = body;
    
    if (!recipientEmail || !amount) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        details: { recipientEmail: !!recipientEmail, amount: !!amount }
      }, { status: 400 });
    }
    
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid amount',
        details: { amount, numericAmount }
      }, { status: 400 });
    }
    
    if (session.email === recipientEmail) {
      return NextResponse.json({
        success: false,
        error: 'Cannot send to yourself'
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Basic validation passed',
      data: {
        sender: session.email,
        recipient: recipientEmail,
        amount: numericAmount,
        note: note || null
      }
    });
    
  } catch (error) {
    console.error('❌ SIMPLE TEST: Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error.message
    }, { status: 500 });
  }
}
