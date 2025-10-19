import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user details to check admin status
    const user = await databaseHelpers.user.getUserById(session.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin
    const isAdmin = user.role === 'ADMIN' || user.role === 'admin' || user.isAdmin === true;
    if (!isAdmin) {
      console.log('❌ User is not admin:', { 
        userId: user.id, 
        userRole: user.role, 
        isAdmin: user.isAdmin,
        userEmail: user.email 
      });
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { amount } = body;

    // Validate input
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount. Must be a positive number.' },
        { status: 400 }
      );
    }

    // Check for reasonable limits (prevent excessive minting)
    const maxMintAmount = 10000000; // 10 million tokens max per mint
    if (amount > maxMintAmount) {
      return NextResponse.json(
        { success: false, error: `Amount exceeds maximum limit of ${maxMintAmount.toLocaleString()} tokens` },
        { status: 400 }
      );
    }

    // Check if token supply exists
    const tokenSupply = await databaseHelpers.tokenSupply.getTokenSupply();
    if (!tokenSupply) {
      return NextResponse.json(
        { success: false, error: 'Token supply not initialized' },
        { status: 500 }
      );
    }

    // Perform minting operation
    const mintResult = await databaseHelpers.minting.mintTokens(session.id, amount);

    // Log admin action
    await databaseHelpers.adminLog.createAdminLog({
      adminId: session.id,
      action: 'MINT_TOKENS',
      targetType: 'TOKEN_SUPPLY',
      targetId: tokenSupply.id.toString(),
      details: `Minted ${amount.toLocaleString()} tokens. New total: ${mintResult.totalSupply.toLocaleString()}, New remaining: ${mintResult.remainingSupply.toLocaleString()}`,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Successfully minted ${amount.toLocaleString()} tokens`,
      data: {
        totalSupply: mintResult.totalSupply,
        remainingSupply: mintResult.remainingSupply,
        mintedAmount: amount,
        mintHistoryId: mintResult.mintHistory.id,
        adminId: session.id,
        adminName: user.name || user.email,
        timestamp: mintResult.mintHistory.createdAt
      }
    });

  } catch (error) {
    console.error('Error in mint API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mint tokens' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve mint history
export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user details to check admin status
    const user = await databaseHelpers.user.getUserById(session.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin
    const isAdmin = user.role === 'ADMIN' || user.role === 'admin' || user.isAdmin === true;
    if (!isAdmin) {
      console.log('❌ User is not admin:', { 
        userId: user.id, 
        userRole: user.role, 
        isAdmin: user.isAdmin,
        userEmail: user.email 
      });
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;
    const adminId = searchParams.get('adminId');

    // Get mint history
    const mintHistory = await databaseHelpers.minting.getMintHistory(adminId, limit);

    // Get current token supply
    const tokenSupply = await databaseHelpers.tokenSupply.getTokenSupply();

    return NextResponse.json({
      success: true,
      data: {
        mintHistory: mintHistory.map(mint => ({
          id: mint.id,
          adminId: mint.adminId,
          adminName: mint.admin_name,
          adminEmail: mint.admin_email,
          amount: Number(mint.amount),
          createdAt: mint.createdAt
        })),
        currentSupply: {
          totalSupply: Number(tokenSupply?.totalSupply || 0),
          remainingSupply: Number(tokenSupply?.remainingSupply || 0)
        },
        pagination: {
          limit,
          count: mintHistory.length
        }
      }
    });

  } catch (error) {
    console.error('Error getting mint history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve mint history' },
      { status: 500 }
    );
  }
}
