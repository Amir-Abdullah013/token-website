import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '../../../lib/session';
import { databaseHelpers } from '../../../lib/database';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = await getUserRole(session);
    if (userRole !== 'USER' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'User access required' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const amount = parseFloat(formData.get('amount'));
    const screenshot = formData.get('screenshot');

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    if (!screenshot || screenshot.size === 0) {
      return NextResponse.json(
        { success: false, error: 'Screenshot is required' },
        { status: 400 }
      );
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(screenshot.type)) {
      return NextResponse.json(
        { success: false, error: 'Only JPG, JPEG, and PNG files are allowed' },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (screenshot.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Get Binance address from system settings with fallback
    let binanceAddress;
    try {
      const addressSetting = await databaseHelpers.system.getSetting('BINANCE_DEPOSIT_ADDRESS');
      binanceAddress = addressSetting?.value;
    } catch (error) {
      console.warn('⚠️ Could not fetch Binance address from database, using fallback:', error.message);
    }

    // Use fallback address if not found in database
    if (!binanceAddress) {
      binanceAddress = 'TX7k8t9w2ZkDh8mA1pQw6yLbNcVfGhJkLmNoPqRsTuVwXyZ1234567890'; // Fallback address
      console.log('🔧 Using fallback Binance address:', binanceAddress);
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'deposits');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = screenshot.name.split('.').pop();
    const filename = `deposit_${session.id}_${timestamp}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    const bytes = await screenshot.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Create deposit request
    const depositRequest = await databaseHelpers.deposit.createDepositRequest({
      userId: session.id,
      amount,
      screenshot: `/uploads/deposits/${filename}`,
      binanceAddress: binanceAddress
    });

    // Create transaction record
    const transaction = await databaseHelpers.transaction.createTransaction({
      userId: session.id,
      type: 'DEPOSIT',
      amount,
      currency: 'USD',
      status: 'PENDING',
      gateway: 'Binance',
      screenshot: `/uploads/deposits/${filename}`,
      binanceAddress: binanceAddress,
      description: `Deposit request via Binance`
    });

    console.log('✅ Deposit request created:', {
      userId: session.id,
      amount,
      transactionId: transaction.id,
      depositRequestId: depositRequest.id
    });

    return NextResponse.json({
      success: true,
      message: 'Deposit request submitted successfully. Waiting for admin confirmation.',
      depositRequest: {
        id: depositRequest.id,
        amount,
        status: 'PENDING',
        binanceAddress: binanceAddress
      }
    });

  } catch (error) {
    console.error('Error creating deposit request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create deposit request' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = await getUserRole(session);
    if (userRole !== 'USER' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'User access required' },
        { status: 403 }
      );
    }

    // Get user's deposit requests
    const depositRequests = await databaseHelpers.deposit.getUserDepositRequests(session.id);

    return NextResponse.json({
      success: true,
      depositRequests
    });

  } catch (error) {
    console.error('Error fetching deposit requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch deposit requests' },
      { status: 500 }
    );
  }
}
