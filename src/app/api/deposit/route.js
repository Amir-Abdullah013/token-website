import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '../../../lib/session';
import { databaseHelpers } from '../../../lib/database';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request) {
  console.log('🚀 Deposit API called');
  
  try {
    const session = await getServerSession();
    console.log('👤 Session data:', session ? { id: session.id, email: session.email } : 'No session');
    
    if (!session?.id) {
      console.log('❌ No session found, returning 401');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user exists in database - try by ID first, then by email
    let dbUser = await databaseHelpers.user.getUserById(session.id);
    
    // If not found by ID, try by email (common with OAuth)
    if (!dbUser && session.email) {
      console.log('🔄 User not found by ID, trying by email:', session.email);
      dbUser = await databaseHelpers.user.getUserByEmail(session.email);
    }
    
    if (!dbUser) {
      console.log('❌ User not found in database:', session.id, session.email);
      return NextResponse.json(
        { success: false, error: 'User not found. Please sign in again.' },
        { status: 401 }
      );
    }
    
    console.log('✅ User found in database:', dbUser.id, dbUser.email);

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

    // Create deposit request using the database user ID
    const depositRequest = await databaseHelpers.deposit.createDepositRequest({
      userId: dbUser.id, // Use database user ID, not session ID
      amount,
      screenshot: `/uploads/deposits/${filename}`,
      binanceAddress: binanceAddress
    });

    // Create transaction record using the database user ID
    const transaction = await databaseHelpers.transaction.createTransaction({
      userId: dbUser.id, // Use database user ID, not session ID
      type: 'DEPOSIT',
      amount,
      currency: 'USD',
      status: 'PENDING',
      gateway: 'Binance',
      screenshot: `/uploads/deposits/${filename}`,
      binanceAddress: binanceAddress,
      description: `Deposit request via Binance`
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
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Failed to create deposit request';
    let statusCode = 500;
    
    if (error.message.includes('SASL') || error.message.includes('authentication')) {
      errorMessage = 'Database authentication failed. Please check your database credentials.';
      statusCode = 503; // Service Unavailable
    } else if (error.message.includes('connection')) {
      errorMessage = 'Database connection failed. Please try again in a moment.';
      statusCode = 503; // Service Unavailable
    } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
      errorMessage = 'Database table not found. Please run database migrations.';
      statusCode = 500;
    } else if (error.message.includes('foreign key constraint')) {
      errorMessage = 'Database constraint error. Please check your database setup.';
      statusCode = 500;
    } else if (error.message.includes('Missing required fields')) {
      errorMessage = 'Invalid deposit data. Please check all required fields.';
      statusCode = 400; // Bad Request
    } else if (error.message.includes('Invalid amount')) {
      errorMessage = 'Invalid deposit amount. Please enter a valid amount.';
      statusCode = 400; // Bad Request
    } else if (error.message.includes('User not found')) {
      errorMessage = 'User session expired. Please log in again.';
      statusCode = 401; // Unauthorized
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
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

    // Verify user exists in database - try by ID first, then by email
    let dbUser = await databaseHelpers.user.getUserById(session.id);
    
    // If not found by ID, try by email (common with OAuth)
    if (!dbUser && session.email) {
      console.log('🔄 User not found by ID, trying by email:', session.email);
      dbUser = await databaseHelpers.user.getUserByEmail(session.email);
    }
    
    if (!dbUser) {
      console.log('❌ User not found in database:', session.id, session.email);
      return NextResponse.json(
        { success: false, error: 'User not found. Please sign in again.' },
        { status: 401 }
      );
    }
    
    console.log('✅ User found in database:', dbUser.id, dbUser.email);

    const userRole = await getUserRole(session);
    if (userRole !== 'USER' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'User access required' },
        { status: 403 }
      );
    }

    // Get user's deposit requests using database user ID
    const depositRequests = await databaseHelpers.deposit.getUserDepositRequests(dbUser.id);

    return NextResponse.json({
      success: true,
      depositRequests
    });

  } catch (error) {
    console.error('Error fetching deposit requests:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to fetch deposit requests';
    if (error.message.includes('SASL')) {
      errorMessage = 'Database connection error. Please check your database configuration.';
    } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
      errorMessage = 'Database table not found. Please run database migrations.';
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
