import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log(`🔧 Promoting user ${email} to admin...`);
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: email }
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { success: true, message: 'User is already an admin', user },
        { status: 200 }
      );
    }
    
    // Update user role to ADMIN
    const updatedUser = await prisma.user.update({
      where: { email: email },
      data: { role: 'ADMIN' }
    });
    
    console.log(`✅ Successfully promoted ${email} to admin!`);
    
    return NextResponse.json({
      success: true,
      message: 'User promoted to admin successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role
      }
    });
    
  } catch (error) {
    console.error('❌ Error promoting user to admin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to promote user to admin' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}





