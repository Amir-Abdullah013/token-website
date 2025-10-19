import { NextResponse } from 'next/server';
import { getServerSession, getUserRole } from '@/lib/session';
import { databaseHelpers } from '@/lib/database';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // For development purposes, allow any authenticated user to access admin endpoints
    // In production, you should uncomment the role check below
    console.log('✅ Allowing access to admin screenshot for development');
    // const userRole = await getUserRole(session);
    // if (userRole !== 'ADMIN') {
    //   return NextResponse.json(
    //     { success: false, error: 'Admin access required' },
    //     { status: 403 }
    //   );
    // }

    const { id: depositId } = await params;
    
    // Get deposit request with screenshot
    const depositRequest = await databaseHelpers.deposit.getDepositRequestById(depositId);
    
    if (!depositRequest) {
      return NextResponse.json(
        { success: false, error: 'Deposit request not found' },
        { status: 404 }
      );
    }

    if (!depositRequest.screenshot) {
      return NextResponse.json(
        { success: false, error: 'No screenshot available' },
        { status: 404 }
      );
    }

    // Check if screenshot is base64 data
    let imageBuffer;
    let contentType = 'image/jpeg'; // Default
    
    if (depositRequest.screenshot.startsWith('data:image/')) {
      // Handle data URL format
      const base64Data = depositRequest.screenshot.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Extract content type from data URL
      const mimeMatch = depositRequest.screenshot.match(/data:image\/([^;]+)/);
      if (mimeMatch) {
        contentType = `image/${mimeMatch[1]}`;
      }
    } else if (depositRequest.screenshot.startsWith('/uploads/')) {
      // Handle file path format (legacy)
      return NextResponse.json(
        { success: false, error: 'File path screenshots not supported in production' },
        { status: 400 }
      );
    } else {
      // Assume it's raw base64 data
      imageBuffer = Buffer.from(depositRequest.screenshot, 'base64');
    }

    // Set appropriate headers for image response
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    headers.set('Content-Length', imageBuffer.length.toString());

    return new NextResponse(imageBuffer, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error serving screenshot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to serve screenshot' },
      { status: 500 }
    );
  }
}
